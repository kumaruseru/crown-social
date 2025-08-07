cmake_minimum_required(VERSION 3.16)
project(CrownMediaService)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(OpenCV REQUIRED)
find_package(PkgConfig REQUIRED)
pkg_check_modules(FFMPEG REQUIRED IMPORTED_TARGET libavcodec libavformat libavutil libswscale)

# Add crow framework
include(FetchContent)
FetchContent_Declare(
  Crow
  GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
  GIT_TAG v1.0+5
)
FetchContent_MakeAvailable(Crow)

# Include directories
include_directories(${OpenCV_INCLUDE_DIRS})

# Add executable
add_executable(crown_media_service
    src/main.cpp
    src/image_processor.cpp
    src/video_processor.cpp
    src/media_optimizer.cpp
    src/thumbnail_generator.cpp
)

# Link libraries
target_link_libraries(crown_media_service 
    ${OpenCV_LIBS}
    PkgConfig::FFMPEG
    Crow::Crow
    pthread
)

# Compiler flags for optimization
target_compile_options(crown_media_service PRIVATE -O3 -march=native)
