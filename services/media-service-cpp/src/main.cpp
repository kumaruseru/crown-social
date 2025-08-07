#include <crow.h>
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc.hpp>
#include <json/json.h>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <vector>
#include <thread>
#include <future>
#include <chrono>

#include "image_processor.h"
#include "video_processor.h"
#include "media_optimizer.h"
#include "thumbnail_generator.h"

class MediaService {
private:
    std::unique_ptr<ImageProcessor> imageProcessor;
    std::unique_ptr<VideoProcessor> videoProcessor;
    std::unique_ptr<MediaOptimizer> mediaOptimizer;
    std::unique_ptr<ThumbnailGenerator> thumbnailGenerator;

public:
    MediaService() {
        imageProcessor = std::make_unique<ImageProcessor>();
        videoProcessor = std::make_unique<VideoProcessor>();
        mediaOptimizer = std::make_unique<MediaOptimizer>();
        thumbnailGenerator = std::make_unique<ThumbnailGenerator>();
    }

    // Health check endpoint
    crow::response health() {
        Json::Value response;
        response["status"] = "healthy";
        response["service"] = "crown-media-service-cpp";
        response["timestamp"] = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()).count();
        response["opencv_version"] = CV_VERSION;
        
        Json::StreamWriterBuilder builder;
        std::string jsonString = Json::writeString(builder, response);
        
        return crow::response(200, jsonString);
    }

    // Image processing endpoint
    crow::response processImage(const crow::request& req) {
        try {
            // Parse multipart form data for file upload
            auto boundary = extractBoundary(req.get_header_value("content-type"));
            auto files = parseMultipartData(req.body, boundary);
            
            if (files.empty()) {
                return crow::response(400, "{\"error\": \"No image file provided\"}");
            }

            auto& imageData = files[0];
            
            // Process image options from query parameters
            ProcessingOptions options;
            options.width = std::stoi(req.url_params.get("width") ? req.url_params.get("width") : "0");
            options.height = std::stoi(req.url_params.get("height") ? req.url_params.get("height") : "0");
            options.quality = std::stoi(req.url_params.get("quality") ? req.url_params.get("quality") : "85");
            options.format = req.url_params.get("format") ? req.url_params.get("format") : "jpg";
            
            // Process image
            auto result = imageProcessor->processImage(imageData, options);
            
            if (result.success) {
                Json::Value response;
                response["success"] = true;
                response["processed_size"] = static_cast<int>(result.processedData.size());
                response["original_size"] = static_cast<int>(imageData.size());
                response["compression_ratio"] = static_cast<double>(result.processedData.size()) / imageData.size();
                response["processing_time_ms"] = result.processingTimeMs;
                response["dimensions"]["width"] = result.width;
                response["dimensions"]["height"] = result.height;
                
                Json::StreamWriterBuilder builder;
                std::string jsonString = Json::writeString(builder, response);
                
                auto resp = crow::response(200, jsonString);
                resp.add_header("Content-Type", "application/json");
                return resp;
            } else {
                return crow::response(500, "{\"error\": \"Image processing failed\"}");
            }
            
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, error);
            return crow::response(500, jsonString);
        }
    }

    // Video processing endpoint
    crow::response processVideo(const crow::request& req) {
        try {
            auto boundary = extractBoundary(req.get_header_value("content-type"));
            auto files = parseMultipartData(req.body, boundary);
            
            if (files.empty()) {
                return crow::response(400, "{\"error\": \"No video file provided\"}");
            }

            auto& videoData = files[0];
            
            VideoProcessingOptions options;
            options.targetWidth = std::stoi(req.url_params.get("width") ? req.url_params.get("width") : "1280");
            options.targetHeight = std::stoi(req.url_params.get("height") ? req.url_params.get("height") : "720");
            options.bitrate = std::stoi(req.url_params.get("bitrate") ? req.url_params.get("bitrate") : "2000");
            options.codec = req.url_params.get("codec") ? req.url_params.get("codec") : "h264";
            
            // Process video asynchronously
            auto future = std::async(std::launch::async, [this, videoData, options]() {
                return videoProcessor->processVideo(videoData, options);
            });
            
            // Wait for processing with timeout (30 seconds)
            auto status = future.wait_for(std::chrono::seconds(30));
            
            if (status == std::future_status::ready) {
                auto result = future.get();
                
                Json::Value response;
                response["success"] = result.success;
                response["processing_time_ms"] = result.processingTimeMs;
                response["output_size"] = static_cast<int>(result.processedData.size());
                response["compression_ratio"] = static_cast<double>(result.processedData.size()) / videoData.size();
                
                Json::StreamWriterBuilder builder;
                std::string jsonString = Json::writeString(builder, response);
                return crow::response(200, jsonString);
            } else {
                return crow::response(408, "{\"error\": \"Video processing timeout\"}");
            }
            
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, error);
            return crow::response(500, jsonString);
        }
    }

    // Thumbnail generation endpoint
    crow::response generateThumbnail(const crow::request& req) {
        try {
            auto boundary = extractBoundary(req.get_header_value("content-type"));
            auto files = parseMultipartData(req.body, boundary);
            
            if (files.empty()) {
                return crow::response(400, "{\"error\": \"No media file provided\"}");
            }

            auto& mediaData = files[0];
            
            ThumbnailOptions options;
            options.width = std::stoi(req.url_params.get("width") ? req.url_params.get("width") : "300");
            options.height = std::stoi(req.url_params.get("height") ? req.url_params.get("height") : "200");
            options.quality = std::stoi(req.url_params.get("quality") ? req.url_params.get("quality") : "85");
            
            std::string mediaType = req.url_params.get("type") ? req.url_params.get("type") : "image";
            
            auto result = thumbnailGenerator->generateThumbnail(mediaData, mediaType, options);
            
            if (result.success) {
                Json::Value response;
                response["success"] = true;
                response["thumbnail_size"] = static_cast<int>(result.thumbnailData.size());
                response["processing_time_ms"] = result.processingTimeMs;
                response["dimensions"]["width"] = result.width;
                response["dimensions"]["height"] = result.height;
                
                Json::StreamWriterBuilder builder;
                std::string jsonString = Json::writeString(builder, response);
                return crow::response(200, jsonString);
            } else {
                return crow::response(500, "{\"error\": \"Thumbnail generation failed\"}");
            }
            
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, error);
            return crow::response(500, jsonString);
        }
    }

    // Batch processing endpoint
    crow::response batchProcess(const crow::request& req) {
        try {
            // Parse JSON request body
            Json::Value requestJson;
            Json::CharReaderBuilder builder;
            std::string errs;
            std::istringstream s(req.body);
            
            if (!Json::parseFromStream(builder, s, &requestJson, &errs)) {
                return crow::response(400, "{\"error\": \"Invalid JSON\"}");
            }
            
            auto files = requestJson["files"];
            if (!files.isArray() || files.empty()) {
                return crow::response(400, "{\"error\": \"No files provided\"}");
            }
            
            std::vector<std::future<BatchResult>> futures;
            
            // Process files concurrently
            for (const auto& file : files) {
                futures.push_back(std::async(std::launch::async, [this, file]() {
                    return processSingleFile(file);
                }));
            }
            
            // Collect results
            Json::Value results(Json::arrayValue);
            for (auto& future : futures) {
                auto result = future.get();
                Json::Value resultJson;
                resultJson["file_id"] = result.fileId;
                resultJson["success"] = result.success;
                resultJson["processing_time_ms"] = result.processingTimeMs;
                resultJson["error"] = result.error;
                results.append(resultJson);
            }
            
            Json::Value response;
            response["success"] = true;
            response["processed_count"] = static_cast<int>(futures.size());
            response["results"] = results;
            
            Json::StreamWriterBuilder jsonBuilder;
            std::string jsonString = Json::writeString(jsonBuilder, response);
            return crow::response(200, jsonString);
            
        } catch (const std::exception& e) {
            Json::Value error;
            error["error"] = e.what();
            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, error);
            return crow::response(500, jsonString);
        }
    }

