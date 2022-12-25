import io
import sys
import json
import cv2
import os

from google.cloud import vision

# """
# ＜本プログラムの作成理由＞
# ・撮影物体からの名称取得を確実に行うため，物体撮影の際に定期的に物体情報を取得することにした
# ・物体認識はGoogle Cloud Vision APIのPythonライブラリを使うため，本プログラムを作成

# ＜本プログラムで実行する内容＞
# １．撮影物体の画像ファイルのパスを受け取る
# ２．Cloud Vision APIで物体を認識
# ３．認識情報をJSON文字列として出力
# """
#

def detect_annotation_objects_via_cloud_vision(file_path, mat):


    height, width = mat.shape[:2]

    client = vision.ImageAnnotatorClient()


    with io.open(file_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    # オブジェクト検出
    # これで１ユニット消費
    objects = client.object_localization(image=image).localized_object_annotations

    object_data = []

    for obj in objects:

        obj_name = obj.name

        vertices = obj.bounding_poly.normalized_vertices

        vertices_int = []

        for vertice in vertices:
            vertices_int.append([
                int(vertice.x * width), int(vertice.y * height)
            ])

        # cv2.rectangle(mat,
        #               (vertices_int[0][0], vertices_int[0][1]),
        #             #   vertices_int[0],
        #               (vertices_int[2][0], vertices_int[2][1]),
        #             #   vertices[2],
        #               color=(0, 255, 0),
        #               thickness=2,
        #               lineType=cv2.LINE_AA)

        object_data.append({
            'name': obj_name,
            'vertices': vertices_int
        })

    # cv2.imwrite('/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/' + file_path.split('.')[0] + '_result.jpg', mat)

    return object_data

def test():
    return_data = {}

    # 下記の形式以外で実行されたら，実行失敗として出力
    # python3 本ファイル名 物体画像のファイルパス
    if(len(sys.argv) != 2):
        return_data['result'] = 'failed'
        return_data['message'] = '実行形式が不正'
        print(json.dumps(return_data))
        sys.exit()

    if('GOOGLE_APPLICATION_CREDENTIALS' in os.environ.keys() == False):
        return_data['result'] = 'failed'
        return_data['message'] = 'GOOGLE APPLICATION CREDENTIALSが未設定'
        print(json.dumps(return_data))
        sys.exit()

    # print('success to exec')

    # sys.exit(0)

    file_path = sys.argv[1]

    mat = cv2.imread(file_path)

    height, width = mat.shape[:2]
    # print('file_path: {}'.format(file_path))

    object_data = detect_annotation_objects_via_cloud_vision(file_path, mat)

    return_data['result'] = 'success'

    return_data['width'] = width
    return_data['height'] = height

    return_data['objects'] = object_data

    print(json.dumps(return_data))

    # for data in object_data:
    #     print('name: {}'.format(data['name']))
    #     for vertice in data['vertices']:
    #         print('\tx: {}, y: {}'.format(vertice[0], vertice[1]))
