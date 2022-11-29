# rm ./candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00/*
# echo "rm ./candidate_imgs/2022-09-18_17-33-00/2022-09-18_17-33-00/*"

# rm ./output_img/*
# echo "rm ./output_img/*"

# ./image_process 2022-09-18_17-33-00 2022-10-08_17-20-14 140
# ./image_process 2022-09-18_17-33-00 2022-09-18_17-33-00 140
# ./image_process 2022-09-18_17-33-00 2022-09-18_17-33-00 131

# グリッドモード
# ./image_process ss_mode=grid panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131\
# | tee --append result.txt

# グリッドモード ログのファイル出力なし
# ./image_process ss_mode=grid panorama_id=2022-09-18_17-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131

# Selective Search パラメータの試し
# ./image_process ss_mode=selective_search ss_min_size=200 ss_smallest=1000 ss_largest=30000 nms_threshold=0.0 \
# panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131 \
# | tee --append result_ss_mindist_200.txt

# ./image_process ss_mode=selective_search ss_min_size=200 ss_smallest=1000 ss_largest=30000 nms_threshold=0.5 \
# panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131 \
# | tee --append result_ss_mindist_200.txt

# ./image_process ss_mode=selective_search ss_min_size=200 ss_smallest=1000 ss_largest=30000 nms_threshold=0.7 \
# panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131 \
# | tee --append result_ss_mindist_200.txt

# ./image_process ss_mode=selective_search ss_min_size=200 ss_smallest=1000 ss_largest=30000 nms_threshold=1.0 \
# panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131 \
# | tee --append result_ss_mindist_200.txt


# Selective Search APIへの投稿に向けて
./image_process ss_mode=selective_search ss_min_size=100 ss_smallest=1000 ss_largest=30000 nms_threshold=0.7 \
panorama_id=2022-10-01_10-33-00 annotation_id=2022-09-18_17-33-00 picture_angle=131
