import MySQLdb

# 本APIの稼働状況をデータベースに記録するモジュール
# 以下，記録するデータ
# ・稼働時
#   ・config_key:   object_detector_api_status
#   ・config_value: running
# ・停止時
#   ・config_key:   object_detector_api_status
#   ・config_value: stopped
# ・異常発生時
#   ・config_key:   object_detector_api_status
#   ・config_value: failed

def set_api_status(status):

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
        sql = 'update app_config set config_value=%s where config_key="object_detector_api_status";'

        values = (status,)

        cursor.execute(sql, values)

        connection.commit()

    except MySQLdb.Error as e:
        print('MySQLdb.Error: ', e)
    finally:
        cursor.close()
        connection.close()

def get_api_status():

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
        sql = 'select config_value from app_config where config_key="object_detector_api_status";'

        cursor.execute(sql)

        row = cursor.fetchall()[0]

        return row[0]

    except MySQLdb.Error as e:

        print('MySQLdb.Error: ', e)

    finally:
        cursor.close()
        connection.close()

