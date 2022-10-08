#include "debug_util.hpp"

using namespace std;
using namespace cv;

void display_img(string window_name, Mat mat, double scale){

    namedWindow(window_name);
    Mat dst = mat.clone();
    resize(dst, dst, Size(), scale, scale);
    imshow(window_name, dst);
}

void export_img(string file_name, Mat mat){

    imwrite("./output_img/" + file_name + ".jpg", mat);
}

void show_result(string name, Mat mat, double scale){

#if SHOW_MODE
    display_img(name, mat, scale);
#else
    export_img(name, mat);
#endif

}

void show_result(std::string name, cv::Mat mat){

#if SHOW_MODE
    display_img(name, mat, 1);
#else
    export_img(name, mat);
#endif

}


