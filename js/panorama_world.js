/**
 * パノラマ空間を作成するスクリプト
 * 操作画面とパノラマ空間とのインタフェースもここで定義
 */

/**
 * パノラマの空間を作るScene
 */
var scene = new THREE.Scene();

/**
 * 描画を行うカメラ
 */
var camera = new THREE.PerspectiveCamera();

/**
 * 描画機能クラスのインスタンス
 */
var renderer = new THREE.WebGLRenderer();

/**
 * 描画結果のHTML要素
 */
var renderElement;

/**
 * デバイスの制御クラスのインスタンス
 * デバイスによってクラスが異なる
 */
var controls;

/**
 * パノラマ画像のURLとアノテーションデータの配列で，
 * パノラマ空間を初期化する
 * @param {string} panoramaUrl パノラマ画像のURL
 * @param {object} annotationDatas アノテーションデータの配列
 */
function init(panoramaUrl, annotationDatas){

    // カメラを初期化
    initCamera();

    // レンダラーを初期化
    initRenderer();

    // 使用デバイスを判定
    let isAndroidOrIOS = checkIsAndroidOrIOS();

    // AndroidかiOSのとき
    if(isAndroidOrIOS){
        console.log('Android or iOS');
        window.addEventListener('deviceorientation', setOrientationControls, true);
    }
    // PCのとき
    else{
        setOrbitControlsWithPC();
    }

    // 画面がリサイズしたときの処理
}

/**
 * カメラを初期化し，カメラのオブジェクトを返す
 * @returns カメラ
 */
function initCamera(){

    // 視野角
    camera.fov = 75;

    // 描画の最短距離
    camera.near = 0.1;

    // 描画の最長距離
    camera.far = 2000;

    // アスペクト比
    camera.aspect = window.innerWidth / window.innerHeight;

    // 位置を原点付近にセット
    // 原点にすると，ドラッグで回転できなくなるので，若干ずらす
    camera.position.set(-0.1, 0, 0);

    // カメラが原点を向くようにする
    camera.lookAt(0, 0, 0);

    // カメラの名前をセット
    camera.name = 'camera';

    // 拡大・縮小処理を実装するため，
    // マウスホイールで視野角を変更できるようにする
    window.addEventListener('wheel', function(event){

        // 感度
        let sensi = 0.05;
        let diff = event.deltaY * sensi;
        let fovBefore = camera.fov;
        camera.fov += diff;

        // 拡大縮小の限度を設定
        if(camera.fov <= 0 || camera.fov >= 120){
            camera.fov = fovBefore;
            return;
        }

        // 描画情報を更新
        camera.updateProjectionMatrix();
    });

    // シーンにカメラを追加
    scene.add(camera);
}

/**
 * 描画するためのrendererを初期化
 */
function initRenderer(){

    // アンチエイリアシングをONにする
    renderer.antialias = true;

    // サイズ設定
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 背景色設定
    renderer.setClearColor({color: 0x000000});

    renderer.physicallyCorrectLights = true;

    // 描画用要素
    renderElement = renderer.domElement;

    // HTMLの要素に描画用要素を入れる
    $('#stage').append(renderElement);

    // 描画先を設定して描画
    renderer.render(scene, camera);
}

/**
 * 使用デバイスがAndroidかiOSのときtrue
 * それ以外はfalse
 * @returns AndroidかiOSならtrue
 */
function checkIsAndroidOrIOS(){

    // Android
    if(navigator.userAgent.indexOf('Android') != -1){
        return true;
    }

    // iOS
    if(/(iPad|iPhone|iPod)/g.test(navigator.userAgent)){
        return true;
    }

    return false;
}

/**
 * PCのときにドラッグで視点を操作できるようにする
 */
function setOrbitControlsWithPC(){

    // 制御クラスのインスタンスを初期化
    controls = new THREE.OrbitControls(camera, renderElement);

    // 視点操作のイージングをONにする
    controls.enableDamping = true;

    // 視点操作のイージングの値
    controls.dumpingFactor = 0.3;

    // 視点操作の速さ
    controls.rotateSpeed = -0.3;

    // ズーム禁止にする
    controls.noZoom = true;

    // ズーム速度を0にする（念のため）
    controls.zoomSpeed = 0;

    // パン操作禁止にする
    controls.noPan = true;

    controls.update();
}

function setOrientationControls(e){

    console.log('setOrientationControls');

    // スマホ以外なら何もしない
    if(!e.alpha){
        return;
    }

    console.log(e);

    // スマホで制御するためのクラスのインスタンスを初期化
    controls = new THREE.DeviceOrientationControls(camera, true);

    controls.connect();

    controls.update();

    window.removeEventListener('deviceorientation', setOrientationControls, true);
}


/**
 * パノラマ画像をセットする
 * @param {THREE.Object3D} targetObject パノラマ画像を貼り付けるオブジェクト
 * @param {string} panoramaUrl パノラマ画像のURL
 */
function setPanoramaImage(targetObject, panoramaUrl){

}

/**
 * アノテーションデータから，アノテーションを配置する
 * ここでは，画像データ以外も扱う
 * @param {object} annotationDatas アノテーションデータの配列
 */
function setAnnotations(annotationDatas){

}

/**
 * アノテーションデータから，アノテーションを配置する
 * 実際に配置するのはここ
 * @param {object} annotationData アノテーションデータ
 */
function setAnnotation(annotationData){

}

/**
 * 極座標を，パノラマ空間の直交座標に変換する
 * @param {float} theta 極座標のθ
 * @param {float} phi 極座標のφ
 */
function convertAnnotationPolarToCartesian(theta, phi){

}

/**
 * すべてのアノテーションデータを削除する
 */
function clearAnnotations(){

}
