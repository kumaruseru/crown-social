#pragma once
#include <vector>
#include <string>

struct ThumbnailOptions {
    int width = 300;
    int height = 200;
    int quality = 85;
    std::string format = "jpg";
    bool maintainAspectRatio = true;
    int timeOffsetSeconds = 5; // For video thumbnails
};

struct ThumbnailResult {
    bool success = false;
    std::vector<uint8_t> thumbnailData;
    int width = 0;
    int height = 0;
    int processingTimeMs = 0;
    std::string error;
};

class ThumbnailGenerator {
private:
    std::vector<uint8_t> generateImageThumbnail(const std::vector<uint8_t>& imageData, 
                                               const ThumbnailOptions& options);
    std::vector<uint8_t> generateVideoThumbnail(const std::vector<uint8_t>& videoData, 
                                               const ThumbnailOptions& options);
    std::vector<uint8_t> generateDocumentThumbnail(const std::vector<uint8_t>& docData,
                                                  const ThumbnailOptions& options);
    
public:
    ThumbnailGenerator();
    ~ThumbnailGenerator();
    
    ThumbnailResult generateThumbnail(const std::vector<uint8_t>& mediaData, 
                                    const std::string& mediaType,
                                    const ThumbnailOptions& options);
    
    // Generate multiple thumbnails at different sizes
    std::vector<ThumbnailResult> generateMultipleSizes(const std::vector<uint8_t>& mediaData,
                                                      const std::string& mediaType,
                                                      const std::vector<std::pair<int, int>>& sizes);
    
    // Generate contact sheet (grid of thumbnails) for video
    ThumbnailResult generateContactSheet(const std::vector<uint8_t>& videoData,
                                       int gridWidth = 3, int gridHeight = 3,
                                       const ThumbnailOptions& options = {});
};
