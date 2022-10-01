<?php

require_once(dirname(__FILE__) . '/../../db_conf/database_config_panorama.php');
require_once(dirname(__FILE__) . '/post_manager.php');

// データベースとの連携クラスを初期化
$db_config = new DatabaseConfigPanorama();

// POSTデータの管理クラスを初期化
$post_manager = new PostManager();


?>
