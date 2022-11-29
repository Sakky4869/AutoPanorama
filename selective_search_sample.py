import cv2
import glob
from selective_search import selective_search

mode = 'single'
# MINH = 100
MINH = 200
# MINW = 100
MINW = 200

input_file = './output_img/2022-10-01_10-33-00/front/front.jpg'
output_file = './output_img/2022-10-01_10-33-00/front/front_searched_min_' + str(MINH) + '.jpg'


input_img = cv2.imread(input_file)

print('front画像読み込み完了')

boxes = selective_search(input_img, mode=mode, random_sort=False)

count = 0

for box in boxes:
    if abs(box[2]-box[0]) < MINW or abs(box[3]-box[1])<MINH:
        continue
    ### 描画
    cv2.rectangle(input_img, (box[0],box[1]), (box[2],box[3]), (0,255,0), thickness=1)
    count += 1

cv2.imwrite(output_file, input_img)

print('count: {}'.format(count))
