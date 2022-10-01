<?php

require_once(dirname(__FILE__) . '/view_common.php');

// ログイン機能なしの場合
if($app_config->check_use_login_func() == false){

    // パノラマプレビュー画面にリダイレクト
    $session_manager->redirect_to('./panorama_preview.php');
}

// ログイン機能ありの場合

// セッションにIDが存在しているとき
if( $session_manager->check_session_has_key('ID')  == true){

    // パノラマプレビュー画面にリダイレクト
    $session_manager->redirect_to('./panorama_preview.php');
}else{
    // ログイン画面にリダイレクト
    // 現状はログイン画面を作成していないので，コメントアウト
    // $session_manager->redirect_to('./login.php');

}


?>
