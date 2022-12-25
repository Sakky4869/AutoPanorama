import io
import os
import sys
import json
import glob
import cv2
import numpy as np
# MySQLを操作するため
import MySQLdb

# spacyを用いる場合
# import spacy

# wordnetを用いる場合
# import nltk
# from nltk.corpus import wordnet

# BERTを用いる場合
from sentence_transformers import SentenceTransformer, util

# 進捗表示のため
from tqdm import tqdm
# import time
# import gensim
# from gensim.models import Word2Vec
from google.cloud import vision

# print('モデル読み込み開始')
# model = SentenceTransformer('stsb-xlm-r-multilingual')
# print('モデル読み込み完了')
# sys.exit()


# '''
# ---- 本プログラムについて ----
# detect_objects_via_vision_api.pyでデータベースに保存した物体情報を取得し，標準入力として与えられた物体名称に最も近いものを探す
#
# ---- 処理の流れ ----
# 1．MySQLから物体名称と座標のデータを取得する
# 2．物体名称のみをリスト化し，重複を除く
# 3．入力された物体名称と同一の物体名称があるか確認
#   3.1．同一の物体名称がある場合は，データベースからその名称と同じものをすべて（同じ物体名称のデータが複数存在する可能性があるため）出力する
# 4．同一の物体名称がない場合，入力された物体名称との類似度を計測し，上位10件を出力する
#
# ---- 気になる点 ----
# ・撮影物体から物体情報が取れないときなど，例外処理を含めたフローを整理したほうがいい
# '''

# ホームディレクトリにモデルデータをダウンロード（済み）
# nltk.download('wordnet')
# nltk.download('omw-1.4')


# sys.exit()
def get_taked_object_name(path):

    img = cv2.imread(path)
    # path_splited = path.split('/')
    # print('file name: {}'.format(path_splited[len(path_splited) - 1]))
    # return
    height, width = img.shape[:2]

    client = vision.ImageAnnotatorClient()

    with io.open(path, 'rb') as image_file:
            content = image_file.read()

    image = vision.Image(content=content)

    objects = client.object_localization(image=image).localized_object_annotations

    print('objects:')
    for obj in objects:
        print('\t{}'.format(obj.name))

    # 取得した物体情報が１つでない場合は失敗とする
    if(len(objects) != 1):
        return None

    # if(len(objects) == 0):
    #     return None

    # 物体の名称・画像データのみを返す
    obj = objects[0]
    obj_data = {}
    obj_data['obj_name'] = obj.name
    obj_output_name = obj_data['obj_name'].replace(' ', '_')

    vertices = obj.bounding_poly.normalized_vertices

    top = int(vertices[0].y * height)
    bottom = int(vertices[2].y * height)
    left = int(vertices[0].x * width)
    right = int(vertices[1].x * width)


    cv2.rectangle(img, (left, top), (right, bottom), (0, 255, 0), thickness=6, lineType=cv2.LINE_AA)

    cv2.putText(
            img,
            # text=data['word'],
            # text=str(i) + '_' + str(data['similarity_hist_hsv']),
            text=obj_output_name,
            org=(left, top),
            fontFace=cv2.FONT_HERSHEY_SIMPLEX,
            fontScale=4.0,
            color=(0, 200, 0),
            thickness=6,
            lineType=cv2.LINE_AA
        )

    cv2.imwrite('./output_img/picture_obj_' + obj_output_name + '.jpg', img)

    obj_data['img'] = img[top : bottom, left : right]

    return obj_data



