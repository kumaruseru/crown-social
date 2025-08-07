# C# Analytics Service Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 3006

# Create app user for security
RUN addgroup -S crown && adduser -S crown -G crown
USER crown

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["Crown.Analytics.Service.csproj", "."]
RUN dotnet restore "Crown.Analytics.Service.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/."
RUN dotnet build "Crown.Analytics.Service.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "Crown.Analytics.Service.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create logs directory
USER root
RUN mkdir -p logs && chown -R crown:crown logs
USER crown

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health || exit 1

ENTRYPOINT ["dotnet", "Crown.Analytics.Service.dll"]
