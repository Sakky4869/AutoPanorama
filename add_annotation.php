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
    <link rel="stylesheet" href="./css/add_annotation.css">
    <!-- <link rel="stylesheet" href="./select_grid.css"> -->

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

    <!-- videoとボタン関係を入れるcontent -->
    <div class="container-fluid" id="content">

        <!-- ビデオの親 -->
        <div id="video-area">

            <!-- カメラを表示するvideo -->
            <video autoplay muted playsinline id="camera-video"></video>

            <!-- 撮影データを画像化するために，一時的に撮影データを格納する -->
            <canvas id="camera-canvas"></canvas>

            <!-- 撮影結果を表示するimg -->
            <img id="camera-image" src="" alt="">
            <!-- ガイド枠 -->
            <!-- 表示方法をよく調べる必要あり -->
            <!-- position: absolute;以外でなんとかする方法を調べたい -->
            <!-- <div id="guide-box"></div> -->
        </div>

        <!-- ボタン関係を表示するdiv -->
        <div id="button-area">

            <!-- 取り直しボタン -->
            <div class="action-button" id="retake-button">
                <img class="icon" src="./imgs/retake_picture_icon.svg" alt="">
                <p class="icon-text">取り直す</p>
            </div>

            <!-- 送信ボタン -->
            <div class="action-button" id="send-button">
                <img class="icon" src="./imgs/send_icon.svg" alt="">
                <p class="icon-text">送る</p>
            </div>

            <!-- 撮影ボタン -->
            <div class="action-button" id="take-button">
                <img class="icon" src="./imgs/take_picture_icon.svg" alt="">
                <p class="icon-text">撮影</p>
            </div>

            <!-- ヘルプボタン -->
            <!-- ガイドに沿って撮影するように促すコンテンツを表示する予定 -->
            <div class="action-button" id="help-button">
                <img class="icon" src="./imgs/question_mark_white_in_black.svg" alt="">
                <p class="icon-text">ヘルプ</p>
            </div>
        </div>

        <!-- <div id="debug-area">
            <div class="debug-row">
                <p class="item-title" id="direction">direction：</p>
                <p class="item-value" id="direction-value"></p>
            </div>
            <div class="debug-row">
                <p class="item-title" id="absolute">absolute：</p>
                <p class="item-value" id="absolute-value"></p>
            </div>
            <div class="debug-row">
                <p class="item-title" id="alpha">alpha：</p>
                <p class="item-value" id="alpha-value"></p>
            </div>
            <div class="debug-row">
                <p class="item-title" id="beta">beta：</p>
                <p class="item-value" id="beta-value"></p>
            </div>
            <div class="debug-row">
                <p class="item-title" id="ganma">ganma：</p>
                <p class="item-value" id="ganma-value"></p>
            </div>
        </div> -->

    </div>

    <!-- モーダルウィンドウを表示するためのボタン -->
    <!-- 非表示にして，JSからクリックする -->
    <button id="open-candidate-modal-button" type="button" class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#candidate-modal"></button>

    <!-- 候補表示用のモーダルウィンドウ -->
    <!-- if you want to close by clicking outside the modal, delete the last endpoint:data-bs-backdrop and data-bs-keyboard -->
    <div class="modal fade" id="candidate-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" role="dialog" aria-labelledby="candidate-modal-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-sm" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="candidate-modal-title">画像処理の待機中</h5>
                        <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
                </div>
                <div class="modal-body">

                    <!-- 画像処理システムの結果待ちのときに表示するエリア -->
                    <div class="container-sm" id="wait-area">
                        <button id="progress-value" class="btn btn-primary" type="button" disabled>
                            <span style="margin-right: 5px;" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            0%
                        </button>
                    </div>

                    <!-- 候補画像一覧を表示するエリア -->
                    <div class="container-sm" id="select-box-area"></div>

                    <!-- アノテーションの位置が決まったときに，OKマークを表示するエリア -->
                    <div class="container-sm" id="accept-annotation-mark-area">
                        <p>決定しました</p>
                        <img  id="accept-annotation-mark" src="./imgs/accepted_icon.svg" alt="">
                    </div>
                </div>

                <div id="annotation-modal-footer" class="modal-footer">
                    <button id="cancel-annotation-button"  type="button" class="btn btn-secondary" data-bs-dismiss="modal">この中にはない</button>
                    <button id="decide-annotation-button" type="button" class="btn btn-primary">決定</button>
                </div>
            </div>
        </div>
    </div>

    <!-- JQuery -->
    <script src="https://code.jquery.com/jquery-3.6.1.min.js" integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>

    <!-- 日付取得 -->
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>

    <!-- アノテーション追加画面の機能のスクリプト -->
    <script src="./js/add_annotation.js"></script>

    <!-- 画面作成の際，カメラからの映像取得を確認するため，臨時のスクリプトを作成 -->
    <script>
        $(document).ready(async function() {

            // $('#open-candidate-modal-button').trigger('click');
            await init();
        });
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
</body>

</html>
