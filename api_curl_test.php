<?php

$url = 'http://localhost:8888';

$url .= '/detect_annotation_objects';
// $url .= '/detect_object_position';

// cURLを初期化
$curl = curl_init();

// 送信するデータ
$data = array(
    'annotation_img_temp_id' => '2022-12-22_11-39-50_0002'
);

// $data = array(
//     'input_word' => 'Kettle'
// );

$data_json = json_encode($data);

// URL指定
curl_setopt($curl, CURLOPT_URL, $url);

// 送信データの形式がJSONであることをヘッダに書き込み
curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));

// リクエストメソットをPOSTにする
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'POST');

// JSONデータをセット
curl_setopt($curl, CURLOPT_POSTFIELDS, $data_json);

// curl_setopt($curl, CURLOPT_POST, true);
// curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

// 実行
$res = curl_exec($curl);

echo '---- response ----' . "\n";

echo $res . "\n";

// 結果を表示する
// var_dump($res);

// cURLを終了
curl_close($curl);

?>
