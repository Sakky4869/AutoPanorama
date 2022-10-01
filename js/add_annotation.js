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
 * device orientation eventのabsolute
 */
var absolute;

/**
 * device orientation eventのalpha
 */
var alpha;

/**
 * device orientation eventのbeta
 */
var beta;

/**
 * device orientation eventのganma
 */
var ganma;

async function init() {

    // OSを特定
    os = detectOS();

    // iPhoneのとき
    // 特別な処理をする必要があるらしいが，現状は何もしない
    if (os == 'iphone') {
        console.log('iphone');
        // $('#permit').css('display', 'inline');
        // $('#permit').click(function (e) {

        // });
    } else if (os == 'android') {
        console.log('android');
        // 傾きのイベント発生時に，傾きを取得する関数をセット
        window.addEventListener('deviceorientation', getPhoneDirection, true);
    } else {
        console.log('PCは非対応');
    }

    // カメラ起動
    let cameraData = await startCamera();
    let video = cameraData['video'];
    let width = cameraData['width'];
    let height = cameraData['height'];

    // 撮影ボタンをクリックしたとき
    $('#take-button').click(function(event){

        // 撮影
        let annotation = takeAnnotation(video, width, height);

        // Y軸を中心とする，スマホの傾きを取得
        let direction = alpha;//getPhoneDirection();

        // 撮影画像のIDを首都奥
        let annotationID = getAnnotationID();

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
 * デバイスの向きを取得する
 * @param {deviceoorientation} event 傾きイベント
 * @returns イベントで取得できる傾きのうち，地面に垂直な軸を中心とする角度
 */
function getPhoneDirection(event) {
    // let absolute = event.absolute;
    absolute = event.absolute;
    // let alpha = event.alpha;
    alpha = event.alpha;
    // let beta = event.beta;
    beta = event.beta;
    // let ganma = event.ganma;
    ganma = event.ganma;

    // let degree;
    // if (os == 'iphone') {
    //     degree = event.webkitCompassHeading;
    // } else {
    //     degree = compassHeading(alpha, beta, ganma);
    // }

    // let direction;// = '無方向';
    // if ((337.5 < degree && degree < 360) || (0 < degree && degree < 22.5)) {
    //     direction = '北';
    //     // console.log('北');
    // } else if (22.5 < degree && degree < 67.5) {
    //     direction = '北東';
    //     // console.log('北東');
    // } else if (67.5 < degree && degree < 112.5) {
    //     direction = '東';
    //     // console.log('東');
    // } else if (112.5 < degree && degree < 157.5) {
    //     direction = '東南';
    //     // console.log('東南');
    // } else if (157.5 < degree && degree < 202.5) {
    //     direction = '南';
    //     // console.log('南');
    // } else if (202.5 < degree && degree < 247.5) {
    //     direction = '南西';
    //     // console.log('南西');
    // } else if (247.5 < degree && degree < 292.5) {
    //     direction = '西';
    //     // console.log('西');
    // } else if (292.5 < degree && degree < 337.5) {
    //     direction = '北西';
    //     // console.log('北西');
    // }

    // degree = floatDecimal(degree, 3);
    absolute = floatDecimal(absolute, 3);
    alpha = floatDecimal(alpha, 3);
    beta = floatDecimal(beta, 3);
    ganma = floatDecimal(ganma, 3);

    return alpha;

    // $('#direction-value').html(direction + '\n' + degree);
    // $('#absolute-value').html(absolute);
    // $('#alpha-value').html(alpha);
    // $('#beta-value').html(beta);
    // $('ganma-value').html(ganma);
}

/**
 * 向きを補正する
 * Androidではこれが必要らしい．現状は未使用．
 * @param {float} alpha アルファ
 * @param {float} beta ベータ
 * @param {float} ganma ガンマ
 * @returns 向きの情報
 */
// function compassHeading(alpha, beta, ganma) {

//     let degToRad = Math.PI / 180;

//     let x = beta ? beta * degToRad : 0;
//     let y = ganma ? ganma * degToRad : 0;
//     let z = alpha ? alpha * degToRad : 0;

//     let cX = Math.cos(x);
//     let cY = Math.cos(y);
//     let cZ = Math.cos(z);
//     let sX = Math.sin(x);
//     let sY = Math.sin(y);
//     let sZ = Math.sin(z);

//     let vX = - cZ * sY - sZ * sX * cY;
//     let vY = - sZ * sY + cZ * sX * cY;

//     let heading = Math.atan(vX / vY);

//     if (vY < 0) {
//         heading += Math.PI;
//     } else if (vX < 0) {
//         heading += 2 * Math.PI;
//     }

//     return heading * (180 / Math.PI);
// }



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
        video = $('#camera-video')[0]; // document.querySelector('#video') // <1>

        const options = {
            video: {
                facingMode: 'environment',
                // facingMode: 'front',
                // width: {
                //     min: 0,
                //     ideal: 2250,
                //     max: 2250
                // },
                // height: {
                //     min: 0,
                //     ideal: 4000,
                //     max: 4000
                // },
                aspectRatio: {
                    // exact: 4000 / 2250
                    exact: 16 / 9
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
        // console.log('width', width, 'height', height);
        return { 'video': video, 'width': width, 'height': height };
    } catch (err) {
        console.error(err);
    }
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
    canvasCamera.attr('width', width);
    canvasCamera.attr('height', height);
    const context = canvasCamera[0].getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    let dataUrl = canvasCamera[0].toDataURL('image/png');
    $('#camera-image').attr('src', dataUrl);
    // PHPで受け取るために，プレフィクスを削除
    dataUrl = dataUrl.replace(/^data:\w+\/\w+;base64,/, '');
    $('#camera-image').css('display', 'inline');

    $('#camera-video')[0].srcObject.getTracks().forEach(track => {
        track.stop();
    });
    $('#camera-video').css('display', 'none');
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

    // サーバサイドが未開発のため，臨時データを用意
    // let response = {
    //     'annotation-id': '2022-09-18_17-33-00', 'panorama-id': '2022-09-18_17-33-00',
    //     'images' : [
    //         {'index': '0', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '1', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '2', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '3', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '4', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '5', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '6', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '7', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //         {'index': '8', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
    //         'theta': 1.87, 'phi': 3.10},
    //     ]
    // };

    // showCandidateAreas(response);

    // return;

    let data = {
        'method': 'add-annotation', 'annotation': annotation,
        'direction': direction, 'annotation-id': annotationID,
        'panorama-id': panoramaID,
    };

    $.ajax({
        type: 'POST',
        url: './add_annotation_server.php',
        data: JSON.stringify(data),
        // data: {
        //     'method': 'add-annotation', 'annotation': annotation,
        //     'direction': direction, 'annotation-id': annotationID,
        //     'panorama-id': panoramaID,
        // },
        dataType: 'json',
        contentType: 'application/json',
        // timout: 120000,
        success: function (response) {
            showCandidateAreas(response);
        }
    });
}

function showCandidateAreasTest(){
    // サーバサイドが未開発のため，臨時データを用意
    let response = {
        'annotation-id': '2022-09-18_17-33-00', 'panorama-id': '2022-09-18_17-33-00',
        'images' : [
            {'index': '0', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '1', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '2', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '3', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '4', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '5', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '6', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '7', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
            {'index': '8', 'url': './candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00',
            'theta': 1.87, 'phi': 3.10},
        ]
    };

    showCandidateAreas(response);
}

/**
 *
 * @param {array} candidateDatas 候補画像データ
 */
function showCandidateAreas(candidateDatas) {

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

    // 候補画像を表示するモーダルウィンドウを表示
    $('#open-candidate-modal-button').trigger('click');


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
        imgEle.setAttribute('src', imgData['url'] + '/' + i_images + '.png');
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

