// Settings Page JavaScript
class SettingsManager {
    constructor() {
        this.currentSection = 'account';
        this.isLoading = false;
        this.userData = {
            firstName: 'An',
            lastName: 'Nguyễn Văn',
            username: 'username',
            email: 'user@example.com',
            bio: 'Chào mừng đến với trang của tôi!'
        };
        this.settings = {
            notifications: {
                comments: true,
                likes: true,
                followers: false,
                messages: true
            },
            display: {
                theme: 'dark',
                fontSize: 2,
                accentColor: '#FBBF24'
            },
            advanced: {
                preloadContent: true,
                compressImages: true,
                dataSaver: false,
                language: 'vi',
                timezone: 'Asia/Ho_Chi_Minh',
                sensitiveContent: false,
                autoplayVideo: true
            },
            developer: {
                debugMode: false,
                apiKey: 'cr_1234567890abcdef',
                webhookUrl: '',
                webhookEvents: {
                    newPost: false,
                    likes: false,
                    comments: false,
                    follows: false,
                    messages: false
                }
            },
            integrations: {
                socialMedia: {
                    twitter: { connected: false, username: '' },
                    facebook: { connected: false, username: '' },
                    linkedin: { connected: false, username: '' }
                },
                cloudStorage: {
                    googleDrive: { connected: false, quota: 0 },
                    oneDrive: { connected: false, quota: 0 }
                }
            }
        };
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupToggleSwitches();
        this.setupThemeSelector();
        this.setupFontSizeSlider();
        this.setupColorPicker();
        this.setupAdvancedSettings();
        this.setupIntegrations();
        this.setupDeveloperTools();
        this.setupMobileMenu();
        this.loadUserData();
        this.loadLoginSessions();
        this.restoreUserSettings();
        this.initializeTheme();
    }

