/**
 * File Upload Service - Multi-language Implementation
 * Handles file uploads with processing across different languages
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FileUploadService {
    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'uploads');
        this.tempDir = path.join(this.uploadsDir, 'temp');
        this.imagesDir = path.join(this.uploadsDir, 'images');
        this.videosDir = path.join(this.uploadsDir, 'videos');
        this.documentsDir = path.join(this.uploadsDir, 'documents');
        this.avatarsDir = path.join(this.uploadsDir, 'avatars');
        
        this.initializeDirectories();
        this.configureMulter();
    }

    /**
     * Initialize upload directories
     */
    async initializeDirectories() {
        const directories = [
            this.uploadsDir,
            this.tempDir,
            this.imagesDir,
            this.videosDir,
            this.documentsDir,
            this.avatarsDir
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch (error) {
                await fs.mkdir(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }

    /**
     * Configure Multer for file uploads
     */
    configureMulter() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                let uploadPath = this.tempDir;
                
                if (file.fieldname === 'avatar') {
                    uploadPath = this.avatarsDir;
                } else if (file.mimetype.startsWith('image/')) {
                    uploadPath = this.imagesDir;
                } else if (file.mimetype.startsWith('video/')) {
                    uploadPath = this.videosDir;
                } else {
                    uploadPath = this.documentsDir;
                }
                
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = this.generateUniqueFilename(file.originalname);
                cb(null, uniqueName);
            }
        });

        const fileFilter = (req, file, cb) => {
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'video/mp4',
                'video/avi',
                'video/mov',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} not allowed`), false);
            }
        };

        this.upload = multer({
            storage,
            fileFilter,
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB
                files: 10
            }
        });
    }

    /**
     * Generate unique filename
     */
    generateUniqueFilename(originalname) {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalname);
        return `${timestamp}_${randomBytes}${extension}`;
    }

    /**
     * Process image upload (using Sharp - Node.js)
     */
    async processImage(filePath, options = {}) {
        const {
            width = 1200,
            height = 1200,
            quality = 85,
            generateThumbnail = true,
            thumbnailSize = 300
        } = options;

        try {
            const processedPath = filePath.replace(path.extname(filePath), '_processed.jpg');
            const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');

            // Main image processing
            await sharp(filePath)
                .resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality })
                .toFile(processedPath);

            // Generate thumbnail
            if (generateThumbnail) {
                await sharp(filePath)
                    .resize(thumbnailSize, thumbnailSize, {
                        fit: 'cover'
                    })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);
            }

            // Get image metadata
            const metadata = await sharp(filePath).metadata();

            return {
                original: filePath,
                processed: processedPath,
                thumbnail: generateThumbnail ? thumbnailPath : null,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: metadata.size
                }
            };

        } catch (error) {
            console.error('Image processing error:', error);
            throw new Error('Failed to process image');
        }
    }

    /**
     * Process video using C++ service
     */
    async processVideo(filePath, options = {}) {
        const {
            generateThumbnail = true,
            compressVideo = true,
            outputFormat = 'mp4'
        } = options;

        try {
            // Call C++ media processing service
            const response = await fetch('http://localhost:3003/process-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputPath: filePath,
                    generateThumbnail,
                    compressVideo,
                    outputFormat
                })
            });

            if (!response.ok) {
                throw new Error('Video processing failed');
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Video processing error:', error);
            
            // Fallback to FFmpeg if C++ service is unavailable
            return await this.processVideoWithFFmpeg(filePath, options);
        }
    }

    /**
     * Fallback video processing with FFmpeg
     */
    async processVideoWithFFmpeg(filePath, options = {}) {
        const { generateThumbnail = true } = options;
        const outputPath = filePath.replace(path.extname(filePath), '_compressed.mp4');
        const thumbnailPath = filePath.replace(path.extname(filePath), '_thumb.jpg');

        try {
            // Compress video
            await execAsync(`ffmpeg -i "${filePath}" -c:v libx264 -crf 28 -c:a aac -b:a 128k "${outputPath}"`);

            // Generate thumbnail
            if (generateThumbnail) {
                await execAsync(`ffmpeg -i "${filePath}" -ss 00:00:01.000 -vframes 1 "${thumbnailPath}"`);
            }

            return {
                original: filePath,
                compressed: outputPath,
                thumbnail: generateThumbnail ? thumbnailPath : null
            };

        } catch (error) {
            console.error('FFmpeg processing error:', error);
            throw new Error('Failed to process video');
        }
    }

    /**
     * Process avatar upload with AI enhancement (Python service)
     */
    async processAvatar(filePath, userId) {
        try {
            // Call Python AI service for avatar enhancement
            const response = await fetch('http://localhost:3004/enhance-avatar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imagePath: filePath,
                    userId: userId,
                    enhancements: {
                        faceDetection: true,
                        backgroundRemoval: false,
                        qualityImprovement: true
                    }
                })
            });

            if (!response.ok) {
                console.warn('AI avatar enhancement failed, using standard processing');
                return await this.processImage(filePath, {
                    width: 400,
                    height: 400,
                    generateThumbnail: true,
                    thumbnailSize: 150
                });
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Avatar processing error:', error);
            
            // Fallback to standard image processing
            return await this.processImage(filePath, {
                width: 400,
                height: 400,
                generateThumbnail: true,
                thumbnailSize: 150
            });
        }
    }

    /**
     * Scan file for security threats using Go service
     */
    async scanFile(filePath) {
        try {
            const response = await fetch('http://localhost:3002/scan-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: filePath
                })
            });

            if (!response.ok) {
                console.warn('File scanning service unavailable, skipping security scan');
                return { safe: true, warnings: [] };
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('File scanning error:', error);
            return { safe: true, warnings: ['Security scan unavailable'] };
        }
    }

    /**
     * Store file metadata in search service (Java/Kotlin)
     */
    async indexFile(fileInfo) {
        try {
            await fetch('http://localhost:3007/index-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fileInfo)
            });
        } catch (error) {
            console.error('File indexing error:', error);
        }
    }

    /**
     * Send file processing notification (Elixir service)
     */
    async sendProcessingNotification(userId, fileInfo, status) {
        try {
            await fetch('http://localhost:3005/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    type: 'file_processing',
                    data: {
                        fileName: fileInfo.originalName,
                        status,
                        fileType: fileInfo.type
                    }
                })
            });
        } catch (error) {
            console.error('Notification sending error:', error);
        }
    }

    /**
     * Complete file upload pipeline
     */
    async processFileUpload(file, userId, uploadType = 'general') {
        const startTime = Date.now();
        
        try {
            // 1. Security scan (Go service)
            const scanResult = await this.scanFile(file.path);
            if (!scanResult.safe) {
                await fs.unlink(file.path);
                throw new Error('File failed security scan');
            }

            // 2. Process based on file type
            let processResult;
            if (file.mimetype.startsWith('image/')) {
                if (uploadType === 'avatar') {
                    processResult = await this.processAvatar(file.path, userId);
                } else {
                    processResult = await this.processImage(file.path);
                }
            } else if (file.mimetype.startsWith('video/')) {
                processResult = await this.processVideo(file.path);
            } else {
                processResult = { original: file.path };
            }

            // 3. Create file info object
            const fileInfo = {
                id: crypto.randomUUID(),
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                uploadedBy: userId,
                uploadType,
                paths: processResult,
                scanResult,
                uploadedAt: new Date(),
                processingTime: Date.now() - startTime
            };

            // 4. Index file for search (Java/Kotlin service)
            await this.indexFile(fileInfo);

            // 5. Send notification (Elixir service)
            await this.sendProcessingNotification(userId, fileInfo, 'completed');

            // 6. Log analytics (C#/.NET service)
            await this.logFileAnalytics(fileInfo);

            return fileInfo;

        } catch (error) {
            console.error('File upload processing error:', error);
            
            // Send failure notification
            await this.sendProcessingNotification(userId, {
                originalName: file.originalname,
                type: file.mimetype
            }, 'failed');
            
            throw error;
        }
    }

    /**
     * Log file analytics (C#/.NET service)
     */
    async logFileAnalytics(fileInfo) {
        try {
            await fetch('http://localhost:3006/log-file-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: fileInfo.uploadedBy,
                    fileType: fileInfo.mimetype,
                    fileSize: fileInfo.size,
                    processingTime: fileInfo.processingTime,
                    timestamp: fileInfo.uploadedAt
                })
            });
        } catch (error) {
            console.error('Analytics logging error:', error);
        }
    }

    /**
     * Get upload middleware
     */
    getUploadMiddleware(fieldName = 'file', maxFiles = 1) {
        if (maxFiles === 1) {
            return this.upload.single(fieldName);
        } else {
            return this.upload.array(fieldName, maxFiles);
        }
    }

    /**
     * Get multiple files upload middleware
     */
    getMultipleUploadMiddleware(fields) {
        return this.upload.fields(fields);
    }

    /**
     * Delete file and its variants
     */
    async deleteFile(fileInfo) {
        const filesToDelete = [];
        
        if (fileInfo.paths) {
            filesToDelete.push(
                fileInfo.paths.original,
                fileInfo.paths.processed,
                fileInfo.paths.compressed,
                fileInfo.paths.thumbnail
            );
        } else {
            filesToDelete.push(fileInfo.path || fileInfo.filename);
        }

        for (const filePath of filesToDelete) {
            if (filePath) {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.warn(`Failed to delete file: ${filePath}`);
                }
            }
        }
    }

    /**
     * Get file URL
     */
    getFileUrl(filePath) {
        const relativePath = path.relative(this.uploadsDir, filePath);
        return `/uploads/${relativePath.replace(/\\/g, '/')}`;
    }
}

module.exports = new FileUploadService();
