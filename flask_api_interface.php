<?php


function send_request_to_flask_api($endpoint, $data){

    // APIのエンドポイントをセット
    $url = 'http://localhost:8888' . $endpoint;

    // 送信するデータをJSON形式に変換
    $data_json = json_encode($data);

    // 送信データの形式をJSONにセット
    $content_type = 'Content-Type: application/json';

    // リクエストメソッドをPOSTにセット
    $request_method = 'POST';

    // CURLオブジェクトを初期化
    $curl = curl_init();

    // CURLの設定
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_HTTPHEADER, array($content_type));
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $request_method);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $data_json);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

    // 実行
    $res = curl_exec($curl);

    // APIからはJSON文字列を受け取るので，そのまま呼び出し元にreturn
    return $res;


}


?>
