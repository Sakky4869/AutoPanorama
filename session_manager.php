<?php

/**
 * セッション管理を行うクラス
 */
class SessionManager{

    /**
     * セッションにキーが存在するかチェック
     * 存在していればtrue
     *
     * @param string $key
     * @return bool
     */
    public function check_session_has_key($key){
        return isset($_SESSION[$key]);
    }

    /**
     * 指定したURLにリダイレクトする
     * $urlには，リダイレクト先のURLとクエリを入れる．
     *
     * @param string $url
     * @return void
     */
    public function redirect_to($url){
        header('Location: ' . $url);
        exit();
    }
}


?>
