<?php
ini_set('display_errors', 1);

require_once('/home/sakai/db_conf/database_config_panorama.php');


// パノラマIDとアノテーションIDに一致する行があるかを確認
function check_row_already_exists($pdo, $panorama_id, $annotation_id){

    $sql = 'select * from detect_progress where panorama_id=? and annotation_id=?';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $panorama_id);
    $statement->bindValue(2, $annotation_id);

    $statement->execute();

    if($statement->rowCount() == 1) return true;
    return false;
}


// 該当行のprogressを更新
function update_progress($pdo, $progress, $panorama_id, $annotation_id){

    $sql = 'update detect_progress set progress=? where panorama_id=? and annotation_id=?';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $progress);
    $statement->bindValue(2, $panorama_id);
    $statement->bindValue(3, $annotation_id);

    $statement->execute();
}

// 進捗データを挿入
function insert_progress($pdo, $progress, $panorama_id, $annotation_id){

    $sql = 'insert into detect_progress(panorama_id, annotation_id, progress) values(?, ?, ?)';

    $statement = $pdo->prepare($sql);

    $statement->bindValue(1, $panorama_id);
    $statement->bindValue(2, $annotation_id);
    $statement->bindValue(3, $progress);

    $statement->execute();
}

// 結果データを挿入
function upload_result($pdo, $result_str_file_name, $panorama_id, $annotation_id){

    $result_str = file_get_contents($result_str_file_name);

    $json_data = json_decode($result_str, true);

    $images = $json_data["images"];

    for($i = 0; $i < count($images); $i++){

        $data = $images[$i];

        $img_index = $data["index"];
        $theta = $data["theta"];
        $phi = $data["phi"];
        $url = $data["url"];

        $sql = 'insert into detect_result (panorama_id, annotation_id, img_index, theta, phi, url) values(?, ?, ?, ?, ?, ?)';

        $statement = $pdo->prepare($sql);

        $statement->bindValue(1, $panorama_id);
        $statement->bindValue(2, $annotation_id);
        $statement->bindValue(3, $img_index);
        $statement->bindValue(4, $theta);
        $statement->bindValue(5, $phi);
        $statement->bindValue(6, $url);

        $statement->execute();
    }
}

function upload_regions($pdo, $panorama_id){

    $json_str = file_get_contents("output_file/" . $panorama_id . ".json");

    $json_data = json_decode($json_str, true);

    // echo "json data:\n";

    // var_dump($json_data);

    $regions = $json_data["regions"];

    for($i = 0; $i < count($regions); $i++){

        $data = $regions[$i];

        $img_file_path = $data["img_file_path"];
        $region_id = $data["region_id"];
        $top_left_x_cubemap = $data["top_left_x_cubemap"];
        $top_left_y_cubemap = $data["top_left_y_cubemap"];

        $sql = 'insert into recognized_regions(panorama_id, img_file_path, region_id, top_left_x_cubemap, top_left_y_cubemap) values(:panorama_id, :img_file_path, :region_id, :top_left_x_cubemap, :top_left_y_cubemap)';

        $statement = $pdo->prepare($sql);

        $statement->bindValue(':panorama_id', $panorama_id);
        $statement->bindValue(':img_file_path', $img_file_path);
        $statement->bindValue(':region_id', $region_id);
        $statement->bindValue(':top_left_x_cubemap', $top_left_x_cubemap);
        $statement->bindValue(':top_left_y_cubemap', $top_left_y_cubemap);

        $statement->execute();
    }


}


// データベースへの接続クラスのインスタンスを生成
$dbConfig = new DatabaseConfigPanorama();

// if($argc < 5){
//     echo "引数たりない\n";
//     exit();
// }

$pdo = $dbConfig->connect_db();

$method = (string)$argv[1];

if($method == 'update-progress'){

    // パノラマIDを取得
    $panorama_id = (string)$argv[2];


    // アノテーションIDを取得
    $annotation_id = (string)$argv[3];

    // 進捗状況の数値を取得
    $progress = (int)$argv[4];

    // $pdo = new PDO();

    // panorama_idとannotation_idに該当する行がすでに存在していれば
    if(check_row_already_exists($pdo, $panorama_id, $annotation_id)){

        // progressを更新
        update_progress($pdo, $progress, $panorama_id, $annotation_id);

    }
    else{

        // 存在しないときは，データを挿入
        insert_progress($pdo, $progress, $panorama_id, $annotation_id);

    }

}
else if($method == 'upload-result'){

    // パノラマIDを取得
    $panorama_id = (string)$argv[2];


    // アノテーションIDを取得
    $annotation_id = (string)$argv[3];

    // 結果のJSON文字列を取得
    $result_str_file_name = $argv[4];

    // var_dump($result_str);

    // 結果データをアップロード
    upload_result($pdo, $result_str_file_name, $panorama_id, $annotation_id);

}
else if($method == 'upload-regions'){

    // パノラマIDを取得
    $panorama_id = (string)$argv[2];

    // 領域データのJSON文字列を取得
    // $region_json_str = (string)$argv[3];

    // echo "json: " . $region_json_str . " ...\n";

    // 領域データのJSON文字列をデータベースに追加
    // upload_regions($pdo, $region_json_str, $panorama_id);
    upload_regions($pdo, $panorama_id);

}

?>
