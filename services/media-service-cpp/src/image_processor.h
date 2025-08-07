#pragma once
#include <opencv2/opencv.hpp>
#include <vector>
#include <string>

struct ProcessingOptions {
    int width = 0;      // 0 means keep original
    int height = 0;     // 0 means keep original
    int quality = 85;   // JPEG quality (1-100)
    std::string format = "jpg"; // jpg, png, webp
    bool maintainAspectRatio = true;
    bool autoEnhance = false;
    bool removeMetadata = true;
};

struct ProcessingResult {
    bool success = false;
    std::vector<uint8_t> processedData;
    int width = 0;
    int height = 0;
    int processingTimeMs = 0;
    std::string error;
};

class ImageProcessor {
private:
    cv::Mat loadImageFromBuffer(const std::vector<uint8_t>& buffer);
    std::vector<uint8_t> encodeImage(const cv::Mat& image, const std::string& format, int quality);
    cv::Mat resizeImage(const cv::Mat& image, int targetWidth, int targetHeight, bool maintainAspectRatio);
    cv::Mat enhanceImage(const cv::Mat& image);
    
public:
    ImageProcessor();
    ~ImageProcessor();
    
    ProcessingResult processImage(const std::vector<uint8_t>& imageData, const ProcessingOptions& options);
    ProcessingResult cropImage(const std::vector<uint8_t>& imageData, int x, int y, int width, int height);
    ProcessingResult rotateImage(const std::vector<uint8_t>& imageData, double angle);
    ProcessingResult applyFilter(const std::vector<uint8_t>& imageData, const std::string& filterType);
    ProcessingResult adjustBrightness(const std::vector<uint8_t>& imageData, double brightness, double contrast);
    
    // Batch processing
    std::vector<ProcessingResult> processBatch(const std::vector<std::vector<uint8_t>>& images, 
                                             const ProcessingOptions& options);
};
