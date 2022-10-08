#include "common.hpp"

using namespace std;


void write_log(string data){

    string cmd = "python3 logs/write_log.py ./image_process " + data;

    system(cmd.c_str());
}
