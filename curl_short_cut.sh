# データを付与した状態でcurlを実行するのが面倒なので，ファイルにまとめる
curl -X POST -H "Content-Type: application/json" --data '{"annotation_img_temp_id":"2022-12-22_16-17-24_0003"}' http://localhost:8888/detect_annotation_objects

# curl -X POST -H "Content-Type: application/json" --data '{"input_word":"Kettle"}' http://localhost:8888/detect_object_position
