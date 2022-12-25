from flask import Flask, request
import json
import cv2
import pandas as pd

# BERTを用いる場合
from sentence_transformers import SentenceTransformer, util
from google.cloud import vision
import MySQLdb

import detect_annotation_object
import nlp

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

    file_path = '/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/' + annotation_img_temp_id + '.jpg'

    mat = cv2.imread(file_path)

    height, width = mat.shape[:2]

    object_data = detect_annotation_object.detect_annotation_objects(file_path, client, width, height)

    return_data = {}

    return_data['result'] = 'success'
    return_data['width'] = width
    return_data['height'] = height
    return_data['objects'] = object_data

    return json.dumps(return_data)

# 名称の称号によるパノラマ内物体位置推定
@app.route('/detect_object_position', methods=['POST'])
def detect_object_position():

    input_word = request.json['input_word']

    obj_name_list, obj_name_and_position_list = nlp.get_word_data_from_db(connection)

    result = nlp.search_object_in_cubemap(input_word, obj_name_list, obj_name_and_position_list, model)

    pos_top_left = result['pos_top_left']
    pos_bottom_right = result['pos_bottom_right']

    center_x_cubemap = int(( pos_top_left[0] + pos_bottom_right[0] ) / 2)
    center_y_cubemap = int(( pos_top_left[1] + pos_bottom_right[1] ) / 2)

    # print('center x cubemap: {}, center y cubemap: {}'.format(center_x_cubemap, center_y_cubemap))

    pos_panorama = pos_map[(pos_map['pos_x_cubemap'] == center_x_cubemap) & (pos_map['pos_y_cubemap'] == center_y_cubemap)].values[0]

    pos_x_panorama = pos_panorama[2]
    pos_y_panorama = pos_panorama[3]

    # print('result')
    # print('\tword: {}'.format(result['word']))
    # print('\tpos_x_panorama: {}, pos_y_panorama: {}'.format(pos_x_panorama, pos_y_panorama))

    return json.dumps(result)

    # return result



# app.run(port=8888, debug=True)

print('app start')
