/**
 * パノラマ空間を作成するスクリプト
 * 操作画面とパノラマ空間とのインタフェースもここで定義
 */

// const { randInt } = require("three/src/math/MathUtils");

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

var panoramaSphere;

var raycaster = new THREE.Raycaster();

var pointer = new THREE.Vector2();

var clickFlag = false;

/**
 * パノラマ画像のURLとアノテーションデータの配列で，
 * パノラマ空間を初期化する
 * @param {string} panoramaUrl パノラマ画像のURL
 * @param {object} annotationDatas アノテーションデータの配列
 */
function init(panoramaUrl, annotationDatas) {

    // カメラを初期化
    initCamera();

    // レンダラーを初期化
    initRenderer();

    // 使用デバイスを判定
    let isAndroidOrIOS = checkIsAndroidOrIOS();

    // AndroidかiOSのとき
    if (isAndroidOrIOS) {
        // setOrbitControlsWithSmartphone();
        // スマホのときにジャイロで操作させようとしたが，Threejsが無効化したらしい
        // 一応PCと同じ設定で，指のドラッグで動作した
        setOrbitControlsWithPC();
    }
    // PCのとき
    else {
        setOrbitControlsWithPC();
    }

    // パノラマを表示する球体を作成
    panoramaSphere = createPanoramaSphere();

    // パノラマ画像を貼り付け
    setPanoramaImage(panoramaUrl);

    // アノテーションデータからアノテーションを生成
    setAnnotations(annotationDatas);

    // 画面がリサイズしたときの処理
    window.addEventListener('resize', handleResize, false);

    // 画面をクリックしたときの処理
    // アノテーションをクリックしたら，詳細情報を表示する
    const stage = document.querySelector('#panorama-world');
    stage.addEventListener('click', onPointerClick);
    // window.addEventListener('click', onPointerClick);


    let data = {
        'to-panorama-id': '2022-10-10_15-00-00',
   		'phi': 6.70
    };

    setPanoramaLink(data);

    render();

    // requestAnimationFrame(render);
}

/**
 * カメラを初期化し，カメラのオブジェクトを返す
 * @returns カメラ
 */
function initCamera() {

    // 視野角
    camera.fov = 75;

    // 描画の最短距離
    camera.near = 0.1;

    // 描画の最長距離
    camera.far = 2000;

    // アスペクト比
    camera.aspect = window.innerWidth / window.innerHeight;
    // console.log(camera.aspect, window.innerWidth, window.innerHeight);

    // 位置を原点付近にセット
    // 原点にすると，ドラッグで回転できなくなるので，若干ずらす
    // camera.position.set(-0.1, 0, 0);
    camera.position.set(0.1, 0, 0);

    // カメラが原点を向くようにする
    camera.lookAt(0, 0, 0);

    // カメラの名前をセット
    camera.name = 'Camera';

    // 拡大・縮小処理を実装するため，
    // マウスホイールで視野角を変更できるようにする
    window.addEventListener('wheel', function (event) {
        // 感度
        let sensi = 0.05;
        let diff = event.deltaY * sensi;
        let fovBefore = camera.fov;
        camera.fov += diff;

        // 拡大縮小の限度を設定
        if (camera.fov <= 0 || camera.fov >= 120) {
            camera.fov = fovBefore;
            return;
        }

        // 描画情報を更新
        camera.updateProjectionMatrix();
    });


    camera.updateProjectionMatrix();

    // シーンにカメラを追加
    scene.add(camera);
}

/**
 * 描画するためのrendererを初期化
 */
function initRenderer() {

    // アンチエイリアシングをONにする
    renderer.antialias = true;

    // サイズ設定
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 背景色設定
    renderer.setClearColor({ color: 0x000000 });

    renderer.physicallyCorrectLights = true;

    // 描画用要素
    renderElement = renderer.domElement;

    // HTMLの要素に描画用要素を入れる
    document.getElementById('panorama-world').appendChild(renderElement);

    // 描画先を設定して描画
    renderer.render(scene, camera);
}

