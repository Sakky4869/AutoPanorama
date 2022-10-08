#include "path_convert.hpp"

using namespace std;

string get_application_dir(){
    // return "../";
    return "./";
}

string get_panorama_path(string panorama_id){

    return get_application_dir() + "panorama_imgs/" + panorama_id + "/origin.jpg";
}

string get_annotation_path(string annotation_id){

    return get_application_dir() + "annotation_imgs/" + annotation_id + ".jpg";
}

string get_candidate_path(string panorama_id, string annotation_id, string index_str){

    return get_application_dir() + "candidate_imgs/" + panorama_id + "/" + annotation_id + "/" + index_str + ".jpg";
}



