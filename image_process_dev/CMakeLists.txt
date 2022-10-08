# set(CMAKE_VERBOSE_MAKEFILE 1)
cmake_minimum_required(VERSION 3.16.3)
project(image_process)

set(CMAKE_CXX_FLAGS "-g")

if(UNIX)
    set(CMAKE_C_COMPILER "/usr/local/bin/gcc")
    set(CMAKE_CXX_COMPILER "/usr/local/bin/g++")
    set(OpenCV_DIR "/usr/local/lib64/cmake/opencv4")
    set(JSON_DIR "./nlohmann_json")
endif()

# 画像ファイル関係を，ビルドディレクトリにコピー
# file(COPY ${CMAKE_SOURCE_DIR}/imgs/ DESTINATION ${PROJECT_BINARY_DIR}/imgs/)
# add_definitions(-DRESOURCE_DIR="${PROJECT_BINARY_DIR}/imgs/")

add_executable(image_process
    main.cpp
    # display.cpp
    convert_pano_to_cube.cpp
    convert_position.cpp
    debug_util.cpp
    detect_object_position.cpp
    export_data.cpp
    path_convert.cpp
    preprocess.cpp

)

find_package(OpenCV REQUIRED)

if(OpenCV_FOUND)
    target_include_directories(image_process PUBLIC ${OpenCV_INCLUDE_DIRS})
    target_link_libraries(image_process ${OpenCV_LIBS})
endif()

target_include_directories(image_process PUBLIC ${JSON_DIR})
