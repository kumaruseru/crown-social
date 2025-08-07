/**
 * News.js - Quản lý trang tin tức với RSS feeds
 * Crown Social Network
 */

class NewsManager {
    constructor() {
        this.currentCategory = 'latest';
        this.currentPage = 1;
        this.isLoading = false;
        this.searchTimeout = null;
        
        // Store articles data for click handling
        this.featuredArticles = [];
        this.latestArticles = [];
        this.hotTopicArticles = [];
        
        // Hot topics scroll state
        this.hotTopicsScrollIndex = 0;
        this.hotTopicsItemWidth = 300; // width + gap
        
        // Time refresh interval
        this.timeRefreshInterval = null;
        
        this.init();
    }

    async init() {
        console.log('🛠️ Khởi tạo News Manager...');
        
        try {
            await this.loadCategories();
            await this.loadFeaturedNews();
            await this.loadLatestNews();
            await this.loadHotTopics();
            
            this.setupEventListeners();
            this.setupSearch();
            this.startTimeRefresh();
            
            console.log('✅ News Manager đã sẵn sàng!');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo News Manager:', error);
            this.showError('Không thể tải tin tức. Vui lòng thử lại sau.');
        }
    }

    // Load danh sách categories
    async loadCategories() {
        try {
            console.log('🔄 Loading categories...');
            const response = await fetch('/api/news/categories');
            const data = await response.json();

            if (data.success && data.data) {
                this.renderCategories(data.data);
            } else {
                console.log('Using fallback categories');
                // Fallback categories nếu API fail
                const fallbackCategories = [
                    { id: 'latest', name: 'Mới nhất', active: true },
                    { id: 'world', name: 'Thế giới' },
                    { id: 'technology', name: 'Công nghệ' },
                    { id: 'sports', name: 'Thể thao' },
                    { id: 'business', name: 'Kinh doanh' },
                    { id: 'entertainment', name: 'Giải trí' },
                    { id: 'health', name: 'Sức khỏe' }
                ];
                this.renderCategories(fallbackCategories);
            }
        } catch (error) {
            console.error('❌ Lỗi load categories:', error);
            // Fallback categories khi có lỗi
            const fallbackCategories = [
                { id: 'latest', name: 'Mới nhất', active: true },
                { id: 'world', name: 'Thế giới' },
                { id: 'technology', name: 'Công nghệ' },
                { id: 'sports', name: 'Thể thao' },
                { id: 'business', name: 'Kinh doanh' },
                { id: 'entertainment', name: 'Giải trí' },
                { id: 'health', name: 'Sức khỏe' }
            ];
            this.renderCategories(fallbackCategories);
        }
    }

    // Load tin tức nổi bật
    async loadFeaturedNews() {
        try {
            console.log('🔄 Loading featured news...');
            const response = await fetch('/api/news/latest?limit=4');
            const data = await response.json();
            
            console.log('Featured news response:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                this.featuredArticles = data.data; // Store for click handling
                this.renderFeaturedNews(data.data);
            } else {
                console.log('No featured news available');
                this.showNoFeaturedNews();
            }
        } catch (error) {
            console.error('❌ Lỗi load featured news:', error);
            this.showNoFeaturedNews();
        }
    }

    // Load tin tức mới nhất  
    async loadLatestNews() {
        try {
            console.log('🔄 Loading latest news...');
            const response = await fetch('/api/news/latest?limit=10&offset=4');
            const data = await response.json();
            
            console.log('Latest news response:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                this.latestArticles = data.data; // Store for click handling
                this.renderLatestNews(data.data);
            } else {
                console.log('No latest news available');
                this.showNoLatestNews();
            }
        } catch (error) {
            console.error('❌ Lỗi load latest news:', error);
            this.showNoLatestNews();
        }
    }

    // Load hot topics
    async loadHotTopics() {
        try {
            console.log('🔄 Loading hot topics...');
            const response = await fetch('/api/news/latest?limit=8');
            const data = await response.json();
            
            console.log('Hot topics response:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                this.hotTopicArticles = data.data; // Store for click handling
                this.renderHotTopics(data.data);
            } else {
                console.log('No hot topics available');
                this.showNoHotTopics();
            }
        } catch (error) {
            console.error('❌ Lỗi load hot topics:', error);
            this.showNoHotTopics();
        }
    }

