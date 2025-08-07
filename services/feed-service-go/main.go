package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "github.com/go-redis/redis/v8"
    "github.com/gorilla/websocket"
    "github.com/joho/godotenv"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type FeedService struct {
    mongo     *mongo.Client
    redis     *redis.Client
    upgrader  websocket.Upgrader
}

type Post struct {
    ID           primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
    Author       primitive.ObjectID   `bson:"author" json:"author"`
    Content      string              `bson:"content" json:"content"`
    Type         string              `bson:"type" json:"type"`
    Visibility   string              `bson:"visibility" json:"visibility"`
    Media        []MediaItem         `bson:"media" json:"media"`
    Tags         []string            `bson:"tags" json:"tags"`
    LikesCount   int                 `bson:"likesCount" json:"likesCount"`
    CommentsCount int                `bson:"commentsCount" json:"commentsCount"`
    SharesCount  int                 `bson:"sharesCount" json:"sharesCount"`
    ViewsCount   int                 `bson:"viewsCount" json:"viewsCount"`
    IsActive     bool                `bson:"isActive" json:"isActive"`
    CreatedAt    time.Time           `bson:"createdAt" json:"createdAt"`
    UpdatedAt    time.Time           `bson:"updatedAt" json:"updatedAt"`
}

type MediaItem struct {
    Type      string `bson:"type" json:"type"`
    URL       string `bson:"url" json:"url"`
    Thumbnail string `bson:"thumbnail,omitempty" json:"thumbnail,omitempty"`
    Filename  string `bson:"filename,omitempty" json:"filename,omitempty"`
}

type FeedRequest struct {
    UserID string `json:"userId"`
    Page   int    `json:"page"`
    Limit  int    `json:"limit"`
}

type FeedResponse struct {
    Success    bool   `json:"success"`
    Posts      []Post `json:"posts"`
    Pagination struct {
        Page    int  `json:"page"`
        Limit   int  `json:"limit"`
        HasMore bool `json:"hasMore"`
    } `json:"pagination"`
    CacheHit bool `json:"cacheHit"`
}

func NewFeedService() *FeedService {
    // Load environment variables
    godotenv.Load()

    // MongoDB connection
    mongoClient, err := mongo.Connect(context.Background(), options.Client().ApplyURI(
        getEnv("MONGODB_URI", "mongodb://localhost:27017/crown-social"),
    ))
    if err != nil {
        log.Fatal("Failed to connect to MongoDB:", err)
    }

    // Redis connection
    redisClient := redis.NewClient(&redis.Options{
        Addr:     getEnv("REDIS_URL", "localhost:6379"),
        Password: "",
        DB:       0,
    })

    // Test connections
    if err := mongoClient.Ping(context.Background(), nil); err != nil {
        log.Fatal("MongoDB ping failed:", err)
    }

    if err := redisClient.Ping(context.Background()).Err(); err != nil {
        log.Fatal("Redis ping failed:", err)
    }

    return &FeedService{
        mongo: mongoClient,
        redis: redisClient,
        upgrader: websocket.Upgrader{
            CheckOrigin: func(r *http.Request) bool {
                return true // Allow all origins in development
            },
        },
    }
}

func (fs *FeedService) GetPersonalizedFeed(c *gin.Context) {
    var req FeedRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    // Set defaults
    if req.Page == 0 {
        req.Page = 1
    }
    if req.Limit == 0 {
        req.Limit = 10
    }

    // Check Redis cache first
    cacheKey := fmt.Sprintf("feed:%s:page:%d:limit:%d", req.UserID, req.Page, req.Limit)
    cachedData, err := fs.redis.Get(context.Background(), cacheKey).Result()
    
    if err == nil {
        // Cache hit
        var cachedFeed []Post
        if json.Unmarshal([]byte(cachedData), &cachedFeed) == nil {
            c.JSON(http.StatusOK, FeedResponse{
                Success:  true,
                Posts:    cachedFeed,
                CacheHit: true,
                Pagination: struct {
                    Page    int  `json:"page"`
                    Limit   int  `json:"limit"`
                    HasMore bool `json:"hasMore"`
                }{
                    Page:    req.Page,
                    Limit:   req.Limit,
                    HasMore: len(cachedFeed) == req.Limit,
                },
            })
            return
        }
    }

    // Cache miss - fetch from database
    posts, err := fs.fetchFeedFromDB(req.UserID, req.Page, req.Limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch feed"})
        return
    }

    // Cache the results for 5 minutes
    postsJSON, _ := json.Marshal(posts)
    fs.redis.Set(context.Background(), cacheKey, postsJSON, 5*time.Minute)

    c.JSON(http.StatusOK, FeedResponse{
        Success:  true,
        Posts:    posts,
        CacheHit: false,
        Pagination: struct {
            Page    int  `json:"page"`
            Limit   int  `json:"limit"`
            HasMore bool `json:"hasMore"`
        }{
            Page:    req.Page,
            Limit:   req.Limit,
            HasMore: len(posts) == req.Limit,
        },
    })
}

