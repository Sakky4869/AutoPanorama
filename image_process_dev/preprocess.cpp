#include "preprocess.hpp"

using namespace std;
using namespace cv;

int split_img(Mat src, int col_num, vector<Mat> &mat_list){

    int len = (int)(src.cols / col_num);

    for (int i = 0; i < col_num; i++)
    {
        for (int j = 0; j < col_num; j++)
        {
            // cout << "Roi X: " << (j * len) << " Y: " << i * len << " len: " << len << endl;
            mat_list.push_back(src(Rect(j * len, i * len, len, len)).clone());
        }

    }

    return 0;
}


// int split_cubemap(map<string, Mat> faces, vector<Mat> &matl_list){

//     vector<string> face_names  {"front", "right", "back", "left", "top", "bottom"};

//     for (int i = 0; i < face_names.size(); i++)
//     {
//         string face_name = face_names[i];

//         Mat face = faces[face_name];

//         vector<Mat> split_imgs;

//         split_img(face, 5, split_imgs);


//     }


// }


double get_dist_rgb(Vec3b pixel, Vec3b std_color){

    int target_b = (int)pixel[0];// - (uchar)'0';
    int target_g = (int)pixel[1];// - (uchar)'0';
    int target_r = (int)pixel[2];// - (uchar)'0';

    int std_b = (int)std_color[0];// - (uchar)'0';
    int std_g = (int)std_color[1];// - (uchar)'0';
    int std_r = (int)std_color[2];// - (uchar)'0';

    double dist = sqrt(pow(target_b - std_b, 2) + pow(target_g - std_g, 2) + pow(target_r - std_r, 2));

    return dist;
}


int check_color_far_than_limit(cv::Vec3b pixel, cv::Vec3b std_color, int limit){

    double dist = get_dist_rgb(pixel, std_color);

    if(dist > limit) return 1;

    return 0;
}


int get_representative_color(Mat img, Vec3b &color){

    // もともとはクラスタ数10でやっていたが，jupyterの状況とずれていたので，5に変更
    // const int cluster_count = 10;
    const int cluster_count = 5;


    // cout << "img pixel count: " << (img.rows * img.cols) << endl;
    // 画像を1列のデータに変換
    Mat points;
    img.convertTo(points, CV_32FC3);
    points = points.reshape(3, img.rows * img.cols);

    // K-Meansを実行し，RGB空間でピクセルを分ける
    Mat_<int> clusters(points.size(), CV_32SC1);
    Mat centers;
    TermCriteria cri(TermCriteria::MAX_ITER + TermCriteria::EPS, 10, 1.0);
    kmeans(points, cluster_count, clusters,
        // TermCriteria(TermCriteria::EPS + TermCriteria::MAX_ITER, 10, 1.0),
        cri,
        10, KMEANS_RANDOM_CENTERS, centers
    );

    vector<long> pixel_count_per_cluster(cluster_count);

    vector<int> cluster_vec;

    // cout << "cluster count: " << clusters.rows << endl;

    for (int i = 0; i < clusters.rows; i++)
    {
        pixel_count_per_cluster[clusters.at<int>(i)]++;
    }

    int max_count_cluster = 0;
    int max_count = 0;

    // cout << "---- clusters ----" << endl;
    for (int i = 0; i < cluster_count; i++)
    {
        // cout << "cluster: " << i << " count: " << pixel_count_per_cluster[i] << endl;

        if(i == 0 || max_count < pixel_count_per_cluster[i]){
            max_count_cluster = i;
            max_count = pixel_count_per_cluster[i];
        }
    }

    // cout << "---- centers ----" << endl;
    // for(int i = 0; i < centers.rows; i++){
    //     cout << "index: " << i << " ";
    //     for (int j = 0; j < centers.cols; j++)
    //     {
    //         cout << centers.at<float>(i, j) << " ";
    //     }

    //     cout << endl;

    // }

    // cout << "max cluster: " << max_count_cluster << " count: " << max_count << endl;

    float b = centers.at<float>(max_count_cluster, 0);
    float g = centers.at<float>(max_count_cluster, 1);
    float r = centers.at<float>(max_count_cluster, 2);


    // color[0] = (uchar)b;
    color[0] = convert_float_to_uchar(b);
    // color[1] = (uchar)g;
    color[1] = convert_float_to_uchar(g);
    // color[2] = (uchar)r;
    color[2] = convert_float_to_uchar(r);

    // cout << "representative color B: " << b << " G: " << g << " R: " << r << endl;

    // cout << "cluster min: " << *min_element(cluster_vec.begin(), cluster_vec.end()) << ", max: " << *max_element(cluster_vec.begin(), cluster_vec.end()) << endl;

    return 1;

}

