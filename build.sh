cd /home/sakai/AutoPanorama_img_proc/image_process_dev/build
echo "cd build"

cmake ..
echo "cmake .."

make
echo "make"

mv /home/sakai/AutoPanorama_img_proc/image_process_dev/build/image_process /home/sakai/AutoPanorama_img_proc/image_process
echo "mv ./image_process ../../image_process"

cd /home/sakai/AutoPanorama_img_proc/panorama_imgs
echo "cd /home/sakai/AutoPanorama_img_proc/panorama_imgs"
