from flask import Flask, request, session
import logging
import json
import cv2
import pandas as pd
import os
import shutil
import glob
import sys

# BERTを用いる場合
from sentence_transformers import SentenceTransformer#, util
from google.cloud import vision

# アノテーション画像から物体情報を取得するモジュール
import annotation_object_detector

# BERTを使って物体位置を推定するモジュール
import nlp

# キューブマップ上の位置とパノラマ上の位置を変換するモジュール
import cube_pano_pos_converter

# データベースにアノテーションデータを入れるモジュール
import annotation_data_uploader

# 本APIの稼働状況をデータベースに記録するモジュール
import api_status

LOG_FILE = '/home/sakai/AutoPanorama_img_proc/experiment/flask_app_log.txt'



# APIのインスタンス生成
app = Flask(__name__)

# ログ関係の設定
# logging.basicConfig(level=logging.DEBUG)
# app.logger.setLevel(logging.DEBUG)
log_handler = logging.FileHandler(LOG_FILE)
# log_handler.setLevel(logging.DEBUG)
log_handler.setLevel(logging.INFO)
app.logger.addHandler(log_handler)

# print('MySQLに接続完了')

# Cloud Visionのインスタンスを初期化
client = vision.ImageAnnotatorClient()
# print('Vision APIのクライアント作成')
app.logger.info('Vision APIのクライアント作成')

# 類似度算出のためのモデルをロード
model = SentenceTransformer('stsb-xlm-r-multilingual')
# print('BERT初期化完了')
app.logger.info('BERT初期化完了')

# 座標変換マップのロード
pos_map = pd.read_csv('../pos_map.csv')
# print('pos_mapロード完了')
app.logger.info('pos_mapロード完了')


@app.route('/')
def index():

    # help_msg = '''ここはindex.
    # 使い方:
    #     /detect_annotation_objects

    # '''

    return 'index'


# 撮影時の物体情報取得
@app.route('/detect_annotation_objects', methods=['POST'])
def detect_annotation_objects():

    # print('receivec request: detect_annotation_objects')
    app.logger.info('receivec request: detect_annotation_objects')

    annotation_img_temp_id = request.json['annotation_img_temp_id']

    # print('annotation img temp id: {}'.format(annotation_img_temp_id))
    app.logger.info('annotation img temp id: {}'.format(annotation_img_temp_id))

    file_path = '/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/' + annotation_img_temp_id + '.jpg'

    mat = cv2.imread(file_path)

    height, width = mat.shape[:2]

    # アノテーションの一時画像から，物体名称とその座標データを取得
    object_data = annotation_object_detector.detect_annotation_objects(file_path, client, width, height)

    # print('detect_annotation_objects from annotation temp img')
    app.logger.info('detect_annotation_objects from annotation temp img')

    # レスポンスデータ作成
    return_data = {
        'result': 'success',
        'width': width,
        'height': height,
        'objects': object_data,
        'annotation_img_temp_id': annotation_img_temp_id
    }

    response = json.dumps(return_data)

    # print('send response: {}'.format(response))
    app.logger.info('send response: {}'.format(response))

    # return_data['result'] = 'success'
    # return_data['width'] = width
    # return_data['height'] = height
    # return_data['objects'] = object_data
    # return_data['annotation_img_temp_id'] = annotation_img_temp_id

    return response

# 名称の称号によるパノラマ内物体位置推定
@app.route('/detect_object_position', methods=['POST'])
def detect_object_position():

    # print('receivec request: detect_object_position')
    app.logger.info('receivec request: detect_object_position')

    input_word = request.json['input_word']
    annotation_img_temp_id = request.json['annotation_img_temp_id']
    panorama_id = request.json['panorama_id']
    annotation_id = request.json['annotation_id']

    # print('temp id: {}'.format(annotation_img_temp_id))
    app.logger.info('temp id: {}'.format(annotation_img_temp_id))

    # データベースから，キューブマップ上の物体名称とその位置データを取得
    obj_name_list, obj_name_and_position_list = nlp.get_word_data_from_db()

    # 物体名称を使い，アノテーション画像と同一物体のキューブマップ上の位置を取得
    result = nlp.search_object_in_cubemap(input_word, obj_name_list, obj_name_and_position_list, model)

    # print('searched object in cubemap')
    app.logger.info('searched object in cubemap')

    pos_top_left = result['pos_top_left']
    pos_bottom_right = result['pos_bottom_right']

    # 取得した座標データから，中央の位置を計算
    center_x_cubemap = int(( pos_top_left[0] + pos_bottom_right[0] ) / 2)
    center_y_cubemap = int(( pos_top_left[1] + pos_bottom_right[1] ) / 2)

    # キューブマップ上の座標から，パノラマ上の座標に変換
    pos_x_panorama, pos_y_panorama = cube_pano_pos_converter.convert_pos_from_cube_to_pano(center_x_cubemap, center_y_cubemap, pos_map)

    # print('converted pos from cubemap to panorama')
    app.logger.info('converted pos from cubemap to panorama')

    # バーチャルツアーで表示するため，thetaとphiを計算
    theta, phi = cube_pano_pos_converter.get_theta_and_phi(pos_x_panorama, pos_y_panorama)

    # print('theta: {}, phi: {}'.format(theta, phi))
    app.logger.info('theta: {}, phi: {}'.format(theta, phi))

    # データベースにデータを格納
    annotation_data_uploader.upload_annotation_data(annotation_id, theta, phi, panorama_id)

    # print('uploaded theta, phi to DB')
    app.logger.info('uploaded theta, phi to DB')

    # 画像ファイルを移動
    application_dir = '/home/sakai/AutoPanorama_img_proc/'

    # 一時画像をアノテーション画像として使用するため，ファイル名を変更し，位置を移動
    path_from = application_dir + 'annotation_imgs_temp/' + annotation_img_temp_id + '.jpg'
    path_to = application_dir + 'annotation_imgs/' + annotation_id + '.jpg'

    try:
        new_path = shutil.move(path_from, path_to)
        # print('mv img to {}'.format(new_path))
        app.logger.info('mv img to {}'.format(new_path))
    except FileNotFoundError as e:
        print(e)

    # 一時画像一覧を取得
    temp_files = glob.glob('/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/*.jpg')

    # 一時画像のうち，アノテーションIDの文字列を含むものを削除する
    for file in temp_files:
        if(annotation_id in file):
            os.remove(file)

    return_data = {'result': 'ok'}

    response = json.dumps(return_data)

    app.logger.info(response)

    return response

    # return result


# APIサーバの稼働状況をデータベースに記録
api_status.set_api_status('running')

# app.run(port=8888, debug=True)

print('app start')

app.logger.info('app start')
