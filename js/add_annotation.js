/**
 * ビデオ要素
 */
var video;

/**
 * 幅と高さ
 */
var width, height;

/**
 * 識別したOS
 */
var os;

/**
 * アノテーション（撮影物体画像）のID
 */
var annotationID;

/**
 * 物体情報取得の際にサーバに画像をアップロードする間隔
 */
var searchSpan;

/**
 * アップローモード機能を使うかどうか
 * true：アップロードモード
 */
var useSearchFunc = false;

/**
 * サーチ機能を保存する
 * スイッチでループのONとOFFを切り替えるため
 */
var searchLoop;

/**
 * サーチのループ機能で，秒を数える変数
 */
var searchLoopCounter;

/**
 * アップロードしたアノテーションの一時画像のID
 */
var currentAnnotationImgTempId = null;

/**
 * アップロードしたアノテーションの一時画像から取得した物体名称
 */
var currentAnnotationObjectName = null;

async function init(span) {


    // 一時画像の撮影間隔を設定
    searchSpan = span;

    console.log('アップロード間隔:', searchSpan);

    // 撮影画像のIDを取得
    annotationID = getAnnotationID();
    console.log('撮影画像のIDを取得')

    // OSを特定
    os = detectOS();
    console.log('OSを特定')

    // カメラの起動後に説明用モーダル表示
    // $('#open-candidate-modal-button').trigger('click');

    // ヘルプボタンを押したら，取り方マニュアルのモーダルを表示する
    $('#help-button').on('click', () => {
        console.log('click help button');
        // $('#open-candidate-modal-button').trigger('click');
        $('#candidate-modal').modal('show');
    });

    // カメラ起動
    // カメラのデータを取得
    let cameraData = await startCamera();

    // return;

    // 撮影機能をOff
    setTakePictureModeOff();

    let video = cameraData['video'];
    // video = cameraData['video'];
    let width = cameraData['width'];
    // width = cameraData['width'];
    let height = cameraData['height'];
    // height = cameraData['height'];

    // 撮影開始
    // startToTakePicture(video, width, height);

    // サーチスイッチが押されたらサーチ開始
    $('#search-switch').on('click', function () {

        console.log('サーチスイッチ：', $(this).prop('checked'));

        useSearchFunc = $(this).prop('checked');

        if(useSearchFunc == true){

            startSearchLoop(video, width, height);

        } else {

            stopSearchLoop();
            clearSearchCanvas();
        }
    })

    // 撮影ボタンをクリックしたとき
    $('#take-button').click(function(event){

        if($('#take-button').data('take') == 'off') return;

        // アノテーションの一時画像から取得した物体名称，アノテーションID，一時画像のIDをサーバにアップロード
        uploadAnnotation(currentAnnotationObjectName, annotationID, currentAnnotationImgTempId);
        // uploadAnnotation(annotation, direction, annotationID);
    });

    // アノテーション候補一覧から，撮影物体と一致するものを選んだとき
    $('#decide-annotation-button').click(function(event){
        // アノテーションデータをサーバにアップロード
        decideAnnotation();
    });

}

/**
 * 一時画像から取得した情報を可視化するcanvasをclearする
 */
