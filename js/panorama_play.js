
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
 * パノラマIDをもとに，パノラマのオリジナル画像のURLを取得する
 * @param {string} panoramaID パノラマID
 * @returns パノラマのオリジナル画像のURL
 */
function getPanoramaOriginUrl(panoramaID) {

    // 2022/09/27
    // サーバサイドが未開発のため，臨時データをreturn
    // return './panorama_imgs/2022-09-08_17-33-00/origin.jpg';

    // 2022/10/01
    // クライアントのみでURLを構築可能と判明したため，通信はしない
    return './panorama_imgs/' + panoramaID + '/origin.jpg';

    // $.ajax({
    //     type: 'POST',
    //     url: './panorama_play_server.php',
    //     dataType: 'json',
    //     data: {
    //         'method': 'get-panorama-origin', 'panorama-id': panoramaID
    //     },
    //     success: function (response) {
    //         if (response['result'] == true) {
    //             return response['origin-url'];
    //         } else {
    //             showErrorMessage(response['message']);
    //             return null;
    //         }
    //     }
    // });
}

/**
 * パノラマIDをもとに，アノテーションデータを取得する
 * @param {string} panoramaID パノラマID
 */
function getAnnotationDatas(panoramaID) {

    // 2022/09/27
    // サーバサイドが未開発のため，臨時データをreturn
    // return {
    //     'datas': [
    //         { 'annotation-id' : "2022-09-08_17-33-00",'theta' : 1.87, 'phi' : 3.10,
    //             'annotation-url' : "./annotation_imgs/2022-09-18_17-33-00.jpg"},
    //     ]
    // };

    let data = {
        'method': 'get-annotation-datas',
        'panorama-id': panoramaID
    };

    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'POST',
            url: './panorama_play_server.php',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            async: true,
        }).then(function (response) {

            resolve(response);

        }).fail(function (response) {
            console.log('get annotation datas error:', response);
            reject();

        });

    })

}

/**
 * パノラマ画像をダウンロードする
 * 容量が大きいため，進捗を表示する
 * @param {string} img 画像ファイルの名前
 */
function downloadPanoramaImage(img) {

    // プログレスバー取得
    const progressBar = $('#download-progress');
    const xhr = new XMLHttpRequest();

    // プログレスバーの初期化
    progressBar.css('width', '0%');
    progressBar.html('0%');

    xhr.open('GET', img);
    xhr.responseType = 'blob';

    // ダウンロード中の処理
    xhr.onprogress = function (event) {
        let value = event.loaded / event.total * 100 | 0 + '%';
        progressBar.css('width', value + '%');
        progressBar.html(value);
    };

    // ダウンロード完了時の処理
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            setPanoramaImage(URL.createObjectURL(this.response));
            $('#loading-window').css('display', 'none');
            $('#add-annotation-button').css('display', 'flex');
        }
    };

    xhr.send();

}

/**
 * エラーメッセージを表示する
 * @param {string} msg エラーのメインメッセージ
 * @param {string} optMsg エラーのオプションメッセージ
 */
function showErrorMessage(msg, optMsg) {
    const errorMainMsg = $('#error-main-message');
    errorMainMsg.html(msg);

    if (optMsg != null) {
        const errorOptMsg = $('#error-option-message');
        errorOptMsg.html(optMsg);
    }

    if (msg == 'パノラマが見つかりませんでした') {
        const errorActionButton = $('#error-action-button');
        errorActionButton.css('display', 'inline');
        errorActionButton.click(function (e) {
            window.location.href = './panorama_preview.php';
        });
    }

    $('#message-window').css('display', 'inline');
}

function check_object_detector_api_status(panoramaID){

    let data = {
        'method': 'check-object-detector-api-status',
    };

    // console.log('add-annotation temp id:', annotationImgTempId);

    $.ajax({
        type: 'POST',
        url: './panorama_play_server.php',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: function (response) {

            let status = response['status'];

            // APIが稼働中の場合
            if(status == 'running'){
                redirectToAnnotationPage(panoramaID);
            }else if(status == 'stopped'){
                alert('APIが停止中です．');
            }
        }
    });
}


/**
 * パノラマIDをクエリに付与し，アノテーション追加画面へリダイレクトする
 * @param {string} panoramaID パノラマID
 */
function redirectToAnnotationPage(panoramaID) {
    window.location.href = './add_annotation.php?panorama-id=' + panoramaID;
}
