from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import nltk
from textblob import TextBlob
from langdetect import detect
import redis
import pymongo
from typing import List, Optional, Dict
import json
import os
from datetime import datetime, timedelta
import asyncio
import logging

# Download NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

app = FastAPI(title="Crown AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
sentiment_analyzer = None
content_classifier = None
recommendation_model = None

# Database connections
redis_client = None
mongo_client = None

class PostAnalysis(BaseModel):
    post_id: str
    content: str
    user_id: str

class SentimentResult(BaseModel):
    sentiment: str
    confidence: float
    emotions: Dict[str, float]

class ContentModerationResult(BaseModel):
    is_appropriate: bool
    confidence: float
    categories: List[str]
    risk_score: float

class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 10
    exclude_seen: bool = True

class UserInterest(BaseModel):
    user_id: str
    interests: List[str]
    interaction_history: List[Dict]

@app.on_event("startup")
async def startup_event():
    """Initialize models and database connections"""
    global sentiment_analyzer, content_classifier, redis_client, mongo_client
    
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    logger.info("🤖 Initializing Crown AI Service...")
    
    # Initialize Redis
    try:
        redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            db=0,
            decode_responses=True
        )
        redis_client.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
    
    # Initialize MongoDB
    try:
        mongo_client = pymongo.MongoClient(
            os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
        )
        mongo_client.admin.command('ping')
        logger.info("✅ MongoDB connected")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
    
    # Initialize ML models
    try:
        # Sentiment Analysis Model
        sentiment_analyzer = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            device=-1  # Use CPU
        )
        logger.info("✅ Sentiment analyzer loaded")
        
        # Content Classification Model
        content_classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            device=-1
        )
        logger.info("✅ Content classifier loaded")
        
    except Exception as e:
        logger.error(f"❌ Model loading failed: {e}")
    
    logger.info("🚀 Crown AI Service ready!")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "crown-ai-service-python",
        "timestamp": datetime.utcnow().isoformat(),
        "models_loaded": {
            "sentiment_analyzer": sentiment_analyzer is not None,
            "content_classifier": content_classifier is not None
        }
    }

