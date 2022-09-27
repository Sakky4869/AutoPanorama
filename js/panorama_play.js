
/**
 * URLのクエリからパノラマIDを取得する
 * @returns パノラマID
 */
function getPanoramaID(){

    let url = new URL(window.location.href);

    let params = url.searchParams;

    return params.get('panorama-id');
}

/**
 * パノラマIDをもとに，パノラマのオリジナル画像のURLを取得する
 * @param {string} panoramaID パノラマID
 * @returns パノラマのオリジナル画像のURL
 */
function getPanoramaOriginUul(panoramaID){

    // 2022/09/27
    // サーバサイドが未開発のため，臨時データをreturn
    return './panorama_imgs/2022-09-08_17-33-00/origin.jpg';

    $.ajax({
        type: 'POST',
        url: './panorama_play_server.php',
        dataType: 'json',
        data: {
          'method': 'get-panorama-origin', 'panorama-id': panoramaID
        },
        success: function (response) {
            if(response['result'] == true){
                return response['origin-url'];
            }else{
                showErrorMessage(response['message']);
                return null;
            }
        }
    });
}

/**
 * パノラマIDをもとに，アノテーションデータを取得する
 * @param {string} panoramaID パノラマID
 */
function getAnnotationDatas(panoramaID){

    // 2022/09/27
    // サーバサイドが未開発のため，臨時データをreturn
    return {
        'datas': [
            { 'annotation-id' : "2022-09-08_17-33-00",'theta' : 1.87, 'phi' : 3.10,
                'annotation-url' : "./annotation_imgs/2022-09-18_17-33-00.jpg"},
        ]
    };

    $.ajax({
        type: 'POST',
        url: './panorama_play_server.php',
        dataType: 'json',
        data: {
            'method': 'get-annotation-datas',
            'panorama-id': panoramaID
        },
        success: function(response){
            return response;
        }
    });
}

function showErrorMessage(msg, optMsg){

}

/**
 * パノラマIDをクエリに付与し，アノテーション追加画面へリダイレクトする
 * @param {string} panoramaID パノラマID
 */
function redirectToAnnotationPage(panoramaID){
    window.location.href = '../add_annotation.php?panorama-id=' + panoramaID;
}
