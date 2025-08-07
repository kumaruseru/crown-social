# Dockerfile for Crown Media Service (C++)
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    pkg-config \
    libopencv-dev \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    ffmpeg \
    libjsoncpp-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy source code
COPY src/ ./src/
COPY CMakeLists.txt ./

# Build the application
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc)

# Create non-root user
RUN groupadd -r crownmedia && useradd -r -g crownmedia crownmedia

# Create temp directory for media processing
RUN mkdir -p /tmp/crown_media_processing && \
    chown -R crownmedia:crownmedia /tmp/crown_media_processing

# Switch to non-root user
USER crownmedia

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start the service
CMD ["./build/crown-media-service"]
