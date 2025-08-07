#include "thumbnail_generator.h"
#include "image_processor.h"
#include <opencv2/opencv.hpp>
#include <chrono>
#include <iostream>
#include <filesystem>
#include <fstream>
#include <random>
#include <sstream>

ThumbnailGenerator::ThumbnailGenerator() {
    std::cout << "🖼️  Thumbnail Generator initialized" << std::endl;
}

ThumbnailGenerator::~ThumbnailGenerator() {
    // Cleanup if needed
}

std::vector<uint8_t> ThumbnailGenerator::generateImageThumbnail(const std::vector<uint8_t>& imageData, 
                                                              const ThumbnailOptions& options) {
    ImageProcessor processor;
    ProcessingOptions procOptions;
    procOptions.width = options.width;
    procOptions.height = options.height;
    procOptions.quality = options.quality;
    procOptions.format = options.format;
    procOptions.maintainAspectRatio = options.maintainAspectRatio;
    
    auto result = processor.processImage(imageData, procOptions);
    
    if (result.success) {
        return result.processedData;
    }
    
    return {};
}

std::vector<uint8_t> ThumbnailGenerator::generateVideoThumbnail(const std::vector<uint8_t>& videoData, 
                                                              const ThumbnailOptions& options) {
    try {
        // Create temporary files
        static std::random_device rd;
        static std::mt19937 gen(rd());
        static std::uniform_int_distribution<> dis(100000, 999999);
        
        std::string tempDir = std::filesystem::temp_directory_path().string();
        std::string inputFile = tempDir + "/temp_video_" + std::to_string(dis(gen)) + ".mp4";
        std::string outputFile = tempDir + "/temp_thumb_" + std::to_string(dis(gen)) + ".jpg";
        
        // Write video data to temporary file
        std::ofstream file(inputFile, std::ios::binary);
        if (!file) {
            return {};
        }
        file.write(reinterpret_cast<const char*>(videoData.data()), videoData.size());
        file.close();
        
        // Generate thumbnail using FFmpeg
        std::ostringstream cmd;
        cmd << "ffmpeg -y -ss " << options.timeOffsetSeconds << " -i \"" << inputFile 
            << "\" -vframes 1 -s " << options.width << "x" << options.height 
            << " -q:v 2 \"" << outputFile << "\" 2>&1";
        
        bool success = false;
        #ifdef _WIN32
        success = (system(cmd.str().c_str()) == 0);
        #else
        int result = system(cmd.str().c_str());
        success = (WEXITSTATUS(result) == 0);
        #endif
        
        std::vector<uint8_t> thumbnailData;
        
        if (success && std::filesystem::exists(outputFile)) {
            // Read generated thumbnail
            std::ifstream thumbFile(outputFile, std::ios::binary);
            if (thumbFile) {
                thumbFile.seekg(0, std::ios::end);
                size_t size = thumbFile.tellg();
                thumbFile.seekg(0, std::ios::beg);
                
                thumbnailData.resize(size);
                thumbFile.read(reinterpret_cast<char*>(thumbnailData.data()), size);
            }
        }
        
        // Cleanup temporary files
        std::filesystem::remove(inputFile);
        std::filesystem::remove(outputFile);
        
        return thumbnailData;
        
    } catch (const std::exception& e) {
        std::cerr << "Error generating video thumbnail: " << e.what() << std::endl;
        return {};
    }
}

std::vector<uint8_t> ThumbnailGenerator::generateDocumentThumbnail(const std::vector<uint8_t>& docData,
                                                                  const ThumbnailOptions& options) {
    // For document thumbnails, create a simple placeholder image
    // In a real implementation, you'd use libraries like ImageMagick or Ghostscript
    
    cv::Mat thumbnail(options.height, options.width, CV_8UC3, cv::Scalar(240, 240, 240));
    
    // Add document icon or text
    cv::putText(thumbnail, "DOC", cv::Point(options.width/4, options.height/2), 
                cv::FONT_HERSHEY_SIMPLEX, 2, cv::Scalar(100, 100, 100), 3);
    
    std::vector<uint8_t> buffer;
    std::vector<int> params = {cv::IMWRITE_JPEG_QUALITY, options.quality};
    cv::imencode(".jpg", thumbnail, buffer, params);
    
    return buffer;
}

