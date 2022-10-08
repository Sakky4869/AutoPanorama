#include "common.hpp"
#include <nlohmann/json.hpp>
#include<fstream>
// #include "debug_util.hpp"
// #include "time.h"

struct CandidateInfo{
    int index;
    std::string url;
    double theta;
    double phi;
};

struct Result{
    std::string panorama_id;
    std::string annotation_id;
    std::vector<CandidateInfo> imgs;
};

std::string get_timestamp();

std::string get_save_dir_of_candidate_imgs(std::string panorama_id, std::string annotation_id);

void update_progress_database(std::string panorama_id, std::string annotation_id, int &progress_count, int total);

void send_detect_result(std::string panorama_id, std::string annotation_id, std::string result);

void convert_result_struct_to_json(Result result, std::string &json_str);
