#include "detect_object_position.hpp"

using namespace std;
using namespace cv;


void detect_object_position(){

}


void match(cv::Mat template_img, cv::Mat src_img, int cut, MatchResult &match_result){
    vector<KeyPoint> src_keypoints;
    vector<KeyPoint> template_keypoints;

    Mat src_descriptors;
    Mat template_descriptors;

    Ptr<AKAZE> akaze = AKAZE::create();

    // cout << "start detect and compute" << endl;

    akaze->detectAndCompute(src_img, noArray(), src_keypoints, src_descriptors);
    akaze->detectAndCompute(template_img, noArray(), template_keypoints, template_descriptors);

    // cout << ".";

    // cout << "src  kp size: " << src_keypoints.size() << endl;
    // cout << "temp kp size: " << template_keypoints.size() << endl;

    if(src_keypoints.size() == 0){
        match_result.flag = 0;
        return;
    }
    // cout << "template keypoints: " << template_keypoints.size() << endl;
    // cout << "src      keypoints: " << src_keypoints.size() << endl;

    Mat src_keypoints_img;
    Mat template_keypoints_img;
    drawKeypoints(src_img, src_keypoints, src_keypoints_img, Scalar::all(-1), DrawMatchesFlags::DRAW_RICH_KEYPOINTS);
    drawKeypoints(template_img, template_keypoints, template_keypoints_img, Scalar::all(-1), DrawMatchesFlags::DRAW_RICH_KEYPOINTS);

    BFMatcher matcher(NORM_HAMMING);
    vector<vector<DMatch>> nn_matches;
    matcher.knnMatch(template_descriptors, src_descriptors, nn_matches, 1);

    // cout << ".";
    // cout << "match succeeded" << endl;

    std::sort(nn_matches.begin(), nn_matches.end(), [](const vector<DMatch> &first, const vector<DMatch> &second){
        return first[0].distance < second[0].distance;
    });

    // cout << "nn_matches.size(): " << nn_matches.size() << endl;

    // cout << "---- nn_matches ----" << endl;

    // for (int i = 0; i < nn_matches.size(); i++)
    // {
    //     cout << "index: " << i << " dist: " << nn_matches[i][0].distance << endl;
    // }

    // const float ratio_thresh = 0.8f;
    vector<DMatch> good_matches;

    for (int i = 0; i < cut; i++)
    {
        if(i >= nn_matches.size()) break;
        good_matches.push_back(nn_matches[i][0]);
        // if(nn_matches[i][0].distance < ratio_thresh * nn_matches[i][1].distance){
        //     good_matches.push_back(nn_matches[i][0]);
        // }
    }

    // cout << "good_matches.size(): " << good_matches.size() << endl;

    // good_matches.push_back(nn_matches[0][0]);

    Mat matches_img;
    drawMatches(template_img, template_keypoints, src_img, src_keypoints, good_matches, matches_img);


    vector<Point2f> obj;
    vector<Point2f> scene;
    // cout << "---- good matches ----" << endl;

    // for (int i = 0; i < good_matches.size(); i++)
    // {
    //     cout << "match: " << good_matches[i].distance << endl;
    // }


    for (int i = 0; i < good_matches.size(); i++)
    {
        obj.push_back(template_keypoints[good_matches[i].queryIdx].pt);
        scene.push_back(src_keypoints[good_matches[i].trainIdx].pt);
    }

    if(good_matches.size() > 0){

        Mat h;// = findHomography(obj, scene, RANSAC);

        if(h.empty() == false){
            vector<Point2f> obj_corners(4);
            obj_corners[0] = Point2f(0.0, 0.0);
            obj_corners[1] = Point2f((float)template_img.cols, 0.0);
            obj_corners[2] = Point2f((float)template_img.cols, (float)template_img.rows);
            obj_corners[3] = Point2f(0.0, (float)template_img.rows);

            vector<Point2f> scene_corners(4);
            perspectiveTransform(obj_corners, scene_corners, h);

            line(matches_img, scene_corners[0] + Point2f((float)template_img.cols, 0.0), scene_corners[1] + Point2f((float)template_img.cols, 0.0), Scalar(0, 255, 0), 4);
            line(matches_img, scene_corners[1] + Point2f((float)template_img.cols, 0.0), scene_corners[2] + Point2f((float)template_img.cols, 0.0), Scalar(0, 255, 0), 4);
            line(matches_img, scene_corners[2] + Point2f((float)template_img.cols, 0.0), scene_corners[3] + Point2f((float)template_img.cols, 0.0), Scalar(0, 255, 0), 4);
            line(matches_img, scene_corners[3] + Point2f((float)template_img.cols, 0.0), scene_corners[0] + Point2f((float)template_img.cols, 0.0), Scalar(0, 255, 0), 4);

        }

        match_result.flag = 1;
        match_result.match_img = matches_img;
        match_result.template_keypoints = template_keypoints;
        match_result.template_descriptors = template_descriptors;
        match_result.src_keypoints = src_keypoints;
        match_result.src_descriptors = src_descriptors;
        match_result.match_datas = good_matches;
        match_result.min_distance = good_matches[0].distance;
        match_result.x = (double)src_keypoints[good_matches[0].trainIdx].pt.x;
        match_result.y = (double)src_keypoints[good_matches[0].trainIdx].pt.y;

    }else{
        match_result.flag = 0;
    }

    // cout << ".";
    // show_result("match_result", matches_img, 0);
}



