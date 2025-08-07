#include "image_processor.h"
#include <opencv2/imgproc.hpp>
#include <opencv2/imgcodecs.hpp>
#include <chrono>
#include <algorithm>
#include <iostream>

ImageProcessor::ImageProcessor() {
    // Initialize OpenCV
    std::cout << "🖼️  Image Processor initialized with OpenCV " << CV_VERSION << std::endl;
}

ImageProcessor::~ImageProcessor() {
    // Cleanup if needed
}

cv::Mat ImageProcessor::loadImageFromBuffer(const std::vector<uint8_t>& buffer) {
    return cv::imdecode(buffer, cv::IMREAD_COLOR);
}

std::vector<uint8_t> ImageProcessor::encodeImage(const cv::Mat& image, const std::string& format, int quality) {
    std::vector<uint8_t> buffer;
    std::vector<int> params;
    
    std::string ext = "." + format;
    std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);
    
    if (ext == ".jpg" || ext == ".jpeg") {
        params = {cv::IMWRITE_JPEG_QUALITY, quality};
    } else if (ext == ".png") {
        // PNG compression level (0-9)
        int compression = (100 - quality) / 11; // Convert quality to compression level
        params = {cv::IMWRITE_PNG_COMPRESSION, compression};
    } else if (ext == ".webp") {
        params = {cv::IMWRITE_WEBP_QUALITY, quality};
    }
    
    cv::imencode(ext, image, buffer, params);
    return buffer;
}

cv::Mat ImageProcessor::resizeImage(const cv::Mat& image, int targetWidth, int targetHeight, bool maintainAspectRatio) {
    if (targetWidth <= 0 && targetHeight <= 0) {
        return image.clone();
    }
    
    cv::Size originalSize = image.size();
    cv::Size targetSize;
    
    if (maintainAspectRatio) {
        double aspectRatio = static_cast<double>(originalSize.width) / originalSize.height;
        
        if (targetWidth > 0 && targetHeight > 0) {
            // Both dimensions specified - choose the smaller scaling factor
            double scaleW = static_cast<double>(targetWidth) / originalSize.width;
            double scaleH = static_cast<double>(targetHeight) / originalSize.height;
            double scale = std::min(scaleW, scaleH);
            
            targetSize.width = static_cast<int>(originalSize.width * scale);
            targetSize.height = static_cast<int>(originalSize.height * scale);
        } else if (targetWidth > 0) {
            // Only width specified
            targetSize.width = targetWidth;
            targetSize.height = static_cast<int>(targetWidth / aspectRatio);
        } else {
            // Only height specified
            targetSize.height = targetHeight;
            targetSize.width = static_cast<int>(targetHeight * aspectRatio);
        }
    } else {
        targetSize.width = targetWidth > 0 ? targetWidth : originalSize.width;
        targetSize.height = targetHeight > 0 ? targetHeight : originalSize.height;
    }
    
    cv::Mat resized;
    cv::resize(image, resized, targetSize, 0, 0, cv::INTER_LANCZOS4);
    return resized;
}

cv::Mat ImageProcessor::enhanceImage(const cv::Mat& image) {
    cv::Mat enhanced = image.clone();
    
    // Apply histogram equalization for better contrast
    if (image.channels() == 1) {
        cv::equalizeHist(enhanced, enhanced);
    } else {
        // Convert to LAB color space for better histogram equalization
        cv::Mat lab;
        cv::cvtColor(enhanced, lab, cv::COLOR_BGR2Lab);
        
        std::vector<cv::Mat> labChannels;
        cv::split(lab, labChannels);
        
        // Apply histogram equalization to L channel
        cv::equalizeHist(labChannels[0], labChannels[0]);
        
        cv::merge(labChannels, lab);
        cv::cvtColor(lab, enhanced, cv::COLOR_Lab2BGR);
    }
    
    // Apply slight gaussian blur to reduce noise
    cv::Mat blurred;
    cv::GaussianBlur(enhanced, blurred, cv::Size(3, 3), 0.5);
    
    // Blend original with blurred for subtle enhancement
    cv::addWeighted(enhanced, 0.8, blurred, 0.2, 0, enhanced);
    
    return enhanced;
}

