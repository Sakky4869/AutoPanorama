<?php

require_once(dirname(__FILE__) . '/server_common.php');

function add_annotation($data)
{

    $annotation_id = '2022-09-18_17-33-00';//$data['annotation-id'];
    $annotation_id = $data['annotation-id'];
    $annotation_base64_jpeg = $data['annotation'];
    $panorama_id = '2022-09-18_17-33-00';//$data['panorama-id'];
    $panorama_id = $data['panorama-id'];
    $direction = $data['direction'];


    // file_put_contents('./logs/log.txt', 'データ pano: ' . $panorama_id . ' anno: ' . $annotation_id . ' angle: ' . $direction . "\n", FILE_APPEND);

    $img_path = './annotation_imgs/' . $annotation_id . '.jpg';
    // $dir_name = './candidate_imgs/' . $panorama_id . '/' . $annotation_id + '/';
    // $dir_name = '../../panorama_images/candidate_imgs/' . $panorama_id . '/' . $annotation_id + '/';

    file_put_contents($img_path, base64_decode($annotation_base64_jpeg));

    // 候補画像を保存するディレクトリを作成する
    // ディレクトリ作成時のマスク設定を退避
    // $mask = umask();

    // マスク設定を一時的に消す
    // umask(000);s


    // ディレクトリを再帰的に作成
    // mkdir($dir_name, 0777, true);

    // if(chmod('./candidate_imgs/' . $panorama_id . '/', 0777)){

    // }


    // file_put_contents('./logs/log.txt', 'ディレクトリ作成 ' . $dir_name . "\n", FILE_APPEND);
    // マスク設定を戻す
    // umask($mask);

    // -- このタイミングで画像処理プログラムを非同期実行する ----
    exec('./image_process ' . $panorama_id . ' ' . $annotation_id . ' ' . $direction . ' > /dev/null &');

    file_put_contents('./logs/log.txt', '画像処理プログラム開始' . "\n", FILE_APPEND);
    // 画像処理システムが未構築のため，臨時データをreturn
    // $ret = array(
    //     'annotation-id' => $annotation_id,
    //     'panorama-id' => $panorama_id,
    //     'images' => array(
    //         array('index' => 1, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 2, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 3, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 4, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 5, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 6, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 7, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 8, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //         array('index' => 9, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
    //     )
    // );

    $ret = array(
        'result' => 'true'
    );

    $json_manager = new JsonManager();

    $json = $json_manager->get_json_response($ret);

    return $json;
}

function decide_annotation($data)
{
    $annotation_id = $data['annotation-id'];
    $panorama_id = $data['panorama-id'];
    $theta = floatval($data['theta']);
    $phi = floatval($data['phi']);

    $db_config = new DatabaseConfigPanorama();

    $json_manager = new JsonManager();

    $pdo = $db_config->connect_db();

    $sql = 'insert into annotation (annotation_id, theta, phi, panorama_id) values (?, ?, ?, ?)';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $annotation_id);
    $statement->bindValue(2, $theta);
    $statement->bindValue(3, $phi);
    $statement->bindValue(4, $panorama_id);

    $result = $statement->execute();

    // file_put_contents('./logs/log.txt', 'annotation-id: ' . $annotation_id . ', theta: ' . $theta, ', phi: '. $phi . ', panorama-id: '. $panorama_id . "\n", FILE_APPEND);

    $ret = array(
        'result' => 'true'
    );

    $json = $json_manager->get_json_response($ret);

    return $json;

}

function check_image_progress($data){

    $annotation_id = '2022-09-18_17-33-00';//$data['annotation-id'];
    $annotation_id = $data['annotation-id'];
    $panorama_id = '2022-09-18_17-33-00';//$data['panorama-id'];
    $panorama_id = $data['panorama-id'];

    $db_config = new DatabaseConfigPanorama();

    $json_manager = new JsonManager();

    $pdo = $db_config->connect_db();

    $sql = 'select progress from detect_progress where panorama_id=? and annotation_id=?';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $panorama_id);
    $statement->bindValue(2, $annotation_id);

    $statement->execute();

    $result = $statement->fetch();

    // file_put_contents('./logs/log.txt', , FILE_APPEND);

    $ret = array(
        'result' => 'true',
        'progress' => $result['progress']
    );

    $json = $json_manager->get_json_response($ret);

    return $json;
}


function get_annotation_datas($data){

    $annotation_id = '2022-09-18_17-33-00';//$data['annotation-id'];
    $annotation_id = $data['annotation-id'];
    $panorama_id = '2022-09-18_17-33-00';//$data['panorama-id'];
    $panorama_id = $data['panorama-id'];

    $db_config = new DatabaseConfigPanorama();

    $json_manager = new JsonManager();

    $pdo = $db_config->connect_db();

    $sql = 'select * from detect_result where panorama_id=? and annotation_id=?';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $panorama_id);
    $statement->bindValue(2, $annotation_id);

    $statement->execute();

    $result = $statement->fetchAll();


    // file_put_contents('./logs/log.txt',  . "\n", FILE_APPEND);s


    $ret = array(
        'result' => 'true',
        'annotation-id' => $annotation_id,
        'panorama-id' => $panorama_id,
        'images' => array(),
    );


    // file_put_contents('./logs/log.txt', 'result: ' . count($result) . "\n", FILE_APPEND);

    foreach($result as $row){

        // file_put_contents('./logs/log.txt', 'img_index：' . $row['img_index'] . "\n", FILE_APPEND);
        $data = array(
            'index' => (int)$row['img_index'],
            'url' => $row['url'],
            'theta' => (float)$row['theta'],
            'phi' => (float)$row['phi']
        );
        array_push($ret['images'], $data);
        // $ret['images']
    }


    // file_put_contents('./logs/log.txt', 'データ取得完了' . "\n", FILE_APPEND);


    $json = $json_manager->get_json_response($ret);

    return $json;
}


$post_manager = new PostManager();

$json_manager = new JsonManager();

// methodデータがないときは，終わり
$post_manager->exit_if_post_has_no_method();

// POSTデータのJSON文字列を取得
$json_post = $post_manager->get_json_in_post();

// JSON文字列を配列に変換
$json_array = $json_manager->get_array_from_json($json_post);

$json_ret = null;

if ($post_manager->check_method_equals('add-annotation')) {

    // $json_post = $post_manager->get_json_in_post();

    // $json_array = $json_manager->get_array_from_json($json_post);

    $json_ret = add_annotation($json_array);

    // header( "Content-Type: application/json; charset=utf-8");

    // echo $json_ret;
}

if($post_manager->check_method_equals('decide-annotation')){


    file_put_contents('./logs/log.txt', 'request : decide-annotation' . "\n", FILE_APPEND);

    // $json_post = $post_manager->get_json_in_post();

    // $json_array = $json_manager->get_array_from_json($json_post);

    $json_ret = decide_annotation($json_array);

    // header( "Content-Type: application/json; charset=utf-8");

    // echo $json_ret;
}

if($post_manager->check_method_equals('check-image-progress')){


    file_put_contents('./logs/log.txt', 'request : check-image-progress' . "\n", FILE_APPEND);

    $json_ret = check_image_progress($json_array);
}


if($post_manager->check_method_equals('get-annotation-datas')){


    file_put_contents('./logs/log.txt', 'request : get-annotation-datas' . "\n", FILE_APPEND);

    $json_ret = get_annotation_datas($json_array);
}

header( "Content-Type: application/json; charset=utf-8");

echo $json_ret;
