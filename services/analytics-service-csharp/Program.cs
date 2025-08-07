using Crown.Analytics.Service.Core;
using Crown.Analytics.Service.Infrastructure;
using Crown.Analytics.Service.Services;
using Crown.Analytics.Service.Hubs;
using Crown.Analytics.Service.Middleware;
using Serilog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/crown-analytics-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.DateTimeZoneHandling = Newtonsoft.Json.DateTimeZoneHandling.Utc;
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Crown Analytics Service", 
        Version = "v1",
        Description = "High-performance analytics and metrics service for Crown Social Network"
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CrownPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://crown-social.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:SecretKey"] ?? "your-super-secret-jwt-key-change-in-production";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "crown-analytics";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "crown-users";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 1000,
                Window = TimeSpan.FromMinutes(1)
            }));
    
    options.RejectionStatusCode = 429;
});

// Configure Database Services
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB"));

builder.Services.AddSingleton<IMongoDbContext, MongoDbContext>();

// Configure Redis Caching
var redisConnectionString = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = redisConnectionString;
    options.InstanceName = "CrownAnalytics";
});

// Configure ML.NET Services
builder.Services.AddSingleton<IAnalyticsMLService, AnalyticsMLService>();
builder.Services.AddSingleton<IPredictionService, PredictionService>();

// Configure Application Services
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IMetricsService, MetricsService>();
builder.Services.AddScoped<IRealtimeAnalyticsService, RealtimeAnalyticsService>();
builder.Services.AddScoped<IUserBehaviorService, UserBehaviorService>();
builder.Services.AddScoped<IContentAnalyticsService, ContentAnalyticsService>();

// Configure Background Services
builder.Services.AddHostedService<AnalyticsAggregationService>();
builder.Services.AddHostedService<MetricsCollectionService>();
builder.Services.AddHostedService<PredictiveAnalyticsService>();

// Configure SignalR for real-time analytics
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB
});

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Configure FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddMongoDb(builder.Configuration.GetConnectionString("MongoDB") ?? "mongodb://localhost:27017")
    .AddRedis(redisConnectionString)
    .AddCheck("self", () => HealthCheckResult.Healthy("Analytics Service is running"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Crown Analytics Service V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

// Add custom middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("CrownPolicy");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// Map SignalR Hubs
app.MapHub<AnalyticsHub>("/hubs/analytics");
app.MapHub<MetricsHub>("/hubs/metrics");

// Add root endpoint
app.MapGet("/", () => new
{
    service = "Crown Analytics Service",
    version = "1.0.0",
    status = "running",
    timestamp = DateTime.UtcNow,
    features = new[]
    {
        "Real-time Analytics",
        "User Behavior Tracking",
        "Content Performance Metrics",
        "Predictive Analytics with ML.NET",
        "High-Performance Data Processing",
        "Real-time Dashboards via SignalR"
    }
});

Log.Information("🔢 Crown Analytics Service (.NET 8.0) starting on port {Port}", 
    builder.Configuration["ANALYTICS_SERVICE_PORT"] ?? "3005");

app.Run();
