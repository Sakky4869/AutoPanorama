import vision_api_interface

def detect_annotation_objects(file_path, client, width, height):
    """アノテーションの一時画像から物体名称を取得する

    Args:
        file_path (string): アノテーションの一時画像のファイルパス
        client (vision.client): Vision APIと通信するためのクライアント
        width (int): 画像の幅
        height (int): 画像の高さ

    Returns:
        list: 物体名称とその座標データ
    """

    # まず，文字検出を行い，検出できたらそれをデータとする
    # 検出されなかった場合，オブジェクト検出

    # Vision APIを使って物体名称のデータを取得
    objects = vision_api_interface.get_objects_in_image(file_path, client)

    # 文字かオブジェクトか，種類を取得
    data_type = objects['type']

    # 本システムに使いやすい形に変換
    object_data = []

    for obj in objects['data']:

        obj_name = ''
        vertices_int = []

        if(data_type == 'object'):

            obj_name = obj.name
            vertices = obj.bounding_poly.normalized_vertices
            for vertice in vertices:
                vertices_int.append([
                    int(vertice.x * width), int(vertice.y * height)
                ])

        elif(data_type == 'text'):

            obj_name = obj.description
            vertices_int = [[vertice.x, vertice.y] for vertice in obj.bounding_poly.vertices]

        # cv2.rectangle(mat,
        #               (vertices_int[0][0], vertices_int[0][1]),
        #             #   vertices_int[0],
        #               (vertices_int[2][0], vertices_int[2][1]),
        #             #   vertices[2],
        #               color=(0, 255, 0),
        #               thickness=2,
        #               lineType=cv2.LINE_AA)

        object_data.append({
            'name': obj_name,
            'vertices': vertices_int
        })

    # cv2.imwrite('/home/sakai/AutoPanorama_img_proc/annotation_imgs_temp/' + file_path.split('.')[0] + '_result.jpg', mat)

    return object_data

