package com.crown.search.controller

import com.crown.search.dto.*
import com.crown.search.service.SearchService
import com.crown.search.service.SuggestionService
import com.crown.search.service.AutocompleteService
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Flux
import reactor.core.publisher.Mono
import org.springframework.validation.annotation.Validated
import javax.validation.Valid
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Min
import javax.validation.constraints.Max
import io.micrometer.core.annotation.Timed
import org.springframework.security.access.prepost.PreAuthorize

/**
 * High-Performance Search Controller
 * Handles all search operations with reactive streams for optimal performance
 */
@RestController
@RequestMapping("/api/v1")
@Validated
class SearchController(
    private val searchService: SearchService,
    private val suggestionService: SuggestionService,
    private val autocompleteService: AutocompleteService
) {
    
    /**
     * Main search endpoint with advanced filtering and ranking
     */
    @GetMapping("/search")
    @Timed(value = "search.query.duration", description = "Time taken to execute search query")
    fun search(
        @RequestParam @NotBlank query: String,
        @RequestParam(defaultValue = "all") type: String,
        @RequestParam(defaultValue = "0") @Min(0) page: Int,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) size: Int,
        @RequestParam(defaultValue = "relevance") sortBy: String,
        @RequestParam(required = false) userId: String?,
        @RequestParam(required = false) filters: String?,
        @RequestParam(defaultValue = "false") includeHighlights: Boolean,
        @RequestParam(defaultValue = "false") includeFacets: Boolean
    ): Mono<SearchResponse> {
        
        val searchRequest = SearchRequest(
            query = query,
            type = SearchType.fromString(type),
            pagination = PaginationRequest(page, size),
            sortBy = SortType.fromString(sortBy),
            userId = userId,
            filters = filters?.let { parseFilters(it) } ?: emptyMap(),
            includeHighlights = includeHighlights,
            includeFacets = includeFacets
        )
        
        return searchService.search(searchRequest)
    }
    
    /**
     * Real-time search suggestions
     */
    @GetMapping("/suggest")
    @Timed(value = "search.suggest.duration", description = "Time taken to generate suggestions")
    fun suggest(
        @RequestParam @NotBlank query: String,
        @RequestParam(defaultValue = "10") @Min(1) @Max(50) limit: Int,
        @RequestParam(required = false) userId: String?
    ): Flux<SuggestionResponse> {
        
        return suggestionService.getSuggestions(query, limit, userId)
    }
    
    /**
     * Autocomplete endpoint for real-time typing assistance
     */
    @GetMapping("/autocomplete", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @Timed(value = "search.autocomplete.duration", description = "Time taken for autocomplete")
    fun autocomplete(
        @RequestParam @NotBlank partial: String,
        @RequestParam(defaultValue = "5") @Min(1) @Max(20) limit: Int,
        @RequestParam(required = false) userId: String?
    ): Flux<AutocompleteResponse> {
        
        return autocompleteService.getAutocomplete(partial, limit, userId)
    }
    
    /**
     * Advanced search with complex queries
     */
    @PostMapping("/search/advanced")
    @Timed(value = "search.advanced.duration", description = "Time taken for advanced search")
    @PreAuthorize("hasRole('USER')")
    fun advancedSearch(
        @Valid @RequestBody request: AdvancedSearchRequest
    ): Mono<SearchResponse> {
        
        return searchService.advancedSearch(request)
    }
    
    /**
     * Search within user's network (friends, following)
     */
    @GetMapping("/search/social")
    @Timed(value = "search.social.duration", description = "Time taken for social search")
    @PreAuthorize("hasRole('USER')")
    fun socialSearch(
        @RequestParam @NotBlank query: String,
        @RequestParam @NotBlank userId: String,
        @RequestParam(defaultValue = "0") @Min(0) page: Int,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) size: Int
    ): Mono<SearchResponse> {
        
        return searchService.socialSearch(query, userId, page, size)
    }
    
    /**
     * Search trends and popular queries
     */
    @GetMapping("/search/trends")
    @Timed(value = "search.trends.duration", description = "Time taken to get search trends")
    fun searchTrends(
        @RequestParam(defaultValue = "global") scope: String,
        @RequestParam(defaultValue = "24") @Min(1) @Max(168) hours: Int
    ): Flux<TrendingQuery> {
        
        return searchService.getSearchTrends(scope, hours)
    }
    
    /**
     * Similar content recommendations based on search
     */
    @GetMapping("/search/similar")
    @Timed(value = "search.similar.duration", description = "Time taken for similar content search")
    fun findSimilar(
        @RequestParam @NotBlank contentId: String,
        @RequestParam(defaultValue = "10") @Min(1) @Max(50) limit: Int,
        @RequestParam(required = false) userId: String?
    ): Flux<SimilarContentResponse> {
        
        return searchService.findSimilarContent(contentId, limit, userId)
    }
    
    /**
     * Search history for authenticated users
     */
    @GetMapping("/search/history")
    @Timed(value = "search.history.duration", description = "Time taken to get search history")
    @PreAuthorize("hasRole('USER')")
    fun searchHistory(
        @RequestParam @NotBlank userId: String,
        @RequestParam(defaultValue = "0") @Min(0) page: Int,
        @RequestParam(defaultValue = "50") @Min(1) @Max(100) size: Int
    ): Flux<SearchHistoryEntry> {
        
        return searchService.getSearchHistory(userId, page, size)
    }
    
    /**
     * Real-time search analytics
     */
    @GetMapping("/search/analytics")
    @Timed(value = "search.analytics.duration", description = "Time taken to get search analytics")
    @PreAuthorize("hasRole('ADMIN')")
    fun searchAnalytics(
        @RequestParam(defaultValue = "24") @Min(1) @Max(720) hours: Int
    ): Mono<SearchAnalytics> {
        
        return searchService.getSearchAnalytics(hours)
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    fun health(): Mono<Map<String, Any>> {
        return Mono.just(mapOf(
            "service" to "crown-search-service-java-kotlin",
            "status" to "healthy",
            "timestamp" to System.currentTimeMillis(),
            "features" to listOf(
                "Elasticsearch Integration",
                "Apache Lucene Advanced Search", 
                "Reactive Streams",
                "Real-time Suggestions",
                "Multi-language Support",
                "ML-based Relevance Scoring",
                "Social Network Search",
                "Search Analytics"
            )
        ))
    }
    
    private fun parseFilters(filtersString: String): Map<String, List<String>> {
        // Parse filter string like "category:posts,users;date:2023-01-01,2023-12-31"
        return filtersString.split(";")
            .associate { filter ->
                val parts = filter.split(":")
                if (parts.size == 2) {
                    parts[0] to parts[1].split(",")
                } else {
                    parts[0] to emptyList()
                }
            }
    }
}