func (fs *FeedService) fetchFeedFromDB(userID string, page, limit int) ([]Post, error) {
    collection := fs.mongo.Database("crown-social").Collection("posts")
    
    // Convert userID to ObjectID
    userObjectID, err := primitive.ObjectIDFromHex(userID)
    if err != nil {
        return nil, err
    }

    // In production, this would include friend filtering
    filter := bson.M{
        "isActive": true,
        "$or": []bson.M{
            {"visibility": "public"},
            {"author": userObjectID}, // User's own posts
        },
    }

    // Calculate skip
    skip := (page - 1) * limit

    // Query options
    opts := options.Find().
        SetSort(bson.D{{Key: "createdAt", Value: -1}}).
        SetSkip(int64(skip)).
        SetLimit(int64(limit))

    cursor, err := collection.Find(context.Background(), filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(context.Background())

    var posts []Post
    if err := cursor.All(context.Background(), &posts); err != nil {
        return nil, err
    }

    return posts, nil
}

func (fs *FeedService) GetTrendingPosts(c *gin.Context) {
    timeframe := c.DefaultQuery("timeframe", "24h")
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

    // Check cache first
    cacheKey := fmt.Sprintf("trending:%s:limit:%d", timeframe, limit)
    cachedData, err := fs.redis.Get(context.Background(), cacheKey).Result()
    
    if err == nil {
        var cachedPosts []Post
        if json.Unmarshal([]byte(cachedData), &cachedPosts) == nil {
            c.JSON(http.StatusOK, gin.H{
                "success":  true,
                "posts":    cachedPosts,
                "cacheHit": true,
            })
            return
        }
    }

    // Fetch from database
    posts, err := fs.fetchTrendingFromDB(timeframe, limit)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch trending posts"})
        return
    }

    // Cache results for 10 minutes
    postsJSON, _ := json.Marshal(posts)
    fs.redis.Set(context.Background(), cacheKey, postsJSON, 10*time.Minute)

    c.JSON(http.StatusOK, gin.H{
        "success":  true,
        "posts":    posts,
        "cacheHit": false,
    })
}

func (fs *FeedService) fetchTrendingFromDB(timeframe string, limit int) ([]Post, error) {
    collection := fs.mongo.Database("crown-social").Collection("posts")

    // Calculate time range
    var hoursAgo time.Duration
    switch timeframe {
    case "24h":
        hoursAgo = 24 * time.Hour
    case "7d":
        hoursAgo = 7 * 24 * time.Hour
    case "30d":
        hoursAgo = 30 * 24 * time.Hour
    default:
        hoursAgo = 24 * time.Hour
    }

    since := time.Now().Add(-hoursAgo)

    // Aggregation pipeline for trending posts
    pipeline := []bson.M{
        {
            "$match": bson.M{
                "createdAt": bson.M{"$gte": since},
                "isActive":  true,
                "visibility": bson.M{"$in": []string{"public", "friends"}},
            },
        },
        {
            "$addFields": bson.M{
                "trendingScore": bson.M{
                    "$add": []bson.M{
                        {"$multiply": []interface{}{"$likesCount", 1}},
                        {"$multiply": []interface{}{"$commentsCount", 2}},
                        {"$multiply": []interface{}{"$sharesCount", 3}},
                        {"$multiply": []interface{}{"$viewsCount", 0.1}},
                    },
                },
            },
        },
        {"$sort": bson.M{"trendingScore": -1}},
        {"$limit": limit},
    }

    cursor, err := collection.Aggregate(context.Background(), pipeline)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(context.Background())

    var posts []Post
    if err := cursor.All(context.Background(), &posts); err != nil {
        return nil, err
    }

    return posts, nil
}

func (fs *FeedService) HandleWebSocket(c *gin.Context) {
    conn, err := fs.upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        log.Printf("WebSocket upgrade failed: %v", err)
        return
    }
    defer conn.Close()

    userID := c.Query("userId")
    if userID == "" {
        conn.WriteMessage(websocket.TextMessage, []byte(`{"error": "userId required"}`))
        return
    }

    log.Printf("WebSocket connected for user: %s", userID)

    // Subscribe to Redis channel for real-time updates
    pubsub := fs.redis.Subscribe(context.Background(), fmt.Sprintf("user_feed:%s", userID))
    defer pubsub.Close()

    ch := pubsub.Channel()

    for {
        select {
        case msg := <-ch:
            // Forward Redis message to WebSocket client
            if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
                log.Printf("WebSocket write error: %v", err)
                return
            }
        }
    }
}

func (fs *FeedService) InvalidateCache(c *gin.Context) {
    userID := c.Param("userId")
    
    // Delete user's feed cache
    pattern := fmt.Sprintf("feed:%s:*", userID)
    iter := fs.redis.Scan(context.Background(), 0, pattern, 0).Iterator()
    
    var keys []string
    for iter.Next(context.Background()) {
        keys = append(keys, iter.Val())
    }
    
    if len(keys) > 0 {
        fs.redis.Del(context.Background(), keys...)
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Cache invalidated",
        "keys_deleted": len(keys),
    })
}

func (fs *FeedService) HealthCheck(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "status":    "healthy",
        "service":   "crown-feed-service-go",
        "timestamp": time.Now(),
        "version":   "1.0.0",
    })
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func main() {
    // Initialize service
    feedService := NewFeedService()
    
    // Setup Gin router
    r := gin.Default()
    
    // CORS middleware
    r.Use(cors.New(cors.Config{
        AllowAllOrigins:  true,
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:          12 * time.Hour,
    }))

    // Routes
    api := r.Group("/api/v1")
    {
        api.GET("/health", feedService.HealthCheck)
        api.POST("/feed", feedService.GetPersonalizedFeed)
        api.GET("/trending", feedService.GetTrendingPosts)
        api.DELETE("/cache/:userId", feedService.InvalidateCache)
        api.GET("/ws", feedService.HandleWebSocket)
    }

    port := getEnv("FEED_SERVICE_PORT", "3002")
    log.Printf("🚀 Crown Feed Service (Go) starting on port %s", port)
    
    if err := r.Run(":" + port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
