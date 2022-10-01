<?php

require_once(dirname(__FILE__) . '/session_manager.php');
require_once(dirname(__FILE__) . '/app_config.php');

// アプリの設定クラスを初期化
$app_config = new AppConfig();

// セッション管理クラスを初期化
$session_manager = new SessionManager();

?>
