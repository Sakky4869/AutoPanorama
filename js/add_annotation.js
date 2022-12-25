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

async function init(span) {


    // 一時画像の撮影間隔を設定
    searchSpan = span;

    console.log('アップロード間隔:', searchSpan);

    // if(useSearchFunc) $('#recognition-mode').text('　オン');
    // else $('#recognition-mode').text('　オフ');

    // $('#search-switch').prop('checked', false);

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

    let video = cameraData['video'];
    // video = cameraData['video'];
    let width = cameraData['width'];
    // width = cameraData['width'];
    let height = cameraData['height'];
    // height = cameraData['height'];

    // 撮影開始
    startToTakePicture(video, width, height);

    // サーチスイッチが押されたらサーチ開始
    $('#search-switch').on('click', function () {

        console.log('サーチスイッチ：', $(this).prop('checked'));

        useSearchFunc = $(this).prop('checked');

        if(useSearchFunc == false){
            let canvas = $('#object-canvas')[0];
            let ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    })

    // 撮影ボタンをクリックしたとき
    $('#take-button').click(function(event){

        return;
        // console.log(absolute_event);

        useSearchFunc = !useSearchFunc;
        console.log('useSearchFunc', useSearchFunc);

        // if(useSearchFunc) $('#recognition-mode').text('　オン');
        // else $('#recognition-mode').text('　オフ');

        return;

        // 撮影
        let annotation = takeAnnotation(video, width, height);

        // Y軸を中心とする，スマホの傾きを取得
        let direction = degree;//alpha;//getPhoneDirection();


        // サーバにアップロード
        uploadAnnotation(annotation, direction, annotationID);
    });

    // アノテーション候補一覧から，撮影物体と一致するものを選んだとき
    $('#decide-annotation-button').click(function(event){
        // アノテーションデータをサーバにアップロード
        decideAnnotation();
    });

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
 * カメラを起動し，映像データ・幅・高さを取得する
 * @returns カメラの映像データと幅と高さ
 */
async function startCamera() {

    try {
        video = document.querySelector('#camera-video') // <1>

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
        // video.css.max-width =

        const [track] = stream.getVideoTracks();

        const settings = track.getSettings();
        // console.log('setting', settings);
        const {
            width,
            height
        } = settings;

        console.log('カメラ起動', 'width', width, 'height', height);
        // $('#camera-video').css('width', width);
        // $('#camera-video').css('height', height);
        // $('#camera-video')[0].videoWidth = width;
        // $('#camera-video')[0].videoHeight = height;
        // console.log('camera-video width:', width, 'height:', height);
        // console.log($('#camera-video')[0].srcObject);
        // $('#object-canvas').css('display', 'inline');
        // $('#camera-canvas').css('display', 'none');
        // $('#camera-image').css('display', 'none');
        return { 'video': video, 'width': width, 'height': height };
    } catch (err) {
        console.error(err);
    }
}

/**
 * 撮影物体からの名称取得を正確に行うために，定期的に画像をサーバへアップロードする
 */
function startToTakePicture(video, width, height){

    // 定期的にWebカメラで取得した画像をサーバへアップロード
    setInterval(() => {

        console.log('take picture', 'span', searchSpan);
        // 撮影
        let annotation = takeAnnotation(video, width, height);

        if(useSearchFunc == false) return;

        // サーバにアップロード
        uploadAnnotationTemp(annotation,annotationID);

        console.log('uplaoded');

    }, searchSpan);

}


/**
 * 写真を撮影して，一時保存した画像データのURLを取得する
 * @param {video} video カメラ映像を流しているvideo要素
 * @param {int} width カメラの幅
 * @param {int} height カメラの高さ
 * @returns 一時的に保存した撮影画像のURL
 */
function takeAnnotation(video, width, height) {
    let canvasCamera = $('#camera-canvas');
    // $('#camera-canvas').css('display', 'inline');
    canvasCamera.attr('width', width);
    canvasCamera.attr('height', height);
    // console.log('take annotation width', width, 'height', height);
    // console.log(video);
    // return;
    const context = canvasCamera[0].getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    let dataUrl = canvasCamera[0].toDataURL('image/jpeg', 1);
    $('#camera-image').attr('src', dataUrl);
    // PHPで受け取るために，プレフィクスを削除
    dataUrl = dataUrl.replace(/^data:\w+\/\w+;base64,/, '');
    // $('#camera-image').css('display', 'inline');

    // $('#camera-video')[0].srcObject.getTracks().forEach(track => {
    //     track.stop();
    // });
    // $('#camera-video').css('display', 'none');
    return dataUrl;
}

/**
 * 撮影画像データ・デバイスが向いている方向・アノテーションIDをサーバにアップ
 * @param {string} annotation base64に変換した画像データ
 * @param {int} direction デバイスが向いている方向
 * @param {string} annotationID アノテーションID
 */
function uploadAnnotation(annotation, direction, annotationID) {

    let panoramaID = getPanoramaID();

    // return;

    let data = {
        'method': 'add-annotation',
        'annotation': annotation,
        'direction': direction,
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
            console.log(response);
            start_wait_image_process();
        }
    });
}


/**
 * 撮影物体から名称を取得するための一時画像をアップロードする
 * @param {string} annotation base64に変換した画像データ
 * @param {string} annotationID アノテーションID
 */
function uploadAnnotationTemp(annotation, annotationID) {

    let panoramaID = getPanoramaID();

    let data = {
        // 'method': 'add-annotation',
        'method': 'upload-annotation-temp',
        'annotation': annotation,
        // 'direction': direction,
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
            console.log('content:', response);
            showDetectResult(response['detect-result']['objects'], response['detect-result']['width'], response['detect-result']['height']);
            // start_wait_image_process();
        }
    });
}

function showDetectResult(detectResult, width, height){

    if(useSearchFunc == false) return;

    console.log('detect result len:', detectResult.length);

    console.log('picture width', width, 'height', height);

    for(let i = 0; i < detectResult.length; i++){

        let data = detectResult[i];
        let name = data['name'];
        console.log('name', name);
        let vertices = data['vertices'];
        // console.log('vertices', vertices);

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
        // canvasCamera.attr('width', width);
        // canvasCamera.attr('height', height);
        context.beginPath();
        // context.fillStyle = "rgba(255, 255, 255, 0)";
        // console.log('canvas width:', canvasCamera[0].width, 'height:', canvasCamera[0].height);
        // context.fillRect(0, 0, canvasCamera[0].width, canvasCamera[0].height);
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
        console.log('font:', context.font);
        // console.log('width', width, 'height', height);
        // context.drawImage(video, 0, 0, width, height);
    }
}

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
            console.log(response);
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
 *
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