def get_word_data_from_db():
    """MySQLのデータベースから物体名称データを取得
    物体名称のみのリストと，物体名称および，キューブマップ上の座標データを格納したリストを返す
    """

    # MySQLに接続
    connection = MySQLdb.connect(
        host='localhost',
        user='sakai',
        password='tyoshino',
        db='sakai',
        use_unicode=True,
        charset='utf8'
    )

    # 操作するためのカーソルを作成
    cursor = connection.cursor()


    # 物体名称のみを格納するリスト
    # これを使って，完全一致名詞の探索や類似度の計算を行う
    obj_name_list = []

    # 物体の名称と，キューブマップ上の座標データを格納するリスト
    obj_name_and_position_list = []

    try:

        print('start getting datas...')

        # SQL文
        sql = 'select object_name, object_id, bounding_box_cubemap, center_x_cubemap, center_y_cubemap from recognized_objects'

        # SQL実行
        cursor.execute(sql)

        # 全結果をリストとして取得
        rows = cursor.fetchall()

        print('completed')

        for row in rows:
            # 物体名称を取得
            object_name = row[0].lower()

            # wordnetを使う場合，スペースをアンダーバーに変換
            # if(check_using_wordnet()):
            #     object_name = object_name.replace(' ', '_')

            # 物体名称のみのリストに格納
            obj_name_list.append(object_name)

            # 物体を囲むバウンディングボックスの頂点情報を取得
            bounding_box_cubemap = row[2]

            # 左上，右上，右下，左下の情報になるように分割
            point_list_str = bounding_box_cubemap.split('|')

            point_list = []
            # 文字列なので，intに変換する
            for data in point_list_str:
                point_float = list(map(float, data.split(',')))
                point = list(map(int, point_float))
                point_list.append(point)
            # 取得したデータをリストに格納する
            obj_name_and_position_list.append({
                'word': object_name,
                'pos_top_left': point_list[0],
                'pos_top_right': point_list[1],
                'pos_bottom_right': point_list[2],
                'pos_bottom_left': point_list[3]
            })
            # 描画
            # cv2.rectangle(panorama,
            #               point_list[0],
            #               point_list[2],
            #               color=(0, 255, 0),
            #               thickness=2,
            #               lineType=cv2.LINE_AA
            #               )
    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)
    finally:
        cursor.close()
        connection.close()

    # 重複を除く
    obj_name_list = list(set(obj_name_list))

    print('word:')
    for obj_name in obj_name_list:
        print('\t{}'.format(obj_name))

    return [obj_name_list, obj_name_and_position_list]


def search_object_by_exact_match(input_word, object_name_list, object_name_and_position_list):
    """データベースから取得した物体名称と，入力された物体名称の，完全一致による探索を行う

    Args:
        search_word (string): 入力された単語（撮影物体）
        word_db (list): データベース内の物体名称のリスト

    Returns:
        string or None: 一致する物体が見つかった場合はその物体名称を，見つからなかった場合はNoneを返す
    """

    # もし撮影物体の名称がリストにない場合はNoneを返す
    if(input_word not in object_name_list):
        return None

    # 出力リスト
    output_list = []

    # 文字列が一致したデータのみを取り出す
    for data in object_name_and_position_list:
        if(data['word'] == input_word):
            output_list.append(data)

    return output_list

def search_object_by_calc_similarity(input_word, object_name_list, object_name_and_position_list, model):

    # nlp = None
    # 類似度算出のためのモデルをロード spacy
    # nlp = spacy.load('en_core_web_lg')

    # 類似度算出のためのモデルをロード BERT
    # print('モデルロード中...', end='')
    # model = SentenceTransformer('stsb-xlm-r-multilingual')
    # print('完了')
    # 類似度を計算するためのオブジェクトを生成 spacy

    # input_word_nlp = nlp(input_word)

    # 類似度を計算するためのオブジェクトを生成 wordnet
    # w1 = wordnet.synset(input_word + '.n.01')

    # 類似度を計算するためのオブジェクトを生成 BERT
    emb1 = model.encode(input_word)

    # 類似度データを含めたリスト
    word_similarity_data = []

    index = 0

    # 類似度を計算して，リストに格納する
    for i in tqdm(object_name_list):

        # 単語を取ってくる
        # word_comp = object_name_and_position_list[index]['word']
        word_comp = object_name_list[index]
        # print('comp word: {}'.format(word_comp))

        # 取ってきた単語で，類似度を計算するためのオブジェクトを生成 spacy
        # word_comp_nlp = nlp(word_comp)
        # 取ってきた単語で，類似度を計算するためのオブジェクトを生成 wordnet
        # w2 = wordnet.synset(word_comp + '.n.01')
        # 取ってきた単語で，類似度を計算するためのオブジェクトを生成 BERT
        emb2 = model.encode(word_comp)

        # 入力単語とデータベースの単語で類似度を計算 spacy
        # similarity = input_word_nlp.similarity(word_comp_nlp)

         # 入力単語とデータベースの単語で類似度を計算 BERT
        similarity = float(util.cos_sim(emb1, emb2))

        # 入力単語とデータベースの単語で類似度を計算 spacy
        # wup
        # similarity = w1.wup_similarity(w2)
        # path
        # similarity = w1.path_similarity(w2)

        # リストに追加
        word_similarity_data.append({
            'word': word_comp,
            'similarity': similarity,
            # 'pos_top_left': object_name_and_position_list[index]['pos_top_left'],
            # 'pos_bottom_right': object_name_and_position_list[index]['pos_bottom_right']
        })

        index += 1

    # 類似物体として採用する数
    # 例えば９だと，上位９個を類似物体として採用
    adopt_count = 10

    # 類似度でソートし，採用数分だけ切り取る
    word_similarity_data = sorted(word_similarity_data, key=lambda d: d['similarity'], reverse=True)[0:adopt_count]

    # 採用データのうち，単語情報のみ抽出
    similar_word_list = [d['word'] for d in word_similarity_data]

    print('target word: {}'.format(input_word))

    for data in word_similarity_data:
        print('\t{}\t{}'.format(data['word'], data['similarity']))


    # for i in range(len(similar_word_list)):
        # if(i == len(similar_word_list)):
        #     break
        # print('\t{}'.format(similar_word_list[i]))

    # 出力リスト
    output_list = []

    # 物体名称と座標のデータから，類似度が高いと判定された名称を含むもののみ，出力リストに追加
    for sim_word in similar_word_list:
        for obj_data in object_name_and_position_list:
            if(obj_data['word'] == sim_word):
                output_list.append(obj_data)

    # for data in object_name_and_position_list:
    #     if(data['word'] in similar_word_list):
    #         print('find: {}'.format(data['word']))
    #         output_list.append(data)

    return output_list

