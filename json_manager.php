<?php

/**
 * 配列とJSONの変換を行う
 */
class JsonManager{

    /**
     * 配列データをJSONに変換してecho
     *
     * @param array $data
     * @return string
     */
    public function get_json_response($array_data){
        return json_encode($array_data, JSON_UNESCAPED_UNICODE);
    }

    /**
     * JSONを配列データに変換する
     *
     * @param string $json
     * @return array
     */
    public function get_array_from_json($json){
        return json_decode($json, true);
    }
}

?>
