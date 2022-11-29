import io
import os
import sys
import json
import glob
import cv2

# """
# ＜本プログラムで実行する内容＞
# 1. MySQLからの物体領域データ取得
# 2. 画像ファイル読み込み
# 3. vision apiに画像を送信し，物体検出データを受信
# 4. 検出した物体情報をMySQLに保存

# ＜実行方法＞
# #### GOOGLE_APPLICATION_CREDENTIALSに認証ファイルのパスを指定する必要があるため，run_detect_objects_via_vision_api.shから実行すると楽
# PHPのexec関数で実行．
# その際，ホームディレクトリのanaconda環境のPythonファイル /home/sakai/anaconda3/bin/python で実行する．
# cloud visionのライブラリをインストールしたのがここなので．
# """

from google.cloud import vision
import MySQLdb

def get_regions_from_mysql():

    # 返すデータを用意
    return_data = []

    # MySQLに接続
    connection = MySQLdb.connect(
        host='localhost',
        user='sakai',
        password='tyoshino',
        db='sakai',
        use_unicode=True,
        charset='utf8')

    # 操作するためのカーソルを取得
    cursor = connection.cursor()

    try:
        # SQL文
        sql = 'select panorama_id, img_file_path, region_id, top_left_x_cubemap, top_left_y_cubemap from recognized_regions'

        # SQLを実行
        cursor.execute(sql)

        # 全データを取得
        rows = cursor.fetchall()

        # データベースのデータを，キーバリュー形式で保存
        for row in rows:
            data = {}
            data['panorama_id'] = row[0]
            data['img_file_path'] = row[1]
            data['region_id'] = row[2]
            data['top_left_x_cubemap'] = row[3]
            data['top_left_y_cubemap'] = row[4]
            return_data.append(data)

        # MySQLへの変更を保存
        connection.commit()

    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)

    finally:
        cursor.close()
        connection.close()

    return return_data


def detect_objects_via_cloud_vision(region_data):

    # data = {}
    # data['objects'] = []
    # data = []

    # 検出したオブジェクトに与えるIDに使用するインデックス
    object_index = 0

    # Cloud Visionのインスタンスを初期化
    client = vision.ImageAnnotatorClient()

    connection = MySQLdb.connect(
        host='localhost',
        user='sakai',
        password='tyoshino',
        db='sakai',
        use_unicode=True,
        charset='utf8')

    # 操作するためのカーソルを取得
    cursor = connection.cursor()

    # MySQLに挿入するデータをまとめる配列
    insert_data = []

    data_index = 0

    # 物体領域データを使って，Vision APIで物体認識
    # データは上記の配列に格納
    # あとでまとめてMySQLに挿入
    for data in region_data:

        data_index += 1

        print('Start Object Recognition {} / {} ...'.format(data_index, len(region_data)))

        # 画像のファイル名を取得
        file_name = data['img_file_path']

        # 頂点の座標を計算するため，画像ファイルを読み取り
        mat = cv2.imread(file_name)

        print('file name: {}'.format(file_name.split('/')[len(file_name.split('/')) - 1]))

        # 画像ファイルを開く
        with io.open(file_name, 'rb') as image_file:
            content = image_file.read()

        image = vision.Image(content=content)

        # ラベル検出　これで１ユニット消費
        # 2022/11/24時点では使用するつもりはないが，ラベルも情報として使う可能性があるので，
        # 一応残す
        # response_label = client.label_detection(image=image)
        # labels = response_label.label_annotations
        # print('Labels:')
        # for label in labels:
        #     print(label.description)

        # オブジェクト検出　これで１ユニット消費
        objects = client.object_localization(image=image).localized_object_annotations

        print('Object found: {}'.format(len(objects)))

        # insert_data = []

        # 検出したオブジェクトデータを配列にまとめる
        for object_ in objects:

            # 矩形のデータがない（矩形のverticesの長さが4以外）ときは，何もせず次へ
            if(len(object_.bounding_poly.normalized_vertices) != 4):
                # print('continue because vertices length is {}'.format(len(object_.bounding_poly.vertices)))
                print('continue because normalized vertices length is {}'.format(len(object_.bounding_poly.normalized_vertices)))
                continue

            # パノラマのID
            panorama_id = data['panorama_id']

            # 認識されたオブジェクトの名前
            object_name = object_.name

            # オブジェクトのID
            # 名前が被っても，データとしては一意になるように設定
            object_id = panorama_id + "_"
            if(object_index < 10):
                object_id += "0" + str(object_index)
            else:
                object_id += str(object_index)

            # 物体を囲む矩形について，矩形の頂点の座標をキューブマップ上の座標に変換する
            vertices = object_.bounding_poly.normalized_vertices
            top_left_x_cubemap = data['top_left_x_cubemap']
            top_left_y_cubemap = data['top_left_y_cubemap']
            img_height, img_width = mat.shape[:2]
            for i in range(len(vertices)):
                vertices[i].x = vertices[i].x * img_width + top_left_x_cubemap
                vertices[i].y = vertices[i].y * img_height + top_left_y_cubemap
                # vertices[i].x += top_left_x_cubemap
                # vertices[i].y += top_left_y_cubemap

            # 矩形のデータを文字列にまとめる
            bounding_box = str(vertices[0].x) + "," + str(vertices[0].y) + "|" + str(vertices[1].x) + "," + str(vertices[1].y) + "|" + str(vertices[2].x) + "," + str(vertices[2].y) + "|" + str(vertices[3].x) + "," + str(vertices[3].y)

            # 矩形の中央の座標を計算
            center_x_cubemap = int((vertices[0].x + vertices[2].x) / 2)
            center_y_cubemap = int((vertices[0].y + vertices[2].y) / 2)

            # MySQLに挿入するための配列に格納
            insert_data.append((
                panorama_id,
                object_name,
                object_id,
                bounding_box,
                center_x_cubemap,
                center_y_cubemap
            ))
            # オブジェクトのインデックスを増やす
            object_index += 1
        print()

    # MySQLにデータを格納
    try:
        # SQL文
        sql = ('''
        insert into recognized_objects (panorama_id, object_name, object_id, bounding_box_cubemap, center_x_cubemap, center_y_cubemap)
        values (%s, %s, %s, %s, %s, %s)
        ''')

        # SQLを実行

        # cursor.execute(sql)
        print('Executing SQL ...')
        cursor.executemany(sql, insert_data)

        # 全データを取得
        # rows = cursor.fetchall()

        # データベースのデータを，キーバリュー形式で保存
        # for row in rows:
        #     data = {}
        #     data['panorama_id'] = row[0]
        #     data['img_file_path'] = row[1]
        #     data['region_id'] = row[2]
        #     data['top_left_x_cubemap'] = row[3]
        #     data['top_left_y_cubemap'] = row[4]
        #     return_data.append(data)

        # MySQLへの変更を保存
        connection.commit()

        print('Completed')
    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)
    finally:
        cursor.close()
        connection.close()
        # print('\n{} (confidence: {})'.format(object_.name, object_.score))
        # object_data = {}
        # object_data['object_name'] = object_.name
        # object_data['bounding_box'] = []
        # for vertex in object_.bounding_poly.normalized_vertices:
        #     position = [vertex.x, vertex.y]
        #     object_data['bounding_box'].append(position)
        #     print(' - ({}, {})'.format(vertex.x, vertex.y))
        # # data['objects'].append(object_data)
        # data.append(object_data)
    return insert_data



