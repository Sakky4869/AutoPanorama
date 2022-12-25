import vision_api_interface

def detect_annotation_objects(file_path, client, width, height):

    objects = vision_api_interface.get_objects_in_image(file_path, client)

    object_data = []

    for obj in objects:

        obj_name = obj.name

        vertices = obj.bounding_poly.normalized_vertices

        vertices_int = []

        for vertice in vertices:
            vertices_int.append([
                int(vertice.x * width), int(vertice.y * height)
            ])

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

