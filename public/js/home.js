/**
 * Chức năng này dùng để bật/tắt menu thả xuống cho một bài đăng cụ thể.
 * @param {HTMLElement} button - Nút (biểu tượng ba chấm) đã được nhấp.
 */
function toggleMenu(button) {
    const dropdown = button.nextElementSibling;

    // Đóng tất cả các menu khác trước khi mở menu mới
    const allMenus = document.querySelectorAll('.dropdown-menu');
    allMenus.forEach(menu => {
        // Nếu menu không phải là menu đang được click, hãy ẩn nó đi
        if (menu !== dropdown) {
            menu.classList.add('hidden');
        }
    });

    // Bật/tắt menu được click
    dropdown.classList.toggle('hidden');
}

// Thêm sự kiện để đóng menu khi người dùng nhấp ra ngoài
window.addEventListener('click', function(event) {
    // Kiểm tra xem cú nhấp chuột có nằm ngoài khu vực chứa nút và menu không
    // (class 'relative' được dùng để bao bọc nút và menu)
    if (!event.target.closest('.relative')) {
        const allMenus = document.querySelectorAll('.dropdown-menu');
        allMenus.forEach(menu => {
            menu.classList.add('hidden');
        });
    }
});

/**
 * Lấy thông tin user hiện tại và cập nhật UI
 */
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const user = result.data;
                
                // Cập nhật tên người dùng - tìm tất cả elements có text "Tên Người Dùng"
                const usernameElements = document.querySelectorAll('.font-bold.text-white');
                usernameElements.forEach(element => {
                    if (element.textContent.trim() === 'Tên Người Dùng') {
                        element.textContent = `${user.firstName} ${user.lastName}`;
                    }
                });
                
                // Cập nhật @username - tìm tất cả elements có text "@username"
                const handleElements = document.querySelectorAll('.text-sm.text-slate-400');
                handleElements.forEach(element => {
                    if (element.textContent.trim() === '@username') {
                        element.textContent = `@${user.username}`;
                    }
                });
                
                // Cập nhật avatar người dùng trong header
                const avatarElements = document.querySelectorAll('img[alt="User Avatar"]');
                avatarElements.forEach(avatar => {
                    avatar.src = ClientAvatarUtils.getAvatarUrl(user, 48);
                });
                
                console.log('✅ User info loaded:', user);
                
                // Load posts after user info is loaded
                await loadPosts();
            } else {
                console.error('❌ Failed to get user info:', result.message);
                // Redirect to login if not authenticated
                window.location.href = '/login.html';
            }
        } else {
            console.error('❌ Failed to fetch user info:', response.status);
            // Redirect to login if not authenticated
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('❌ Error loading user info:', error);
        // Don't redirect on network errors, just log
    }
}

// Load user info when page loads
document.addEventListener('DOMContentLoaded', loadUserInfo);

/**
 * Lấy danh sách posts và hiển thị
 */
async function loadPosts() {
    try {
        const response = await fetch('/api/posts?limit=20', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const posts = result.data.posts;
                displayPosts(posts);
                console.log('✅ Posts loaded:', posts.length);
            } else {
                console.error('❌ Failed to get posts:', result.message);
                showEmptyPostsMessage();
            }
        } else {
            console.error('❌ Failed to fetch posts:', response.status);
            showEmptyPostsMessage();
        }
    } catch (error) {
        console.error('❌ Error loading posts:', error);
        showEmptyPostsMessage();
    }
}

/**
 * Hiển thị danh sách posts
 */
function displayPosts(posts) {
    const postsContainer = document.querySelector('#posts-container');
    if (!postsContainer) {
        console.error('❌ Posts container not found');
        return;
    }

    if (posts.length === 0) {
        showEmptyPostsMessage();
        return;
    }

    // Clear existing posts
    postsContainer.innerHTML = '';

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
}

