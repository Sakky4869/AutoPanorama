<?php

// セッション開始
session_start();

require_once(dirname(__FILE__) . '/view_common.php');

// ログイン機能を使う場合
if($app_config->check_use_login_func() == true){

    // セッションにIDが存在しない場合
    if($session_manager->check_session_has_key('ID') == false){

        // ログイン画面にリダイレクト
        $session_manager->redirect_to('./login.php');
    }
}


?>

<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- BoostrapのCSSファイル -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">

    <!-- 共通のCSSファイル -->
    <link rel="stylesheet" href="./css/common.css">

    <!-- プレビュー画面のCSSファイル -->
    <link rel="stylesheet" href="./css/panorama_play.css">

    <!-- Robotoフォントを適用する設定 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">

    <title>Auto Panorama</title>
</head>

<body>

    <!-- BootstrapのNavbar -->
    <!-- 今後ログイン機能などを実装した際に活用予定 -->
    <nav class="navbar navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="#"></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarText">
                <!-- <ul class="navbar-nav me-auto mb-2 mb-lg-0"> -->
                <!-- <li class="nav-item">
                        <a class="nav-link active" aria-current="page" href="#"></a>
                    </li> -->
                <!-- </ul> -->
            </div>
        </div>
    </nav>

    <!-- ダウンロード進捗表示エリア -->
    <div id="loading-window">
        <div class="container-fluid" id="loading-window-container">
            パノラマ読み込み中
            <div class="progress">
                <div class="progress-bar bg-dark" id="download-progress" style="width: 0%" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
        </div>
    </div>

    <!-- メッセージ表示エリア -->
    <div id="message-window">
        <div class="container-fluid" id="message-box">
            <h3 id="error-main-message">
                パノラマが見つかりませんでした
            </h3>
            <div id="error-option-message">
            </div>
            <button id="error-action-button" type="button" class="btn btn-dark">戻る</button>
        </div>
    </div>

    <!-- パノラマ空間を作成するステージ -->
    <div id="panorama-world"></div>

    <!-- アノテーション追加画面へ移動するボタン -->
    <button type="button" id="add-annotation-button">
        <div class="add-annotation-mark-parts mark-ver"></div>
        <div class="add-annotation-mark-parts mark-hor"></div>
    </button>


    <!-- JQuery -->
    <script src="https://code.jquery.com/jquery-3.6.1.min.js" integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>

    <!-- Bootstra JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>

    <!-- パノラマ空間を作るためのThree.jsライブラリ -->
    <script src="./js/three.min.js"></script>

    <!-- 視点操作のためのライブラリ -->
    <script src="./js/OrbitControls.js"></script>

    <!-- パノラマ空間を初期化するスクリプト -->
    <script src="./js/panorama_world.js"></script>

    <!-- パノラマ画面の操作スクリプト -->
    <script src="./js/panorama_play.js"></script>

    <script>
        $(document).ready(async function() {

            // パノラマのIDを取得
            let panoramaID = getPanoramaID();

            // パノラマ画像のURLを取得
            let panoramaOriginUrl = getPanoramaOriginUrl(panoramaID);

            // console.log('panorama url', panoramaOriginUrl);

            // アノテーションデータを取得
            let annotationDatas = await getAnnotationDatas(panoramaID);
            // console.log(annotationDatas);

            // 臨時のアノテーションデータを作成
            // let annotationDatas = {
            //     'datas': [{
            //         'annotation-id': "2022-09-08_17-33-00",
            //         'theta': 1.87,
            //         'phi': 3.10,
            //         'annotation-url': "./annotation_imgs/2022-09-18_17-33-00.jpg"
            //     }, ]
            // };

            // パノラマ空間の初期化
            init(panoramaOriginUrl, annotationDatas);

            // パノラマ画像をダウンロードして，パノラマ空間にセット
            downloadPanoramaImage(panoramaOriginUrl);

            // ボタンを押したらアノテーション追加画面へ移動
            $('#add-annotation-button').click(function(event){
                redirectToAnnotationPage(panoramaID);
            });

        });
    </script>
</body>

</html>
