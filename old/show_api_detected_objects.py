import io
import os
import sys
import json
import glob
import cv2
import MySQLdb

# '''
# ---- 本プログラムについて ----
# 本プログラムは，detect_objects_via_vision_api.pyでMySQLに保存した物体データを取得し，キューブマップの画像に保存するプログラム
# '''

file_path = './output_img/cubemap.jpg'

panorama = cv2.imread(file_path)

connection = MySQLdb.connect(
    host='localhost',
    user='sakai',
    password='tyoshino',
    db='sakai',
    use_unicode=True,
    charset='utf8'
)

cursor = connection.cursor()

try:

    print('start getting datas...')
    sql = 'select object_name, object_id, bounding_box_cubemap from recognized_objects'

    cursor.execute(sql)

    rows = cursor.fetchall()

    print('completed')

    print('writing...')
    index = 0
    for row in rows:
        index += 1
        print('process: {} / {}'.format(index, len(rows)))
        object_name = row[0]
        object_id = row[1]
        bounding_box_cubemap = row[2]
        point_list_str = bounding_box_cubemap.split('|')
        point_list = []
        for data in point_list_str:
            point_float = list(map(float, data.split(',')))
            point = list(map(int, point_float))
            point_list.append(point)
        # オブジェクトを囲む矩形を描画
        cv2.rectangle(panorama,
                        point_list[0],
                        point_list[2],
                        color=(0, 255, 0),
                        thickness=2,
                        lineType=cv2.LINE_AA)
        # オブジェクトの名前を描画
        cv2.putText(panorama,
                    text=object_name,
                    org=(point_list[0][0], point_list[0][1]),
                    fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                    fontScale=1.0,
                    color=(0, 200, 0),
                    thickness=2,
                    lineType=cv2.LINE_AA)
except MySQLdb.Error as e:
    print('MySQLdb.Error: ', e)
finally:
    cursor.close()
    connection.close()

output_file_path = './output_file/2022-10-01_10-33-00_objects.jpg'

cv2.imwrite(output_file_path, panorama)
