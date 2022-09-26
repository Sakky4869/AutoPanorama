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

            <!-- ガイド枠 -->
            <!-- 表示方法をよく調べる必要あり -->
            <!-- position: absolute;以外でなんとかする方法を調べたい -->
            <!-- <div id="guide-box"></div> -->
        </div>

        <div id="button-area">
            <div class="action-button" id="retake-button">
                <img class="icon" src="./imgs/retake_picture_icon.svg" alt="">
                <p class="icon-text">取り直す</p>
            </div>

            <div class="action-button" id="send-button">
                <img class="icon" src="./imgs/send_icon.svg" alt="">
                <p class="icon-text">送る</p>
            </div>

            <div class="action-button" id="take-button">
                <img class="icon" src="./imgs/take_picture_icon.svg" alt="">
                <p class="icon-text">撮影</p>
            </div>

            <div class="action-button" id="help-button">
                <img class="icon" src="./imgs/question_mark_white_in_black.svg" alt="">
                <p class="icon-text">ヘルプ</p>
            </div>
        </div>

    </div>



    <!-- JQuery -->
    <script src="https://code.jquery.com/jquery-3.6.1.min.js" integrity="sha256-o88AwQnZB+VDvE9tvIXrMQaPlFFSUTR+nldQm1LuPXQ=" crossorigin="anonymous"></script>


    <!-- 画面作成の際，カメラからの映像取得を確認するため，臨時のスクリプトを作成 -->
    <script>
        $(document).ready(async function() {

            try {
                const video = $('#camera-video'); // document.querySelector('#video') // <1>

                const options = {
                    video: {
                        // facingMode: 'environment',
                        facingMode: 'front',
                        width: {
                            min: 0,
                            ideal: 2250,
                            max: 2250
                        },
                        height: {
                            min: 0,
                            ideal: 4000,
                            max: 4000
                        },
                        aspectRatio: {
                            exact: 4000 / 2250
                        }
                    },
                    audio: false,
                };

                const stream = await navigator.mediaDevices.getUserMedia(options);

                video[0].srcObject = stream;

                const [track] = stream.getVideoTracks();

                const settings = track.getSettings();
                // console.log('setting', settings);
                const {
                    width,
                    height
                } = settings;
                // console.log('width', width, 'height', height);

            } catch (err) {
                console.error(err);
            }
        });
    </script>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
</body>

</html>
