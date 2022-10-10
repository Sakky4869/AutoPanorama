#include "common.hpp"
// #include "debug_util.hpp"


int split_img(cv::Mat src, int col_num, std::vector<cv::Mat> &mat_list);

int split_cubemap(std::map<std::string, cv::Mat> faces, std::vector<cv::Mat> &matl_list);

double get_dist_rgb(cv::Vec3b pixel, cv::Vec3b std_color);

int check_color_far_than_limit(cv::Vec3b pixel, cv::Vec3b std_color, int limit);


int get_representative_color(cv::Mat img, cv::Vec3b &color);

uchar convert_float_to_uchar(float value);

int cut_not_representative_color(cv::Mat &img, cv::Vec3b &repre_color, int color_dist_limit);

int convert_img_color_to_binary(cv::Mat &img);

int extract_target_area(cv::Mat mat, int angle, cv::Mat &target_area, int &cubemap_x, int &cubemap_y);

