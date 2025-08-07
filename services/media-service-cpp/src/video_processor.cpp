#include "video_processor.h"
#include <chrono>
#include <iostream>
#include <fstream>
#include <filesystem>
#include <random>
#include <sstream>
#include <cstdlib>

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#include <sys/wait.h>
#endif

VideoProcessor::VideoProcessor() {
    // Create temporary directory for video processing
    #ifdef _WIN32
    tempDir = std::filesystem::temp_directory_path().string() + "\\crown_video_processing";
    #else
    tempDir = std::filesystem::temp_directory_path().string() + "/crown_video_processing";
    #endif
    
    std::filesystem::create_directories(tempDir);
    std::cout << "🎬 Video Processor initialized with temp dir: " << tempDir << std::endl;
}

VideoProcessor::~VideoProcessor() {
    // Clean up temporary directory
    try {
        std::filesystem::remove_all(tempDir);
    } catch (const std::exception& e) {
        std::cerr << "Failed to clean up temp directory: " << e.what() << std::endl;
    }
}

std::string VideoProcessor::createTempFile(const std::string& extension) {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(100000, 999999);
    
    std::string filename = "temp_" + std::to_string(dis(gen)) + "." + extension;
    #ifdef _WIN32
    return tempDir + "\\" + filename;
    #else
    return tempDir + "/" + filename;
    #endif
}

bool VideoProcessor::writeBinaryFile(const std::string& filename, const std::vector<uint8_t>& data) {
    std::ofstream file(filename, std::ios::binary);
    if (!file) {
        return false;
    }
    
    file.write(reinterpret_cast<const char*>(data.data()), data.size());
    return file.good();
}

std::vector<uint8_t> VideoProcessor::readBinaryFile(const std::string& filename) {
    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        return {};
    }
    
    file.seekg(0, std::ios::end);
    size_t size = file.tellg();
    file.seekg(0, std::ios::beg);
    
    std::vector<uint8_t> buffer(size);
    file.read(reinterpret_cast<char*>(buffer.data()), size);
    
    return buffer;
}

std::string VideoProcessor::buildFFmpegCommand(const std::string& input, const std::string& output, 
                                             const VideoProcessingOptions& options) {
    std::ostringstream cmd;
    
    // Basic FFmpeg command
    cmd << "ffmpeg -y -i \"" << input << "\"";
    
    // Video codec settings
    if (options.codec == "h264") {
        cmd << " -c:v libx264 -preset medium";
    } else if (options.codec == "h265") {
        cmd << " -c:v libx265 -preset medium";
    } else if (options.codec == "vp9") {
        cmd << " -c:v libvpx-vp9";
    }
    
    // Video quality settings
    cmd << " -b:v " << options.bitrate << "k";
    cmd << " -r " << options.framerate;
    
    // Resolution settings
    if (options.targetWidth > 0 && options.targetHeight > 0) {
        if (options.maintainAspectRatio) {
            cmd << " -vf \"scale=" << options.targetWidth << ":" << options.targetHeight 
                << ":force_original_aspect_ratio=decrease,pad=" << options.targetWidth 
                << ":" << options.targetHeight << ":(ow-iw)/2:(oh-ih)/2\"";
        } else {
            cmd << " -s " << options.targetWidth << "x" << options.targetHeight;
        }
    }
    
    // Audio codec settings
    if (options.audioCodec == "aac") {
        cmd << " -c:a aac";
    } else if (options.audioCodec == "mp3") {
        cmd << " -c:a libmp3lame";
    }
    cmd << " -b:a " << options.audioBitrate << "k";
    
    cmd << " \"" << output << "\"";
    
    // Suppress FFmpeg output
    cmd << " 2>&1";
    
    return cmd.str();
}

bool VideoProcessor::executeCommand(const std::string& command) {
    #ifdef _WIN32
    return system(command.c_str()) == 0;
    #else
    int result = system(command.c_str());
    return WEXITSTATUS(result) == 0;
    #endif
}

