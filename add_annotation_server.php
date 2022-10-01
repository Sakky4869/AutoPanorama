<?php

require_once(dirname(__FILE__) . '/server_common.php');

function add_annotation($data)
{

    $annotation_id = $data['annotation-id'];
    $annotation_base64_jpeg = $data['annotation'];
    $panorama_id = $data['panorama-id'];
    $direction = $data['direction'];



    // 画像処理システムが未構築のため，臨時データをreturn
    $ret = array(
        'annotation-id' => $annotation_id,
        'panorama-id' => $panorama_id,
        'images' => array(
            array('index' => 0, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 1, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 2, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 3, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 4, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 5, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 6, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 7, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
            array('index' => 8, 'url' =>  './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00', 'theta' => 1.87, 'phi' => 3.10),
        )
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

$post_manager = new PostManager();

$json_manager = new JsonManager();

// methodデータがないときは，終わり
$post_manager->exit_if_post_has_no_method();


$json_post = $post_manager->get_json_in_post();

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


header( "Content-Type: application/json; charset=utf-8");

echo $json_ret;