# 領域データを取得
print('Get Regions from DB...')
region_data = get_regions_from_mysql()

# 領域データから画像を取得し，Vision APIに投げる
object_data = detect_objects_via_cloud_vision(region_data=region_data)

json_str = json.dumps(object_data)

# for data in region_data:

#     print('panorama_id')
#     print('\t{}'.format(data['panorama_id']))
#     print('img_file_path')
#     print('\t{}'.format(data['img_file_path']))
#     print('region_id')
#     print('\t{}'.format(data['region_id']))
#     print('top_left_x_cubemap')
#     print('\t{}'.format(data['top_left_x_cubemap']))
#     print('top_left_y_cubemap')
#     print('\t{}'.format(data['top_left_y_cubemap']))

# sys.exit()
# file = './cubemap_lab_front_arround_kettle.jpg'
# file = './panorama_lab_cube_test_left.jpg'

# path = os.path.abspath(file)
# path = '/home/sakai/public_html/AutoPanorama_dev/output_img/selective_search_mindist_200/2022-10-01_10-33-00_nsm_thresh_0.5/front/front_17.jpg'

# panorama_date = '2022-10-01_10-33-00'

# dir = '/home/sakai/public_html/AutoPanorama_dev/output_img/selective_search/' + panorama_date

# print('dir:')
# print(dir)


# result = {}
# result['objects'] = []

# files = glob.glob(dir + '/*.jpg')
# print('files:')
# for file in files:
#     # print(file)
#     data = detect_objects_via_cloud_vision(file)
#     result['objects'].append(data)

# sys.exit()

# data = detect_objects_via_cloud_vision(path)

# img_path = '/home/sakai/public_html/AutoPanorama_dev/output_img/selective_search_mindist_200/2022-10-01_10-33-00_nsm_thresh_0.5/front'

json_str = json.dumps(object_data)

print('JSONデータ：')
print(json_str)

print('ファイル書き込み開始')

with open('./output_file/recognized_objects.json', 'w') as f:
    f.write(json_str)

print('ファイル書き込み終了')


# sys.exit()


# print('sample')

# sys.exit()

