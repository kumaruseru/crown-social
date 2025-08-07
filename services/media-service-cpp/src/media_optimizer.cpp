#include "media_optimizer.h"
#include "image_processor.h"
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc.hpp>
#include <chrono>
#include <iostream>
#include <algorithm>
#include <cmath>

MediaOptimizer::MediaOptimizer() {
    std::cout << "⚡ Media Optimizer initialized" << std::endl;
}

MediaOptimizer::~MediaOptimizer() {
    // Cleanup if needed
}

std::vector<uint8_t> MediaOptimizer::optimizeImage(const std::vector<uint8_t>& imageData, 
                                                  const OptimizationOptions& options) {
    try {
        // Decode image
        cv::Mat image = cv::imdecode(imageData, cv::IMREAD_COLOR);
        if (image.empty()) {
            return {};
        }
        
        cv::Mat optimized = image.clone();
        
        // Resize if needed
        if (shouldResizeImage(image.cols, image.rows, options)) {
            auto newSize = calculateOptimalSize(image.cols, image.rows, options);
            cv::resize(optimized, optimized, cv::Size(newSize.first, newSize.second), 0, 0, cv::INTER_LANCZOS4);
        }
        
        // Choose optimal format and compression
        std::vector<uint8_t> result;
        
        if (options.enableWebP) {
            result = convertToWebP(imageData, options.targetQuality);
            if (!result.empty()) {
                return result;
            }
        }
        
        // Fallback to JPEG/PNG optimization
        std::vector<int> params;
        std::string ext = ".jpg";
        
        if (options.enableLossless || image.channels() == 4) {
            // Use PNG for lossless or images with alpha
            ext = ".png";
            int compression = (100 - options.targetQuality) / 11; // Convert quality to PNG compression
            params = {cv::IMWRITE_PNG_COMPRESSION, compression};
        } else {
            // Use JPEG
            params = {cv::IMWRITE_JPEG_QUALITY, options.targetQuality};
            if (options.enableProgressive) {
                params.push_back(cv::IMWRITE_JPEG_PROGRESSIVE);
                params.push_back(1);
            }
        }
        
        cv::imencode(ext, optimized, result, params);
        
        // Check if result meets size constraints
        if (options.maxFileSizeKB > 0 && result.size() > options.maxFileSizeKB * 1024) {
            // Reduce quality until size constraint is met
            int quality = options.targetQuality;
            while (quality > 10 && result.size() > options.maxFileSizeKB * 1024) {
                quality -= 10;
                params[1] = quality;
                cv::imencode(ext, optimized, result, params);
            }
        }
        
        return result;
        
    } catch (const std::exception& e) {
        std::cerr << "Image optimization error: " << e.what() << std::endl;
        return {};
    }
}

std::vector<uint8_t> MediaOptimizer::optimizeVideo(const std::vector<uint8_t>& videoData, 
                                                  const OptimizationOptions& options) {
    // Video optimization would require FFmpeg integration
    // For now, return original data (placeholder implementation)
    
    if (options.maxFileSizeKB > 0 && videoData.size() > options.maxFileSizeKB * 1024) {
        // In a real implementation, this would re-encode the video with lower bitrate
        // For now, just return original
    }
    
    return videoData;
}

