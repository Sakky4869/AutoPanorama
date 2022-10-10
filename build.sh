cd image_process_dev/build
echo "cd build"

cmake ..
echo "cmake .."

make
echo "make"

mv ./image_process ../../image_process
echo "mv ./image_process ../../image_process"

cd ../..
echo "cd ../.."
