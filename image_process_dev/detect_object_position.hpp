#include "common.hpp"
// #include "debug_util.hpp"

struct MatchResult{

    // 結果のフラグ　1：成功 0：失敗
    int flag;

    // マッチング結果の画像
    cv::Mat match_img;

    // テンプレート画像のキーポイント
    std::vector<cv::KeyPoint> template_keypoints;

    // テンプレート画像のdescriptor
    cv::Mat template_descriptors;

    // ソース画像のキーポイント
    std::vector<cv::KeyPoint> src_keypoints;

    // ソース画像のdescriptor
    cv::Mat src_descriptors;

    // マッチングデータ
    std::vector<cv::DMatch> match_datas;

    // ソース画像のマッチング点のX座標
    double x;

    // ソース画像のマッチング点のY座標
    double y;

    // 最短距離
    float min_distance;
};

void detect_object_position();

void match(cv::Mat template_img, cv::Mat src_img, int cut, MatchResult &match_result);