@app.post("/analyze/sentiment", response_model=SentimentResult)
async def analyze_sentiment(analysis: PostAnalysis):
    """Analyze sentiment of post content"""
    if not sentiment_analyzer:
        raise HTTPException(status_code=503, detail="Sentiment analyzer not available")
    
    try:
        # Detect language
        try:
            lang = detect(analysis.content)
        except:
            lang = 'unknown'
        
        # Get sentiment from transformer model
        result = sentiment_analyzer(analysis.content)
        
        # Get detailed emotions using TextBlob
        blob = TextBlob(analysis.content)
        
        # Convert to standardized format
        sentiment_label = result[0]['label'].lower()
        confidence = result[0]['score']
        
        # Map transformer labels to our format
        if sentiment_label in ['positive', 'pos']:
            sentiment = 'positive'
        elif sentiment_label in ['negative', 'neg']:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Calculate emotion scores (simplified)
        emotions = {
            "joy": max(0, blob.sentiment.polarity) if sentiment == 'positive' else 0,
            "anger": abs(min(0, blob.sentiment.polarity)) if sentiment == 'negative' else 0,
            "sadness": abs(min(0, blob.sentiment.polarity)) * 0.7 if sentiment == 'negative' else 0,
            "fear": abs(min(0, blob.sentiment.polarity)) * 0.3 if sentiment == 'negative' else 0,
            "surprise": abs(blob.sentiment.polarity) * 0.5 if sentiment == 'neutral' else 0
        }
        
        # Cache result
        cache_key = f"sentiment:{hash(analysis.content)}"
        result_data = {
            "sentiment": sentiment,
            "confidence": confidence,
            "emotions": emotions,
            "language": lang,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if redis_client:
            redis_client.setex(cache_key, 3600, json.dumps(result_data))
        
        return SentimentResult(
            sentiment=sentiment,
            confidence=confidence,
            emotions=emotions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

@app.post("/moderate/content", response_model=ContentModerationResult)
async def moderate_content(analysis: PostAnalysis):
    """Moderate content for inappropriate material"""
    if not content_classifier:
        raise HTTPException(status_code=503, detail="Content classifier not available")
    
    try:
        # Check cache first
        cache_key = f"moderation:{hash(analysis.content)}"
        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                cached_data = json.loads(cached)
                return ContentModerationResult(**cached_data)
        
        # Run content classification
        result = content_classifier(analysis.content)
        
        # Analyze toxicity
        is_toxic = result[0]['label'] == 'TOXIC'
        confidence = result[0]['score']
        
        # Calculate risk categories
        categories = []
        risk_score = 0
        
        if is_toxic:
            risk_score = confidence
            categories.append("toxicity")
            
            # Additional checks for specific categories
            content_lower = analysis.content.lower()
            
            # Hate speech detection
            hate_words = ['hate', 'racist', 'homophobic', 'sexist']
            if any(word in content_lower for word in hate_words):
                categories.append("hate_speech")
                risk_score += 0.2
            
            # Violence detection
            violence_words = ['kill', 'murder', 'violence', 'attack']
            if any(word in content_lower for word in violence_words):
                categories.append("violence")
                risk_score += 0.3
            
            # Adult content detection
            adult_words = ['explicit', 'nsfw', 'adult']
            if any(word in content_lower for word in adult_words):
                categories.append("adult_content")
                risk_score += 0.1
        
        risk_score = min(risk_score, 1.0)
        is_appropriate = risk_score < 0.5
        
        result_data = {
            "is_appropriate": is_appropriate,
            "confidence": confidence,
            "categories": categories,
            "risk_score": risk_score
        }
        
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 7200, json.dumps(result_data))
        
        return ContentModerationResult(**result_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content moderation failed: {str(e)}")

@app.post("/recommend/posts")
async def recommend_posts(request: RecommendationRequest):
    """Generate personalized post recommendations"""
    try:
        if not mongo_client:
            raise HTTPException(status_code=503, detail="Database not available")
        
        db = mongo_client['crown-social']
        
        # Get user's interaction history
        user_interactions = list(db.interactions.find({
            "user_id": request.user_id
        }).limit(100).sort("timestamp", -1))
        
        # Get all posts
        posts = list(db.posts.find({
            "isActive": True,
            "visibility": {"$in": ["public", "friends"]}
        }).limit(1000).sort("createdAt", -1))
        
        if not posts:
            return {"recommendations": [], "algorithm": "fallback"}
        
        # Extract user preferences from interactions
        user_liked_content = []
        user_categories = []
        
        for interaction in user_interactions:
            if interaction.get('type') == 'like':
                # Find the liked post content
                post = db.posts.find_one({"_id": interaction.get('post_id')})
                if post:
                    user_liked_content.append(post.get('content', ''))
                    user_categories.extend(post.get('tags', []))
        
        if not user_liked_content:
            # Fallback: return trending posts
            trending_posts = sorted(posts, key=lambda x: (
                x.get('likesCount', 0) + 
                x.get('commentsCount', 0) * 2 + 
                x.get('sharesCount', 0) * 3
            ), reverse=True)[:request.limit]
            
            return {
                "recommendations": [str(p['_id']) for p in trending_posts],
                "algorithm": "trending_fallback",
                "count": len(trending_posts)
            }
        
        # Content-based filtering using TF-IDF
        all_content = user_liked_content + [post.get('content', '') for post in posts]
        
        vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(all_content)
        
        # Calculate similarity between user profile and posts
        user_profile = tfidf_matrix[:len(user_liked_content)].mean(axis=0)
        post_vectors = tfidf_matrix[len(user_liked_content):]
        
        similarities = cosine_similarity(user_profile, post_vectors).flatten()
        
        # Combine with engagement scores
        scored_posts = []
        for i, post in enumerate(posts):
            engagement_score = (
                post.get('likesCount', 0) * 0.3 +
                post.get('commentsCount', 0) * 0.4 +
                post.get('sharesCount', 0) * 0.3
            )
            
            # Normalize engagement score
            engagement_score = min(engagement_score / 100, 1.0)
            
            # Combined score
            final_score = similarities[i] * 0.7 + engagement_score * 0.3
            
            scored_posts.append({
                "post_id": str(post['_id']),
                "score": final_score,
                "content_similarity": similarities[i],
                "engagement_score": engagement_score
            })
        
        # Sort by score and exclude seen posts if requested
        if request.exclude_seen:
            seen_post_ids = {str(i.get('post_id')) for i in user_interactions}
            scored_posts = [p for p in scored_posts if p['post_id'] not in seen_post_ids]
        
        scored_posts.sort(key=lambda x: x['score'], reverse=True)
        
        recommendations = [p['post_id'] for p in scored_posts[:request.limit]]
        
        # Cache recommendations
        cache_key = f"recommendations:{request.user_id}"
        if redis_client:
            redis_client.setex(cache_key, 1800, json.dumps({
                "recommendations": recommendations,
                "generated_at": datetime.utcnow().isoformat()
            }))
        
        return {
            "recommendations": recommendations,
            "algorithm": "content_based_collaborative",
            "count": len(recommendations),
            "user_liked_items": len(user_liked_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {str(e)}")

@app.post("/analyze/user-interests")
async def analyze_user_interests(user_interest: UserInterest):
    """Analyze and update user interests based on interactions"""
    try:
        if not mongo_client:
            raise HTTPException(status_code=503, detail="Database not available")
        
        db = mongo_client['crown-social']
        
        # Analyze interaction patterns
        interaction_analysis = {}
        content_keywords = []
        
        for interaction in user_interest.interaction_history:
            interaction_type = interaction.get('type')
            if interaction_type not in interaction_analysis:
                interaction_analysis[interaction_type] = 0
            interaction_analysis[interaction_type] += 1
            
            # Extract content keywords if available
            if 'content' in interaction:
                blob = TextBlob(interaction['content'])
                content_keywords.extend([word.lower() for word in blob.words if len(word) > 3])
        
        # Find most common keywords
        from collections import Counter
        keyword_counts = Counter(content_keywords)
        top_interests = [word for word, count in keyword_counts.most_common(20)]
        
        # Update user profile in database
        db.user_profiles.update_one(
            {"user_id": user_interest.user_id},
            {
                "$set": {
                    "interests": top_interests,
                    "interaction_patterns": interaction_analysis,
                    "last_analysis": datetime.utcnow(),
                }
            },
            upsert=True
        )
        
        return {
            "user_id": user_interest.user_id,
            "extracted_interests": top_interests,
            "interaction_patterns": interaction_analysis,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interest analysis failed: {str(e)}")

@app.get("/analytics/engagement/{user_id}")
async def get_engagement_analytics(user_id: str, days: int = 7):
    """Get user engagement analytics"""
    try:
        if not mongo_client:
            raise HTTPException(status_code=503, detail="Database not available")
        
        db = mongo_client['crown-social']
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get user's posts in the time range
        posts = list(db.posts.find({
            "author": user_id,
            "createdAt": {"$gte": start_date, "$lte": end_date}
        }))
        
        # Calculate metrics
        total_posts = len(posts)
        total_likes = sum(post.get('likesCount', 0) for post in posts)
        total_comments = sum(post.get('commentsCount', 0) for post in posts)
        total_shares = sum(post.get('sharesCount', 0) for post in posts)
        total_views = sum(post.get('viewsCount', 0) for post in posts)
        
        avg_engagement = (total_likes + total_comments + total_shares) / max(total_posts, 1)
        
        # Engagement trend analysis
        daily_engagement = {}
        for post in posts:
            date_key = post['createdAt'].strftime('%Y-%m-%d')
            if date_key not in daily_engagement:
                daily_engagement[date_key] = 0
            daily_engagement[date_key] += (
                post.get('likesCount', 0) + 
                post.get('commentsCount', 0) + 
                post.get('sharesCount', 0)
            )
        
        return {
            "user_id": user_id,
            "period_days": days,
            "metrics": {
                "total_posts": total_posts,
                "total_likes": total_likes,
                "total_comments": total_comments,
                "total_shares": total_shares,
                "total_views": total_views,
                "avg_engagement_per_post": avg_engagement
            },
            "daily_engagement": daily_engagement,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    print(f"🤖 Crown AI Service (Python) starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