/**
 * Tạo HTML element cho một post
 */
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'glass-card post-card p-6 rounded-lg';
    postDiv.style.color = 'var(--home-text-color)';
    
    const timeAgo = getTimeAgo(post.createdAt);
    const hasImages = post.images && post.images.length > 0;
    
    postDiv.innerHTML = `
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
                <img src="${ClientAvatarUtils.getAvatarUrl(post.author, 40)}" 
                     alt="${post.author.firstName} ${post.author.lastName}" 
                     class="w-10 h-10 rounded-full">
                <div>
                    <h4 class="font-bold" style="color: var(--home-text-color)">${post.author.firstName} ${post.author.lastName}</h4>
                    <p class="text-sm" style="color: var(--home-text-secondary)">@${post.author.username} • ${timeAgo}</p>
                </div>
            </div>
            <div class="relative">
                <button onclick="toggleMenu(this)" class="hover:opacity-75" style="color: var(--home-text-secondary)">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                </button>
                <div class="dropdown-menu absolute right-0 mt-2 w-48 rounded-md shadow-lg hidden" style="background: var(--home-card-bg); border: 1px solid var(--home-border)">
                    <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" style="color: var(--home-text-color)">Theo dõi</a>
                    <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" style="color: var(--home-text-color)">Báo cáo</a>
                    <a href="#" class="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" style="color: var(--home-text-color)">Chặn</a>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="mb-4">
            <p style="color: var(--home-text-color)">${post.content}</p>
        </div>

        ${hasImages ? `
        <!-- Images -->
        <div class="mb-4">
            ${post.images.length === 1 ? `
                <img src="${post.images[0].url}" alt="${post.images[0].alt || 'Post image'}" 
                     class="w-full rounded-lg max-h-96 object-cover">
            ` : `
                <div class="grid ${post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} gap-2">
                    ${post.images.slice(0, 4).map((img, index) => `
                        <div class="relative">
                            <img src="${img.url}" alt="${img.alt || 'Post image'}" 
                                 class="w-full h-48 object-cover rounded-lg">
                            ${post.images.length > 4 && index === 3 ? `
                                <div class="absolute inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center rounded-lg">
                                    <span class="text-white font-bold text-xl">+${post.images.length - 4}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex items-center justify-between pt-4" style="border-top: 1px solid var(--home-border)">
            <div class="flex space-x-6">
                <button onclick="toggleLike('${post.id}')" 
                        class="flex items-center space-x-2 hover:text-red-500 like-btn"
                        style="color: var(--home-text-secondary)"
                        data-post-id="${post.id}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.682l-1.318-1.364a4.5 4.5 0 00-6.364 0z">
                        </path>
                    </svg>
                    <span class="like-count">${post.likeCount || 0}</span>
                </button>
                
                <button onclick="showComments('${post.id}')" 
                        class="flex items-center space-x-2 hover:text-blue-500"
                        style="color: var(--home-text-secondary)">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
                        </path>
                    </svg>
                    <span>${post.commentCount || 0}</span>
                </button>
                
                <button class="flex items-center space-x-2 hover:text-green-500"
                        style="color: var(--home-text-secondary)">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z">
                        </path>
                    </svg>
                    <span>${post.shareCount || 0}</span>
                </button>
            </div>
            
            <button class="hover:opacity-75" style="color: var(--home-text-secondary)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z">
                    </path>
                </svg>
            </button>
        </div>
    `;
    
    return postDiv;
}

/**
 * Hiển thị thông báo khi không có posts
 */
function showEmptyPostsMessage() {
    const postsContainer = document.querySelector('#posts-container');
    if (postsContainer) {
        postsContainer.innerHTML = `
            <div class="glass-card p-8 rounded-lg text-center">
                <div class="mb-4" style="color: var(--home-text-secondary)">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z">
                        </path>
                    </svg>
                </div>
                <h3 class="text-lg font-semibold mb-2" style="color: var(--home-text-color)">Chưa có bài đăng nào</h3>
                <p style="color: var(--home-text-secondary)">Hãy là người đầu tiên chia sẻ điều gì đó thú vị!</p>
            </div>
        `;
    }
}

/**
 * Tính toán thời gian đã trôi qua
 */
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return 'Vừa xong';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

/**
 * Toggle like cho post
 */
async function toggleLike(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Update UI
                const likeBtn = document.querySelector(`[data-post-id="${postId}"]`);
                const likeCount = likeBtn.querySelector('.like-count');
                likeCount.textContent = result.data.likeCount;
                
                if (result.data.liked) {
                    likeBtn.style.color = '#ef4444'; // red-500
                } else {
                    likeBtn.style.color = 'var(--home-text-secondary)';
                }
            }
        }
    } catch (error) {
        console.error('❌ Error toggling like:', error);
    }
}

/**
 * Hiển thị comments (placeholder)
 */
function showComments(postId) {
    console.log('Show comments for post:', postId);
    // TODO: Implement comments modal
}