ProcessingResult ImageProcessor::processImage(const std::vector<uint8_t>& imageData, const ProcessingOptions& options) {
    ProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        // Load image from buffer
        cv::Mat image = loadImageFromBuffer(imageData);
        
        if (image.empty()) {
            result.error = "Failed to decode image data";
            return result;
        }
        
        cv::Mat processed = image.clone();
        
        // Apply auto enhancement if requested
        if (options.autoEnhance) {
            processed = enhanceImage(processed);
        }
        
        // Resize image if dimensions specified
        if (options.width > 0 || options.height > 0) {
            processed = resizeImage(processed, options.width, options.height, options.maintainAspectRatio);
        }
        
        // Encode processed image
        result.processedData = encodeImage(processed, options.format, options.quality);
        result.width = processed.cols;
        result.height = processed.rows;
        result.success = true;
        
    } catch (const cv::Exception& e) {
        result.error = "OpenCV error: " + std::string(e.what());
        result.success = false;
    } catch (const std::exception& e) {
        result.error = "Processing error: " + std::string(e.what());
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

ProcessingResult ImageProcessor::cropImage(const std::vector<uint8_t>& imageData, int x, int y, int width, int height) {
    ProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        cv::Mat image = loadImageFromBuffer(imageData);
        
        if (image.empty()) {
            result.error = "Failed to decode image data";
            return result;
        }
        
        // Validate crop rectangle
        cv::Rect cropRect(x, y, width, height);
        cv::Rect imageRect(0, 0, image.cols, image.rows);
        cv::Rect validCrop = cropRect & imageRect;
        
        if (validCrop.area() == 0) {
            result.error = "Invalid crop rectangle";
            return result;
        }
        
        cv::Mat cropped = image(validCrop);
        
        result.processedData = encodeImage(cropped, "jpg", 85);
        result.width = cropped.cols;
        result.height = cropped.rows;
        result.success = true;
        
    } catch (const std::exception& e) {
        result.error = e.what();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

ProcessingResult ImageProcessor::rotateImage(const std::vector<uint8_t>& imageData, double angle) {
    ProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        cv::Mat image = loadImageFromBuffer(imageData);
        
        if (image.empty()) {
            result.error = "Failed to decode image data";
            return result;
        }
        
        cv::Point2f center(image.cols / 2.0, image.rows / 2.0);
        cv::Mat rotationMatrix = cv::getRotationMatrix2D(center, angle, 1.0);
        
        cv::Mat rotated;
        cv::warpAffine(image, rotated, rotationMatrix, image.size());
        
        result.processedData = encodeImage(rotated, "jpg", 85);
        result.width = rotated.cols;
        result.height = rotated.rows;
        result.success = true;
        
    } catch (const std::exception& e) {
        result.error = e.what();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

ProcessingResult ImageProcessor::applyFilter(const std::vector<uint8_t>& imageData, const std::string& filterType) {
    ProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        cv::Mat image = loadImageFromBuffer(imageData);
        
        if (image.empty()) {
            result.error = "Failed to decode image data";
            return result;
        }
        
        cv::Mat filtered = image.clone();
        
        if (filterType == "blur") {
            cv::GaussianBlur(image, filtered, cv::Size(15, 15), 0);
        } else if (filterType == "sharpen") {
            cv::Mat kernel = (cv::Mat_<float>(3, 3) << 0, -1, 0, -1, 5, -1, 0, -1, 0);
            cv::filter2D(image, filtered, -1, kernel);
        } else if (filterType == "edge") {
            cv::Mat gray;
            cv::cvtColor(image, gray, cv::COLOR_BGR2GRAY);
            cv::Canny(gray, gray, 100, 200);
            cv::cvtColor(gray, filtered, cv::COLOR_GRAY2BGR);
        } else if (filterType == "emboss") {
            cv::Mat kernel = (cv::Mat_<float>(3, 3) << -2, -1, 0, -1, 1, 1, 0, 1, 2);
            cv::filter2D(image, filtered, -1, kernel);
            cv::add(filtered, cv::Scalar(128, 128, 128), filtered);
        } else if (filterType == "sepia") {
            cv::Mat kernel = (cv::Mat_<float>(4, 4) << 
                0.272, 0.534, 0.131, 0,
                0.349, 0.686, 0.168, 0,
                0.393, 0.769, 0.189, 0,
                0, 0, 0, 1);
            cv::transform(image, filtered, kernel);
        }
        
        result.processedData = encodeImage(filtered, "jpg", 85);
        result.width = filtered.cols;
        result.height = filtered.rows;
        result.success = true;
        
    } catch (const std::exception& e) {
        result.error = e.what();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

ProcessingResult ImageProcessor::adjustBrightness(const std::vector<uint8_t>& imageData, double brightness, double contrast) {
    ProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        cv::Mat image = loadImageFromBuffer(imageData);
        
        if (image.empty()) {
            result.error = "Failed to decode image data";
            return result;
        }
        
        cv::Mat adjusted;
        image.convertTo(adjusted, -1, contrast, brightness);
        
        result.processedData = encodeImage(adjusted, "jpg", 85);
        result.width = adjusted.cols;
        result.height = adjusted.rows;
        result.success = true;
        
    } catch (const std::exception& e) {
        result.error = e.what();
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

std::vector<ProcessingResult> ImageProcessor::processBatch(const std::vector<std::vector<uint8_t>>& images, 
                                                         const ProcessingOptions& options) {
    std::vector<ProcessingResult> results;
    results.reserve(images.size());
    
    for (const auto& imageData : images) {
        results.push_back(processImage(imageData, options));
    }
    
    return results;
}