ThumbnailResult ThumbnailGenerator::generateThumbnail(const std::vector<uint8_t>& mediaData, 
                                                    const std::string& mediaType,
                                                    const ThumbnailOptions& options) {
    ThumbnailResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        if (mediaType == "image") {
            result.thumbnailData = generateImageThumbnail(mediaData, options);
        } else if (mediaType == "video") {
            result.thumbnailData = generateVideoThumbnail(mediaData, options);
        } else if (mediaType == "document") {
            result.thumbnailData = generateDocumentThumbnail(mediaData, options);
        } else {
            result.error = "Unsupported media type: " + mediaType;
            return result;
        }
        
        if (!result.thumbnailData.empty()) {
            result.success = true;
            result.width = options.width;
            result.height = options.height;
        } else {
            result.error = "Failed to generate thumbnail";
        }
        
    } catch (const std::exception& e) {
        result.error = "Thumbnail generation error: " + std::string(e.what());
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

std::vector<ThumbnailResult> ThumbnailGenerator::generateMultipleSizes(const std::vector<uint8_t>& mediaData,
                                                                      const std::string& mediaType,
                                                                      const std::vector<std::pair<int, int>>& sizes) {
    std::vector<ThumbnailResult> results;
    
    for (const auto& size : sizes) {
        ThumbnailOptions sizeOptions;
        sizeOptions.width = size.first;
        sizeOptions.height = size.second;
        sizeOptions.quality = 85;
        sizeOptions.format = "jpg";
        
        results.push_back(generateThumbnail(mediaData, mediaType, sizeOptions));
    }
    
    return results;
}

ThumbnailResult ThumbnailGenerator::generateContactSheet(const std::vector<uint8_t>& videoData,
                                                       int gridWidth, int gridHeight,
                                                       const ThumbnailOptions& options) {
    ThumbnailResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        int totalFrames = gridWidth * gridHeight;
        int frameWidth = options.width / gridWidth;
        int frameHeight = options.height / gridHeight;
        
        // Create contact sheet canvas
        cv::Mat contactSheet(options.height, options.width, CV_8UC3, cv::Scalar(255, 255, 255));
        
        // Generate thumbnails at different time offsets
        for (int i = 0; i < totalFrames; ++i) {
            ThumbnailOptions frameOptions = options;
            frameOptions.width = frameWidth;
            frameOptions.height = frameHeight;
            frameOptions.timeOffsetSeconds = i * 10; // Every 10 seconds
            
            auto frameThumb = generateVideoThumbnail(videoData, frameOptions);
            
            if (!frameThumb.empty()) {
                // Decode thumbnail and place in contact sheet
                cv::Mat frameMat = cv::imdecode(frameThumb, cv::IMREAD_COLOR);
                
                if (!frameMat.empty()) {
                    int row = i / gridWidth;
                    int col = i % gridWidth;
                    
                    cv::Rect roi(col * frameWidth, row * frameHeight, frameWidth, frameHeight);
                    
                    // Resize frame to fit grid cell
                    cv::Mat resizedFrame;
                    cv::resize(frameMat, resizedFrame, cv::Size(frameWidth, frameHeight));
                    
                    resizedFrame.copyTo(contactSheet(roi));
                }
            }
        }
        
        // Encode final contact sheet
        std::vector<uint8_t> buffer;
        std::vector<int> params = {cv::IMWRITE_JPEG_QUALITY, options.quality};
        cv::imencode(".jpg", contactSheet, buffer, params);
        
        result.thumbnailData = buffer;
        result.success = !buffer.empty();
        result.width = options.width;
        result.height = options.height;
        
    } catch (const std::exception& e) {
        result.error = "Contact sheet generation error: " + std::string(e.what());
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}
