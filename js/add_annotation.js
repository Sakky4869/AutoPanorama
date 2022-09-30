
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

async function init() {


    os = detectOS();

    if (os == 'iphone') {
        // $('#permit').css('display', 'inline');
        // $('#permit').click(function (e) {

        // });
        console.log('iphone');
    } else if (os == 'android') {
        window.addEventListener('deviceorientation', getPhoneDirection, true);
    } else {
        console.log('PCは未対応');
    }

    let cameraData = await startCamera();
    let video = cameraData['video'];
    let width = cameraData['width'];
    let height = cameraData['height'];

    $('#take-button').click(function(event){
        let annotation = takeAnnotation(video, width, height);
        let direction = getPhoneDirection();
        let annotationID = getAnnotationID();
        uploadAnnotation(annotation, direction, annotationID);
    });

}

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

function floatDecimal(value, n) {
    return Math.floor(value * Math.pow(10, n)) / Math.pow(10, n);
}

function getPhoneDirection(event) {
    let absolute = event.absolute;
    let alpha = event.alpha;
    let beta = event.beta;
    let ganma = event.ganma;

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

    degree = floatDecimal(degree, 3);
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

function compassHeading(alpha, beta, ganma) {

    let degToRad = Math.PI / 180;

    let x = beta ? beta * degToRad : 0;
    let y = ganma ? ganma * degToRad : 0;
    let z = alpha ? alpha * degToRad : 0;

    let cX = Math.cos(x);
    let cY = Math.cos(y);
    let cZ = Math.cos(z);
    let sX = Math.sin(x);
    let sY = Math.sin(y);
    let sZ = Math.sin(z);

    let vX = - cZ * sY - sZ * sX * cY;
    let vY = - sZ * sY + cZ * sX * cY;

    let heading = Math.atan(vX / vY);

    if (vY < 0) {
        heading += Math.PI;
    } else if (vX < 0) {
        heading += 2 * Math.PI;
    }

    return heading * (180 / Math.PI);
}

function getAnnotationID() {
    let takeTime = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    return takeTime;
    // console.log(nowStr);
}

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

function takeAnnotation(video, width, height) {
    let canvasCamera = $('#camera-canvas');
    canvasCamera.attr('width', width);
    canvasCamera.attr('height', height);
    const context = canvasCamera[0].getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvasCamera[0].toDataURL('image/jpeg');
    $('#camera-image').attr('src', dataUrl);
    $('#camera-image').css('display', 'inline');

    $('#camera-video')[0].srcObject.getTracks().forEach(track => {
        track.stop();
    });
    $('#camera-video').css('display', 'none');
    return dataUrl;
}

function uploadAnnotation(annotation, direction, annotationID) {

    let panoramaID = getPanoramaID();

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

    return;
    $.ajax({
        type: 'POST',
        url: './add_annotation.php',
        data: {
            'method': 'add-annotation', 'annotation': annotation,
            'direction': direction, 'annotation-id': annotationID,
            'panorama-id': panoramaID,
        },
        dataType: 'json',
        timout: 120000,
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

function showCandidateAreas(candidateDatas) {

    // アノテーションIDを取得
    let annotationID = candidateDatas['annotation-id'];

    // パノラマIDを取得
    let panoramaID = candidateDatas['panorama-id'];

    // 候補画像リストを取得
    let images = candidateDatas['images'];

    // 候補画像一覧のグリッドを生成
    createCandidateGrid(images);

    // 候補画像を表示するモーダルウィンドウを表示
    $('#open-candidate-modal-button').trigger('click');


}

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


function decideAnnotation() {

}

