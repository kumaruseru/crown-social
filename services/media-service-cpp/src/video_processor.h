#pragma once
#include <string>
#include <vector>

struct VideoProcessingOptions {
    int targetWidth = 1280;
    int targetHeight = 720;
    int bitrate = 2000;        // kbps
    std::string codec = "h264";
    int framerate = 30;
    bool maintainAspectRatio = true;
    std::string audioCodec = "aac";
    int audioBitrate = 128;    // kbps
};

struct VideoProcessingResult {
    bool success = false;
    std::vector<uint8_t> processedData;
    int width = 0;
    int height = 0;
    int duration = 0;          // in seconds
    int processingTimeMs = 0;
    std::string error;
    double compressionRatio = 0.0;
};

struct VideoInfo {
    int width = 0;
    int height = 0;
    int duration = 0;
    int framerate = 0;
    std::string codec;
    int bitrate = 0;
    bool hasAudio = false;
    std::string audioCodec;
};

class VideoProcessor {
private:
    std::string tempDir;
    std::string createTempFile(const std::string& extension);
    bool writeBinaryFile(const std::string& filename, const std::vector<uint8_t>& data);
    std::vector<uint8_t> readBinaryFile(const std::string& filename);
    std::string buildFFmpegCommand(const std::string& input, const std::string& output, 
                                 const VideoProcessingOptions& options);
    bool executeCommand(const std::string& command);
    
public:
    VideoProcessor();
    ~VideoProcessor();
    
    VideoProcessingResult processVideo(const std::vector<uint8_t>& videoData, 
                                     const VideoProcessingOptions& options);
    VideoProcessingResult compressVideo(const std::vector<uint8_t>& videoData, int targetSizeMB);
    VideoProcessingResult extractAudio(const std::vector<uint8_t>& videoData, const std::string& format = "mp3");
    VideoProcessingResult trimVideo(const std::vector<uint8_t>& videoData, int startSeconds, int durationSeconds);
    VideoProcessingResult addWatermark(const std::vector<uint8_t>& videoData, 
                                     const std::vector<uint8_t>& watermarkData, 
                                     const std::string& position = "bottom-right");
    
    VideoInfo getVideoInfo(const std::vector<uint8_t>& videoData);
    std::vector<std::vector<uint8_t>> extractFrames(const std::vector<uint8_t>& videoData, 
                                                   int maxFrames = 10);
};
