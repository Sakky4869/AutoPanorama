import math

def convert_pos_from_cube_to_pano(center_x_cubemap, center_y_cubemap, pos_map):
    """キューブマップ上の座標からパノラマ上の座標に変換する

    Args:
        center_x_cubemap (int): キューブマップ上での物体の中央のX座標
        center_y_cubemap (int): キューブマップ上での物体の中央のY座標
        pos_map (DataFrame): 座標データのCSVファイルを読み込んで作成したデータフレーム

    Returns:
        list: パノラマ上のX座標とY座標
    """

    pos_panorama = pos_map[(pos_map['pos_x_cubemap'] == center_x_cubemap) & (pos_map['pos_y_cubemap'] == center_y_cubemap)].values[0]

    pos_x_panorama = pos_panorama[2]
    pos_y_panorama = pos_panorama[3]

    return [pos_x_panorama, pos_y_panorama]

def get_theta_and_phi(pos_x_panorama, pos_y_panorama):
    """パノラマ上の座標から，バーチャルツアーで表示するためのthetaとphiに変換する

    Args:
        pos_x_panorama (int): パノラマ上のX座標
        pos_y_panorama (int): パノラマ上のY座標

    Returns:
        list: thetaとphiを格納したリスト
    """

    panorama_width = 6720
    panorama_height = 3360

    v = float(pos_y_panorama) / float(panorama_height)
    u = float(pos_x_panorama) / float(panorama_width)

    theta = v * math.pi
    phi = u * 2.0 * math.pi

    return [theta, phi]

