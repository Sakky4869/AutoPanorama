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

/**
 * 日付データの文字列を表示用に変更
 * 変更前：YYYY-MM-DD_HH-mm-ss
 * 変更後：YYYY.mm.dd HH:mm:ss
 *
 * @param string $date_str
 * @return string
 */
function change_date_format($date_str){

    $array = explode('_', $date_str);
    $day = $array[0];
    $time = $array[1];

    return str_replace('-', '.', $day) . ' ' . str_replace('-', ':', $time);
}

/**
 * パノラマのデータを取得する
 * 取得データ：panorama_id，panorama_name
 *
 * @return array
 */
function get_panorama_datas(){

    // データベースに接続するクラスを初期化
    $dbConfig = new DatabaseConfigPanorama();

    // データベースに接続
    $pdo = $dbConfig->connect_db();

    if($pdo == null) return array();

    // パノラマのIDと名前を取得するSQL
    $sql = 'select panorama_id, panorama_name from panorama';

    // 実行
    $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

    return $rows;

}

// パノラマ関係のデータを取得
$panorama_datas = get_panorama_datas();

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
    <link rel="stylesheet" href="./css/panorama_preview.css">

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

    <!-- 表示エリア -->
    <div class="container-sm preview-area">

        <!-- タイトル -->
        <h2 id="preview-title">パノラマ一覧</h2>

        <!-- プレビューを表示するエリア -->
        <div id="content-box">

    <?php
        // 取得したパノラマデータに対して実行
        for($i = 0; $i < count($panorama_datas); $i++){
            $panorama = $panorama_datas[$i];
            $panorama_id = $panorama['panorama_id'];
            $panorama_name = $panorama['panorama_name'];
    ?>
            <!-- プレビューコンテンツ -->
            <div class="card preview-card" data-panorama-id="<?php echo  $panorama_id; ?>">

                <!-- 画像ファイルのパスを，パノラマのIDに設定 -->
                <img class="card-img-top" src="./panorama_imgs/<?php echo $panorama_id; ?>/preview.jpg" alt="プレビュー画像">

                <div class="card-body">

                    <!-- タイトルを，パノラマの名前に設定 -->
                    <h4 class="card-title"><?php echo $panorama_name; ?></h4>

                    <!-- テキストを，パノラマのIDを変換した文字に設定 -->
                    <p class="card-text"><?php echo change_date_format( $panorama_id ); ?></p>
                </div>
            </div>
    <?php
        }
    ?>
        </div>

    </div>


    <!-- JQuery -->
    <script src="https://code.jquery.com/jquery-3.6.1.min.js" integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>

    <!-- Bootstra JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>

    <script>
        $(document).ready(function () {

            // 詳細画像をタップしたときの処理
            $('.preview-card').click(function (e) {

                // パノラマIDをクエリに追加して，パノラマ画面に移動するようにセット
                window.location.href = './panorama_play.php?panorama-id=' + e.target.getAttribute('panorama-id');

            });
        });
    </script>
</body>
</html>
