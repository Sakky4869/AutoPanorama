#include "common.hpp"
// #include "debug_util.hpp"

#ifndef PIXEL
#define PIXEL
typedef cv::Point3_<uint8_t> Pixel;
#endif

void create_position_map_from_cubemap_to_panorama(cv::Mat cubemap, cv::Mat panorama, cv::Mat &position_map);

void get_theta_and_phi(int panorama_x, int panorama_y, int panorama_width, int panorama_height, double &theta, double &phi);