def search_object_by_calc_hsv_hist(taked_picture, obj_db, cubemap):

    # ---- 読み込んだ撮影画像をHSVに変換 ----
    taked_picture_hsv = cv2.cvtColor(taked_picture, cv2.COLOR_BGR2HSV)

    # ---- 撮影画像のHSVヒストグラムを算出 ----
    hist_hsv_taked_picture = []
    for channel in range(3):
        hist_hsv_taked_picture.append(cv2.calcHist([taked_picture_hsv], [channel], None, histSize=[256], ranges=[0, 256]))

    # ---- データベースから取得できる物体領域に対して，撮影画像とのヒストグラムの類似度を計算 ----
    for obj in obj_db:
        # 座標情報取得
        pos_top_left = obj['pos_top_left']
        pos_bottom_right = obj['pos_bottom_right']
        top = pos_top_left[1]
        bottom = pos_bottom_right[1]
        left = pos_top_left[0]
        right = pos_bottom_right[0]

        # 物体領域を切り取り
        obj_img = cubemap[top : bottom, left : right]

        # HSVに変換
        obj_img_hsv = cv2.cvtColor(obj_img, cv2.COLOR_RGB2HSV)

        # ヒストグラムの類似度のリスト
        hist_similarity_list = []

        # ヒストグラムの類似度を計算し，リストに格納
        for channel in range(3):
            hist = cv2.calcHist([obj_img_hsv], [channel], None, histSize=[256], ranges=[0, 256])
            hist_similarity = cv2.compareHist(hist_hsv_taked_picture[channel], hist, cv2.HISTCMP_CORREL)
            hist_similarity_list.append(hist_similarity)

        # ヒストグラムの平均値を計算
        mean_hist_similarity = np.mean(hist_similarity_list)

        # データベースに格納
        obj['similarity_hist_hsv'] = mean_hist_similarity

    # ヒストグラムの類似度上位を出力
    # 出力として採用する数
    adopt_count = 1
    # obj_db = sorted(obj_db, key=lambda d: d['similarity_hist_hsv'], reverse=True)
    obj_db = sorted(obj_db, key=lambda d: d['similarity_hist_hsv'], reverse=True)[0:adopt_count]

    return obj_db

