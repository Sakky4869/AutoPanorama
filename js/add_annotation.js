
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

function showCandidateAreas(candidateDatas) {

}

function decideAnnotation() {

}