private:
    std::string extractBoundary(const std::string& contentType) {
        auto pos = contentType.find("boundary=");
        if (pos != std::string::npos) {
            return contentType.substr(pos + 9);
        }
        return "";
    }
    
    std::vector<std::vector<uint8_t>> parseMultipartData(const std::string& body, const std::string& boundary) {
        // Simplified multipart parsing - in production, use a proper library
        std::vector<std::vector<uint8_t>> files;
        
        // For now, return the entire body as a single file
        files.emplace_back(body.begin(), body.end());
        
        return files;
    }
    
    struct BatchResult {
        std::string fileId;
        bool success;
        int processingTimeMs;
        std::string error;
    };
    
    BatchResult processSingleFile(const Json::Value& fileInfo) {
        BatchResult result;
        result.fileId = fileInfo["id"].asString();
        
        auto start = std::chrono::high_resolution_clock::now();
        
        try {
            // Simulate file processing
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            result.success = true;
        } catch (const std::exception& e) {
            result.success = false;
            result.error = e.what();
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
        
        return result;
    }
};

int main() {
    crow::SimpleApp app;
    MediaService service;
    
    // Enable CORS
    app.get_middleware<crow::CORSHandler>().global()
        .headers("Content-Type", "Authorization")
        .methods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .origin("*");
    
    // Health check endpoint
    CROW_ROUTE(app, "/health").methods("GET"_method)
    ([&service](const crow::request& req) {
        return service.health();
    });
    
    // Image processing endpoint
    CROW_ROUTE(app, "/api/v1/process/image").methods("POST"_method)
    ([&service](const crow::request& req) {
        return service.processImage(req);
    });
    
    // Video processing endpoint
    CROW_ROUTE(app, "/api/v1/process/video").methods("POST"_method)
    ([&service](const crow::request& req) {
        return service.processVideo(req);
    });
    
    // Thumbnail generation endpoint
    CROW_ROUTE(app, "/api/v1/generate/thumbnail").methods("POST"_method)
    ([&service](const crow::request& req) {
        return service.generateThumbnail(req);
    });
    
    // Batch processing endpoint
    CROW_ROUTE(app, "/api/v1/batch/process").methods("POST"_method)
    ([&service](const crow::request& req) {
        return service.batchProcess(req);
    });
    
    // Get port from environment or use default
    const char* portEnv = std::getenv("MEDIA_SERVICE_PORT");
    int port = portEnv ? std::stoi(portEnv) : 3003;
    
    std::cout << "🎬 Crown Media Service (C++) starting on port " << port << std::endl;
    
    app.port(port).multithreaded().run();
    
    return 0;
}
