from flask import Flask, request
import json
import cv2
import pandas as pd
import os
import shutil

# BERTを用いる場合
from sentence_transformers import SentenceTransformer, util
from google.cloud import vision
import MySQLdb

# アノテーション画像から物体情報を取得するモジュール
import annotation_object_detector

# BERTを使って物体位置を推定するモジュール
import nlp

# キューブマップ上の位置とパノラマ上の位置を変換するモジュール
import cube_pano_pos_converter

# データベースにアノテーションデータを入れるモジュール
import annotation_data_uploader


# APIのインスタンス生成
app = Flask(__name__)

# MySQLに接続
connection = MySQLdb.connect(
    host='localhost',
    user='sakai',
    password='tyoshino',
    db='sakai',
    use_unicode=True,
    charset='utf8'
)
print('MySQLに接続完了')

# Cloud Visionのインスタンスを初期化
client = vision.ImageAnnotatorClient()
print('Vision APIのクライアント作成')

# 類似度算出のためのモデルをロード
model = SentenceTransformer('stsb-xlm-r-multilingual')
print('BERT初期化完了')

# 座標変換マップのロード
pos_map = pd.read_csv('../pos_map.csv')
print('pos_mapロード完了')


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

    annotation_img_temp_id = request.json['annotation_img_temp_id']

    # print('annotation img temp id: {}'.format(annotation_img_temp_id))

    file_path = '/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/' + annotation_img_temp_id + '.jpg'

    mat = cv2.imread(file_path)

    height, width = mat.shape[:2]

    # アノテーションの一時画像から，物体名称とその座標データを取得
    object_data = annotation_object_detector.detect_annotation_objects(file_path, client, width, height)

    # レスポンスデータ作成
    return_data = {
        'result': 'success',
        'width': width,
        'height': height,
        'objects': object_data,
        'annotation_img_temp_id': annotation_img_temp_id
    }

    # return_data['result'] = 'success'
    # return_data['width'] = width
    # return_data['height'] = height
    # return_data['objects'] = object_data
    # return_data['annotation_img_temp_id'] = annotation_img_temp_id

    return json.dumps(return_data)

# 名称の称号によるパノラマ内物体位置推定
@app.route('/detect_object_position', methods=['POST'])
def detect_object_position():

    input_word = request.json['input_word']
    annotation_img_temp_id = request.json['annotation_img_temp_id']
    panorama_id = request.json['panorama_id']
    annotation_id = request.json['annotation_id']

    # データベースから，キューブマップ上の物体名称とその位置データを取得
    obj_name_list, obj_name_and_position_list = nlp.get_word_data_from_db(connection)

    # 物体名称を使い，アノテーション画像と同一物体のキューブマップ上の位置を取得
    result = nlp.search_object_in_cubemap(input_word, obj_name_list, obj_name_and_position_list, model)

    pos_top_left = result['pos_top_left']
    pos_bottom_right = result['pos_bottom_right']

    # 取得した座標データから，中央の位置を計算
    center_x_cubemap = int(( pos_top_left[0] + pos_bottom_right[0] ) / 2)
    center_y_cubemap = int(( pos_top_left[1] + pos_bottom_right[1] ) / 2)

    # キューブマップ上の座標から，パノラマ上の座標に変換
    pos_x_panorama, pos_y_panorama = cube_pano_pos_converter.convert_pos_from_cube_to_pano(center_x_cubemap, center_y_cubemap, pos_map)

    # バーチャルツアーで表示するため，thetaとphiを計算
    theta, phi = cube_pano_pos_converter.get_theta_and_phi(pos_x_panorama, pos_y_panorama)

    # データベースにデータを格納
    annotation_data_uploader.upload_annotation_data(connection, annotation_id, theta, phi, panorama_id)

    # 画像ファイルを移動
    application_dir = '/home/sakai/AutoPanorama_img_proc/'

    # 一時画像をアノテーション画像として使用するため，ファイル名を変更し，位置を移動
    new_path = shutil.move(application_dir + 'annotation_imgs_temp/' + annotation_img_temp_id + '.jpg', application_dir + 'annotation_imgs/' + annotation_id + '.jpg')

    return_data = {'result': 'ok'}

    return json.dumps(return_data)

    # return result



# app.run(port=8888, debug=True)

print('app start')
