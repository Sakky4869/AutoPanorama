import cv2
import MySQLdb

from sentence_transformers import util

def search_object_in_cubemap(input_word, object_name_list, object_name_and_position_list, model):

    # 入力単語は小文字にする
    input_word = input_word.lower()

    # 出力リスト
    output_list = []

    # 類似度を使って，物体の位置を探索する
    output_list = search_object_by_calc_similarity(input_word, object_name_list, object_name_and_position_list, model)

    # output_list = output_list[0]

    return output_list[0]



def get_word_data_from_db():


    # MySQLに接続
    connection = MySQLdb.connect(
        host='localhost',
        user='sakai',
        password='tyoshino',
        db='sakai',
        use_unicode=True,
        charset='utf8'
    )

    cursor = connection.cursor()

    # 物体名称のみを格納するリスト
    # これを使って，完全一致名詞の探索や類似度の計算を行う
    obj_name_list = []

    # 物体の名称と，キューブマップ上の座標データを格納するリスト
    obj_name_and_position_list = []

    try:

        # print('start getting datas...')

        # SQL文
        sql = 'select object_name, object_id, bounding_box_cubemap, center_x_cubemap, center_y_cubemap from recognized_objects'

        # SQL実行
        cursor.execute(sql)

        # 全結果をリストとして取得
        rows = cursor.fetchall()

        # print('completed')

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

    return [obj_name_list, obj_name_and_position_list]


def search_object_by_calc_similarity(input_word, object_name_list, object_name_and_position_list, model):
    """物体名称の類似度を使い，同一物体を探索する

    Args:
        input_word (string): アノテーションの一時画像から取得した物体名称
        object_name_list (list): 物体名称のリスト．これを使って類似度から探索する
        object_name_and_position_list (list): 物体名称と座標のリスト
        model (model): 類似度を計算するモデル．

    Returns:
        list: 最大類似度を持つ物体名称とその座標データ
    """

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
    for i in range(len(object_name_list)):

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

    # print('target word: {}'.format(input_word))

    # for data in word_similarity_data:
    #     print('\t{}\t{}'.format(data['word'], data['similarity']))


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
    """ヒストグラムの比較による物体探索

    Args:
        taked_picture (cv2.Mat): 撮影した写真
        obj_db (Object): 物体情報のデータベース
        cubemap (cv2.Mat): キューブマップの画像

    Returns:
        Object: ヒストグラムの類似度が最も高い領域のデータ
    """

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