def search_object_in_cubemap(taked_picture_path, object_name_list, object_name_and_position_list, model):

    # ---- 撮影された物体から物体情報を取得する ----
    print('撮影画像から物体情報を取得中...')

    # 撮影された物体画像のパス
    # システムとして稼働させるときは，コマンドライン引数から取得
    # taked_picture_path = './annotation_imgs/kettle.jpg'
    # taked_picture_path = './annotation_imgs/oven.jpg'

    # Vision APIで物体情報を取得
    taked_picture_obj_data = get_taked_object_name(taked_picture_path)

    # return

    if(taked_picture_obj_data == None):
        print('物体情報なし')
        sys.exit()

    print('取得完了')

    # 入力された物体名称
    # spacyを使う場合は，単語間のスペースはあっていい
    # wordnetを使う場合は，単語間のスペースはアンダーバーに置き換える
    input_word = taked_picture_obj_data['obj_name'].lower()
    # input_word = 'kettle'
    # input_word = 'wall clock'
    # input_word = 'wall_clock'
    # input_word = 'home appliance'
    # input_word = ''
    # input_word = 'electric kettle'

    print('input_word: {}'.format(input_word))

    # 出力リスト
    # 物体名称とその座標情報を出力する
    output_list = []

    # データベースから，物体名称と座標データを取得する
    # mainで実行する
    # object_name_list, object_name_and_position_list = get_word_data_from_db()

    # return

    # ---- 自然言語処理による物体領域の絞り込み ----

    # 文字列の完全一致による物体名称の探索
    # output_list = search_object_by_exact_match(input_word, object_name_list, object_name_and_position_list)

    # 類似度の算出による物体名称の探索
    output_list = search_object_by_calc_similarity(input_word, object_name_list, object_name_and_position_list, model)

    # for i, data in enumerate(output_list):
    #     print('{}: {}'.format(i, data['word']))
    output_list = output_list[:1]

    print('keys:')
    print(output_list[0].keys())

    cubemap = cv2.imread('./output_img/cubemap.jpg')

    # ---- HSVのヒストグラム比較による最後の絞り込み ----
    # taked_picture = cv2.imread(taked_picture_path)
    taked_picture = taked_picture_obj_data['img']
    cv2.imwrite('./output_img/taked_picture_obj.jpg', taked_picture)
    # output_list = search_object_by_calc_hsv_hist(taked_picture, output_list, cubemap)

    if(output_list == None):
        print('output_list is None')
        sys.exit()

    print('output_list count: {}'.format(len(output_list)))


    # データ出力
    for i in range(len(output_list)):
        data = output_list[i]
        # continue
        cv2.putText(
            cubemap,
            # text=data['word'],
            # text=str(i) + '_' + str(data['similarity_hist_hsv']),
            # text=str(i) + '_' + data['word'],
            text=data['word'],
            org=(data['pos_top_left'][0], data['pos_top_left'][1]),
            fontFace=cv2.FONT_HERSHEY_SIMPLEX,
            fontScale=1.0,
            color=(0, 200, 0),
            thickness=1,
            lineType=cv2.LINE_AA
        )
        # panorama,
        # text=object_name,
        # org=(point_list[0][0], point_list[0][1]),
        # fontFace=cv2.FONT_HERSHEY_SIMPLEX,
        # fontScale=1.0,
        # color=(0, 200, 0),
        # thickness=2,
        # lineType=cv2.LINE_AA)
        cv2.rectangle(
            cubemap,
            data['pos_top_left'],
            data['pos_bottom_right'],
            color=(0, 255, 0),
            thickness=2,
            lineType=cv2.LINE_AA
        )
    # 出力するファイル名のために，単語のスペースをアンダースコアに置換
    input_word = input_word.replace(' ', '_')

    # 描画データを出力
    # 完全一致による探索の結果
    # cv2.imwrite('./output_img/cubemap_search_' + input_word + '_exact.jpg', cubemap)
    # 類似度算出による探索の結果
    # output_file_name = './output_img/cubemap_search_' + input_word + '_similarity_spacy.jpg'
    output_file_name = './output_img/cubemap_search_' + input_word + '_similarity_bert.jpg'
    print('output file name: {}'.format(output_file_name))
    cv2.imwrite(output_file_name, cubemap)
    # cv2.imwrite('./output_img/cubemap_search_' + input_word + '_similarity_wordnet.jpg', cubemap)


if(__name__ == '__main__'):

    taked_picture_file_paths = [
        './annotation_imgs/clock.jpg',
        './annotation_imgs/kettle.jpg',
        './annotation_imgs/oven.jpg'
    ]

    # データベースから，物体名称と座標データを取得する
    object_name_list, object_name_and_position_list = get_word_data_from_db()

    # 類似度算出のためのモデルをロード
    print('モデルロード中...', end='')
    model = SentenceTransformer('stsb-xlm-r-multilingual')
    print('完了')

    # 物体名称の類似度を計算し，撮影物体の位置を推定する
    for taked_picture_file_path in taked_picture_file_paths:
        search_object_in_cubemap(taked_picture_file_path, object_name_list, object_name_and_position_list, model)

