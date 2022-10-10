#include "common.hpp"

#ifndef CONFIG_INCLUDE
#define CONFIG_INCLUDE
#include "config.hpp"
#endif

/**
 * @brief Matデータを表示する
 *
 * @param window_name ウィンドウの名前
 * @param mat 表示するMat
 * @param scale 表示するスケール
 */
void display_img(std::string window_name, cv::Mat mat, double scale);

/**
 * @brief Matデータをファイルに書き出す
 *
 * @param file_name ファイル名
 * @param mat 書き出すMat
 */
void export_img(std::string file_name, cv::Mat mat);

/**
 * @brief Matデータを表示する．
 * SHOW_MODE：1 -> 画面に表示
 * SHOW_MODe：0 -> ファイルに書き出す
 *
 * @param name
 * @param mat
 * @param scale
 */
void show_result(std::string name, cv::Mat mat, double scale);

void show_result(std::string name, cv::Mat mat);

