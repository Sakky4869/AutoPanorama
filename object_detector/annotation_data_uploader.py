import MySQLdb

def upload_annotation_data(annotation_id, theta, phi, panorama_id):
    """アノテーションデータをデータベースにアップロードする

    Args:
        connection (MySQL.connect): MySQLとの接続情報
        annotation_id (string): アノテーションID
        theta (float): theta
        phi (float): phi
        panorama_id (string): パノラマID
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

    cursor = connection.cursor()

    try:

        # すでにannotation_idとpanorama_idが一致するデータが存在するか確認
        sql = 'select count(*) from  annotation where annotation_id=%s and panorama_id=%s;'

        # print('annotation_id {}, panorama_id: {}'.format(annotation_id, panorama_id))

        values = (annotation_id, panorama_id)

        cursor.execute(sql, values)

        # すでにデータが存在していれば，データ更新に変更
        if(cursor.fetchone()[0] == 1):
            update_annotation_data(connection, annotation_id, theta, phi, panorama_id)
            return

        # まだデータが存在していなければ，挿入
        sql = 'insert into annotation (annotation_id, theta, phi, panorama_id) values(%s, %s, %s, %s);'

        values = (annotation_id, theta, phi, panorama_id)

        cursor.execute(sql, values)

        connection.commit()

    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)


def update_annotation_data(connection, annotation_id, theta, phi, panorama_id):
    """アノテーションデータを更新する

    Args:
        connection (MySQL.connect): MySQLとの接続情報
        annotation_id (string): アノテーションID
        theta (float): theta
        phi (float): phi
        panorama_id (string): パノラマID
    """

    cursor = connection.cursor()

    try:
        sql = 'update annotation set annotation_id=%s, theta=%s, phi=%s, panorama_id=%s;'

        values = (annotation_id, theta, phi, panorama_id)

        cursor.execute(sql, values)

        connection.commit()

    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)
