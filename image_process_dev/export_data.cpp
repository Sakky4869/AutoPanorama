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
        write_log("ファイル　" + match_result_file_name + "が開けませんでした");
        // cout << "ファイル: " << match_result_file_name << " を開けませんでした" << endl;
        return;
    }
    ofs << result;
    ofs.close();

    chmod(match_result_file_name.c_str(),
        S_IRUSR | S_IWUSR |
        S_IRGRP | S_IWGRP |
        S_IROTH | S_IWOTH
    );


    write_log("ファイル " + match_result_file_name + " に書き込み権限を与えた");

    // string command = "php ./update_detect_progress.php upload-result " + panorama_id + " " + annotation_id + " " + result;
    string command = "php ./update_detect_progress.php upload-result " + panorama_id + " " + annotation_id + " " + match_result_file_name;

    write_log("exec: " + command);
    // cout << endl << "exec: " + command << endl;
    // debugl("exec: " + command);

    system(command.c_str());
}

void send_region_datas(string panorama_id){

    string commnad = "php ./update_detect_progress.php upload-regions " + panorama_id;

    system(commnad.c_str());
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

    write_log("JSON形式に変換");

    json_str = j.dump();
}

