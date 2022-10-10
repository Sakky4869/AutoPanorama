#include "common.hpp"

using namespace std;


void write_log(string data){

    ofstream ofs("./logs/image_process_log.txt", ios::app);

    time_t now = time(NULL);
    tm *pnow = localtime(&now);
    string timedate = to_string(pnow->tm_year + 1900) + "/" + to_string(pnow->tm_mon + 1) + "/" + to_string(pnow->tm_mday) + " " + to_string(pnow->tm_hour) + ":" + to_string(pnow->tm_min) + ":" + to_string(pnow->tm_sec) + " ";

    ofs << timedate.c_str() << data.c_str() << endl;

    ofs.close();

    // string cmd = "python3 ./logs/write_log.py ./image_process " + data;

    // system(cmd.c_str());
}

void write_log_opencv(string data){
    write_log("OpenCVエラー " + data);
}
