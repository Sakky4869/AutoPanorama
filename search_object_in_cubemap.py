import io
import os
import sys
import json
import glob
import cv2
import MySQLdb
# import gensim
# from gensim.models import Word2Vec

# '''
# ---- 本プログラムについて ----
# detect_objects_via_vision_api.pyでデータベースに保存した物体情報を取得し，標準入力として与えられた物体名称に最も近いものを探す
# '''

# model = gensim.models.Word2Vec.load('./w2v_models/ja.bin')
# model = gensim.models.KeyedVectors.load_word2vec_format('./w2v_models/entity_vector.model.bin', binary=True)

# for item, value in model.wv.most_similar('男'):
#     print(item, value)

# sys.exit()

connection = MySQLdb.connect(
    host='localhost',
    user='sakai',
    password='tyoshino',
    db='sakai',
    use_unicode=True,
    charset='utf8'
)

cursor = connection.cursor()

panorama = cv2.imread('./output_img/cubemap.jpg')

try:

    print('start getting datas...')
    sql = 'select object_name, object_id, bounding_box_cubemap, center_x_cubemap, center_y_cubemap from recognized_objects'

    cursor.execute(sql)

    rows = cursor.fetchall()

    print('completed')

    object_name_list = []

    for row in rows:
        if('Kettle' not in row[0]):
            continue
        bounding_box_cubemap = row[2]
        point_list_str = bounding_box_cubemap.split('|')
        point_list = []
        for data in point_list_str:
            point_float = list(map(float, data.split(',')))
            point = list(map(int, point_float))
            point_list.append(point)
        cv2.rectangle(panorama,
                      point_list[0],
                      point_list[2],
                      color=(0, 255, 0),
                      thickness=2,
                      lineType=cv2.LINE_AA
                      )
except MySQLdb.Error as e:
    print('MySQLdb.Error: ', e)
finally:
    cursor.close()
    connection.close()

cv2.imwrite('./output_file/2022-10-01_10-33-00_kettle_marked.jpg', panorama)

# print(object_name_list)