std::vector<uint8_t> MediaOptimizer::convertToWebP(const std::vector<uint8_t>& imageData, int quality) {
    try {
        cv::Mat image = cv::imdecode(imageData, cv::IMREAD_COLOR);
        if (image.empty()) {
            return {};
        }
        
        std::vector<uint8_t> result;
        std::vector<int> params = {cv::IMWRITE_WEBP_QUALITY, quality};
        
        if (cv::imencode(".webp", image, result, params)) {
            return result;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "WebP conversion error: " << e.what() << std::endl;
    }
    
    return {};
}

std::vector<uint8_t> MediaOptimizer::compressJPEG(const std::vector<uint8_t>& imageData, int quality, bool progressive) {
    try {
        cv::Mat image = cv::imdecode(imageData, cv::IMREAD_COLOR);
        if (image.empty()) {
            return {};
        }
        
        std::vector<uint8_t> result;
        std::vector<int> params = {cv::IMWRITE_JPEG_QUALITY, quality};
        
        if (progressive) {
            params.push_back(cv::IMWRITE_JPEG_PROGRESSIVE);
            params.push_back(1);
        }
        
        cv::imencode(".jpg", image, result, params);
        return result;
        
    } catch (const std::exception& e) {
        std::cerr << "JPEG compression error: " << e.what() << std::endl;
        return {};
    }
}

std::vector<uint8_t> MediaOptimizer::optimizePNG(const std::vector<uint8_t>& imageData, bool lossless) {
    try {
        cv::Mat image = cv::imdecode(imageData, cv::IMREAD_UNCHANGED); // Preserve alpha channel
        if (image.empty()) {
            return {};
        }
        
        std::vector<uint8_t> result;
        int compression = lossless ? 9 : 6; // Max compression for lossless, balanced for lossy
        std::vector<int> params = {cv::IMWRITE_PNG_COMPRESSION, compression};
        
        cv::imencode(".png", image, result, params);
        return result;
        
    } catch (const std::exception& e) {
        std::cerr << "PNG optimization error: " << e.what() << std::endl;
        return {};
    }
}

bool MediaOptimizer::shouldResizeImage(int width, int height, const OptimizationOptions& options) {
    if (options.maxWidth <= 0 && options.maxHeight <= 0) {
        return false;
    }
    
    return (options.maxWidth > 0 && width > options.maxWidth) || 
           (options.maxHeight > 0 && height > options.maxHeight);
}

std::pair<int, int> MediaOptimizer::calculateOptimalSize(int originalWidth, int originalHeight, 
                                                       const OptimizationOptions& options) {
    if (!shouldResizeImage(originalWidth, originalHeight, options)) {
        return {originalWidth, originalHeight};
    }
    
    double aspectRatio = static_cast<double>(originalWidth) / originalHeight;
    int newWidth = originalWidth;
    int newHeight = originalHeight;
    
    if (options.maxWidth > 0 && originalWidth > options.maxWidth) {
        newWidth = options.maxWidth;
        newHeight = static_cast<int>(newWidth / aspectRatio);
    }
    
    if (options.maxHeight > 0 && newHeight > options.maxHeight) {
        newHeight = options.maxHeight;
        newWidth = static_cast<int>(newHeight * aspectRatio);
    }
    
    return {newWidth, newHeight};
}

OptimizationResult MediaOptimizer::optimize(const std::vector<uint8_t>& mediaData, 
                                          const std::string& mediaType,
                                          const OptimizationOptions& options) {
    OptimizationResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        result.originalSize = static_cast<int>(mediaData.size());
        
        if (mediaType == "image") {
            result.optimizedData = optimizeImage(mediaData, options);
            result.outputFormat = options.enableWebP ? "webp" : (options.enableLossless ? "png" : "jpg");
        } else if (mediaType == "video") {
            result.optimizedData = optimizeVideo(mediaData, options);
            result.outputFormat = "mp4";
        } else {
            result.error = "Unsupported media type: " + mediaType;
            return result;
        }
        
        if (!result.optimizedData.empty()) {
            result.success = true;
            result.optimizedSize = static_cast<int>(result.optimizedData.size());
            result.compressionRatio = static_cast<double>(result.optimizedSize) / result.originalSize;
            
            // Get dimensions if image
            if (mediaType == "image") {
                cv::Mat original = cv::imdecode(mediaData, cv::IMREAD_COLOR);
                cv::Mat optimized = cv::imdecode(result.optimizedData, cv::IMREAD_COLOR);
                
                if (!original.empty()) {
                    result.originalWidth = original.cols;
                    result.originalHeight = original.rows;
                }
                
                if (!optimized.empty()) {
                    result.optimizedWidth = optimized.cols;
                    result.optimizedHeight = optimized.rows;
                }
            }
        } else {
            result.error = "Optimization failed";
        }
        
    } catch (const std::exception& e) {
        result.error = "Optimization error: " + std::string(e.what());
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

std::vector<OptimizationResult> MediaOptimizer::optimizeBatch(const std::vector<std::vector<uint8_t>>& mediaFiles,
                                                             const std::vector<std::string>& mediaTypes,
                                                             const OptimizationOptions& options) {
    std::vector<OptimizationResult> results;
    
    for (size_t i = 0; i < mediaFiles.size() && i < mediaTypes.size(); ++i) {
        results.push_back(optimize(mediaFiles[i], mediaTypes[i], options));
    }
    
    return results;
}

MediaAnalysis MediaOptimizer::analyzeMedia(const std::vector<uint8_t>& mediaData) {
    MediaAnalysis analysis;
    
    try {
        // Try to decode as image first
        cv::Mat image = cv::imdecode(mediaData, cv::IMREAD_UNCHANGED);
        
        if (!image.empty()) {
            analysis.mediaType = "image";
            analysis.width = image.cols;
            analysis.height = image.rows;
            analysis.fileSize = static_cast<int>(mediaData.size());
            analysis.hasAlpha = (image.channels() == 4);
            analysis.colorDepth = image.depth() == CV_8U ? 8 : 16;
            analysis.aspectRatio = static_cast<double>(image.cols) / image.rows;
            
            // Determine format from magic bytes
            if (mediaData.size() >= 4) {
                if (mediaData[0] == 0xFF && mediaData[1] == 0xD8) {
                    analysis.format = "JPEG";
                } else if (mediaData[0] == 0x89 && mediaData[1] == 0x50 && 
                          mediaData[2] == 0x4E && mediaData[3] == 0x47) {
                    analysis.format = "PNG";
                } else if (mediaData.size() >= 12 && 
                          std::string(mediaData.begin() + 8, mediaData.begin() + 12) == "WEBP") {
                    analysis.format = "WebP";
                }
            }
        } else {
            // Check if it's a video file
            if (mediaData.size() >= 8) {
                std::string header(mediaData.begin(), mediaData.begin() + 8);
                if (header.find("ftyp") != std::string::npos) {
                    analysis.mediaType = "video";
                    analysis.format = "MP4";
                }
            }
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Media analysis error: " << e.what() << std::endl;
    }
    
    return analysis;
}

OptimizationResult MediaOptimizer::smartOptimize(const std::vector<uint8_t>& mediaData,
                                                const std::string& targetUse) {
    OptimizationOptions options;
    
    // Analyze media first
    auto analysis = analyzeMedia(mediaData);
    
    // Set optimization parameters based on target use
    if (targetUse == "web") {
        options.enableWebP = true;
        options.targetQuality = 85;
        options.maxWidth = 1920;
        options.maxHeight = 1080;
        options.maxFileSizeKB = 500; // 500KB max for web
        options.enableProgressive = true;
    } else if (targetUse == "mobile") {
        options.enableWebP = true;
        options.targetQuality = 75;
        options.maxWidth = 1080;
        options.maxHeight = 720;
        options.maxFileSizeKB = 200; // 200KB max for mobile
        options.enableProgressive = false;
    } else if (targetUse == "print") {
        options.enableLossless = true;
        options.targetQuality = 95;
        options.maxFileSizeKB = 0; // No size limit for print
        options.enableProgressive = false;
    }
    
    // Adjust based on image characteristics
    if (analysis.hasAlpha) {
        options.enableWebP = true; // WebP handles alpha better than JPEG
        options.enableLossless = true;
    }
    
    if (analysis.fileSize < 50 * 1024) { // Small files (< 50KB)
        options.targetQuality = std::min(options.targetQuality + 10, 95);
    }
    
    return optimize(mediaData, analysis.mediaType, options);
}

std::vector<OptimizationResult> MediaOptimizer::generateProgressive(const std::vector<uint8_t>& mediaData,
                                                                   const std::vector<int>& qualityLevels) {
    std::vector<OptimizationResult> results;
    
    auto analysis = analyzeMedia(mediaData);
    
    for (int quality : qualityLevels) {
        OptimizationOptions options;
        options.targetQuality = quality;
        options.enableProgressive = true;
        
        results.push_back(optimize(mediaData, analysis.mediaType, options));
    }
    
    return results;
}
