# FLASKの起動コマンドが面倒なので，ファイルにまとめる
export FLASK_APP=main
export FLASK_ENV=development
export GOOGLE_APPLICATION_CREDENTIALS=/home/sakai/AutoPanorama_img_proc/savvy-webbing-368209-93035ab18f3a.json
# flask run -h 127.0.0.1 -p 8888 --reload
flask run -h 127.0.0.1 -p 8888
