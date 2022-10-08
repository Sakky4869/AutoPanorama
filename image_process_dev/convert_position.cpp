#include "convert_position.hpp"

using namespace std;
using namespace cv;

void create_position_map_from_cubemap_to_panorama(Mat cubemap, Mat panorama, Mat &position_map)
{

    // 6720
    int cubemap_height = cubemap.rows;
    // 5040
    int cubemap_width = cubemap.cols;

    // 6720
    int panorama_height = panorama.rows;
    // 3360
    int panorama_width = panorama.cols;

    int cube_face_height = cubemap_height / 3;
    int cube_face_width = cubemap_width / 4;

    // cout << "対応マップ雛形作成中" << endl;
    // debugl("対応マップ雛形作成中");

    Mat convert_map = Mat::ones(cubemap_height, cubemap_width, CV_32SC2);

    // cout << "対応マップ雛形作成完了" << endl;
    // debugl("対応マップ雛形作成完了");

    // cout << "対応マップ作成開始" << endl;
    // debugl("対応マップ作成開始");

    bool x_over_flag = false;
    bool y_over_flag = false;



    panorama.forEach<Pixel>([&](Pixel &pixel, const int position[2]) -> void
    {
        // Y j
        int _y = position[0];

        // X i
        int _x = position[1];

        double v = 1.0 - ((double) _y / (double)panorama_height);
        double theta = v * M_PI;

        double u = ((double)_x / (double)panorama_width);
        double phi = u * 2.0 * M_PI;

        double x = sin(phi) * sin(theta) * -1.0;
        double y = cos(theta);
        double z = cos(phi) * sin(theta) * -1.0;

        vector<double> xyz = {abs(x), abs(y), abs(z)};
        double a = *max_element(xyz.begin(), xyz.end());

        double xa = x / a;
        double ya = y / a;
        double za = z / a;

        int x_pixel = 0;
        int y_pixel = 0;
        int x_offset = 0;
        int y_offset = 0;

        if (xa == 1)
        {
            x_pixel = (int)((((za + 1.0) / 2.0) - 1.0) * cube_face_width);
            x_offset = 2 * cube_face_width;
            y_pixel = (int)((((ya + 1.0) / 2.0)) * cube_face_height);
            y_offset = cube_face_height;
        }
        else if(xa == -1)
        {
            x_pixel = (int)((((za + 1.0) / 2.0)) * cube_face_width);
            x_offset = 2 * cube_face_width;
            y_pixel = (int)((((ya + 1.0) / 2.0)) * cube_face_height);
            y_offset = cube_face_height;
        }
        else if(ya == 1)
        {
            x_pixel = (int)((((xa + 1.0) / 2.0)) * cube_face_width);
            x_offset = cube_face_width;
            y_pixel = (int)((((za + 1.0) / 2.0) - 1.0) * cube_face_height);
            y_offset = 2 * cube_face_height;
        }
        else if(ya == -1)
        {
            x_pixel = (int)((((xa + 1.0) / 2.0)) * cube_face_width);
            x_offset = cube_face_width;
            y_pixel = (int)((((za + 1.0) / 2.0)) * cube_face_height);
            y_offset = 0;
        }
        else if(za == 1)
        {
            x_pixel = (int)((((xa + 1.0) / 2.0)) * cube_face_width);
            x_offset = cube_face_width;
            y_pixel = (int)((((ya + 1.0) / 2.0)) * cube_face_height);
            y_offset = cube_face_height;
        }
        else if(za == -1)
        {
            x_pixel = (int)((((xa + 1.0) / 2.0) - 1.0) * cube_face_width);
            x_offset = 3 * cube_face_width;
            y_pixel = (int)((((ya + 1.0) / 2.0)) * cube_face_height);
            y_offset = cube_face_height;
        }else{
            x_pixel = y_pixel = x_offset = y_offset = 0;
        }

        x_pixel = (int)(abs(x_pixel) + x_offset) - 1;
        y_pixel = (int)(abs(y_pixel) + y_offset) - 1;

        if(x_pixel < 0) x_pixel = 0;
        if(x_pixel >= convert_map.cols) x_pixel = convert_map.cols - 1;

        if(y_pixel < 0) y_pixel = 0;
        if(y_pixel >= convert_map.rows) y_pixel = convert_map.rows - 1;


        convert_map.at<Vec2i>(y_pixel , x_pixel )[0] = _x;
        convert_map.at<Vec2i>(y_pixel , x_pixel )[1] = _y;


    });

    // cout << "対応マップ作成完了" << endl;
    // debugl("対応マップ作成完了");

    convert_map.copyTo(position_map);

}


void get_theta_and_phi(int panorama_x, int panorama_y, int panorama_width, int panorama_height, double &theta, double &phi){

    // double v = 1 - ( (double) panorama_y / (double) panorama_height );
    double v = (double) panorama_y / (double) panorama_height ;
    theta = v * M_PI;
    double u = (double) panorama_x / (double) panorama_width;
    phi = u * 2.0 * M_PI;
}
