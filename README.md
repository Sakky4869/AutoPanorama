# AutoPanorama

* 【研究】パノラマへのアノテーション半自動化システムの開発用リポジトリ．
    * アノテーション：パノラマ画像中の特定の物体に対して、説明をするためにマーキングをすること
* アプリページ：https://grapefruit.sys.wakayama-u.ac.jp/~sakai/AutoPanorama_dev


## 概要

- Webアプリで撮影した１枚の画像に対して、同一の物体を画像処理と自然言語処理を組み合わせてパノラマ画像から探索し、見つけた位置にアノテーションをつけるシステムです。
- 物体認識はGoogle Cloud Vision APIを利用しました。

![image](https://github.com/Sakky4869/AutoPanorama/assets/45997787/a6c59d42-8665-422e-a352-15af63774434)

### システムの利用フロー

![system_flow_screen](https://github.com/Sakky4869/AutoPanorama/assets/45997787/35ff7223-fae6-4567-86b9-8f0714e934d8)


## ブランチ

- [develop_web_app](https://github.com/Sakky4869/AutoPanorama/tree/develop_web_app)
    - Webアプリケーション本体
- [develop_image_process](https://github.com/Sakky4869/AutoPanorama/tree/develop_image_process)
    - バックグラウンドで稼働する画像処理システムと自然言語処理システム

## システムの大まかな構成要素

### Webアプリケーション

- ユーザーがアクセスするWebアプリケーション
- パノラマを閲覧したり、アノテーションを付与したりする

### 画像処理システム

- パノラマ画像を分割して、Google Cloud Vision APIで物体を認識しやすくする処理
- Google Cloud Vision APIを経由して画像中の物体の名称を取得

### 自然言語処理システム

- パノラマから取得した物体名称と、Webアプリケーションからアップロードされた画像に映る物体の名称を照合

## 技術スタック

- Webアプリケーション
    - PHP
    - JavaScript
    - CSS
    - Bootstrap
- 画像処理システム
    - C++
- 自然言語処理システム
    - Python
    - BERT

## 設計情報

- Google Drive上にDraw.ioで作成
- 下記リンクに画像として出力しています
    - https://drive.google.com/drive/folders/1C0Xm7jGvMrru0KVyiiMBycYGgtOJE4WS?usp=drive_link

## 工夫した点

- Webアプリケーションで物体の画像を撮影してから結果が表示されるまでに時間がかかっていたため、非同期処理を実装しました
   - DBにバックグラウンド処理の進捗状況を保存し、その数値を定期的に読み取ることで、処理が完了したタイミングで結果を取得できるようにしました