    // Render categories
    renderCategories(categories) {
        const categoryContainer = document.getElementById('category-filters');
        if (!categoryContainer) return;

        categoryContainer.innerHTML = categories.map(cat => `
            <button class="news-category px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat.active ? 'bg-yellow-400 text-black' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }" data-category="${cat.id}">
                ${cat.name}
            </button>
        `).join('');
    }

    // Render featured news
    renderFeaturedNews(articles) {
        this.featuredArticles = articles; // Store for time updates
        const container = document.getElementById('featured-news');
        if (!container) return;

        if (!articles || articles.length === 0) {
            this.showNoFeaturedNews();
            return;
        }

        container.innerHTML = articles.map((article, index) => {
            const colSpan = index === 0 ? 'lg:col-span-2' : '';
            const rowSpan = index === 0 ? 'lg:row-span-2' : '';
            
            // Generate better placeholder based on source
            const getPlaceholderImage = (source, title) => {
                const colors = {
                    'VnExpress': '1E40AF',
                    'Tuổi Trẻ': '059669', 
                    'Thanh Niên': 'DC2626',
                    'Tinhte': '7C3AED',
                    'default': '1E3A8A'
                };
                const color = colors[source] || colors.default;
                const shortTitle = source || 'Crown News';
                return `https://via.placeholder.com/800x400/${color}/FFFFFF?text=${encodeURIComponent(shortTitle)}`;
            };
            
            const imageUrl = article.image && article.image !== 'null' && article.image.trim() !== '' 
                ? article.image 
                : getPlaceholderImage(article.source, article.title);
                
            console.log(`Article ${index}: ${article.title.substring(0, 50)}... Image: ${imageUrl}`);
            
            return `
                <article class="featured-article ${colSpan} ${rowSpan} bg-slate-800/80 rounded-lg overflow-hidden hover:bg-slate-700/80 transition-colors cursor-pointer" data-id="${article._id}">
                    <div class="relative h-48 ${index === 0 ? 'lg:h-full' : ''}">
                        <img src="${imageUrl}" 
                             alt="${article.title}" 
                             class="w-full h-full object-cover"
                             onerror="console.log('Image failed:', '${imageUrl}'); this.onerror=null; this.src='https://via.placeholder.com/800x400/1E3A8A/FFFFFF?text=Crown+News'"
                             onload="console.log('Image loaded:', '${imageUrl}')"
                             loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div class="absolute bottom-4 left-4 right-4">
                            <div class="text-yellow-400 text-xs font-medium mb-2 uppercase">${article.source || 'Crown News'}</div>
                            <h3 class="text-white font-bold ${index === 0 ? 'text-xl lg:text-2xl' : 'text-lg'} leading-tight mb-2">${article.title}</h3>
                            <div class="article-time text-slate-300 text-sm" title="${this.getDetailedTime(article.publishedAt || article.createdAt)}">${this.timeAgo(article.publishedAt || article.createdAt)}</div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    // Render hot topics
    renderHotTopics(articles) {
        this.hotTopicArticles = articles; // Store for time updates
        const container = document.getElementById('hot-topics');
        if (!container) return;

        if (!articles || articles.length === 0) {
            this.showNoHotTopics();
            return;
        }

        container.innerHTML = articles.map((article, index) => `
            <div class="hot-topic-item flex-shrink-0 w-72 bg-slate-800/80 rounded-lg p-4 hover:bg-slate-700/80 transition-colors cursor-pointer" data-id="${article._id}">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0 text-yellow-400 font-bold text-lg">${String(index + 1).padStart(2, '0')}</div>
                    <div class="min-w-0">
                        <h4 class="text-white font-semibold text-sm leading-tight mb-1">${article.title}</h4>
                        <p class="text-slate-400 text-xs leading-relaxed">${article.description?.substring(0, 80) || article.title.substring(0, 80)}...</p>
                        <div class="article-time text-slate-500 text-xs mt-2" title="${this.getDetailedTime(article.publishedAt || article.createdAt)}">${this.timeAgo(article.publishedAt || article.createdAt)}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Reset scroll position
        this.hotTopicsScrollIndex = 0;
        container.style.transform = 'translateX(0px)';
        
        // Update navigation buttons
        this.updateHotTopicsNavigation();
    }

    // Render latest news
    renderLatestNews(articles) {
        const container = document.getElementById('latest-news');
        if (!container) return;

        if (!articles || articles.length === 0) {
            this.showNoLatestNews();
            return;
        }

        container.innerHTML = articles.map(article => {
            // Generate better placeholder based on source
            const getPlaceholderImage = (source, title) => {
                const colors = {
                    'VnExpress': '1E40AF',
                    'Tuổi Trẻ': '059669', 
                    'Thanh Niên': 'DC2626',
                    'Tinhte': '7C3AED',
                    'Sức Khỏe Đời Sống': '059669',
                    'default': '1E3A8A'
                };
                const color = colors[source] || colors.default;
                const shortTitle = source || 'Crown News';
                return `https://via.placeholder.com/120x80/${color}/FFFFFF?text=${encodeURIComponent(shortTitle)}`;
            };
            
            const imageUrl = article.image && article.image !== 'null' && article.image.trim() !== '' 
                ? article.image 
                : getPlaceholderImage(article.source, article.title);
                
            return `
                <article class="latest-news-item flex items-start space-x-4 bg-slate-800/80 rounded-lg p-4 hover:bg-slate-700/80 transition-colors cursor-pointer" data-id="${article._id}">
                    <div class="flex-shrink-0">
                        <img src="${imageUrl}" 
                             alt="${article.title}" 
                             class="w-20 h-14 object-cover rounded-md"
                             onerror="console.log('Latest news image failed:', '${imageUrl}'); this.onerror=null; this.src='https://via.placeholder.com/120x80/1E3A8A/FFFFFF?text=News'"
                             loading="lazy">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-yellow-400 text-xs font-medium mb-1 uppercase">${article.source || 'Crown News'}</div>
                        <h3 class="text-white font-semibold text-base leading-tight mb-2">${article.title}</h3>
                        <p class="text-slate-400 text-sm leading-relaxed mb-2">${article.description?.substring(0, 120) || ''}...</p>
                        <div class="text-slate-500 text-xs" title="${this.getDetailedTime(article.publishedAt || article.createdAt)}">${this.timeAgo(article.publishedAt || article.createdAt)}</div>
                    </div>
                </article>
            `;
        }).join('');
    }

    // Show no content messages
    showNoFeaturedNews() {
        const container = document.getElementById('featured-news');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
                    </svg>
                    <p>Chưa có tin nổi bật</p>
                </div>
            `;
        }
    }

    showNoLatestNews() {
        const container = document.getElementById('latest-news');
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-slate-400">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>Chưa có tin mới nhất</p>
                </div>
            `;
        }
    }

    showNoHotTopics() {
        const container = document.getElementById('hot-topics');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                    </svg>
                    <p>Chưa có chủ đề nóng hổi</p>
                </div>
            `;
        }
    }

    // Event listeners
    setupEventListeners() {
        // Category click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('news-category')) {
                this.handleCategoryChange(e.target.dataset.category);
            }
        });

        // News item click
        document.addEventListener('click', (e) => {
            const newsItem = e.target.closest('.featured-article, .latest-news-item, .hot-topic-item');
            if (newsItem && newsItem.dataset.id) {
                this.openNewsDetail(newsItem.dataset.id);
            }
        });

        // Hot topics navigation
        const prevBtn = document.getElementById('hot-topics-prev');
        const nextBtn = document.getElementById('hot-topics-next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.scrollHotTopics('prev'));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.scrollHotTopics('next'));
        }

        // Infinite scroll
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
                this.loadMoreNews();
            }
        });
        
        // Handle window resize for hot topics
        window.addEventListener('resize', () => {
            this.updateHotTopicsNavigation();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    // Search functionality
    setupSearch() {
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 500);
            });
        }
    }

    // Handle category change
    async handleCategoryChange(category) {
        if (this.isLoading || category === this.currentCategory) return;

        this.currentCategory = category;
        this.currentPage = 1;

        // Update active category
        document.querySelectorAll('.news-category').forEach(cat => {
            if (cat.dataset.category === category) {
                cat.className = 'news-category px-4 py-2 rounded-full text-sm font-medium transition-colors bg-yellow-400 text-black';
            } else {
                cat.className = 'news-category px-4 py-2 rounded-full text-sm font-medium transition-colors bg-slate-800/80 text-slate-300 hover:bg-slate-700';
            }
        });

        // Load news for category
        await this.loadNewsByCategory(category);
    }

    // Load news by category
    async loadNewsByCategory(category) {
        try {
            this.isLoading = true;
            console.log(`🔄 Loading news for category: ${category}`);
            
            let endpoint = '/api/news/latest?limit=10';
            if (category !== 'latest') {
                endpoint = `/api/news/category/${category}?limit=10`;
            }
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.latestArticles = data.data; // Store for click handling
                this.renderLatestNews(data.data);
            } else {
                this.showNoLatestNews();
            }
        } catch (error) {
            console.error(`❌ Lỗi load news for category ${category}:`, error);
            this.showNoLatestNews();
        } finally {
            this.isLoading = false;
        }
    }

    // Search functionality
    async performSearch(query) {
        if (!query.trim()) {
            this.loadLatestNews();
            return;
        }

        try {
            console.log(`🔍 Searching: ${query}`);
            const response = await fetch(`/api/news/search?q=${encodeURIComponent(query)}&limit=10`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.latestArticles = data.data; // Store for click handling
                this.renderLatestNews(data.data);
            } else {
                this.showNoLatestNews();
            }
        } catch (error) {
            console.error('❌ Lỗi search:', error);
            this.showNoLatestNews();
        }
    }

    // Load more news (infinite scroll)
    async loadMoreNews() {
        if (this.isLoading) return;

        this.currentPage++;
        await this.loadNewsByCategory(this.currentCategory);
    }

    // Open news detail
    openNewsDetail(newsId) {
        console.log('Opening news detail:', newsId);
        
        // Tìm bài viết trong dữ liệu hiện tại
        const allArticles = [
            ...this.featuredArticles || [],
            ...this.latestArticles || [],
            ...this.hotTopicArticles || []
        ];
        
        const article = allArticles.find(a => a._id === newsId || a.id === newsId);
        
        if (article && article.link) {
            // Mở link gốc trong tab mới
            window.open(article.link, '_blank', 'noopener,noreferrer');
        } else {
            // Nếu không có link, fetch từ API
            fetch(`/api/news/${newsId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.data && data.data.link) {
                        window.open(data.data.link, '_blank', 'noopener,noreferrer');
                    } else {
                        alert('Không thể mở bài viết. Link không khả dụng.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching article:', error);
                    alert('Có lỗi khi mở bài viết.');
                });
        }
    }

    // Start time refresh interval
    startTimeRefresh() {
        // Clear existing interval if any
        if (this.timeRefreshInterval) {
            clearInterval(this.timeRefreshInterval);
        }
        
        // Update time displays every minute
        this.timeRefreshInterval = setInterval(() => {
            this.updateTimeDisplays();
        }, 60000); // Update every 60 seconds
        
        console.log('🕒 Time refresh started');
    }

    // Update all time displays
    updateTimeDisplays() {
        try {
            // Get stored article data and update their time displays
            const allContainers = [
                { articles: this.featuredArticles, selector: '.featured-article' },
                { articles: this.latestArticles, selector: '.latest-news-item' },
                { articles: this.hotTopicArticles, selector: '.hot-topic-item' }
            ];

            allContainers.forEach(({ articles, selector }) => {
                if (!articles) return;
                
                const elements = document.querySelectorAll(selector);
                elements.forEach((element, index) => {
                    const article = articles[index];
                    if (!article) return;
                    
                    const timeElement = element.querySelector('[title*="("]');
                    if (timeElement) {
                        const publishDate = article.publishedAt || article.createdAt;
                        if (publishDate) {
                            const newTimeAgo = this.timeAgo(publishDate);
                            const newDetailedTime = this.getDetailedTime(publishDate);
                            
                            timeElement.textContent = newTimeAgo;
                            timeElement.setAttribute('title', newDetailedTime);
                        }
                    }
                });
            });
            
            console.log('⏰ Time displays updated');
        } catch (error) {
            console.error('Error updating time displays:', error);
        }
    }

    // Cleanup function
    cleanup() {
        if (this.timeRefreshInterval) {
            clearInterval(this.timeRefreshInterval);
            this.timeRefreshInterval = null;
            console.log('🧹 Time refresh interval cleared');
        }
    }

    // Hot topics scroll functionality
    scrollHotTopics(direction) {
        const container = document.getElementById('hot-topics');
        if (!container) return;
        
        const containerWidth = container.parentElement.clientWidth;
        const itemsVisible = Math.floor(containerWidth / this.hotTopicsItemWidth);
        const maxScroll = Math.max(0, this.hotTopicArticles.length - itemsVisible);
        
        if (direction === 'next' && this.hotTopicsScrollIndex < maxScroll) {
            this.hotTopicsScrollIndex++;
        } else if (direction === 'prev' && this.hotTopicsScrollIndex > 0) {
            this.hotTopicsScrollIndex--;
        }
        
        const translateX = -(this.hotTopicsScrollIndex * this.hotTopicsItemWidth);
        container.style.transform = `translateX(${translateX}px)`;
        
        this.updateHotTopicsNavigation();
    }
    
    // Update navigation button states
    updateHotTopicsNavigation() {
        const prevBtn = document.getElementById('hot-topics-prev');
        const nextBtn = document.getElementById('hot-topics-next');
        const container = document.getElementById('hot-topics');
        
        if (!prevBtn || !nextBtn || !container) return;
        
        const containerWidth = container.parentElement.clientWidth;
        const itemsVisible = Math.floor(containerWidth / this.hotTopicsItemWidth);
        const maxScroll = Math.max(0, this.hotTopicArticles.length - itemsVisible);
        
        // Update button states
        prevBtn.disabled = this.hotTopicsScrollIndex === 0;
        nextBtn.disabled = this.hotTopicsScrollIndex >= maxScroll;
        
        // Update button styles
        if (prevBtn.disabled) {
            prevBtn.className = 'w-10 h-10 bg-slate-900/50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-not-allowed';
        } else {
            prevBtn.className = 'w-10 h-10 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors';
        }
        
        if (nextBtn.disabled) {
            nextBtn.className = 'w-10 h-10 bg-slate-900/50 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-not-allowed';
        } else {
            nextBtn.className = 'w-10 h-10 bg-slate-800/80 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-colors';
        }
    }

    // Utility function for time ago
    timeAgo(date) {
        if (!date) return 'Vừa xong';
        
        try {
            const now = new Date();
            const articleDate = new Date(date);
            
            // Check if date is valid
            if (isNaN(articleDate.getTime())) {
                return 'Thời gian không xác định';
            }
            
            const diffInMs = now - articleDate;
            const diffInSeconds = Math.floor(diffInMs / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);
            const diffInWeeks = Math.floor(diffInDays / 7);
            const diffInMonths = Math.floor(diffInDays / 30);
            const diffInYears = Math.floor(diffInDays / 365);

            // Handle future dates (in case of timezone issues)
            if (diffInMs < 0) {
                return 'Vừa xong';
            }

            // Time formatting logic
            if (diffInSeconds < 30) return 'Vừa xong';
            if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
            if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
            if (diffInHours < 24) return `${diffInHours} giờ trước`;
            if (diffInDays === 1) return 'Hôm qua';
            if (diffInDays < 7) return `${diffInDays} ngày trước`;
            if (diffInWeeks === 1) return '1 tuần trước';
            if (diffInWeeks < 4) return `${diffInWeeks} tuần trước`;
            if (diffInMonths === 1) return '1 tháng trước';
            if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
            if (diffInYears === 1) return '1 năm trước';
            if (diffInYears < 2) return `${diffInYears} năm trước`;
            
            // For very old articles, show exact date
            return this.formatExactDate(articleDate);
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Thời gian không xác định';
        }
    }

    // Format exact date for old articles
    formatExactDate(date) {
        try {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Ho_Chi_Minh'
            };
            return date.toLocaleDateString('vi-VN', options);
        } catch (error) {
            // Fallback to basic format
            return date.toLocaleDateString('vi-VN');
        }
    }

    // Get formatted publish time with full details
    getDetailedTime(date) {
        if (!date) return 'Thời gian không xác định';
        
        try {
            const articleDate = new Date(date);
            
            if (isNaN(articleDate.getTime())) {
                return 'Thời gian không xác định';
            }
            
            const options = {
                year: 'numeric',
                month: 'numeric', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Ho_Chi_Minh',
                hour12: false
            };
            
            const formatted = articleDate.toLocaleString('vi-VN', options);
            return `${formatted} (${this.timeAgo(date)})`;
        } catch (error) {
            console.error('Error formatting detailed time:', error);
            return 'Thời gian không xác định';
        }
    }

    // Show error message
    showError(message) {
        console.error('News Manager Error:', message);
        // Show error in UI
        const containers = ['featured-news', 'hot-topics', 'latest-news'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12 text-red-400">
                        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                        <p>${message}</p>
                    </div>
                `;
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing News Manager...');
    
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.newsManager = new NewsManager();
    }, 100);
});
