<?php
ini_set('display_erros', 'On');

require_once(dirname(__FILE__) . '/server_common.php');

// パノラマのオリジナル画像のURLを取得する関数
// 取得が，クライアントだけでできることがわかったので，実装しない
// function get_panorama_origin_url(){

// }

function get_panorama_annotations($panorama_id){

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

    // 結果の配列を作成
    $result = array(
        'result' => true,
        'datas' => array()
    );

    foreach($statement as $row){

        // データを作成
        $data = array(
            'annotation-id' => $row['annotation_id'],
            'theta' => $row['theta'],
            'phi' => $row['phi']
        );

        // 結果の配列に追加
        array_push($result['datas'], $data);
    }

    // 配列をJSONに変換
    $json = $json_manager->get_json_response($result);

    // JSONデータを出力
    return $json;
}

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

    // JSONデータを配列に変換
    $array_post = $json_manager->get_array_from_json($json_post);

    // アノテーションデータを，データベースから取得
    $json = get_panorama_annotations($array_post['panorama-id']);

    // アノテーションデータを返す
    header( "Content-Type: application/json; charset=utf-8");
    echo $json;

}

?>
