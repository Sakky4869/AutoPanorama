

function init(){
    return;
    window.addEventListener('deviceorientation', function(event){
        // console.log('absolute', event.absolute);
        console.log('alpha', event.alpha);
        console.log('beta', event.beta);
        console.log('gamma', event.gamma);
    });
}

/**
 * URLのクエリからパノラマIDを取得する
 * @returns パノラマID
 */
 function getPanoramaID(){

    let url = new URL(window.location.href);

    let params = url.searchParams;

    return params.get('panorama-id');
}

function getPhoneDirection(){

}

function getAnnotationID(){

}

function startCamera(){

}

function takeAnnotation(video, width, height){

}

function uploadAnnotation(annotation, direction, annotationID){

}

function showCandidateAreas(candidateDatas){

}

function decideAnnotation(){

}