VideoProcessingResult VideoProcessor::processVideo(const std::vector<uint8_t>& videoData, 
                                                 const VideoProcessingOptions& options) {
    VideoProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        // Create temporary files
        std::string inputFile = createTempFile("mp4");
        std::string outputFile = createTempFile("mp4");
        
        // Write input video to temporary file
        if (!writeBinaryFile(inputFile, videoData)) {
            result.error = "Failed to write input video file";
            return result;
        }
        
        // Build FFmpeg command
        std::string command = buildFFmpegCommand(inputFile, outputFile, options);
        
        std::cout << "Executing FFmpeg command: " << command << std::endl;
        
        // Execute FFmpeg
        if (!executeCommand(command)) {
            result.error = "FFmpeg processing failed";
            std::filesystem::remove(inputFile);
            std::filesystem::remove(outputFile);
            return result;
        }
        
        // Read processed video
        result.processedData = readBinaryFile(outputFile);
        if (result.processedData.empty()) {
            result.error = "Failed to read processed video file";
            std::filesystem::remove(inputFile);
            std::filesystem::remove(outputFile);
            return result;
        }
        
        result.success = true;
        result.width = options.targetWidth;
        result.height = options.targetHeight;
        result.compressionRatio = static_cast<double>(result.processedData.size()) / videoData.size();
        
        // Cleanup temporary files
        std::filesystem::remove(inputFile);
        std::filesystem::remove(outputFile);
        
    } catch (const std::exception& e) {
        result.error = "Video processing error: " + std::string(e.what());
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

VideoProcessingResult VideoProcessor::compressVideo(const std::vector<uint8_t>& videoData, int targetSizeMB) {
    VideoProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        // Estimate bitrate needed for target file size
        // Rough calculation: targetSizeMB * 8 * 1024 / estimatedDurationSeconds
        int estimatedBitrate = (targetSizeMB * 8 * 1024) / 60; // Assume 60 seconds average
        
        VideoProcessingOptions options;
        options.bitrate = std::max(100, estimatedBitrate); // Minimum 100 kbps
        options.codec = "h264";
        options.targetWidth = 1280;
        options.targetHeight = 720;
        
        result = processVideo(videoData, options);
        
    } catch (const std::exception& e) {
        result.error = e.what();
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

VideoProcessingResult VideoProcessor::extractAudio(const std::vector<uint8_t>& videoData, const std::string& format) {
    VideoProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        std::string inputFile = createTempFile("mp4");
        std::string outputFile = createTempFile(format);
        
        if (!writeBinaryFile(inputFile, videoData)) {
            result.error = "Failed to write input video file";
            return result;
        }
        
        std::ostringstream cmd;
        cmd << "ffmpeg -y -i \"" << inputFile << "\" -vn -c:a ";
        
        if (format == "mp3") {
            cmd << "libmp3lame";
        } else if (format == "aac") {
            cmd << "aac";
        } else if (format == "wav") {
            cmd << "pcm_s16le";
        }
        
        cmd << " \"" << outputFile << "\" 2>&1";
        
        if (!executeCommand(cmd.str())) {
            result.error = "Audio extraction failed";
            std::filesystem::remove(inputFile);
            std::filesystem::remove(outputFile);
            return result;
        }
        
        result.processedData = readBinaryFile(outputFile);
        result.success = !result.processedData.empty();
        
        std::filesystem::remove(inputFile);
        std::filesystem::remove(outputFile);
        
    } catch (const std::exception& e) {
        result.error = e.what();
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

VideoProcessingResult VideoProcessor::trimVideo(const std::vector<uint8_t>& videoData, int startSeconds, int durationSeconds) {
    VideoProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        std::string inputFile = createTempFile("mp4");
        std::string outputFile = createTempFile("mp4");
        
        if (!writeBinaryFile(inputFile, videoData)) {
            result.error = "Failed to write input video file";
            return result;
        }
        
        std::ostringstream cmd;
        cmd << "ffmpeg -y -ss " << startSeconds << " -i \"" << inputFile 
            << "\" -t " << durationSeconds << " -c copy \"" << outputFile << "\" 2>&1";
        
        if (!executeCommand(cmd.str())) {
            result.error = "Video trimming failed";
            std::filesystem::remove(inputFile);
            std::filesystem::remove(outputFile);
            return result;
        }
        
        result.processedData = readBinaryFile(outputFile);
        result.success = !result.processedData.empty();
        result.duration = durationSeconds;
        
        std::filesystem::remove(inputFile);
        std::filesystem::remove(outputFile);
        
    } catch (const std::exception& e) {
        result.error = e.what();
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

VideoProcessingResult VideoProcessor::addWatermark(const std::vector<uint8_t>& videoData, 
                                                 const std::vector<uint8_t>& watermarkData, 
                                                 const std::string& position) {
    VideoProcessingResult result;
    auto start = std::chrono::high_resolution_clock::now();
    
    try {
        std::string inputFile = createTempFile("mp4");
        std::string watermarkFile = createTempFile("png");
        std::string outputFile = createTempFile("mp4");
        
        if (!writeBinaryFile(inputFile, videoData) || !writeBinaryFile(watermarkFile, watermarkData)) {
            result.error = "Failed to write input files";
            return result;
        }
        
        std::string overlay = "overlay=";
        if (position == "top-left") {
            overlay += "10:10";
        } else if (position == "top-right") {
            overlay += "main_w-overlay_w-10:10";
        } else if (position == "bottom-left") {
            overlay += "10:main_h-overlay_h-10";
        } else { // bottom-right (default)
            overlay += "main_w-overlay_w-10:main_h-overlay_h-10";
        }
        
        std::ostringstream cmd;
        cmd << "ffmpeg -y -i \"" << inputFile << "\" -i \"" << watermarkFile 
            << "\" -filter_complex \"" << overlay << "\" \"" << outputFile << "\" 2>&1";
        
        if (!executeCommand(cmd.str())) {
            result.error = "Watermark application failed";
            std::filesystem::remove(inputFile);
            std::filesystem::remove(watermarkFile);
            std::filesystem::remove(outputFile);
            return result;
        }
        
        result.processedData = readBinaryFile(outputFile);
        result.success = !result.processedData.empty();
        
        std::filesystem::remove(inputFile);
        std::filesystem::remove(watermarkFile);
        std::filesystem::remove(outputFile);
        
    } catch (const std::exception& e) {
        result.error = e.what();
        result.success = false;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    result.processingTimeMs = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    return result;
}

VideoInfo VideoProcessor::getVideoInfo(const std::vector<uint8_t>& videoData) {
    VideoInfo info;
    
    try {
        std::string inputFile = createTempFile("mp4");
        
        if (!writeBinaryFile(inputFile, videoData)) {
            return info;
        }
        
        std::string command = "ffprobe -v quiet -print_format json -show_format -show_streams \"" 
                            + inputFile + "\" 2>&1";
        
        // This is a simplified version - in production, you'd want to parse the JSON output
        // For now, return default values
        info.width = 1920;
        info.height = 1080;
        info.duration = 60;
        info.framerate = 30;
        info.codec = "h264";
        info.bitrate = 2000;
        info.hasAudio = true;
        info.audioCodec = "aac";
        
        std::filesystem::remove(inputFile);
        
    } catch (const std::exception& e) {
        // Return default info on error
    }
    
    return info;
}

std::vector<std::vector<uint8_t>> VideoProcessor::extractFrames(const std::vector<uint8_t>& videoData, int maxFrames) {
    std::vector<std::vector<uint8_t>> frames;
    
    try {
        std::string inputFile = createTempFile("mp4");
        
        if (!writeBinaryFile(inputFile, videoData)) {
            return frames;
        }
        
        // Extract frames at regular intervals
        for (int i = 0; i < maxFrames; ++i) {
            std::string outputFile = createTempFile("jpg");
            int seconds = i * 5; // Extract frame every 5 seconds
            
            std::ostringstream cmd;
            cmd << "ffmpeg -y -ss " << seconds << " -i \"" << inputFile 
                << "\" -vframes 1 \"" << outputFile << "\" 2>&1";
            
            if (executeCommand(cmd.str())) {
                auto frameData = readBinaryFile(outputFile);
                if (!frameData.empty()) {
                    frames.push_back(std::move(frameData));
                }
            }
            
            std::filesystem::remove(outputFile);
        }
        
        std::filesystem::remove(inputFile);
        
    } catch (const std::exception& e) {
        // Return empty frames on error
    }
    
    return frames;
}