    initializeTheme() {
        // Get saved theme or default to system
        const savedTheme = localStorage.getItem('crown-theme') || 'system';
        this.settings.display.theme = savedTheme;
        this.applyTheme(savedTheme);
        
        // Sync with navigation if available
        if (window.navigationManager) {
            // Get current theme from navigation
            const navTheme = window.navigationManager.currentTheme || savedTheme;
            this.settings.display.theme = navTheme;
            this.applyTheme(navTheme);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.settings.display.theme === 'system') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
        
        // Listen for theme changes from navigation
        document.addEventListener('themeChanged', (event) => {
            if (event.detail && event.detail.theme) {
                this.settings.display.theme = event.detail.theme;
                this.updateThemeButtons();
            }
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.setting-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.setting-nav-item').forEach(item => {
            item.classList.remove('setting-nav-active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('setting-nav-active');

        // Update content
        document.querySelectorAll('.setting-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(section).classList.remove('hidden');

        this.currentSection = section;
        
        // Animate content
        this.animateSection(section);
    }

    animateSection(section) {
        const content = document.getElementById(section);
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            content.style.transition = 'all 0.3s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 50);
    }

    setupForms() {
        // Account form
        const accountForm = document.getElementById('account-form');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAccountSettings();
            });
        }

        // Password form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Notification form
        const notificationForm = document.getElementById('notification-form');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationSettings();
            });
        }

        // Display form
        const displayForm = document.getElementById('display-form');
        if (displayForm) {
            displayForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDisplaySettings();
            });
        }

        // Delete account button
        const deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.confirmDeleteAccount();
            });
        }

        // Bio textarea auto-resize
        const bioTextarea = document.getElementById('bio');
        if (bioTextarea) {
            this.autoResizeTextarea(bioTextarea);
            bioTextarea.addEventListener('input', () => {
                this.autoResizeTextarea(bioTextarea);
            });
        }
    }

    setupToggleSwitches() {
        const toggles = document.querySelectorAll('.toggle-checkbox');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.updateToggleState(toggle);
            });
        });
    }

    updateToggleState(toggle) {
        const label = toggle.nextElementSibling;
        if (toggle.checked) {
            label.style.backgroundColor = '#FBBF24';
        } else {
            label.style.backgroundColor = '#4A5568';
        }
    }

    setupThemeSelector() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.settings.display.theme = btn.dataset.theme;
                this.applyTheme(btn.dataset.theme);
                
                // Sync with navigation theme system
                if (window.navigationManager) {
                    window.navigationManager.setTheme(btn.dataset.theme);
                }
            });
        });
        
        // Set initial active state
        this.updateThemeButtons();
    }

    setupFontSizeSlider() {
        const fontSizeSlider = document.getElementById('font-size');
        const preview = document.getElementById('font-size-preview');
        
        if (fontSizeSlider && preview) {
            fontSizeSlider.addEventListener('input', () => {
                const size = fontSizeSlider.value;
                preview.className = preview.className.replace(/size-\d+/, `size-${size}`);
                this.settings.display.fontSize = parseInt(size);
            });
        }
    }

    setupMobileMenu() {
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
    }

    async saveAccountSettings() {
        const form = document.getElementById('account-form');
        if (!form) return;

        this.setLoading(form, true);

        try {
            const formData = new FormData(form);
            const data = {
                firstName: formData.get('first_name'),
                lastName: formData.get('last_name'),
                username: formData.get('username'),
                email: formData.get('email'),
                bio: formData.get('bio')
            };

            // Mock API call
            await this.mockApiCall();
            
            this.userData = { ...this.userData, ...data };
            this.showMessage('Thông tin tài khoản đã được cập nhật thành công!', 'success');
        } catch (error) {
            console.error('Error saving account settings:', error);
            this.showMessage('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.', 'error');
        } finally {
            this.setLoading(form, false);
        }
    }

    async changePassword() {
        const form = document.getElementById('password-form');
        if (!form) return;

        const currentPassword = form.querySelector('#current_password').value;
        const newPassword = form.querySelector('#new_password').value;
        const confirmPassword = form.querySelector('#confirm_password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('Vui lòng điền đầy đủ thông tin mật khẩu.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('Mật khẩu xác nhận không khớp.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
            return;
        }

        this.setLoading(form, true);

        try {
            // Mock API call
            await this.mockApiCall();
            
            form.reset();
            this.showMessage('Mật khẩu đã được thay đổi thành công!', 'success');
        } catch (error) {
            console.error('Error changing password:', error);
            this.showMessage('Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.', 'error');
        } finally {
            this.setLoading(form, false);
        }
    }

    async saveNotificationSettings() {
        const form = document.getElementById('notification-form');
        if (!form) return;

        this.setLoading(form, true);

        try {
            const formData = new FormData(form);
            this.settings.notifications = {
                comments: formData.has('comments'),
                likes: formData.has('likes'),
                followers: formData.has('followers'),
                messages: formData.has('messages')
            };

            // Mock API call
            await this.mockApiCall();
            
            this.showMessage('Cài đặt thông báo đã được lưu thành công!', 'success');
        } catch (error) {
            console.error('Error saving notification settings:', error);
            this.showMessage('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.', 'error');
        } finally {
            this.setLoading(form, false);
        }
    }

    async saveDisplaySettings() {
        const form = document.getElementById('display-form');
        if (!form) return;

        this.setLoading(form, true);

        try {
            // Mock API call
            await this.mockApiCall();
            
            localStorage.setItem('crownSettings', JSON.stringify(this.settings));
            this.showMessage('Cài đặt giao diện đã được lưu thành công!', 'success');
        } catch (error) {
            console.error('Error saving display settings:', error);
            this.showMessage('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.', 'error');
        } finally {
            this.setLoading(form, false);
        }
    }

    confirmDeleteAccount() {
        if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
            this.deleteAccount();
        }
    }

    async deleteAccount() {
        try {
            // Mock API call
            await this.mockApiCall();
            
            alert('Yêu cầu xóa tài khoản đã được gửi. Chúng tôi sẽ liên hệ với bạn trong vòng 7 ngày làm việc.');
        } catch (error) {
            console.error('Error deleting account:', error);
            this.showMessage('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
        }
    }

    loadUserData() {
        // Populate form fields with user data
        const fields = {
            'first_name': this.userData.firstName,
            'last_name': this.userData.lastName,
            'username': this.userData.username,
            'email': this.userData.email,
            'bio': this.userData.bio
        };

        Object.entries(fields).forEach(([name, value]) => {
            const field = document.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value;
                if (field.tagName === 'TEXTAREA') {
                    this.autoResizeTextarea(field);
                }
            }
        });
    }

    async loadLoginSessions() {
        const container = document.getElementById('login-sessions');
        if (!container) return;

        try {
            // Mock sessions data
            const sessions = [
                {
                    id: 1,
                    device: 'Chrome trên Windows 11',
                    location: 'TP. Hồ Chí Minh',
                    lastActive: '2024-01-15T10:30:00Z',
                    current: true
                },
                {
                    id: 2,
                    device: 'Safari trên iPhone',
                    location: 'Hà Nội',
                    lastActive: '2024-01-14T15:45:00Z',
                    current: false
                },
                {
                    id: 3,
                    device: 'Firefox trên Ubuntu',
                    location: 'Đà Nẵng',
                    lastActive: '2024-01-13T09:20:00Z',
                    current: false
                }
            ];

            container.innerHTML = sessions.map((session, index) => `
                <div class="session-item flex items-center justify-between p-3 bg-slate-800/50 rounded-md ${session.current ? 'session-current' : 'session-inactive'}" style="animation-delay: ${index * 0.1}s">
                    <div>
                        <p class="font-semibold">${session.device}</p>
                        <p class="text-sm ${session.current ? 'text-yellow-400' : 'text-slate-400'}">
                            ${session.current ? 'Đang hoạt động' : 'Hoạt động ' + this.formatTime(session.lastActive)} · ${session.location}
                        </p>
                    </div>
                    ${!session.current ? `<button onclick="settingsManager.logoutSession(${session.id})" class="text-xs text-yellow-400 hover:underline">Đăng xuất</button>` : '<span class="text-xs text-yellow-400">Hiện tại</span>'}
                </div>
            `).join('');

            // Animate sessions
            setTimeout(() => {
                container.querySelectorAll('.session-item').forEach(item => {
                    item.classList.add('animate-in');
                });
            }, 100);
        } catch (error) {
            console.error('Error loading login sessions:', error);
        }
    }

    async logoutSession(sessionId) {
        try {
            // Mock API call
            await this.mockApiCall();
            
            this.showMessage('Đã đăng xuất khỏi thiết bị thành công!', 'success');
            this.loadLoginSessions(); // Reload sessions
        } catch (error) {
            console.error('Error logging out session:', error);
            this.showMessage('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.', 'error');
        }
    }

    restoreUserSettings() {
        try {
            const savedSettings = localStorage.getItem('crownSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            // Apply notification settings
            Object.entries(this.settings.notifications).forEach(([key, value]) => {
                const toggle = document.getElementById(key);
                if (toggle) {
                    toggle.checked = value;
                    this.updateToggleState(toggle);
                }
            });

            // Apply theme
            const themeBtn = document.querySelector(`[data-theme="${this.settings.display.theme}"]`);
            if (themeBtn) {
                themeBtn.classList.add('active');
                this.applyTheme(this.settings.display.theme);
            }

            // Apply font size
            const fontSizeSlider = document.getElementById('font-size');
            const preview = document.getElementById('font-size-preview');
            if (fontSizeSlider && preview) {
                fontSizeSlider.value = this.settings.display.fontSize;
                preview.className = preview.className.replace(/size-\d+/, `size-${this.settings.display.fontSize}`);
            }
        } catch (error) {
            console.error('Error restoring settings:', error);
        }
    }

    applyTheme(theme) {
        // Save theme preference
        localStorage.setItem('crown-theme', theme);
        
        // Apply theme to document
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // Update settings
        this.settings.display.theme = theme;
        
        // Update theme button states
        this.updateThemeButtons();
    }

    updateThemeButtons() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === this.settings.display.theme) {
                btn.classList.add('active');
            }
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    setLoading(element, isLoading) {
        if (isLoading) {
            element.classList.add('loading');
            const buttons = element.querySelectorAll('button[type="submit"]');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = 'Đang lưu...';
            });
        } else {
            element.classList.remove('loading');
            const buttons = element.querySelectorAll('button[type="submit"]');
            buttons.forEach(btn => {
                btn.disabled = false;
                btn.textContent = btn.textContent.replace('Đang lưu...', 'Lưu');
            });
        }
    }

    showMessage(text, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        const content = document.querySelector('.setting-content:not(.hidden)');
        if (content) {
            content.insertBefore(message, content.firstChild);
            
            setTimeout(() => {
                message.classList.add('show');
            }, 100);

            setTimeout(() => {
                message.classList.remove('show');
                setTimeout(() => message.remove(), 300);
            }, 5000);
        }
    }

    formatTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'hôm nay';
        if (diffDays === 1) return 'hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return date.toLocaleDateString('vi-VN');
    }

    async mockApiCall() {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }

    setupColorPicker() {
        const colorOptions = document.querySelectorAll('[data-color]');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.settings.display.accentColor = option.dataset.color;
                this.applyAccentColor(option.dataset.color);
            });
        });
    }

    setupAdvancedSettings() {
        // Language selector
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.settings.advanced.language = e.target.value;
                this.applyLanguage(e.target.value);
            });
        }

        // Timezone selector
        const timezoneSelect = document.getElementById('timezone');
        if (timezoneSelect) {
            timezoneSelect.addEventListener('change', (e) => {
                this.settings.advanced.timezone = e.target.value;
                this.showMessage('Múi giờ đã được cập nhật', 'success');
            });
        }

        // Advanced form submission
        const advancedForm = document.getElementById('advanced-form');
        if (advancedForm) {
            advancedForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAdvancedSettings();
            });
        }
    }

    setupIntegrations() {
        // Social media connections
        this.setupSocialConnections();
        this.setupCloudStorage();
    }

    setupSocialConnections() {
        const socialButtons = document.querySelectorAll('[data-social]');
        socialButtons.forEach(button => {
            button.addEventListener('click', () => {
                const platform = button.dataset.social;
                this.connectSocialMedia(platform);
            });
        });
    }

    setupCloudStorage() {
        const cloudButtons = document.querySelectorAll('[data-cloud]');
        cloudButtons.forEach(button => {
            button.addEventListener('click', () => {
                const provider = button.dataset.cloud;
                this.connectCloudStorage(provider);
            });
        });
    }

    setupDeveloperTools() {
        // API Key management
        this.setupApiKeyManagement();
        
        // Webhook configuration
        this.setupWebhooks();
        
        // Debug mode toggle
        const debugToggle = document.getElementById('debug-mode');
        if (debugToggle) {
            debugToggle.addEventListener('change', () => {
                this.settings.developer.debugMode = debugToggle.checked;
                this.toggleDebugMode(debugToggle.checked);
            });
        }
    }

    setupApiKeyManagement() {
        const copyBtn = document.getElementById('copy-api-key');
        const regenerateBtn = document.getElementById('regenerate-api-key');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyApiKey();
            });
        }
        
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.regenerateApiKey();
            });
        }
    }

    setupWebhooks() {
        const testBtn = document.getElementById('test-webhook');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testWebhook();
            });
        }

        // Webhook event checkboxes
        const eventCheckboxes = document.querySelectorAll('.webhook-events input[type="checkbox"]');
        eventCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateWebhookEvents();
            });
        });
    }

    applyAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
        // Update all accent color elements
        const accentElements = document.querySelectorAll('.text-yellow-400, .bg-yellow-400, .border-yellow-400');
        accentElements.forEach(element => {
            element.style.color = color;
            if (element.classList.contains('bg-yellow-400')) {
                element.style.backgroundColor = color;
            }
            if (element.classList.contains('border-yellow-400')) {
                element.style.borderColor = color;
            }
        });
    }

    applyLanguage(language) {
        // In a real application, this would load language files
        // For now, just show a message
        const languageNames = {
            vi: 'Tiếng Việt',
            en: 'English',
            zh: '中文',
            ja: '日本語',
            ko: '한국어'
        };
        
        this.showMessage(`Ngôn ngữ đã được đổi sang ${languageNames[language]}`, 'success');
    }

    async saveAdvancedSettings() {
        const form = document.getElementById('advanced-form');
        if (!form) return;

        this.setLoading(form, true);

        try {
            const formData = new FormData(form);
            
            // Update settings object
            this.settings.advanced = {
                ...this.settings.advanced,
                preloadContent: formData.has('preload-content'),
                compressImages: formData.has('compress-images'),
                dataSaver: formData.has('data-saver'),
                language: formData.get('language'),
                timezone: formData.get('timezone'),
                sensitiveContent: formData.has('sensitive-content'),
                autoplayVideo: formData.has('autoplay-video')
            };

            await this.mockApiCall();
            localStorage.setItem('crownSettings', JSON.stringify(this.settings));
            this.showMessage('Cài đặt nâng cao đã được lưu!', 'success');
        } catch (error) {
            console.error('Error saving advanced settings:', error);
            this.showMessage('Có lỗi xảy ra khi lưu cài đặt', 'error');
        } finally {
            this.setLoading(form, false);
        }
    }

    async connectSocialMedia(platform) {
        try {
            this.showMessage(`Đang kết nối với ${platform}...`, 'info');
            
            // Mock OAuth flow
            await this.mockApiCall();
            
            // Simulate successful connection
            this.settings.integrations.socialMedia[platform] = {
                connected: true,
                username: `user_${platform}_${Date.now()}`
            };
            
            this.showMessage(`Đã kết nối thành công với ${platform}!`, 'success');
            this.updateIntegrationStatus(platform, true);
        } catch (error) {
            console.error(`Error connecting to ${platform}:`, error);
            this.showMessage(`Không thể kết nối với ${platform}`, 'error');
        }
    }

    async connectCloudStorage(provider) {
        try {
            this.showMessage(`Đang kết nối với ${provider}...`, 'info');
            
            // Mock OAuth flow
            await this.mockApiCall();
            
            // Simulate successful connection
            this.settings.integrations.cloudStorage[provider] = {
                connected: true,
                quota: Math.floor(Math.random() * 100) + 10 // Random quota
            };
            
            this.showMessage(`Đã kết nối thành công với ${provider}!`, 'success');
            this.updateIntegrationStatus(provider, true);
        } catch (error) {
            console.error(`Error connecting to ${provider}:`, error);
            this.showMessage(`Không thể kết nối với ${provider}`, 'error');
        }
    }

    updateIntegrationStatus(service, connected) {
        const button = document.querySelector(`[data-social="${service}"], [data-cloud="${service}"]`);
        if (button) {
            if (connected) {
                button.textContent = 'Đã kết nối';
                button.classList.remove('bg-blue-500', 'bg-blue-600', 'bg-blue-700');
                button.classList.add('bg-green-600');
                button.disabled = true;
            }
        }
    }

    async copyApiKey() {
        const apiKey = document.getElementById('api-key').value;
        try {
            await navigator.clipboard.writeText(apiKey);
            
            // Show feedback
            const button = document.getElementById('copy-api-key');
            const originalText = button.textContent;
            button.textContent = 'Đã sao chép!';
            button.classList.add('bg-green-600');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-600');
            }, 2000);
        } catch (error) {
            console.error('Error copying API key:', error);
            this.showMessage('Không thể sao chép API key', 'error');
        }
    }

    async regenerateApiKey() {
        if (!confirm('Bạn có chắc chắn muốn tạo API key mới? Key cũ sẽ không thể sử dụng được nữa.')) {
            return;
        }

        try {
            await this.mockApiCall();
            
            // Generate new API key
            const newKey = 'cr_' + Math.random().toString(36).substr(2, 16);
            this.settings.developer.apiKey = newKey;
            
            document.getElementById('api-key').value = newKey;
            this.showMessage('API key mới đã được tạo!', 'success');
        } catch (error) {
            console.error('Error regenerating API key:', error);
            this.showMessage('Không thể tạo API key mới', 'error');
        }
    }

    async testWebhook() {
        const webhookUrl = document.getElementById('webhook-url').value;
        if (!webhookUrl) {
            this.showMessage('Vui lòng nhập URL webhook', 'error');
            return;
        }

        try {
            this.showMessage('Đang test webhook...', 'info');
            
            // Mock webhook test
            await this.mockApiCall();
            
            this.showMessage('Webhook test thành công!', 'success');
        } catch (error) {
            console.error('Error testing webhook:', error);
            this.showMessage('Webhook test thất bại', 'error');
        }
    }

    updateWebhookEvents() {
        const checkboxes = document.querySelectorAll('.webhook-events input[type="checkbox"]');
        const events = {};
        
        checkboxes.forEach(checkbox => {
            const eventName = checkbox.name || checkbox.getAttribute('data-event');
            if (eventName) {
                events[eventName] = checkbox.checked;
            }
        });
        
        this.settings.developer.webhookEvents = events;
    }

    toggleDebugMode(enabled) {
        if (enabled) {
            this.createDebugConsole();
            this.startDebugLogging();
        } else {
            this.removeDebugConsole();
            this.stopDebugLogging();
        }
    }

    createDebugConsole() {
        if (document.getElementById('debug-console')) return;

        const console = document.createElement('div');
        console.id = 'debug-console';
        console.className = 'debug-console active mt-4';
        console.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h4 class="text-white font-semibold">Debug Console</h4>
                <button onclick="settingsManager.clearDebugLog()" class="text-xs px-2 py-1 bg-slate-600 rounded">
                    Clear
                </button>
            </div>
            <div id="debug-logs"></div>
        `;

        const developerSection = document.getElementById('developer');
        if (developerSection) {
            developerSection.appendChild(console);
        }
    }

    removeDebugConsole() {
        const console = document.getElementById('debug-console');
        if (console) {
            console.remove();
        }
    }

    startDebugLogging() {
        this.debugInterval = setInterval(() => {
            this.addDebugLog('info', 'System check completed');
        }, 5000);

        // Log initial debug info
        this.addDebugLog('info', 'Debug mode enabled');
        this.addDebugLog('info', `User agent: ${navigator.userAgent}`);
        this.addDebugLog('info', `Screen resolution: ${screen.width}x${screen.height}`);
    }

    stopDebugLogging() {
        if (this.debugInterval) {
            clearInterval(this.debugInterval);
            this.debugInterval = null;
        }
    }

    addDebugLog(level, message) {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;

        const logElement = document.createElement('div');
        logElement.className = 'debug-log';
        logElement.innerHTML = `
            <span class="debug-timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="debug-level ${level}">[${level.toUpperCase()}]</span>
            <span class="debug-message">${message}</span>
        `;

        logsContainer.appendChild(logElement);
        
        // Limit to 50 logs
        while (logsContainer.children.length > 50) {
            logsContainer.removeChild(logsContainer.firstChild);
        }
        
        // Auto scroll to bottom
        logElement.scrollIntoView({ behavior: 'smooth' });
    }

    clearDebugLog() {
        const logsContainer = document.getElementById('debug-logs');
        if (logsContainer) {
            logsContainer.innerHTML = '';
            this.addDebugLog('info', 'Debug log cleared');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (window.settingsManager && window.settingsManager.settings.display.theme === 'system') {
        window.settingsManager.applyTheme('system');
    }
});
