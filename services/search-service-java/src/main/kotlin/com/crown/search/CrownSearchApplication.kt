package com.crown.search

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.elasticsearch.repository.config.EnableReactiveElasticsearchRepositories
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories
import org.springframework.scheduling.annotation.EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.cache.annotation.EnableCaching
import org.springframework.web.reactive.config.EnableWebFlux

/**
 * Crown Search Service - High-Performance Search Engine
 * 
 * Features:
 * - Elasticsearch integration for full-text search
 * - Apache Lucene for advanced search algorithms
 * - Reactive programming with Spring WebFlux
 * - Real-time search suggestions and autocomplete
 * - Multi-language search support
 * - Fuzzy matching and spell correction
 * - Content ranking and personalized results
 * - High-performance caching with Redis
 * - Machine learning-based search relevance
 */
@SpringBootApplication
@EnableWebFlux
@EnableReactiveElasticsearchRepositories
@EnableReactiveMongoRepositories
@EnableAsync
@EnableScheduling
@EnableCaching
class CrownSearchApplication

fun main(args: Array<String>) {
    runApplication<CrownSearchApplication>(*args)
    
    println("""
    🔍 Crown Search Service (Java 21 + Kotlin) started successfully!
    
    ⚡ Features:
    - Elasticsearch full-text search
    - Apache Lucene advanced algorithms  
    - Reactive programming with WebFlux
    - Real-time search suggestions
    - Multi-language support
    - Fuzzy matching & spell correction
    - ML-based search relevance
    - High-performance Redis caching
    
    🌐 Endpoints:
    - /api/v1/search - Main search endpoint
    - /api/v1/suggest - Search suggestions
    - /api/v1/autocomplete - Real-time autocomplete
    - /health - Health check
    - /actuator - Spring Boot Actuator metrics
    """.trimIndent())
}
