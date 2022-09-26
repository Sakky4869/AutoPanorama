/**
 * パノラマ空間を作成するスクリプト
 * 操作画面とパノラマ空間とのインタフェースもここで定義
 */

/**
 * パノラマの空間を作るScene
 */
var scene = new THREE.Scene();


/**
 * 描画機能クラスのインスタンス
 */
var renderer;// = new THREE.WebGLRenderer();

/**
 * パノラマ画像のURLとアノテーションデータの配列で，
 * パノラマ空間を初期化する
 * @param {string} panoramaUrl パノラマ画像のURL
 * @param {object} annotationDatas アノテーションデータの配列
 */
function init(panoramaUrl, annotationDatas){

    // カメラを初期化
    let camera = initCamera();

    // シーンにカメラを追加
    scene.add(camera);


}

/**
 * カメラを初期化し，カメラのオブジェクトを返す
 * @returns カメラ
 */
function initCamera(){

    // カメラ
    let camera = new THREE.PerspectiveCamera();

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

    return camera;

}


function initRenderer(){

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
