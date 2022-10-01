<?php

// データベースへの接続設定ファイルを使う
require_once('../../db_conf/database_config_panorama.php');

/**
 * アプリの設定クラス
 */
class AppConfig{

    /**
     * ログイン機能を使用するかどうかを確認
     * データベースに接続し，ログイン機能がtrueになっていたら，trueを返す
     *
     * @return bool
     */
    public function check_use_login_func(){

        // データベースへの接続クラスを初期化
        $dbConfig = new DatabaseConfigPanorama();

        // データベースへ接続
        $pdo = $dbConfig->connect_db();

        if($pdo == null){
            exit('DBに接続できませんでした');
        }

        // ログイン機能を使用するかどうかを取得するSQL文を構築
        $sql = 'select config_value from app_config where config_key= "use_login_func"';

        // 実行
        $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        // ログイン機能を使っているかどうかを返す
        return $rows[0]['config_value'] == 'true';
    }

}

// テスト
// $app_config = new AppConfig();
// echo $app_config->check_use_login_func() == true ? 'true' : 'false';
// echo '\n';
// exit();

?>
