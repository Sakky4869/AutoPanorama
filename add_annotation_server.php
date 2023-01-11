<?php

require_once(dirname(__FILE__) . '/server_common.php');
require_once(dirname(__FILE__) . '/app_config.php');
require_once(dirname(__FILE__) . '/flask_api_interface.php');

// アプリの設定クラスを初期化
$app_config = new AppConfig();

// file_put_contents('./logs/log.txt', 'img_base_dir：' . $img_base_dir . "\n", FILE_APPEND);

function add_annotation($data)
{

    // $annotation_id = '2022-09-18_17-33-00';
    $annotation_id = $data['annotation-id'];
    // $annotation_base64_jpeg = $data['annotation'];
    // $panorama_id = '2022-09-18_17-33-00';
    $panorama_id = $data['panorama-id'];
    $object_name = $data['object-name'];
    // $object_name = 'Kettle';
    $annotation_img_temp_id = $data['annotation-img-temp-id'];
    // $annotation_img_temp_id = '2022-12-22_16-17-24_0001';

    // $direction = $data['direction'];

    // APIに送信するデータを作成
    $data = array(
        'input_word' => $object_name,
        'annotation_img_temp_id' => $annotation_img_temp_id,
        'panorama_id' => $panorama_id,
        'annotation_id' => $annotation_id
    );

    // APIにリクエストを送信
    $res = send_request_to_flask_api('/detect_object_position', $data);


    // file_put_contents('./logs/log.txt', 'データ pano: ' . $panorama_id . ' anno: ' . $annotation_id . ' angle: ' . $direction . "\n", FILE_APPEND);

    // 位置推定システムをAPI化したため，コメントアウト
    // $img_path =  './annotation_imgs/' . $annotation_id . '.jpg';

    // $dir_name = './candidate_imgs/' . $panorama_id . '/' . $annotation_id + '/';
    // $dir_name = '../../panorama_images/candidate_imgs/' . $panorama_id . '/' . $annotation_id + '/';

    // 物体名称の取得はできている前提で進めるため，コメントアウト
    // file_put_contents($img_path, base64_decode($annotation_base64_jpeg));

    // -- このタイミングで画像処理プログラムを非同期実行する ----
    // exec('./image_process ' . $panorama_id . ' ' . $annotation_id . ' ' . $direction . ' > /dev/null &');

    // file_put_contents('./logs/log.txt', '画像処理プログラム開始' . "\n", FILE_APPEND);
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
    $json_manager = new JsonManager();

    $res_array = $json_manager->get_array_from_json($res);

    $ret = array(
        'result' => 'true',
        // 'detect-result' => $res
        'detect-result' => $res_array
    );


    $json = $json_manager->get_json_response($ret);

    return $json;
}

/**
 * 撮影物体からの名称取得を正確に行うため，一時的に撮影画像をアップする
 * 2022/12/15
 * いったんアップロードのみ行う．うまくいったら物体認識した結果をJSONで返すようにする
 */
function upload_annotation_temp($data, $app_config){
    // $annotation_id = '2022-09-18_17-33-00';
    $annotation_id = $data['annotation-id'];
    $annotation_base64_jpeg = $data['annotation'];
    // $panorama_id = '2022-09-18_17-33-00';
    $panorama_id = $data['panorama-id'];
    // $direction = $data['direction'];


    // 画像の保存先であるホームディレクトリの画像処理システムのパス
    $img_base_dir =  $app_config->get_img_save_base_dir();

    // file_put_contents('./logs/log.txt', '探索パス：' . $img_base_dir . '/annotation_imgs_temp/*.jpg' . "\n", FILE_APPEND);

    // すでにアップロードされている画像数を記録
    $temp_img_count = 0;

    $img_files = glob($img_base_dir . '/annotation_imgs_temp/*.jpg');

    // file_put_contents('./logs/log.txt', '一時画像のファイル数：' . count($img_files) . "\n", FILE_APPEND);


    // 保存するディレクトリ内の画像ファイルを探索
    foreach ($img_files as $key => $value) {

        // 画像ファイルの名前にアノテーションIDが含まれている場合のみ，画像数を１つ増やす
        if(strpos($value, $annotation_id) !== false){
            $temp_img_count++;
        }
    }

    //　画像のファイル名
    $img_path =  $img_base_dir . '/annotation_imgs_temp/' . $annotation_id . '_' . sprintf("%'.04d", $temp_img_count) . '.jpg';

    // file_put_contents('./logs/log.txt', '一時画像のファイルパス：' . $img_path . "\n", FILE_APPEND);

    file_put_contents($img_path, base64_decode($annotation_base64_jpeg));

    // 物体検出を行うファイル名を構築
    $annotation_img_temp_id = $annotation_id . '_' . sprintf("%'.04d", $temp_img_count);// . '.jpg';
    // $annotation_img_temp_id = '2022-12-22_16-17-24_0002.jpg';

    // APIに送信するデータを作成
    $data = array(
        'annotation_img_temp_id' => $annotation_img_temp_id
    );

    // APIにリクエストを送信
    $res = send_request_to_flask_api('/detect_annotation_objects', $data);

    // file_put_contents('./logs/log.txt', '一時画像のファイル数：' . (string)$temp_img_count . "\n", FILE_APPEND);


    // file_put_contents('./logs/log.txt', '一時画像保存完了：' . $img_path . "\n", FILE_APPEND);

    $json_manager = new JsonManager();

    // 物体画像の認識結果をJSON文字列で受け取る
    // $result_detect_annotation_object_str = $output[0];
    $result_detect_annotation_object_str = $res;

    // JSON配列に変換
    $result_detect_annotation_object = $json_manager->get_array_from_json($result_detect_annotation_object_str);

    $ret = array(
        'result' => 'success',
        'detect-result' => $result_detect_annotation_object,
        'annotation-img-temp-id' => $annotation_img_temp_id
    );

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

if($post_manager->check_method_equals('upload-annotation-temp')){

    $json_ret = upload_annotation_temp($json_array, $app_config);

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


    // file_put_contents('./logs/log.txt', 'request : check-image-progress' . "\n", FILE_APPEND);

    $json_ret = check_image_progress($json_array);
}


if($post_manager->check_method_equals('get-annotation-datas')){


    // file_put_contents('./logs/log.txt', 'request : get-annotation-datas' . "\n", FILE_APPEND);

    $json_ret = get_annotation_datas($json_array);
}

header( "Content-Type: application/json; charset=utf-8");

echo $json_ret;
