#include "convert_pano_to_cube.hpp"

using namespace std;
using namespace cv;

int convert_panorama_to_cubemap(cv::Mat &input, cv::Mat &cubemap, map<string, Mat> &faces){

    // Faceの幅を計算
    int face_dim = input.cols / 4;

    // Faceの大きさを設定
    Size face_size(face_dim, face_dim);

    // 各Faceの変数を用意
    Mat front(face_size, CV_8UC3);
    Mat right(face_size, CV_8UC3);
    Mat back(face_size, CV_8UC3);
    Mat left(face_size, CV_8UC3);
    Mat top(face_size, CV_8UC3);
    Mat bottom(face_size, CV_8UC3);

    // Faceを作成
    int ret = 0b000000;
    ret |= create_cubemap_face(input, front, Name::Front, face_dim, face_dim);
    ret |= create_cubemap_face(input, right, Name::Right, face_dim, face_dim) << 1;
    ret |= create_cubemap_face(input, back, Name::Back, face_dim, face_dim) << 2;
    ret |= create_cubemap_face(input, left, Name::Left, face_dim, face_dim) << 3;
    ret |= create_cubemap_face(input, top, Name::Top, face_dim, face_dim) << 4;
    ret |= create_cubemap_face(input, bottom, Name::Bottom, face_dim, face_dim) << 5;

    if(ret == 0b111111){
        // cout << "All faces created." << endl;
    }else{
        // cout << "Some faces create failed." << endl;
        // cout << "Failed : ";
        if(ret & 0b000001 == 0b000001) cout << "Front ";
        if(ret & 0b000010 == 0b000010) cout << "Right ";
        if(ret & 0b000100 == 0b000100) cout << "Back ";
        if(ret & 0b001000 == 0b001000) cout << "Left ";
        if(ret & 0b010000 == 0b010000) cout << "Top ";
        if(ret & 0b100000 == 0b100000) cout << "Bottom ";
        cout << endl;
        return 0;
    }

    transpose(bottom, bottom);
    flip(bottom, bottom, 0);

    transpose(top, top);
    flip(top, top, 1);

    if((cubemap.cols == front.size().width * 4 && cubemap.rows == front.size().height * 3) == false){

        cubemap = Mat(Size(front.size().width * 4, front.size().height * 3), CV_8UC3, Scalar::all(0));
    }

    // Faceを格納
    faces["top"] = top;
    faces["left"] = left;
    faces["front"] = front;
    faces["right"] = right;
    faces["back"] = back;
    faces["bottom"] = bottom;

    top.copyTo(cubemap(Rect(face_dim, 0, face_dim, face_dim)));
    left.copyTo(cubemap(Rect(0, face_dim, face_dim, face_dim)));
    front.copyTo(cubemap(Rect(face_dim, face_dim, face_dim, face_dim)));
    right.copyTo(cubemap(Rect(face_dim * 2, face_dim, face_dim, face_dim)));
    back.copyTo(cubemap(Rect(face_dim * 3, face_dim, face_dim, face_dim)));
    bottom.copyTo(cubemap(Rect(face_dim, face_dim * 2, face_dim, face_dim)));

    return 1;

}


int create_cubemap_face(Mat &input, Mat &face, Name face_name, int width, int height)
{
    if(input.rows != input.cols / 2){
        return 0;
    }

    const double M_HALF_PI = M_PI_2;

    Face face_table[] = {
        {Name::Front, {0.0, 0.0}},
        {Name::Right, {M_HALF_PI, 0.0}},
        {Name::Back, {M_PI, 0.0}},
        {Name::Left, {-M_HALF_PI, 0.0}},
        {Name::Top, {0.0, -M_HALF_PI}},
        {Name::Bottom, {0.0, M_HALF_PI}}};

    string face_names[] = {
        "Front", "Right", "Back", "Left", "Top", "Bottom", "Unknown"
    };

    // debugl("Converting : " + face_names[(int)face_name]);
    // cout << "Converting : " << face_names[(int)face_name] << " ..." << endl;

    int face_id = (int)face_name;

    int input_width = input.cols;
    int input_height = input.rows;

    Mat map_x(height, width, CV_32F);
    Mat map_y(height, width, CV_32F);

    float an = sin(M_PI / 4);
    float ak = cos(M_PI / 4);

    float ftu = face_table[face_id].polar_coords[0];
    float ftv = face_table[face_id].polar_coords[1];

    face.forEach<Pixel>([&](Pixel &p, const int position[2]) -> void
    {
        int x = position[1];
        int y = position[0];

        float nx = float(y) / float(height) - 0.5f;
        float ny = float(x) / float(width) - 0.5f;

        nx *= 2;
        ny *= 2;

        nx *= an;
        ny *= an;

        float u = 0;
        float v = 0;

        if (ftv == 0)
        {
            u = atan2(nx, ak);
            v = atan2(ny * cos(u), ak);
            u += ftu;
        }
        else if (ftv > 0)
        {
            float d = sqrt(pow(nx, 2) + pow(ny, 2));
            v = M_PI / 2 - atan2(d, ak);
            u = atan2(ny, nx);
        }
        else
        {
            float d = sqrt(pow(nx, 2) + pow(ny, 2));
            v = -M_PI / 2 + atan2(d, ak);
            u = atan2(-ny, nx);
        }

        u = u / M_PI;
        v = v / (M_PI / 2.0);

        while (v < -1)
        {
            v += 2;
            u += 1;
        }

        while (v > 1)
        {
            v -= 2;
            u += 1;
        }

        while (u < -1)
        {
            u += 2;
        }

        while (u > 1)
        {
            u -= 2;
        }

        u = u / 2.0 + 0.5;
        v = v / 2.0 + 0.5;

        u = u * (input_width - 1);
        v = v * (input_height - 1);

        map_x.at<float>(x, y) = u;
        map_y.at<float>(x, y) = v;
    });

    if (face.cols != width || face.rows != height || typeid(face).name() != typeid(input).name())
    {
        face = Mat(width, height, input.type());
    }

    remap(input, face, map_x, map_y, INTER_CUBIC, BORDER_CONSTANT, Scalar(0, 0, 0));

    return 1;
}
