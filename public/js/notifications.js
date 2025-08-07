// Notifications Page JavaScript
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.currentTab = 'all';
        this.isLoading = false;
        this.hasMoreNotifications = true;
        this.lastNotificationId = null;
        
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupNotificationActions();
        this.loadInitialNotifications();
        this.setupInfiniteScroll();
        this.setupMarkAllRead();
        this.setupNotificationFilters();
        this.setupThemeToggle();
    }

    setupThemeToggle() {
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

    setupTabNavigation() {
        const tabs = document.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabType = tab.dataset.tab;
                this.switchTab(tabType);
            });
        });
    }

    switchTab(tabType) {
        // Update active tab
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.classList.remove('tab-active');
        });
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('tab-active');

        this.currentTab = tabType;
        this.clearNotifications();
        this.loadInitialNotifications();
    }

    setupNotificationActions() {
        // Mark individual notification as read
        document.addEventListener('click', (e) => {
            if (e.target.matches('.mark-read-btn')) {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.markAsRead(notificationId);
            }

            if (e.target.matches('.delete-notification-btn')) {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.deleteNotification(notificationId);
            }
        });

        // Click on notification to navigate
        document.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem && !e.target.closest('.notification-actions')) {
                const notificationId = notificationItem.dataset.notificationId;
                this.handleNotificationClick(notificationId);
            }
        });
    }

    setupMarkAllRead() {
        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }
    }

    setupNotificationFilters() {
        // Could add additional filtering options here
        // For now, we have the basic tab filtering
    }

    async loadInitialNotifications() {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const notifications = await this.fetchNotifications(this.currentTab, 0, 20);
            this.notifications = notifications;
            this.renderNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showErrorState();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    async fetchNotifications(tab, offset, limit) {
        // Mock API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockNotifications = this.generateMockNotifications(tab, offset, limit);
                resolve(mockNotifications);
            }, 800);
        });
    }

    generateMockNotifications(tab, offset, limit) {
        const users = [
            { id: 1, name: 'Sarah Johnson', avatar: '/public/images/default-avatar.svg', username: 'sarah_j' },
            { id: 2, name: 'Mike Chen', avatar: '/public/images/default-avatar.svg', username: 'mike_c' },
            { id: 3, name: 'Emily Davis', avatar: '/public/images/default-avatar.svg', username: 'emily_d' },
            { id: 4, name: 'Alex Rivera', avatar: '/public/images/default-avatar.svg', username: 'alex_r' },
            { id: 5, name: 'Lisa Thompson', avatar: '/public/images/default-avatar.svg', username: 'lisa_t' }
        ];

        const notificationTypes = [
            { type: 'follow', icon: 'fas fa-user-plus', color: 'notification-follow' },
            { type: 'like', icon: 'fas fa-heart', color: 'notification-like' },
            { type: 'comment', icon: 'fas fa-comment', color: 'notification-comment' },
            { type: 'mention', icon: 'fas fa-at', color: 'notification-mention' },
            { type: 'repost', icon: 'fas fa-retweet', color: 'notification-repost' }
        ];

        const notifications = [];
        for (let i = 0; i < limit; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
            const isRead = tab === 'unread' ? false : Math.random() > 0.3;
            const isMention = tab === 'mentions' ? true : notificationType.type === 'mention';
            
            if (tab === 'mentions' && !isMention) continue;
            if (tab === 'unread' && isRead) continue;

            const notification = {
                id: Date.now() + i + offset,
                user,
                type: notificationType.type,
                icon: notificationType.icon,
                color: notificationType.color,
                message: this.generateNotificationMessage(notificationType.type, user.name),
                time: this.generateRandomTime(),
                isRead,
                isUnread: !isRead,
                postContent: notificationType.type !== 'follow' ? 'Just shared some thoughts about the future of technology...' : null
            };

            notifications.push(notification);
        }

        return notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    generateNotificationMessage(type, userName) {
        const messages = {
            follow: `${userName} đã bắt đầu theo dõi bạn`,
            like: `${userName} đã thích bài viết của bạn`,
            comment: `${userName} đã bình luận về bài viết của bạn`,
            mention: `${userName} đã nhắc đến bạn trong một bài viết`,
            repost: `${userName} đã chia sẻ bài viết của bạn`
        };
        return messages[type] || `${userName} đã tương tác với bạn`;
    }

    generateRandomTime() {
        const now = new Date();
        const randomHours = Math.floor(Math.random() * 168); // Up to 1 week ago
        return new Date(now.getTime() - (randomHours * 60 * 60 * 1000));
    }

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = '';

        if (this.notifications.length === 0) {
            this.showEmptyState();
            return;
        }

        this.notifications.forEach((notification, index) => {
            const element = this.createNotificationElement(notification);
            container.appendChild(element);
            
            // Animate in
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 50);
        });

        this.updateNotificationCounts();
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item p-4 border-b border-gray-700 cursor-pointer ${notification.isUnread ? 'unread' : 'read'}`;
        div.dataset.notificationId = notification.id;

        div.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 relative">
                    <img src="${notification.user.avatar}" alt="${notification.user.name}" class="w-12 h-12 rounded-full object-cover">
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <i class="${notification.icon} text-xs ${notification.color}"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <p class="text-sm font-medium text-gray-200 truncate">
                            ${notification.message}
                        </p>
                        ${notification.isUnread ? '<div class="unread-dot ml-2"></div>' : ''}
                    </div>
                    ${notification.postContent ? `
                        <p class="mt-1 text-sm text-gray-400 truncate">
                            "${notification.postContent}"
                        </p>
                    ` : ''}
                    <p class="mt-1 notification-time ${this.isRecent(notification.time) ? 'recent' : ''}">
                        ${this.formatTime(notification.time)}
                    </p>
                </div>
                <div class="notification-actions flex space-x-1">
                    ${notification.isUnread ? `
                        <button class="mark-read-btn notification-action" title="Đánh dấu đã đọc">
                            <i class="fas fa-check text-xs"></i>
                        </button>
                    ` : ''}
                    <button class="delete-notification-btn notification-action" title="Xóa thông báo">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    formatTime(time) {
        const now = new Date();
        const diffMs = now - new Date(time);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return new Date(time).toLocaleDateString('vi-VN');
    }

    isRecent(time) {
        const now = new Date();
        const diffMs = now - new Date(time);
        return diffMs < (60 * 60 * 1000); // Less than 1 hour
    }

    showLoadingState() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = Array(5).fill(0).map(() => `
            <div class="notification-item p-4 border-b border-gray-700">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-full notification-skeleton"></div>
                    <div class="flex-1">
                        <div class="h-4 notification-skeleton mb-2 w-3/4"></div>
                        <div class="h-3 notification-skeleton w-1/2"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    hideLoadingState() {
        // Loading state will be replaced by actual notifications
    }

    showEmptyState() {
        const container = document.getElementById('notifications-list');
        const emptyMessage = this.getEmptyMessage();
        
        container.innerHTML = `
            <div class="empty-state">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7H4l5-5v5z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10v10H7z"></path>
                </svg>
                <h3 class="text-lg font-medium mb-2">${emptyMessage.title}</h3>
                <p class="text-sm">${emptyMessage.description}</p>
            </div>
        `;
    }

    getEmptyMessage() {
        const messages = {
            all: {
                title: 'Không có thông báo',
                description: 'Bạn chưa có thông báo nào. Các thông báo sẽ hiển thị ở đây khi có hoạt động mới.'
            },
            unread: {
                title: 'Tất cả đã được đọc',
                description: 'Bạn đã đọc tất cả thông báo. Tuyệt vời!'
            },
            mentions: {
                title: 'Không có lượt nhắc',
                description: 'Chưa có ai nhắc đến bạn. Hãy tham gia nhiều cuộc trò chuyện hơn!'
            }
        };
        return messages[this.currentTab] || messages.all;
    }

    showErrorState() {
        const container = document.getElementById('notifications-list');
        container.innerHTML = `
            <div class="empty-state">
                <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-lg font-medium mb-2">Không thể tải thông báo</h3>
                <p class="text-sm mb-4">Có lỗi xảy ra khi tải thông báo. Vui lòng thử lại.</p>
                <button onclick="notificationManager.loadInitialNotifications()" class="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors">
                    Thử lại
                </button>
            </div>
        `;
    }

    async markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (!notification || notification.isRead) return;

        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        element.classList.add('marking-read');

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 300));
            
            notification.isRead = true;
            notification.isUnread = false;
            
            element.classList.remove('unread', 'marking-read');
            element.classList.add('read');
            element.querySelector('.unread-dot')?.remove();
            element.querySelector('.mark-read-btn')?.remove();
            
            this.updateNotificationCounts();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            element.classList.remove('marking-read');
        }
    }

    async markAllAsRead() {
        const unreadNotifications = this.notifications.filter(n => !n.isRead);
        if (unreadNotifications.length === 0) return;

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            unreadNotifications.forEach(notification => {
                notification.isRead = true;
                notification.isUnread = false;
                
                const element = document.querySelector(`[data-notification-id="${notification.id}"]`);
                if (element) {
                    element.classList.remove('unread');
                    element.classList.add('read');
                    element.querySelector('.unread-dot')?.remove();
                    element.querySelector('.mark-read-btn')?.remove();
                }
            });
            
            this.updateNotificationCounts();
            this.showSuccessMessage('Đã đánh dấu tất cả thông báo là đã đọc');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            this.showErrorMessage('Không thể đánh dấu tất cả thông báo');
        }
    }

    async deleteNotification(notificationId) {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
            element.style.transform = 'translateX(100%)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id != notificationId);
                element.remove();
                this.updateNotificationCounts();
                
                if (this.notifications.length === 0) {
                    this.showEmptyState();
                }
            }, 300);
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showErrorMessage('Không thể xóa thông báo');
        }
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (!notification) return;

        // Mark as read if unread
        if (!notification.isRead) {
            this.markAsRead(notificationId);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'follow':
                window.location.href = `/profile/${notification.user.username}`;
                break;
            case 'like':
            case 'comment':
            case 'repost':
                // Navigate to post (mock for now)
                console.log('Navigate to post');
                break;
            case 'mention':
                // Navigate to post with mention
                console.log('Navigate to mention');
                break;
        }
    }

    updateNotificationCounts() {
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        const mentionCount = this.notifications.filter(n => n.type === 'mention' && !n.isRead).length;
        
        // Update tab badges
        const unreadTab = document.querySelector('[data-tab="unread"]');
        const mentionTab = document.querySelector('[data-tab="mentions"]');
        
        this.updateTabBadge(unreadTab, unreadCount);
        this.updateTabBadge(mentionTab, mentionCount);
        
        // Update document title
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) Thông báo - Crown`;
        } else {
            document.title = 'Thông báo - Crown';
        }
    }

    updateTabBadge(tab, count) {
        if (!tab) return;
        
        let badge = tab.querySelector('.filter-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'filter-badge';
                tab.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
                this.loadMoreNotifications();
            }
        });
    }

    async loadMoreNotifications() {
        if (this.isLoading || !this.hasMoreNotifications) return;

        this.isLoading = true;
        try {
            const moreNotifications = await this.fetchNotifications(this.currentTab, this.notifications.length, 10);
            
            if (moreNotifications.length === 0) {
                this.hasMoreNotifications = false;
                return;
            }

            this.notifications.push(...moreNotifications);
            this.renderAdditionalNotifications(moreNotifications);
        } catch (error) {
            console.error('Error loading more notifications:', error);
        } finally {
            this.isLoading = false;
        }
    }

    renderAdditionalNotifications(notifications) {
        const container = document.getElementById('notifications-list');
        notifications.forEach((notification, index) => {
            const element = this.createNotificationElement(notification);
            container.appendChild(element);
            
            setTimeout(() => {
                element.classList.add('animate-in');
            }, index * 50);
        });
    }

    clearNotifications() {
        this.notifications = [];
        this.hasMoreNotifications = true;
        document.getElementById('notifications-list').innerHTML = '';
    }

    showSuccessMessage(message) {
        // You can implement a toast notification system here
        console.log('Success:', message);
    }

    showErrorMessage(message) {
        // You can implement a toast notification system here
        console.error('Error:', message);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024 && 
                !sidebar.contains(e.target) && 
                !mobileMenuBtn.contains(e.target) &&
                !sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        });
    }
});
