#include "common.hpp"
// #include "debug_util.hpp"

#ifndef PIXEL
#define PIXEL
typedef cv::Point3_<uint8_t> Pixel;
#endif

enum class Name{
    Front,
    Right,
    Back,
    Left,
    Top,
    Bottom,
    NumFaces
};

struct Face{
    Name name;
    float polar_coords[2];
};

int convert_panorama_to_cubemap(cv::Mat &input, cv::Mat &cubemap, std::map<std::string, cv::Mat> &faces);

int create_cubemap_face(cv::Mat &input, cv::Mat &face, Name face_name, int width, int height);

