#include "export_data.hpp"

using namespace std;
using namespace cv;
using json = nlohmann::json;

void update_progress_database(string panorama_id, string annotation_id, int &progress_count, int total){

    progress_count++;
    int progress = (int)((double) progress_count / (double) total * 100);

    // string command = "php ../update_detect_progress.php " + panorama_id + " " + annotation_id + " " + to_string(progress);
    string command = "php ./update_detect_progress.php update-progress " + panorama_id + " " + annotation_id + " " + to_string(progress);

    write_log("exec: " + command);
    // cout << endl << "exec: " << command << endl;
    // debugl("exec: " + command);

    system(command.c_str());

}


void send_detect_result(string panorama_id, string annotation_id, string result){

    const string match_result_file_name = "./match_result_json/" + panorama_id + "_" + annotation_id + ".json";
    ofstream ofs(match_result_file_name, ios::out);
    if(!ofs){
        // cout << "ファイル: " << match_result_file_name << " を開けませんでした" << endl;
        return;
    }
    ofs << result;
    ofs.close();

    // string command = "php ./update_detect_progress.php upload-result " + panorama_id + " " + annotation_id + " " + result;
    string command = "php ./update_detect_progress.php upload-result " + panorama_id + " " + annotation_id + " " + match_result_file_name;

    write_log("exec: " + command);
    // cout << endl << "exec: " + command << endl;
    // debugl("exec: " + command);

    system(command.c_str());
}

void convert_result_struct_to_json(Result result, string &json_str){

    json j;
    j["panorama-id"] = result.panorama_id;
    j["annotation-id"] = result.annotation_id;
    j["images"] = json::array();
    for (int i = 0; i < result.imgs.size(); i++)
    {
        CandidateInfo info = result.imgs[i];
        j["images"].push_back({
            {"index", info.index},
            {"url", info.url},
            {"theta", info.theta},
            {"phi", info.phi}
        });
    }

    // cout << "---- result ----" << endl;
    // debugl("---- result ----");
    // cout << j.dump() << endl;

    json_str = j.dump();
}

