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
        
        this.init();
    }

    async init() {
        console.log('�️ Khởi tạo News Manager...');
        
        try {
            await this.loadCategories();
            await this.loadFeaturedNews();
            await this.loadLatestNews();
            await this.loadTrendingNews();
            
            this.setupEventListeners();
            this.setupSearch();
            
            console.log('✅ News Manager đã sẵn sàng!');
        } catch (error) {
            console.error('❌ Lỗi khởi tạo News Manager:', error);
            this.showError('Không thể tải tin tức. Vui lòng thử lại sau.');
        }
    }

    // Load danh sách categories
    async loadCategories() {
        try {
            const response = await fetch('/api/news/categories');
            const data = await response.json();

            if (data.success) {
                this.renderCategories(data.data);
            }
        } catch (error) {
            console.error('❌ Lỗi load categories:', error);
        }
    }
    const categories = [
        { id: 'all', name: 'Tất cả', active: true },
        { id: 'world', name: 'Thế giới' },
        { id: 'tech', name: 'Công nghệ' },
        { id: 'sports', name: 'Thể thao' },
        { id: 'business', name: 'Kinh doanh' },
        { id: 'entertainment', name: 'Giải trí' },
        { id: 'health', name: 'Sức khỏe' }
    ];

    // Mock data for featured news
    const featuredNewsData = [
        {
            id: 1,
            title: 'Hội nghị thượng đỉnh toàn cầu đạt được thỏa thuận lịch sử về khí hậu',
            category: 'THẾ GIỚI',
            source: 'VNExpress',
            timeAgo: '2 giờ trước',
            image: 'https://placehold.co/800x800/1E3A8A/BFDBFE?text=Tin+nổi+bật',
            featured: true,
            categoryId: 'world'
        },
        {
            id: 2,
            title: 'Chip AI thế hệ mới ra mắt, hứa hẹn hiệu năng đột phá',
            category: 'CÔNG NGHỆ',
            source: 'Tuổi Trẻ',
            timeAgo: '5 giờ trước',
            image: 'https://placehold.co/800x400/047857/A7F3D0?text=Công+nghệ',
            categoryId: 'tech'
        },
        {
            id: 3,
            title: 'Việt Nam giành chiến thắng kịch tính ở phút bù giờ',
            category: 'THỂ THAO',
            source: 'VTV Sport',
            timeAgo: '1 giờ trước',
            image: 'https://placehold.co/400x400/991B1B/FECACA?text=Thể+thao',
            categoryId: 'sports'
        },
        {
            id: 4,
            title: 'Thị trường chứng khoán tăng trưởng mạnh mẽ',
            category: 'KINH DOANH',
            source: 'CafeF',
            timeAgo: '3 giờ trước',
            image: 'https://placehold.co/400x400/92400E/FDE68A?text=Kinh+doanh',
            categoryId: 'business'
        }
    ];

    // Mock data for hot topics
    const hotTopicsData = [
        {
            id: 1,
            rank: '01',
            title: '#BấtĐộngSản2025',
            description: 'Thị trường đang có nhiều biến động khó lường, các chuyên gia đưa ra nhiều dự báo trái chiều.'
        },
        {
            id: 2,
            rank: '02',
            title: '#DuLịchHè',
            description: 'Các địa điểm ven biển và vùng núi cao đang là lựa chọn hàng đầu của du khách trong và ngoài nước.'
        },
        {
            id: 3,
            rank: '03',
            title: '#StartUpViệt',
            description: 'Nhiều công ty khởi nghiệp công nghệ nhận được vốn đầu tư lớn từ các quỹ quốc tế.'
        },
        {
            id: 4,
            rank: '04',
            title: '#PhimChiếuRạp',
            description: 'Bom tấn hành động mới phá vỡ kỷ lục phòng vé chỉ sau 3 ngày công chiếu.'
        }
    ];

    // Mock data for latest news
    const latestNewsData = [
        {
            id: 5,
            title: 'Công nghệ blockchain được ứng dụng rộng rãi trong ngành tài chính',
            category: 'CÔNG NGHỆ',
            source: 'VnEconomy',
            timeAgo: '30 phút trước',
            excerpt: 'Các ngân hàng lớn đang triển khai công nghệ blockchain để cải thiện bảo mật và tốc độ giao dịch.',
            categoryId: 'tech'
        },
        {
            id: 6,
            title: 'Giải tennis quốc tế diễn ra sôi nổi tại TP.HCM',
            category: 'THỂ THAO',
            source: 'Thể Thao 247',
            timeAgo: '1 giờ trước',
            excerpt: 'Các tay vợt hàng đầu thế giới đang tranh tài tại giải đấu có tổng giải thưởng lên đến 2 triệu USD.',
            categoryId: 'sports'
        },
        {
            id: 7,
            title: 'Khởi nghiệp công nghệ Việt Nam nhận đầu tư 50 triệu USD',
            category: 'KINH DOANH',
            source: 'TechInAsia',
            timeAgo: '2 giờ trước',
            excerpt: 'Startup chuyên về AI và machine learning thu hút sự chú ý của các nhà đầu tư quốc tế.',
            categoryId: 'business'
        }
    ];

    // Initialize page
    init();

    function init() {
        loadCategories();
        loadFeaturedNews();
        loadHotTopics();
        loadLatestNews();
        setupSearch();
    }

    // Load category filters
    function loadCategories() {
        categoryFilters.innerHTML = '';
        
        categories.forEach(category => {
            const categoryElement = createCategoryElement(category);
            categoryFilters.appendChild(categoryElement);
        });
    }

    function createCategoryElement(category) {
        const categoryDiv = document.createElement('button');
        categoryDiv.className = `category-filter px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap ${
            category.active ? 'active bg-yellow-400 text-gray-900' : 'theme-category-bg theme-category-text'
        }`;
        categoryDiv.textContent = category.name;
        categoryDiv.dataset.categoryId = category.id;
        
        categoryDiv.addEventListener('click', () => {
            handleCategoryChange(category.id);
        });
        
        return categoryDiv;
    }

    function handleCategoryChange(categoryId) {
        activeCategory = categoryId;
        
        // Update active category visually
        const allCategories = categoryFilters.querySelectorAll('.category-filter');
        allCategories.forEach(cat => {
            if (cat.dataset.categoryId === categoryId) {
                cat.className = 'category-filter px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap active bg-yellow-400 text-gray-900';
            } else {
                cat.className = 'category-filter px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap theme-category-bg theme-category-text';
            }
        });
        
        // Filter and reload content
        filterNewsByCategory(categoryId);
        
        console.log(`📂 Category changed to: ${categoryId}`);
    }

    function filterNewsByCategory(categoryId) {
        // Filter featured news
        const filteredFeatured = categoryId === 'all' 
            ? featuredNewsData 
            : featuredNewsData.filter(news => news.categoryId === categoryId);
        
        // Filter latest news
        const filteredLatest = categoryId === 'all'
            ? latestNewsData
            : latestNewsData.filter(news => news.categoryId === categoryId);
        
        // Reload content with filtered data
        loadFeaturedNews(filteredFeatured);
        loadLatestNews(filteredLatest);
    }

    // Load featured news
    function loadFeaturedNews(newsData = featuredNewsData) {
        featuredNews.innerHTML = '';
        
        newsData.forEach((news, index) => {
            const newsElement = createFeaturedNewsElement(news, index);
            featuredNews.appendChild(newsElement);
        });
        
        // Animate news cards
        animateNewsCards();
    }

    function createFeaturedNewsElement(news, index) {
        const newsDiv = document.createElement('a');
        newsDiv.href = '#';
        newsDiv.className = `news-card news-card-hover group ${
            news.featured ? 'lg:col-span-2 lg:row-span-2' : ''
        } rounded-lg overflow-hidden relative`;
        
        newsDiv.innerHTML = `
            <img src="${news.image}" class="news-image w-full h-full object-cover loading" alt="${news.title}">
            <div class="absolute inset-0 featured-overlay"></div>
            <div class="absolute bottom-0 left-0 p-${news.featured ? '6' : '4'}">
                <span class="text-xs font-semibold bg-yellow-400 text-gray-900 px-2 py-1 rounded">${news.category}</span>
                <h${news.featured ? '2' : '3'} class="text-${news.featured ? '3xl' : 'xl'} font-bold theme-news-title mt-2 group-hover:text-yellow-300 transition-colors">${news.title}</h${news.featured ? '2' : '3'}>
                ${news.source ? `<p class="text-${news.featured ? 'base' : 'sm'} theme-news-text mt-${news.featured ? '2' : '1'}">${news.source} · ${news.timeAgo}</p>` : ''}
            </div>
        `;
        
        // Add click handler
        newsDiv.addEventListener('click', (e) => {
            e.preventDefault();
            handleNewsClick(news);
        });
        
        // Handle image loading
        const img = newsDiv.querySelector('.news-image');
        img.addEventListener('load', () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
        });
        
        return newsDiv;
    }

    function animateNewsCards() {
        const newsCards = featuredNews.querySelectorAll('.news-card');
        newsCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 100);
        });
    }

    // Load hot topics
    function loadHotTopics() {
        hotTopics.innerHTML = '';
        
        hotTopicsData.forEach(topic => {
            const topicElement = createHotTopicElement(topic);
            hotTopics.appendChild(topicElement);
        });
    }

    function createHotTopicElement(topic) {
        const topicDiv = document.createElement('div');
        topicDiv.className = 'glass-card rounded-lg p-4 flex items-start gap-4 news-card-hover cursor-pointer';
        
        topicDiv.innerHTML = `
            <span class="topic-number">${topic.rank}</span>
            <div>
                <a href="#" class="font-bold theme-news-title hover:text-yellow-400 transition-colors">${topic.title}</a>
                <p class="text-sm theme-news-meta mt-1">${topic.description}</p>
            </div>
        `;
        
        topicDiv.addEventListener('click', () => {
            handleTopicClick(topic);
        });
        
        return topicDiv;
    }

    // Load latest news
    function loadLatestNews(newsData = latestNewsData) {
        latestNews.innerHTML = '';
        
        newsData.forEach(news => {
            const newsElement = createLatestNewsElement(news);
            latestNews.appendChild(newsElement);
        });
    }

    function createLatestNewsElement(news) {
        const newsDiv = document.createElement('a');
        newsDiv.href = '#';
        newsDiv.className = 'block p-4 news-card rounded-lg hover:bg-slate-800/50 transition-colors news-card-hover';
        
        newsDiv.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-semibold bg-yellow-400 text-gray-900 px-2 py-1 rounded">${news.category}</span>
                <span class="text-xs theme-news-meta">${news.timeAgo}</span>
            </div>
            <h3 class="text-lg font-bold theme-news-title mb-2 hover:text-yellow-400 transition-colors">${news.title}</h3>
            <p class="text-sm theme-news-text mb-2">${news.excerpt}</p>
            <p class="text-xs theme-news-meta">${news.source}</p>
        `;
        
        newsDiv.addEventListener('click', (e) => {
            e.preventDefault();
            handleNewsClick(news);
        });
        
        return newsDiv;
    }

    // Event handlers
    function handleNewsClick(news) {
        console.log(`📰 Clicked news: ${news.title}`);
        showNotification(`Đang tải bài viết: ${news.title}`);
        
        // In a real app, this would navigate to the full article
    }

    function handleTopicClick(topic) {
        console.log(`🔥 Clicked hot topic: ${topic.title}`);
        showNotification(`Đang tải nội dung cho ${topic.title}`);
        
        // In a real app, this would show related posts/news
    }

    // Search functionality
    function setupSearch() {
        const searchInput = document.querySelector('input[placeholder*="Tìm kiếm"]');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    handleSearch(e.target.value);
                }, 300);
            });
        }
    }

    function handleSearch(query) {
        if (query.trim().length === 0) return;
        
        console.log(`🔍 Searching news for: ${query}`);
        showNotification(`Đang tìm kiếm tin tức về "${query}"...`);
        
        // In a real app, this would filter news or make API call
    }

    // Utility functions
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function refreshNews() {
        console.log('🔄 Refreshing news...');
        loadFeaturedNews();
        loadLatestNews();
        showNotification('Đã cập nhật tin tức mới nhất');
    }

    // Make refresh function available globally
    window.refreshNews = refreshNews;

    console.log('✅ News page ready');
});

// Theme toggle function
function setupThemeToggle() {
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addListener((e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            document.body.setAttribute('data-theme', theme);
        }
    });

    // Check for manual theme toggle
    document.addEventListener('themeChanged', (e) => {
        document.documentElement.setAttribute('data-theme', e.detail.theme);
        document.body.setAttribute('data-theme', e.detail.theme);
    });

    // Add global theme toggle function
    window.toggleTheme = function() {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
        
        console.log(`🎨 Theme switched to: ${newTheme}`);
    };
}
