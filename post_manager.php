<?php

require_once('./json_manager.php');

/**
 * POSTデータを管理する
 */
class PostManager{

    /**
     * POSTされたJSONを取り出す
     *
     * @return string
     */
    public function get_json_in_post(){

        return file_get_contents('php://input');
    }

    /**
     * POSTされたデータにmethodがない場合に，終了する
     *
     * @return void
     */
    public function exit_if_post_has_no_method(){

        // JSONデータ変換クラスのインスタンスを生成
        $json_manager = new JsonManager();

        // JSONデータ取得
        $json = $this->get_json_in_post();

        // JSONデータを配列に変換
        $post_array = $json_manager->get_array_from_json($json);

        // methodが定義されていないとき
        if(isset($post_array['method']) == false){

            // 「methodがありません」というメッセージを返す
            $data = array(
                "result" => false,
                "message" => "methodがありません"
            );

            $json_manager->echo_json_response($data);

            exit();
        }
    }

    /**
     * methodの種類を確認
     * $methodと同じならtrue
     *
     * @param string $method
     * @return bool
     */
    public function check_method_equals($method){

        // JSONデータ取得
        $json = $this->get_json_in_post();

        // JSONデータ変換クラスのインスタンスを生成
        $json_manager = new JsonManager();

        // JSONデータを配列に変換
        $post_array = $json_manager->get_array_from_json($json);

        // methodが引数と同一かチェックして返す
        return $post_array['method'] == $method;
    }
}


?>