/**
 * 使用デバイスがAndroidかiOSのときtrue
 * それ以外はfalse
 * @returns AndroidかiOSならtrue
 */
function checkIsAndroidOrIOS() {

    // Android
    if (navigator.userAgent.indexOf('Android') != -1) {
        return true;
    }

    // iOS
    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
        return true;
    }

    return false;
}

/**
 * ドラッグで視点を操作できるようにする
 */
function setOrbitControlsWithPC() {

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

// function setOrbitControlsWithSmartphone(){

//     window.addEventListener('click', function(event){
//         console.log('タップ X : ' + event.clientX + ', Y : ' + event.clientY);
//     });

//     window.addEventListener('touchmove', function(event){
//         // event.preventDefault();
//         console.log('ドラッグ X : ' + event.touches[0].pageX + ', Y : ' + event.touches[0].pageY);
//     });
// }


function createPanoramaSphere() {

    // 半径
    let radius = 20;

    // 球体
    let sphereGeo = new THREE.SphereGeometry(radius, 360, 360);

    sphereGeo.scale(-1, 1, 1);

    let material = new THREE.MeshBasicMaterial({ color: 'black' });

    let sphere = new THREE.Mesh(sphereGeo, material);

    sphere.name = 'PanoramaSphere';
    sphere.position.set(0, 0, 0);
    sphere.rotation.set(0, 0 * Math.PI / 180, 0);
    // sphere.rotation.set(0, 180 * Math.PI / 180, 0);

    scene.add(sphere);

    return sphere;

}

/**
 * オブジェクトにテクスチャを貼り付ける
 * @param {THREE.Object3D} targetObject テクスチャを貼り付けるオブジェクト
 * @param {string} url 貼り付けるテクスチャ画像のURL
 */
function createMaterial(url) {
    let textureLoader = new THREE.TextureLoader();
    let texture = textureLoader.load(url);
    let material = new THREE.MeshBasicMaterial({
        map: texture
    });
    return material;
}

/**
 * パノラマ画像をセットする
 * @param {string} panoramaUrl パノラマ画像のURL
 */
function setPanoramaImage(panoramaUrl) {

    let material = createMaterial(panoramaUrl);
    panoramaSphere.material = material;

    // setTextureOnObject(panoramaSphere, panoramaUrl);
}

/**
 * アノテーションデータから，アノテーションを配置する
 * ここでは，画像データ以外も扱う
 * @param {object} annotationDatas アノテーションデータの配列
 */
function setAnnotations(annotationDatas) {
    // console.log(annotationDatas);
    let datas = annotationDatas['datas'];
    // console.log('datas', datas);
    for(let i = 0; i < datas.length; i++){
        setAnnotation(datas[i]);
    }

}

/**
 * アノテーションデータから，アノテーションを配置する
 * 実際に配置するのはここ
 * @param {object} annotationData アノテーションデータ
 */
function setAnnotation(annotationData) {

    let annotationID = annotationData['annotation-id'];
    let theta = parseFloat(annotationData['theta']);
    let phi = parseFloat(annotationData['phi']);
    // console.log('theta', theta, 'phi', phi);
    // let annotationUrl = annotationData['annotation-url'];

    // アノテーションに使用するマテリアルを作成
    let annotationMaterial = createMaterial('./imgs/annotation_photo.jpg');

    // アノテーションの箱を作成
    let annotationBoxGeometry = new THREE.BoxGeometry(2, 2, 2, 10, 10, 10);
    let annotationBox = new THREE.Mesh(annotationBoxGeometry, annotationMaterial);


    let positions = convertAnnotationPolarToCartesian(theta, phi);

    annotationBox.position.set(positions[0], positions[2], positions[1]);

    annotationBox.lookAt(camera.position);
    // annotationBox.name = 'annotation,' + annotationID + ',' + annotationUrl;
    annotationBox.name = 'annotationBox';
    annotationBox.userData.annotationUrl = './annotation_imgs/' + annotationID + '.jpg';
    annotationBox.material.transparent = true;
    annotationBox.material.alphaToCoverage = true;
    annotationBox.material.opacity = 1;
    scene.add(annotationBox);
}

function setPanoramaLink(linkData){

    let theta = 1.57;
    let phi = linkData['phi'];
    let to_panorama_id = linkData['to-panorama-id'];

    // リンクに使用するマテリアルを作成
    let linkMaterial = createMaterial('./imgs/arrow.jpg');

    // リンクの箱を作成
    let linkBoxGeometry = new THREE.BoxGeometry(2, 2, 2, 10, 10, 10);
    let linkBox = new THREE.Mesh(linkBoxGeometry, linkMaterial);


    let positions = convertAnnotationPolarToCartesian(theta, phi);

    linkBox.position.set(positions[0], positions[2], positions[1]);

    linkBox.lookAt(camera.position);
    linkBox.rotateZ(90 * Math.PI / 180);
    // annotationBox.name = 'annotation,' + annotationID + ',' + annotationUrl;
    linkBox.name = 'linkBox';
    linkBox.userData.toPanoramaUrl = './panorama_imgs/' + to_panorama_id + '/origin.jpg';
    linkBox.material.transparent = true;
    linkBox.material.alphaToCoverage = true;
    linkBox.material.opacity = 1;
    scene.add(linkBox);
}

/**
 * 極座標を，パノラマ空間の直交座標に変換する
 * @param {float} theta 極座標のθ
 * @param {float} phi 極座標のφ
 * @returns [ posX, posY, posZ]
 */
function convertAnnotationPolarToCartesian(theta, phi) {
    let radius = 20;
    let posX = radius * Math.sin(theta) * Math.cos(phi);
    let posY = radius * Math.sin(theta) * Math.sin(phi);
    let posZ = radius * Math.cos(theta);
    return [posX, posY, posZ];
}

/**
 * すべてのアノテーションデータを削除する
 */
function clearAnnotations() {

}

/**
 * 画面がリサイズされたときの処理
 */
function handleResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

/**
 * クリックしたときの処理
 * Raycastを使ってアノテーションをクリックしたら，
 * 詳細情報を表示する
 * @param {PointerClickEvent} event
 */
function onPointerClick(event){

    const element = event.currentTarget;

    let x = event.clientX - element.offsetLeft;
    let y = event.clientY - element.offsetTop;

    let w = element.offsetWidth;
    let h = element.offsetHeight;

    pointer.x = (x / w) * 2 - 1;
    pointer.y = -(y / h) * 2 + 1;

    // console.log('click', 'x', pointer.x, 'y', pointer.y);

    clickFlag = true;
}

/**
 * 描画関数
 */
function render() {

    // console.log('call render');

    // クリックしたとき
    if(clickFlag){

        clickFlag = false;

        // レイキャスト
        raycaster.setFromCamera(pointer, camera);

        // レイキャストのヒット情報を取得
        let intersects = raycaster.intersectObjects(scene.children);

        // 最も手前にあるオブジェクトのみ取得
        let hitObje = intersects[0].object;

        // 当たったオブジェクトが，アノテーションだったら
        if(hitObje.name == 'annotationBox'){

            // 当たったオブジェクトから，アノテーションのURLを取得
            let url = hitObje.userData.annotationUrl;

            // モーダルウィンドウを取得
            let annotationModal = new bootstrap.Modal(document.getElementById('annotation-modal'), {
                keyboard: false
            });

            // モーダルウィンドウの画像エリアにURLをセット
            document.getElementById('annotation-img').setAttribute('src', url);

            // モーダルウィンドウを表示する
            annotationModal.show()

        }else if(hitObje.name == 'linkBox'){

            // 当たったオブジェクトから，次のパノラマのURLを取得
            let url = hitObje.userData.toPanoramaUrl;

            // パノラマの画像を変える
            setPanoramaImage(url);
        }

    }

    requestAnimationFrame(render);

    renderer.render(scene, camera);
    controls.update();

}
