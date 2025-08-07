use warp::Filter;
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};
use bcrypt::{hash, verify, DEFAULT_COST};
use uuid::Uuid;
use chrono::{Utc, Duration};
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
    iat: usize,
    user_id: String,
    email: String,
    role: String,
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize)]
struct RegisterRequest {
    email: String,
    password: String,
    first_name: String,
    last_name: String,
}

#[derive(Debug, Serialize)]
struct AuthResponse {
    success: bool,
    message: String,
    token: Option<String>,
    user: Option<UserInfo>,
}

#[derive(Debug, Serialize)]
struct UserInfo {
    id: String,
    email: String,
    first_name: String,
    last_name: String,
    role: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::init();
    dotenv::dotenv().ok();

    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type", "authorization"])
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]);

    // Routes
    let health = warp::path("health")
        .and(warp::get())
        .map(|| warp::reply::json(&serde_json::json!({
            "status": "healthy",
            "service": "crown-auth-service-rust",
            "timestamp": Utc::now()
        })));

    let login = warp::path("auth")
        .and(warp::path("login"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_login);

    let register = warp::path("auth")
        .and(warp::path("register"))
        .and(warp::post())
        .and(warp::body::json())
        .and_then(handle_register);

    let verify_token = warp::path("auth")
        .and(warp::path("verify"))
        .and(warp::post())
        .and(warp::header::<String>("authorization"))
        .and_then(handle_verify_token);

    let routes = health
        .or(login)
        .or(register)
        .or(verify_token)
        .with(cors)
        .with(warp::log("crown_auth"));

    let port = env::var("AUTH_SERVICE_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .expect("Invalid port number");

    println!("🔐 Crown Auth Service (Rust) starting on port {}", port);
    warp::serve(routes).run(([0, 0, 0, 0], port)).await;
}

async fn handle_login(login_req: LoginRequest) -> Result<impl warp::Reply, warp::Rejection> {
    // Simulate database lookup
    // In production, this would connect to MongoDB
    let user = simulate_user_lookup(&login_req.email).await;
    
    match user {
        Some(user_data) => {
            if verify(&login_req.password, &user_data.password_hash).unwrap_or(false) {
                let token = create_jwt_token(&user_data)?;
                let response = AuthResponse {
                    success: true,
                    message: "Login successful".to_string(),
                    token: Some(token),
                    user: Some(UserInfo {
                        id: user_data.id,
                        email: user_data.email,
                        first_name: user_data.first_name,
                        last_name: user_data.last_name,
                        role: user_data.role,
                    }),
                };
                Ok(warp::reply::json(&response))
            } else {
                let response = AuthResponse {
                    success: false,
                    message: "Invalid credentials".to_string(),
                    token: None,
                    user: None,
                };
                Ok(warp::reply::json(&response))
            }
        }
        None => {
            let response = AuthResponse {
                success: false,
                message: "User not found".to_string(),
                token: None,
                user: None,
            };
            Ok(warp::reply::json(&response))
        }
    }
}

async fn handle_register(register_req: RegisterRequest) -> Result<impl warp::Reply, warp::Rejection> {
    let password_hash = hash(&register_req.password, DEFAULT_COST).unwrap();
    let user_id = Uuid::new_v4().to_string();
    
    // Simulate user creation
    let user_data = UserData {
        id: user_id,
        email: register_req.email,
        first_name: register_req.first_name,
        last_name: register_req.last_name,
        password_hash,
        role: "user".to_string(),
    };
    
    let token = create_jwt_token(&user_data)?;
    let response = AuthResponse {
        success: true,
        message: "Registration successful".to_string(),
        token: Some(token),
        user: Some(UserInfo {
            id: user_data.id,
            email: user_data.email,
            first_name: user_data.first_name,
            last_name: user_data.last_name,
            role: user_data.role,
        }),
    };
    
    Ok(warp::reply::json(&response))
}

async fn handle_verify_token(auth_header: String) -> Result<impl warp::Reply, warp::Rejection> {
    if let Some(token) = auth_header.strip_prefix("Bearer ") {
        match verify_jwt_token(token) {
            Ok(claims) => {
                let response = serde_json::json!({
                    "valid": true,
                    "user_id": claims.user_id,
                    "email": claims.email,
                    "role": claims.role,
                    "expires_at": claims.exp
                });
                Ok(warp::reply::json(&response))
            }
            Err(_) => {
                let response = serde_json::json!({
                    "valid": false,
                    "error": "Invalid or expired token"
                });
                Ok(warp::reply::json(&response))
            }
        }
    } else {
        let response = serde_json::json!({
            "valid": false,
            "error": "Invalid authorization header format"
        });
        Ok(warp::reply::json(&response))
    }
}

fn create_jwt_token(user: &UserData) -> Result<String, warp::Rejection> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("Invalid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id.clone(),
        exp: expiration,
        iat: Utc::now().timestamp() as usize,
        user_id: user.id.clone(),
        email: user.email.clone(),
        role: user.role.clone(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|_| warp::reject::custom(AuthError::TokenCreationError))
}

fn verify_jwt_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let validation = Validation::new(Algorithm::HS256);
    
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
    .map(|data| data.claims)
}

#[derive(Debug)]
struct UserData {
    id: String,
    email: String,
    first_name: String,
    last_name: String,
    password_hash: String,
    role: String,
}

async fn simulate_user_lookup(email: &str) -> Option<UserData> {
    // Simulate database lookup
    // In production, connect to MongoDB here
    if email == "admin@crown.com" {
        Some(UserData {
            id: "admin-id".to_string(),
            email: email.to_string(),
            first_name: "Admin".to_string(),
            last_name: "User".to_string(),
            password_hash: hash("admin123", DEFAULT_COST).unwrap(),
            role: "admin".to_string(),
        })
    } else {
        None
    }
}

#[derive(Debug)]
struct AuthError {
    message: String,
}

impl AuthError {
    fn token_creation_error() -> Self {
        AuthError {
            message: "Failed to create token".to_string(),
        }
    }
}

impl warp::reject::Reject for AuthError {}

impl AuthError {
    const TokenCreationError: AuthError = AuthError {
        message: String::new(),
    };
}
