# Java/Kotlin Search Service Dockerfile
FROM gradle:8.5-jdk21-alpine AS build

# Set working directory
WORKDIR /app

# Copy Gradle files
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY gradle gradle

# Download dependencies
RUN gradle dependencies --no-daemon

# Copy source code
COPY src src

# Build the application
RUN gradle build --no-daemon -x test

# Runtime stage
FROM openjdk:21-jdk-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r crown && useradd -r -g crown crown

# Set working directory
WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Create logs directory
RUN mkdir -p logs && chown -R crown:crown logs && chown crown:crown app.jar

# Switch to app user
USER crown

# Expose port
EXPOSE 3007

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3007/health || exit 1

# Set JVM options for performance
ENV JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseZGC -XX:+UnlockExperimentalVMOptions"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