function clearSearchCanvas(){

    let canvas = $('#object-canvas')[0];
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * アクセスに使用したOSがどれか取得する
 * @returns OSを表す文字 iphone android pc
 */
function detectOS() {
    if (navigator.userAgent.indexOf('iPhone') > 0
        || navigator.userAgent.indexOf('iPad') > 0
        || navigator.userAgent.indexOf('iPod') > 0) {
        return 'iphone';
    } else if (navigator.userAgent.indexOf('Android') > 0) {
        return 'android';
    } else {
        return 'pc';
    }
}

/**
 * URLのクエリからパノラマIDを取得する
 * @returns パノラマID
 */
function getPanoramaID() {

    let url = new URL(window.location.href);

    let params = url.searchParams;

    return params.get('panorama-id');
}

/**
 * 小数を，指定の桁に丸める
 * @param {float} value 小数の元データ
 * @param {int} n 桁数
 * @returns 指定の桁で丸めた小数
 */
function floatDecimal(value, n) {
    return Math.floor(value * Math.pow(10, n)) / Math.pow(10, n);
}


/**
 * アノテーションIDを取得する
 */
function getAnnotationID() {
    let takeTime = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    return takeTime;
}

/**
 * 撮影モードをONにしたときのUI変更
 */
function setTakePictureModeOn(){

    // console.log('撮影モード', 'On');

    $('#take-button').data('take', 'on');

    // 1つ目を表示
    $('#take-button img:nth-child(1)').css('display', 'inline');

    // 2つ目を非表示
    $('#take-button img:nth-child(2)').css('display', 'none');

}

/**
 * 撮影モードをOFFにしたときのUIを変更
 */
function setTakePictureModeOff(){

    // console.log('撮影モード', 'Off');

    $('#take-button').data('take', 'off');

    // 1つ目を非表示
    $('#take-button img:nth-child(1)').css('display', 'none');

    // 2つ目を表示
    $('#take-button img:nth-child(2)').css('display', 'inline');
}

/**
 * カメラを起動し，映像データ・幅・高さを取得する
 * @returns カメラの映像データと幅と高さ
 */
async function startCamera() {

    try {

        video = document.querySelector('#camera-video');

        const options = {
            video: {
                facingMode: 'environment',
                aspectRatio: {
                    exact: 4 / 3
                }
            },
            audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(options);

        video.srcObject = stream;

        const [track] = stream.getVideoTracks();

        const settings = track.getSettings();
        // console.log('setting', settings);
        const {
            width,
            height
        } = settings;

        console.log('カメラ起動', 'width', width, 'height', height);
        return { 'video': video, 'width': width, 'height': height };

    } catch (err) {
        console.error(err);
    }
}

/**
 * サーチ機能のループを開始
 * @param {video} video カメラの映像を表示しているvideo要素
 * @param {int} width カメラの幅
 * @param {int} height カメラの高さ
 */
function startSearchLoop(video, width, height){

    // ループカウンタ初期化
    searchLoopCounter = searchSpan / 1000;

    // カウンタのUIを表示
    $('#search-switch-text').text('サーチ：' + searchLoopCounter);

    // ループセット
    searchLoop = setInterval(() => {

        searchLoopCounter -= 1;

        $('#search-switch-text').text('サーチ：' + searchLoopCounter);

        if(searchLoopCounter == 0){

            console.log('take picture', 'span', searchSpan);

            // 撮影
            let annotation = takeAnnotation(video, width, height);

            // サーバにアップロード
            uploadAnnotationTemp(annotation,annotationID);

            // ループカウンタ初期化
            searchLoopCounter = searchSpan / 1000;

            $('#search-switch-text').text('サーチ：' + searchLoopCounter);

            console.log('uplaoded temp img');
        }

    }, 1000);

}

/**
 * サーチ機能のループを止める
 */
function stopSearchLoop(){

    // ループ解除
    clearInterval(searchLoop);

    // カウンタのUIを非表示
    $('#search-switch-text').text('サーチ');

}


/**
 * 写真を撮影して，一時保存した画像データのURLを取得する
 * @param {video} video カメラ映像を流しているvideo要素
 * @param {int} width カメラの幅
 * @param {int} height カメラの高さ
 * @returns 一時的に保存した撮影画像のURL
 */
function takeAnnotation(video, width, height) {

    // カメラの映像を描画するcanvasを取得
    let canvasCamera = $('#camera-canvas');
    canvasCamera.attr('width', width);
    canvasCamera.attr('height', height);

    // 描画するためのcontextを取得
    const context = canvasCamera[0].getContext('2d');

    // 描画
    context.drawImage(video, 0, 0, width, height);

    // 描画したデータから，画像データを作成
    let dataUrl = canvasCamera[0].toDataURL('image/jpeg', 1);
    $('#camera-image').attr('src', dataUrl);

    // PHPで受け取るために，プレフィクスを削除
    dataUrl = dataUrl.replace(/^data:\w+\/\w+;base64,/, '');

    // 画像データを返す
    return dataUrl;
}

/**
 * 撮影画像データ・デバイスが向いている方向・アノテーションIDをサーバにアップ
 * @param {string} annotation base64に変換した画像データ
 * @param {int} direction デバイスが向いている方向
 * @param {string} annotationID アノテーションID
 */
// function uploadAnnotation(annotation, direction, annotationID) {
function uploadAnnotation(objectName, annotationID, annotationImgTempId) {

    // サーチモードをOffにする
    setTakePictureModeOff();

    // サーチループを止める
    stopSearchLoop();

    // サーチモードスイッチをオフにする
    $('#search-switch').removeProp('checked');

    let panoramaID = getPanoramaID();

    // return;

    let data = {
        'method': 'add-annotation',
        'object-name': objectName,
        // 'annotation': annotation,
        // 'direction': direction,
        'annotation-id': annotationID,
        'panorama-id': panoramaID,
        'annotation-img-temp-id': annotationImgTempId
    };

    $.ajax({
        type: 'POST',
        url: './add_annotation_server.php',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: function (response) {
            // console.log(response);
            // start_wait_image_process();
        }
    });
}


/**
 * 撮影物体から名称を取得するための一時画像をアップロードする
 * @param {string} annotation base64に変換した画像データ
 * @param {string} annotationID アノテーションID
 */
function uploadAnnotationTemp(annotation, annotationID) {

    // パノラマIDを取得
    let panoramaID = getPanoramaID();

    let data = {
        'method': 'upload-annotation-temp',
        'annotation': annotation,
        'annotation-id': annotationID,
        'panorama-id': panoramaID,
    };

    $.ajax({
        type: 'POST',
        url: './add_annotation_server.php',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: function (response) {
            // console.log('content:', response);
            // 物体の検出結果を描画する
            showDetectResult(response['detect-result']['objects'], response['detect-result']['width'], response['detect-result']['height']);

            // アノテーションの一時画像のIDを保存
            currentAnnotationImgTempId = response['detect-result']['annotation_img_temp_id'];
            // start_wait_image_process();
        }
    });
}

/**
 * 物体の検出データを描画する
 * @param {object} detectResult 物体の検出データ
 * @param {int} width 画像の幅
 * @param {int} height 画像の高さ
 */
function showDetectResult(detectResult, width, height){

    // サーチ機能がOFFの場合は何もしない
    if(useSearchFunc == false) return;

    console.log('detect result len:', detectResult.length);

    // 情報がほしい物体のみ検出された場合（検出結果がほしい物体１つだけの場合），撮影モードをOnにする
    if(detectResult.length == 1){
        setTakePictureModeOn();
    }else{
        setTakePictureModeOff();
    }

    console.log('picture width', width, 'height', height);

    // 検出データを１つずつ描画
    for(let i = 0; i < detectResult.length; i++){

        let data = detectResult[i];
        let name = data['name'];

        if(detectResult.length == 1){
            currentAnnotationObjectName = name;
        }
        console.log('name', name);

        let vertices = data['vertices'];
        let canvasCamera = $('#object-canvas');
        let videoElement = $('#camera-video');

        let clientRect = videoElement[0].getBoundingClientRect();
        let videoPosX = window.scrollX + clientRect.left;
        let videoPosY = window.scrollY + clientRect.top;

        // console.log('video x:', videoPosX, 'y:', videoPosY);
        canvasCamera.css('top', videoPosY);
        canvasCamera.css('left', videoPosX);
        canvasCamera.css('display', 'inline');
        // console.log('video width:', videoElement.css('width'), 'video height:', videoElement.css('height'));
        canvasCamera.css('width', parseInt(videoElement.css('width')));
        canvasCamera.css('height', parseInt(videoElement.css('height')));
        canvasCamera[0].width = width;
        canvasCamera[0].height = height

        const context = canvasCamera[0].getContext('2d');

        context.beginPath();
        let posX = vertices[0][0];
        let posY = vertices[0][1];
        let object_width = vertices[1][0] - vertices[0][0];
        let object_height = vertices[2][1] - vertices[1][1];

        context.rect(posX, posY, object_width, object_height);
        context.strokeStyle = 'rgba(0, 255, 0, 255)';
        context.lineWidth = 2;
        context.stroke();
        context.font = '20px Roboto';
        context.fillStyle = "rgba(0, 255, 0, 255)";
        let textYPosAdjust = -5;
        if(posY < 15){
            posY += object_width - 5;
        }
        context.fillText(name, posX, posY + textYPosAdjust);
    }
}

/**
 * 物体探索中に待機する関数
 * 2022/12/29　現在は検出方法が変わったため，非使用
 */
function start_wait_image_process(){

    // 候補画像を表示するモーダルウィンドウを表示
    $('#open-candidate-modal-button').trigger('click');

    $('#wait-area').css('display', 'flex');

    let data = {
        'method': 'check-image-progress',
        'panorama-id': getPanoramaID(),
        'annotation-id': annotationID
    };

    let progress = 0;

    let intervalID = setInterval(() => {

        // 進捗が100%になったら,通信を終了
        if(progress == 100){
            get_candidate_datas();
            clearInterval(intervalID);

            // 候補一覧を表示する
        }
        $.ajax({
            type: "POST",
            url: "./add_annotation_server.php",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: 'application/json',
            success: function (response) {
                // console.log(response);
                progress = parseInt(response['progress']);
                document.getElementById('progress-value').childNodes[2].textContent = progress + '%';
                // let inner = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>' +
                //  progress +'%';
                //  $('#progress-value').text(progress + '%');
                //  $('#progress-value').text(inner.substring(1, inner.length - 1));
                // console.log('進捗を確認', progress);
            }
        });

    }, 1500);
}

/**
 * アノテーションの候補データを取得する
 * 2022/12/29　検出方法が変わったため，非使用
 */
function get_candidate_datas(){

    // 待機中のロードボタンを消す
    $('#wait-area').css('display', 'none');

    // モーダルウィンドウのタイトルを変更
    $('#candidate-modal-title').text('撮影した物体を選んでください');

    // ボタンを再表示
    $('#cancel-annotation-button').css('display', 'inline');
    $('#decide-annotation-button').css('display', 'inline');

    let data = {
        'method': 'get-annotation-datas',
        'panorama-id': getPanoramaID(),
        'annotation-id': annotationID,
    };

    $.ajax({
        type: "POST",
        url: "./add_annotation_server.php",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: 'application/json',
        success: function (response) {
            // console.log(response);
            showCandidateAreas(response);
        }
    });
}

// function showCandidateAreasTest(){
//     // サーバサイドが未開発のため，臨時データを用意
//     let response = {
//         'annotation-id': '2022-09-18_17-33-00', 'panorama-id': '2022-09-18_17-33-00',
//         'images' : [
//             {'index': '0', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '1', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '2', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '3', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '4', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '5', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '6', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '7', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//             {'index': '8', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
//             'theta': 1.87, 'phi': 3.10},
//         ]
//     };

//     showCandidateAreas(response);
// }

/**
 * 候補画像のデータを表示する
 * @param {array} candidateDatas 候補画像データ
 */
function showCandidateAreas(candidateDatas) {

    $('#select-box-area').css('display', 'flex');

    // アノテーションIDを取得
    let annotationID = candidateDatas['annotation-id'];

    // パノラマIDを取得
    let panoramaID = candidateDatas['panorama-id'];

    // 候補画像一覧のグリッドの表示エリアに，アノテーションIDとパノラマIDをセット
    $('#select-box-area').attr('data-annotation-id', annotationID);
    $('#select-box-area').attr('data-panorama-id', panoramaID);

    // 候補画像リストを取得
    let images = candidateDatas['images'];

    // 候補画像一覧のグリッドを生成
    createCandidateGrid(images);

    // // 候補画像を表示するモーダルウィンドウを表示
    // $('#open-candidate-modal-button').trigger('click');


}

/**
 * 候補画像一覧のグリッドを作成する
 * @param {array} images 候補画像のURL
 */
function createCandidateGrid(images){

    // 候補画像一覧を表示するdivを取得
    const selectBoxArea = $('#select-box-area');

    // グリッドのrow
    let row = null;

    for(let i_images = 0; i_images < images.length; i_images++){

        // rowの先頭要素を生成するときには，rowも生成する
        if(i_images % 3 == 0){
            // rowにするdivを生成
            row = document.createElement('div');


            // 属性追加
            row.setAttribute('class', 'row row-col-3');

            // 表示エリアに追加
            selectBoxArea.append(row);
        }

        // colを生成
        const col = document.createElement('div');
        col.setAttribute('class', 'col candidate-col');

        // 候補画像のDataを取得
        const imgData = images[i_images];

        // img要素を生成
        const imgEle = document.createElement('img');

        // 属性セット
        // imgEle.setAttribute('src', imgData['url'] + '/' + i_images + '.png');
        // imgEle.setAttribute('src', imgData['url'] + '/' + (i_images + 1) + '.jpg');
        imgEle.setAttribute('src', imgData['url']);
        imgEle.setAttribute('class', 'candidate-img');
        imgEle.setAttribute('data-selected', 'false');
        imgEle.setAttribute('data-index', i_images);
        imgEle.setAttribute('data-theta', imgData['theta']);
        imgEle.setAttribute('data-phi', imgData['phi']);

        imgEle.addEventListener('click', setSelectFunctionOnImgElement);

        // img要素をcolにセット
        col.appendChild(imgEle);

        // colをrowにセット
        row.appendChild(col);

    }
}

/**
 * 候補画像をクリックしたときの選択処理を，img要素にセットする
 * @param {click event} event クリックイベントデータ
 */
function setSelectFunctionOnImgElement(event){

    // すべての候補画像を取得
    const candidateImages = $('.candidate-img');

    // 候補画像の中で，すでに選択されているものを記録する変数
    let selectedImage = null;

    const dataKey = 'data-selected';

    // すでに選択されているものを探す
    for(let i_images = 0; i_images < candidateImages.length; i_images++){
        if(candidateImages[i_images].getAttribute(dataKey) == 'true'){
            selectedImage = candidateImages[i_images];
            break;
        }
    }

    // １つも選択されていなかった場合
    if(selectedImage == null){

        // 選択状態にする
        event.target.setAttribute(dataKey, 'true');
        return;
    }

    // どれかの要素が選択されていた場合

    // 選択されていた要素と，クリックした要素が同一なら
    if(selectedImage == event.target){

        // 選択を解除
        event.target.setAttribute(dataKey, 'false');
    }
    // 別要素なら
    else{
        // すでに選択されている要素の，選択状態を解除
        selectedImage.setAttribute(dataKey, 'false');

        // クリックされた要素を選択状態にする
        event.target.setAttribute(dataKey, 'true');
    }

}

/**
 * 候補画像一覧のモーダルウィンドウを表示
 */
function showCandidateModal(){
    $('#open-candidate-modal-button').trigger('click');
}

/**
 * アノテーションを決定して，サーバにデータをアップロード
 */
function decideAnnotation() {

    // 候補画像一覧を取得
    const candidateImages = $('.candidate-img');

    let theta = null;
    let phi = null;

    // 候補画像一覧から，選択されているもののデータを取得
    for(let i_images = 0; i_images < candidateImages.length; i_images++){
        if(candidateImages[i_images].getAttribute('data-selected') == 'true'){
            theta = candidateImages[i_images].getAttribute('data-theta');
            phi = candidateImages[i_images].getAttribute('data-phi');
        }
    }

    // １つも選択されていなければ，何もせずに終了
    if(theta == null && phi == null){
        return;
    }

    // 候補画像を表示しているdivを取得
    const selectBoxArea = $('#select-box-area');

    // アノテーションIDとパノラマIDを取得
    const annotationID = selectBoxArea.attr('data-annotation-id');
    const panoramaID = selectBoxArea.attr('data-panorama-id');


    let data = {
        'method': 'decide-annotation',
        'annotation-id': annotationID, 'panorama-id': panoramaID,
        'theta': theta, 'phi': phi
    };

    // データをサーバにアップ
    $.ajax({
        type: "post",
        url: "./add_annotation_server.php",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: 'applicatoin/json',
        success: function (response) {
            console.log(response);
            // データのアップに成功したとき
            if(response['result'] == 'true'){
                //1.5秒チェックマークを表示して，パノラマ画面にリダイレクト
                $('#select-box-area').css('display', 'flex');
                $('#accept-annotation-mark-area').css('display', 'flex');
                setTimeout(function(){
                    window.location.href = './panorama_play.php?panorama-id=' + panoramaID;
                }, 1.5 * 1000);
            }else{
                console.log('アップに失敗');
            }
        }
    });
}

