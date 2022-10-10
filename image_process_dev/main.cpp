#include "common.hpp"
#include "convert_pano_to_cube.hpp"
#include "convert_position.hpp"
#include "debug_util.hpp"
#include "detect_object_position.hpp"
#include "export_data.hpp"
#include "preprocess.hpp"
#include "path_convert.hpp"

// #include <iostream>
// #include <string>
// #include <vector>
// #include <map>
// #include <math.h>

#include<sys/time.h>
#include<sys/stat.h>
#include<unistd.h>

using namespace std;
using namespace cv;

#define USE_DB 1
// #define USE_DB 0

/**
 * ---- 使い方 ----
 * アプリケーションと同一のディレクトリに，本プログラムの実行ファイル（detect_object_position）を設置
 * PHPから ./detect_object_position panorama_id annotation_id angle　を実行
 * 画像処理中は，進捗情報をPHPファイルを使って更新
 *  php ./update_detect_progress.php update-progress panorama_id annotation_id progress
 * 結果が出たら，結果をJSON文字列に変換して，PHPファイルを使って更新
 *  php ./update_detect_progress.php upload-result panorama_id annotation_id result_str
 */


int main(int argc, char *argv[])
{

    // 以前のログと区別しやすくするため改行
    for (int i = 0; i < 5; i++)
    {
        write_log(" ");
    }


    // return 0;

    if(argc < 4){
        cout << "引数が足りない" << endl;
        return -1;
    }

    // const string panorama_id = "2022-09-18_17-33-00";
    const string panorama_id = argv[1];

    // const string annotation_id = "2022-09-18_17-33-00";
    const string annotation_id = argv[2];

    const int total_progress_count = 28;
    int progress_count = 0;

    // int picture_angle = 140;
    int picture_angle = atoi(argv[3]);
    // int angle = atoi(argv[3]);

    // cout << "panorama_id: " << panorama_id << " , annotation_id: " << annotation_id << " , angle: " << picture_angle << endl;

    write_log("panorama_id: " + panorama_id + " annotation_id: " + annotation_id + " angle: " + to_string(picture_angle));

    // 開始時刻を記録
    // timeval time_start;
    // gettimeofday(&time_start, NULL);

    // アノテーションのファイル名
    // const string annotation_file_name = get_file_path("Kettle.jpg");
    const string annotation_file_name = get_annotation_path(annotation_id);

    write_log("anotation file: " + annotation_file_name);

    // cout << "annotation file: " << annotation_file_name << endl;
    // debugl("annotation file: " + annotation_file_name);
    // パノラマのファイル名
    // const string panorama_file_name = get_file_path("panorama_lab_exp_02.jpg");
    const string panorama_file_name = get_panorama_path(panorama_id);
    write_log("panorama file: " + panorama_file_name + " at 80");


    // cout << "panorama file: " << panorama_file_name << endl;
    // debugl("panorama file: " + panorama_file_name);

    // ---- パノラマ画像とアノテーション画像を読み込んで，前処理 ----

    // アノテーションファイル読み込み
    Mat annotation_img;// = imread(annotation_file_name);
    try{
        annotation_img = imread(annotation_file_name);
        write_log("アノテーションファイル読み込み完了");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("imread" + annotation_file_name + " at 96");
    }
    // Mat

    // cout << "アノテーションファイル読み込み完了" << endl;
    // cout << "annotation width: " << annotation_img.cols << ", height: " << annotation_img.rows << endl;
    // debugl("アノテーションファイル読み込み完了");
    write_log("アノテーションファイル読み込み完了");
    write_log("annotation width: " + to_string(annotation_img.cols) + " height: " + to_string(annotation_img.rows));

    // パノラマファイル読み込み
    Mat panorama_img;// = imread(panorama_file_name);
    try
    {
        panorama_img = imread(panorama_file_name);
        write_log("パノラマファイル読み込み完了");
    }
    catch(cv::Exception &e)
    {
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("imread " + panorama_file_name + " at " + to_string(117));
    }


    // cout << "パノラマファイル読み込み完了" << endl;
    // cout << "panorama width: " << panorama_img.cols << ", height: " << panorama_img.rows << endl;
    write_log("パノラマファイル読み込み完了");
    write_log("panorama width: " + to_string(panorama_img.cols) + " height: " + to_string(panorama_img.rows));

    // debugl("パノラマファイル読み込み完了");

    // キューブマップの変数
    Mat cubemap;

    // Faceのリスト
    map<string, Mat> faces;

    // キューブマップ作成
    try{

        if(convert_panorama_to_cubemap(panorama_img, cubemap, faces) == 1){
            // cout << "キューブマップ変換完了" << endl;
            // debugl("キューブマップ変換完了");
            write_log("キューブマップ変換完了");
        }else{
            // cout << "キューブマップ変換失敗" << endl;
            // debugl("キューブマップ変換失敗");
            write_log("キューブマップ変換完了");
        }

    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("convert panorama to cubemap at 150");
    }

#if USE_DB
    progress_count++;
    update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif

    // ---- キューブマップ上の座標から，パノラマの上の座標に変換するマップを生成 ----
    Mat position_map(cubemap.rows, cubemap.cols, CV_32SC2);

    try{
        create_position_map_from_cubemap_to_panorama(cubemap, panorama_img, position_map);
        write_log("キューブマップ座標とパノラマ座標の対応マップ作成");

    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("create position map from cubemap to panorama at 168");
    }

    // ---- 撮影時の方位角から，抽出する領域を絞り込む ----

    // 撮影角度：140
    // int picture_angle = 140;

    // 目標領域を格納する変数
    Mat target_area(1680, 1680, CV_8UC3);

    int target_area_top_left_x, target_area_top_left_y;

    // 領域を抽出する
    // その際，領域の左上の座標も記録する
    try{

        extract_target_area(cubemap.clone(), picture_angle, target_area, target_area_top_left_x, target_area_top_left_y);
        write_log("マッチング対象エリアを抽出");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("extract target area at 190");
    }

    // show_result("target", target_area);
    // return 0;

    vector<string> face_names = {"front", "right", "back", "left", "top", "bottom"};

    // for (int i = 0; i < face_names.size(); i++)
    // {
    //     show_result("face_" + face_names[i], faces[face_names[i]]);
    // }

    // return 0;

    // frontのみ取り出し
    // Mat cubemap_front = target_area;
    // Mat target_area = faces["front"];

    // 候補画像表示のため，カラー画像の段階でキューブマップを分割
    vector<Mat> target_area_color_split;

    try{
        // 分割
        split_img(target_area.clone(), 5, target_area_color_split);
        write_log("カラーのキューブマップを分割 幅：5");

    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("split img target color at 220");
    }


    // 代表色
    Vec3b repre_color;

    // 代表色を抽出するために，アノテーション画像を複製
    Mat annotation_img_for_repre_color = annotation_img.clone();

    resize(annotation_img_for_repre_color, annotation_img_for_repre_color, Size(), 0.3, 0.3);

    try{
        // 代表色を抽出
        get_representative_color(annotation_img_for_repre_color.clone(), repre_color);
        write_log("アノテーション画像の代表色抽出");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("get representative color at 239");
    }


#if USE_DB
    progress_count++;
    update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif

    // cout << "repre color: " << repre_color << endl;
    // debugl("repre color: " + to_string(repre_color));

    int color_dist_limit = 50;
    // color_dist_limit = 50;

    // キューブマップの代表色のみ残す
    // cut_not_representative_color(target_area, repre_color, color_dist_limit);

#if USE_DB
    progress_count++;
    update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif

    // show_result("cut_cubemap", cubemap);
    // show_result("cut_cubemap", target_area);

    // return 0;

    try{
        // アノテーション画像について，代表色との距離が遠いピクセルを黒くする
        cut_not_representative_color(annotation_img, repre_color, color_dist_limit);
        write_log("アノテーション画像　代表色以外を除去");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("cut not representative color annotation at 274");
    }

#if USE_DB
    progress_count++;
    update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif

    // show_result("cut_annotation", annotation_img);

    try{
        // frontの画像について，代表色との距離が遠いピクセルを黒くする
        // cut_not_representative_color(cubemap_front, repre_color, color_dist_limit);
        cut_not_representative_color(target_area, repre_color, color_dist_limit);
        write_log("キューブマップの対象エリア　代表色以外を除去");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("cut not representative color cubemap at 292");
    }

#if USE_DB
    progress_count++;
    update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif

    // show_result("cut_front", cubemap_front);
    // show_result("cut_target_area", target_area);

    convert_img_color_to_binary(target_area);

    vector<Mat> mat_list;

    try{
        split_img(target_area.clone(), 5, mat_list);
        write_log("キューブマップの対象エリアを分割　幅：5");
    }catch(cv::Exception &e){
        // write_log(e.err);
        // write_log(e.msg);
        write_log_opencv("split target area at 313");
    }

    int match_area_width = mat_list[0].cols;

    // convert_img_color_to_binary(cubemap);

    // 候補画像データを格納した，マッチングデータを初期化
    Result result;

    result.panorama_id = panorama_id;
    result.annotation_id = annotation_id;

    bool circle_panorama = false;

    for(int i = 1; i < 10; i++){

        float scale = (float)i / (float)10;

        // cout << "---- start matching scale: " << scale << " ----" << endl;

        // cout << "clone: " << i << endl;//" ... ";
        Mat annotation_img_resized = annotation_img.clone();
        // cout << "complete" <<  endl;

        resize(annotation_img_resized, annotation_img_resized, Size(), scale, scale);

        // cout << "resized" << endl;

        convert_img_color_to_binary(annotation_img_resized);

        // cout << "converted to binary" << endl;

        // show_result("binary_x" + to_string(scale), annotation_img_resized);

        // 領域の中で最も類似度が高いものの距離
        float min_dist = -1;

        // 領域の中で最も類似度が高いもののインデックス
        int min_dist_index = -1;

        Mat min_dist_match_img;

        float src_pt_x = -1;
        float src_pt_y = -1;


        for (int j = 0; j < mat_list.size(); j++)
        {

            // cout << ".";
            MatchResult match_result;

            try{
                match(annotation_img_resized, mat_list[j], 10, match_result);

            }catch(cv::Exception &e){

                write_log(e.err);
                write_log(e.msg);
                continue;
            }

            // cout << "\rmatching " << (j + 1) << " / " << mat_list.size();

            if(match_result.flag == 0) continue;

            // 記録がされていないか，記録を更新する場合
            if(min_dist == -1 || (min_dist > match_result.min_distance)){
                min_dist = match_result.min_distance;
                min_dist_index = j;
                src_pt_x = match_result.x + match_area_width * (j % 5);
                src_pt_y = match_result.y + match_area_width * (j / 5);
                min_dist_match_img = match_result.match_img;
            }

        }

        // string file_name = "match_result_x" + to_string((float)i / (float)10) + "_dist_" + to_string(min_dist);
        // show_result(file_name, target_area_color_split[min_dist_index]);

#if USE_DB
        progress_count++;
        update_progress_database(panorama_id, annotation_id, progress_count, total_progress_count);
#endif


        // 候補画像のパス
        const string candidate_img_path = get_candidate_path(panorama_id, annotation_id, to_string(i));

        // 候補画像を書き込み
        try{
            imwrite(candidate_img_path, target_area_color_split[min_dist_index]);
            write_log("候補画像を書き込み" + candidate_img_path);
            imwrite(get_match_img_path(panorama_id, annotation_id, to_string(i)), min_dist_match_img);

        }catch(cv::Exception &e){
            // write_log(e.err);
            // write_log(e.msg);
            write_log_opencv("候補画像書き込み at 406");
        }

        // キューブマップ上のマッチング点の座標と，パノラマ上のマッチング点の座標を変換
        int match_pos_x = target_area_top_left_x + (int)src_pt_x;
        int match_pos_y = target_area_top_left_y + (int)src_pt_y;

        if (match_pos_x >= position_map.cols) match_pos_x = position_map.cols - 1;
        if (match_pos_y >= position_map.rows) match_pos_y = position_map.rows - 1;

        int match_pos_x_in_panorama = -1;// = position_map.at<Vec2i>(match_pos_y, match_pos_x)[0];
        int match_pos_y_in_panorama = -1;// = position_map.at<Vec2i>(match_pos_y, match_pos_x)[1];
        try{
            match_pos_x_in_panorama = position_map.at<Vec2i>(match_pos_y, match_pos_x)[0];
            match_pos_y_in_panorama = position_map.at<Vec2i>(match_pos_y, match_pos_x)[1];

            if(match_pos_x_in_panorama == 1 || match_pos_x_in_panorama == 0
            || match_pos_y_in_panorama == 1 || match_pos_y_in_panorama == 0
            || match_pos_x_in_panorama == -1 || match_pos_y_in_panorama == -1){
                continue;
            }
            write_log("マッチング座標　セル X: " + to_string((int)src_pt_x) + " Y: " + to_string((int)src_pt_y));
            write_log("マッチング座標　キューブマップ X: " + to_string(match_pos_x) + " Y: " + to_string(match_pos_y));
            write_log("マッチング座標　パノラマ X: " + to_string(match_pos_x_in_panorama) + " Y: " + to_string(match_pos_y_in_panorama));

            Mat ret = cubemap.clone();
            circle(ret, Point(match_pos_x, match_pos_y), 30, Scalar(0, 210, 0), 10, LINE_AA);
            show_result("match_" + panorama_id + "_" + annotation_id + "_cubemap_x_" + to_string(match_pos_x) + "_y_" + to_string(match_pos_y), ret);
            write_log("キューブマップに点を描画");

            ret = panorama_img.clone();
            circle(ret, Point(match_pos_x_in_panorama ,match_pos_y_in_panorama), 30, Scalar(0, 200, 0), 10, LINE_AA);
            show_result("match_" + panorama_id + "_" + annotation_id + "_" + to_string(i)  + "_panorama_x_" + to_string(match_pos_x_in_panorama) + "_y_" + to_string(match_pos_y_in_panorama), ret);
            write_log("パノラマに点を描画");
        }catch(cv::Exception &e){
            // write_log(e.err);
            // write_log(e.msg);
            write_log_opencv("対応座標取り出し at 424");
        }
        // ---- 画像処理結果の位置情報をデバッグのため出力 ----
        // cout << endl;

        // cout << "match pos       x: " << (int)src_pt_x << ", y: " << (int)src_pt_y << endl;
        // cout << "target area pos x: " << target_area_top_left_x << ", y: " << target_area_top_left_y << endl;
        // cout << "pos in cubemap  x: " << match_pos_x <<", y: " << match_pos_y << endl;
        // cout << "pos in panorama x: " << match_pos_x_in_panorama << ", y: " << match_pos_y_in_panorama << endl;

        // if(circle_panorama == false){

        //     Mat circle_cubemap_target_area_pos = cubemap.clone();
        //     circle(circle_cubemap_target_area_pos, Point(target_area_top_left_x, target_area_top_left_y), 50, Scalar(0, 200, 0), 10, LINE_AA);
        //     imwrite("./output_img/circle_cubemap_target_area_pos.jpg", circle_cubemap_target_area_pos);

        //     Mat circle_cubemap_match_pos = cubemap.clone();
        //     circle(circle_cubemap_match_pos, Point(match_pos_x, match_pos_y), 50, Scalar(0, 200, 0), 10, LINE_AA);
        //     imwrite("./output_img/circle_cubemap_match_pos.jpg", circle_cubemap_match_pos);

        //     Mat circle_panorama_img = panorama_img.clone();
        //     circle(circle_panorama_img, Point(match_pos_x_in_panorama, match_pos_y_in_panorama), 50, Scalar(0, 200, 0), 10, LINE_AA);
        //     imwrite("./output_img/circle_panorama_img.jpg",circle_panorama_img);

        //     circle_panorama = true;
        // }

        double theta, phi;

        get_theta_and_phi(match_pos_x_in_panorama, match_pos_y_in_panorama, panorama_img.cols, panorama_img.rows, theta, phi);

        // 候補画像のデータを生成
        CandidateInfo info;
        info.index = i;
        info.url = candidate_img_path;
        info.theta = theta;
        info.phi = phi;

        write_log("パノラマ座標 Theta: " + to_string(info.theta) + " Phi: " + to_string(phi));

        // マッチングデータに格納
        result.imgs.push_back(info);

        // cout << endl << "---- end ----" << endl;
    }


    // マッチング結果のデータを，JSON文字列に変換
    string json_str;
    convert_result_struct_to_json(result, json_str);

    // cout << "---- result json ----" << endl;
    // cout << json_str << endl;

    // データベースにアップ
#if USE_DB
    send_detect_result(panorama_id, annotation_id, json_str);
#endif
// #if SHOW_MODE
//     waitkey(0);
// #endif

    // timeval time_end;
    // gettimeofday(&time_end, NULL);

    // clock_t end = clock();

    // cout << "process time: " << ((double)(end - start) / CLOCKS_PER_SEC) << " s" << endl;

    // cout << "process time: " << time_end.tv_sec - time_start.tv_sec + (float)(time_end.tv_usec - time_start.tv_usec) / 1000000 << "[s]" << endl;



    // cout << "total progress: " << progress_count << endl;

    return 0;
}