uchar convert_float_to_uchar(float value){

    int value_int = (int)value;
    uchar value_uchar = value_int;

    // cout << "float: " << value << endl;
    // cout << "uchar: " << value_uchar << endl;

    return value_uchar;
}

int cut_not_representative_color(cv::Mat &img, cv::Vec3b &repre_color, int color_dist_limit){

    img.forEach<Vec3b>([&](Vec3b &pixel, const int potision[3]) -> void{

        uchar b = pixel[0];
        uchar g = pixel[1];
        uchar r = pixel[2];

        if(check_color_far_than_limit(pixel, repre_color, color_dist_limit) == 1){
            // pixel[0] = (uchar)'0';
            pixel[0] = 0;
            // pixel[1] = (uchar)'0';
            pixel[1] = 0;
            // pixel[2] = (uchar)'0';
            pixel[2] = 0;
        }

    });

    return 1;

}

int convert_img_color_to_binary(Mat &img){

    cvtColor(img, img, COLOR_BGR2GRAY);

    equalizeHist(img, img);

    threshold(img, img, 0, 255, THRESH_OTSU);

    return 0;
}




int extract_target_area(cv::Mat mat, int angle, cv::Mat &target_area, int &cubemap_x, int &cubemap_y){

    // 撮影角度から，キューブマップ画像中のX座標を求める
    angle += 135;

    // １周したら戻す
    if(angle > 359) angle -= 359;

    // キューブマップ上の座標に変換するため，X座標の割合を求める
    double ratio = (double)(angle) / (double)360;

    // X座標
    int picture_pos_x = ratio * mat.cols;

    // Y座標
    int picture_pos_y = mat.rows / 2;

    // 抜き出すエリアの左上のX座標
    int roi_x = picture_pos_x - 840;

    // 抜き出すエリアの左上のY座標
    int roi_y = picture_pos_y - 840;

    // キューブマップの端を超えたら，戻す
    if(roi_x > mat.cols - 1) roi_x - mat.cols;

    // 抜き出すエリアの右端のX座標を取得
    int roi_end_x = roi_x + 1680;


    // 右側のX座標がキューブマップの右端を超えていたら，
    // キューブマップを超える前のエリアと，キューブマップを超えたあとのエリアを用意し
    // ２つを合成する形で抽出領域を作成する
    if(roi_end_x > mat.cols - 1){

        // オーバーした分を計算
        int rest_x = roi_end_x - mat.cols;

        // オーバーするまでの長さを計算
        int length_not_rest = mat.cols - roi_x;

        // cout << "rest x: " << rest_x << endl;
        // debugl("rest x: " + to_string(rest_x));
        // cout << "length not rest: " << length_not_rest << endl;
        // debugl("length not rest: " + to_string(length_not_rest));

        // オーバーしていない部分の領域
        Mat not_rest(mat, Rect(roi_x, roi_y, length_not_rest, 1680));

        // cout << "not rest mat width: " << not_rest.cols << ", height: " << not_rest.rows << endl;
        // debugl("not rest mat width: " + to_string(not_rest.cols) +  ", height: " + to_string(not_rest.rows));

        // オーバーした部分の領域
        Mat rest(mat, Rect(0, roi_y, rest_x, 1680));

        // cout << "rest mat width: " << rest.cols << ", height: " << rest.rows << endl;
        // debugl("rest mat width: " + to_string(rest.cols) + ", height: " + to_string(rest.rows));

        // 抽出領域のMatに合成
        not_rest.copyTo(target_area(Rect(0, 0, length_not_rest, 1680)));
        rest.copyTo(target_area(Rect(length_not_rest, 0, 1680 - length_not_rest, 1680)));


    }else{
        target_area = Mat(mat, Rect(roi_x, roi_y, 1680, 1680));
    }

    cubemap_x = roi_x;
    cubemap_y = roi_y;


    return 1;
}


