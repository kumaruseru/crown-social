/**
 * Explore Page JavaScript
 * Handles hashtag trends, search functionality, and dynamic content loading
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Explore page initialized');

    // Theme setup
    setupThemeToggle();

    // DOM Elements
    const tabLinks = document.querySelectorAll('.tab-link');
    const trendsContainer = document.getElementById('trends-container');
    const suggestedUsersContainer = document.getElementById('suggested-users');

    // Current active tab
    let currentTab = 'for-you';

    // Mock data for trends
    const trendsData = {
        'for-you': [
            {
                rank: 1,
                category: 'Xu hướng tại Việt Nam',
                hashtag: '#AI_Vietnam',
                posts: '15.2k'
            },
            {
                rank: 2,
                category: 'Du lịch · Xu hướng',
                hashtag: '#Phuot_HaGiang',
                posts: '8.7k'
            },
            {
                rank: 3,
                category: 'Âm nhạc · Xu hướng',
                hashtag: '#Vpop',
                posts: '21k'
            },
            {
                rank: 4,
                category: 'Công nghệ · Xu hướng',
                hashtag: '#TechVietnam',
                posts: '12.5k'
            },
            {
                rank: 5,
                category: 'Thể thao · Xu hướng',
                hashtag: '#VLeague',
                posts: '9.8k'
            }
        ],
        'trending': [
            {
                rank: 1,
                category: 'Xu hướng toàn cầu',
                hashtag: '#WorldCup2025',
                posts: '2.5M'
            },
            {
                rank: 2,
                category: 'Công nghệ · Nóng',
                hashtag: '#MetaverseLife',
                posts: '890k'
            },
            {
                rank: 3,
                category: 'Giải trí · Trending',
                hashtag: '#KPopNews',
                posts: '456k'
            }
        ],
        'news': [
            {
                rank: 1,
                category: 'Tin tức · Việt Nam',
                hashtag: '#ChinhTriVN',
                posts: '45.6k'
            },
            {
                rank: 2,
                category: 'Kinh tế · Cập nhật',
                hashtag: '#ThiTruongVN',
                posts: '32.1k'
            }
        ],
        'sports': [
            {
                rank: 1,
                category: 'Bóng đá · Live',
                hashtag: '#ManchesterUnited',
                posts: '1.2M'
            },
            {
                rank: 2,
                category: 'Tennis · Wimbledon',
                hashtag: '#Wimbledon2025',
                posts: '678k'
            }
        ],
        'entertainment': [
            {
                rank: 1,
                category: 'Phim · Premiere',
                hashtag: '#MarvelPhase6',
                posts: '2.1M'
            },
            {
                rank: 2,
                category: 'Âm nhạc · Album mới',
                hashtag: '#TaylorSwiftEras',
                posts: '1.8M'
            }
        ]
    };

    // Mock data for suggested users
    const suggestedUsers = [
        {
            name: 'Chi Mai',
            username: '@chimaidev',
            avatar: 'https://placehold.co/40x40/F472B6/831843?text=C'
        },
        {
            name: 'Minh Trí',
            username: '@minddev',
            avatar: 'https://placehold.co/40x40/10B981/065F46?text=M'
        },
        {
            name: 'Thu Hằng',
            username: '@thuhang_design',
            avatar: 'https://placehold.co/40x40/3B82F6/1E40AF?text=T'
        }
    ];

    // Initialize page
    init();

    function init() {
        setupTabNavigation();
        loadTrends(currentTab);
        loadSuggestedUsers();
        setupSearch();
    }

    // Tab navigation
    function setupTabNavigation() {
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get tab identifier from href
                const tabId = link.getAttribute('href').substring(1);
                
                // Update active tab
                updateActiveTab(link);
                
                // Load content for selected tab
                currentTab = tabId;
                loadTrends(tabId);
            });
        });
    }

    function updateActiveTab(activeLink) {
        // Remove active class from all tabs
        tabLinks.forEach(link => {
            link.classList.remove('tab-active');
            link.classList.add('border-transparent', 'text-slate-400');
            link.classList.remove('text-yellow-400');
        });

        // Add active class to clicked tab
        activeLink.classList.add('tab-active');
        activeLink.classList.remove('border-transparent', 'text-slate-400');
        activeLink.classList.add('text-yellow-400');
    }

    // Load trends for specific tab
    function loadTrends(tabId) {
        const trends = trendsData[tabId] || trendsData['for-you'];
        
        trendsContainer.innerHTML = '';
        
        trends.forEach(trend => {
            const trendElement = createTrendElement(trend);
            trendsContainer.appendChild(trendElement);
        });

        // Add animation
        animateTrends();
    }

    function createTrendElement(trend) {
        const trendDiv = document.createElement('div');
        trendDiv.className = 'trend-item p-4 hover:bg-slate-800/50 rounded-lg transition-colors duration-200';
        
        trendDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm text-slate-500">${trend.rank} · ${trend.category}</p>
                    <p class="font-bold text-lg text-white mt-1 hover:text-yellow-400 cursor-pointer transition-colors">${trend.hashtag}</p>
                    <p class="text-sm text-slate-500">${trend.posts} bài viết</p>
                </div>
                <button title="Tùy chọn" class="text-slate-400 hover:text-yellow-400 p-2 rounded-full transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                    </svg>
                </button>
            </div>
        `;

        // Add click handler for hashtag
        const hashtagElement = trendDiv.querySelector('.font-bold');
        hashtagElement.addEventListener('click', () => {
            handleHashtagClick(trend.hashtag);
        });

        return trendDiv;
    }

    function animateTrends() {
        const trends = trendsContainer.querySelectorAll('.trend-item');
        trends.forEach((trend, index) => {
            trend.style.opacity = '0';
            trend.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                trend.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                trend.style.opacity = '1';
                trend.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Handle hashtag clicks
    function handleHashtagClick(hashtag) {
        console.log(`🏷️ Clicked hashtag: ${hashtag}`);
        
        // In a real app, this would navigate to hashtag page or show posts
        // For now, we'll just show a notification
        showNotification(`Đang tải bài viết cho ${hashtag}...`);
    }

    // Load suggested users
    function loadSuggestedUsers() {
        suggestedUsersContainer.innerHTML = '';
        
        suggestedUsers.forEach(user => {
            const userElement = createSuggestedUserElement(user);
            suggestedUsersContainer.appendChild(userElement);
        });
    }

    function createSuggestedUserElement(user) {
        const userDiv = document.createElement('li');
        userDiv.className = 'flex items-center justify-between mb-4 hover:bg-white/5 p-2 rounded-lg transition-colors';
        
        userDiv.innerHTML = `
            <div class="flex items-center">
                <img src="${user.avatar}" alt="Avatar" class="w-10 h-10 rounded-full hover:scale-110 transition-transform">
                <div class="ml-3">
                    <h4 class="font-bold text-slate-200 hover:text-white transition-colors">${user.name}</h4>
                    <p class="text-sm text-slate-400">${user.username}</p>
                </div>
            </div>
            <button class="bg-slate-200 text-slate-900 font-semibold py-1 px-4 rounded-full text-sm hover:bg-white transition-colors follow-btn">
                Theo dõi
            </button>
        `;

        // Add follow button handler
        const followBtn = userDiv.querySelector('.follow-btn');
        followBtn.addEventListener('click', () => {
            handleFollowUser(user, followBtn);
        });

        return userDiv;
    }

    function handleFollowUser(user, button) {
        console.log(`👥 Following user: ${user.username}`);
        
        // Update button state
        button.textContent = 'Đã theo dõi';
        button.className = 'bg-yellow-400 text-gray-900 font-semibold py-1 px-4 rounded-full text-sm cursor-default';
        button.disabled = true;
        
        showNotification(`Đã theo dõi ${user.name}`);
    }

    // Search functionality
    function setupSearch() {
        const searchInput = document.querySelector('input[placeholder="Tìm kiếm trên Crown"]');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    handleSearch(e.target.value);
                }, 300); // Debounce search
            });
        }
    }

    function handleSearch(query) {
        if (query.trim().length === 0) return;
        
        console.log(`🔍 Searching for: ${query}`);
        
        // In a real app, this would make an API call
        showNotification(`Đang tìm kiếm "${query}"...`);
    }

    // Utility function for notifications
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Refresh trends functionality
    function refreshTrends() {
        console.log('🔄 Refreshing trends...');
        loadTrends(currentTab);
        showNotification('Đã cập nhật xu hướng mới nhất');
    }

    // Make refresh function available globally
    window.refreshTrends = refreshTrends;

    console.log('✅ Explore page ready');
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
}
