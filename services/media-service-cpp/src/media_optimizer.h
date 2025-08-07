#pragma once
#include <vector>
#include <string>

struct OptimizationOptions {
    bool enableCompression = true;
    int targetQuality = 85;
    bool enableProgressive = true;    // For JPEG
    bool enableWebP = true;          // Convert to WebP if supported
    bool stripMetadata = true;
    bool enableLossless = false;     // Use lossless compression
    int maxWidth = 0;               // 0 means no limit
    int maxHeight = 0;              // 0 means no limit
    int maxFileSizeKB = 0;          // 0 means no limit
};

struct OptimizationResult {
    bool success = false;
    std::vector<uint8_t> optimizedData;
    std::string outputFormat;
    int originalSize = 0;
    int optimizedSize = 0;
    double compressionRatio = 0.0;
    int processingTimeMs = 0;
    std::string error;
    
    // Statistics
    int originalWidth = 0;
    int originalHeight = 0;
    int optimizedWidth = 0;
    int optimizedHeight = 0;
};

struct MediaAnalysis {
    std::string mediaType;
    std::string format;
    int width = 0;
    int height = 0;
    int fileSize = 0;
    bool hasAlpha = false;
    int colorDepth = 0;
    std::string colorSpace;
    bool isAnimated = false;
    int frameCount = 0;
    double aspectRatio = 0.0;
};

class MediaOptimizer {
private:
    std::vector<uint8_t> optimizeImage(const std::vector<uint8_t>& imageData, 
                                     const OptimizationOptions& options);
    std::vector<uint8_t> optimizeVideo(const std::vector<uint8_t>& videoData, 
                                     const OptimizationOptions& options);
    std::vector<uint8_t> convertToWebP(const std::vector<uint8_t>& imageData, int quality);
    std::vector<uint8_t> compressJPEG(const std::vector<uint8_t>& imageData, int quality, bool progressive);
    std::vector<uint8_t> optimizePNG(const std::vector<uint8_t>& imageData, bool lossless);
    
    bool shouldResizeImage(int width, int height, const OptimizationOptions& options);
    std::pair<int, int> calculateOptimalSize(int originalWidth, int originalHeight, 
                                           const OptimizationOptions& options);
    
public:
    MediaOptimizer();
    ~MediaOptimizer();
    
    OptimizationResult optimize(const std::vector<uint8_t>& mediaData, 
                              const std::string& mediaType,
                              const OptimizationOptions& options);
    
    // Batch optimization
    std::vector<OptimizationResult> optimizeBatch(const std::vector<std::vector<uint8_t>>& mediaFiles,
                                                 const std::vector<std::string>& mediaTypes,
                                                 const OptimizationOptions& options);
    
    // Media analysis
    MediaAnalysis analyzeMedia(const std::vector<uint8_t>& mediaData);
    
    // Smart optimization (automatically choose best settings)
    OptimizationResult smartOptimize(const std::vector<uint8_t>& mediaData,
                                   const std::string& targetUse = "web"); // web, mobile, print
    
    // Progressive optimization (multiple quality levels)
    std::vector<OptimizationResult> generateProgressive(const std::vector<uint8_t>& mediaData,
                                                       const std::vector<int>& qualityLevels);
};
