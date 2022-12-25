import io
from google.cloud import vision


def get_objects_in_image(file_path, client):
    """物体画像から物体を検出し，検出データを返す

    Args:
        file_path (string): 物体画像のパス
        client (vision.ImageAnnotatorClient): Vision APIのクライアント

    Returns:
        object: Vision APIによって検出された物体データのオブジェクト
    """

    # 画像ファイルを開く
    with io.open(file_path, 'rb') as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    # ラベル検出　これで１ユニット消費
    # 2022/11/24時点では使用するつもりはないが，ラベルも情報として使う可能性があるので，
    # 一応残す
    # response_label = client.label_detection(image=image)
    # labels = response_label.label_annotations
    # print('Labels:')
    # for label in labels:
    #     print(label.description)

    # オブジェクト検出　これで１ユニット消費
    return client.object_localization(image=image).localized_object_annotations
