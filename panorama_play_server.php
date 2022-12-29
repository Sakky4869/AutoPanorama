<?php
ini_set('display_erros', 'On');

require_once(dirname(__FILE__) . '/server_common.php');
require_once(dirname(__FILE__) . '/app_config.php');


// パノラマのオリジナル画像のURLを取得する関数
// 取得が，クライアントだけでできることがわかったので，実装しない
// function get_panorama_origin_url(){

// }

function get_panorama_annotations($panorama_id, $app_config){

    $db_config = new DatabaseConfigPanorama();

    $json_manager = new JsonManager();

    $pdo = $db_config->connect_db();

    if($pdo == null){

        $data = array(
            'result' => true,
            'message' => 'データベースに接続できませんでした'
        );

        $ret = $json_manager->get_json_response($data);


        header( "Content-Type: application/json; charset=utf-8");
        echo $ret;
        exit();
    }

    // アノテーションのデータベースから，
    // アノテーションIDとtheta，phiを取得するSQLを構築
    $sql = 'select annotation_id, theta, phi from annotation where panorama_id=?';

    $statement = $pdo->prepare($sql);

    // アノテーションIDをバインド
    $statement->bindValue(1, $panorama_id);

    $statement->execute();

    // file_put_contents('./logs/log.txt', 'mysql実行' . "\n", FILE_APPEND);

    // 結果の配列を作成
    $result = array(
        'result' => true,
        'datas' => array()
    );


    // file_put_contents('./logs/log.txt', 'result length: ' . (string)count($statement, COUNT_RECURSIVE) . "\n", FILE_APPEND);

    foreach($statement as $row){

        $url = $app_config->get_img_save_base_dir() . '/annotation_imgs/' . $row['annotation_id'] . '.jpg';
        $img_data = base64_encode(file_get_contents($url));

        // データを作成
        $data = array(
            'annotation-id' => $row['annotation_id'],
            'theta' => $row['theta'],
            'phi' => $row['phi'],
            'img' => 'data:image/jpg;base64,' . $img_data,
        );

        // 結果の配列に追加
        array_push($result['datas'], $data);
    }

    // file_put_contents('./logs/log.txt', '結果の配列を作成' . "\n", FILE_APPEND);

    // 配列をJSONに変換
    $json = $json_manager->get_json_response($result);

    // JSONデータを出力
    return $json;
}

// アプリの設定クラスを初期化
$app_config = new AppConfig();

// POSTデータの管理クラスを初期化
$post_manager = new PostManager();

// JSONデータの変換クラスを初期化
$json_manager = new JsonManager();

// methodが定義されていなければ，終了メッセージを出力して終わり
$post_manager->exit_if_post_has_no_method();

// アノテーションデータを要求された場合
if($post_manager->check_method_equals('get-annotation-datas')){

    // POSTされたJSONデータを取得
    $json_post = $post_manager->get_json_in_post();

    // file_put_contents('./logs/log.txt', 'get json in post' . "\n", FILE_APPEND);

    // JSONデータを配列に変換
    $array_post = $json_manager->get_array_from_json($json_post);

    // file_put_contents('./logs/log.txt', 'get array from json' . "\n", FILE_APPEND);

    // アノテーションデータを，データベースから取得
    $json = get_panorama_annotations($array_post['panorama-id'], $app_config);

    // file_put_contents('./logs/log.txt', 'get annotations' . "\n", FILE_APPEND);


    // アノテーションデータを返す
    header( "Content-Type: application/json; charset=utf-8");
    echo $json;

}

?>
