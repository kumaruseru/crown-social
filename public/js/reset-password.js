// Reset Password Page JavaScript

class ResetPasswordPage {
    constructor() {
        this.form = document.getElementById('reset-password-form');
        this.submitButton = document.querySelector('.btn-primary');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.strengthIndicator = document.getElementById('password-strength');
        
        this.init();
    }

    init() {
        this.initializeParticleEffect();
        this.setupEventListeners();
        this.checkTokenValidity();
        this.setupFormValidation();
    }

    // Particle effect cho background
    initializeParticleEffect() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;

        // Tạo particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                dx: (Math.random() - 0.5) * 0.5,
                dy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                // Update position
                particle.x += particle.dx;
                particle.y += particle.dy;

                // Bounce off edges
                if (particle.x <= 0 || particle.x >= canvas.width) particle.dx *= -1;
                if (particle.y <= 0 || particle.y >= canvas.height) particle.dy *= -1;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${particle.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        // Resize handler
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    setupEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Password strength checker
        if (this.passwordInput) {
            this.passwordInput.addEventListener('input', () => this.checkPasswordStrength());
            this.passwordInput.addEventListener('keyup', () => this.validatePasswords());
        }

        // Confirm password validation
        if (this.confirmPasswordInput) {
            this.confirmPasswordInput.addEventListener('keyup', () => this.validatePasswords());
        }

        // Add ripple effect to button
        if (this.submitButton) {
            this.submitButton.addEventListener('click', (e) => this.addRippleEffect(e));
        }
    }

    // Kiểm tra token có hợp lệ không
    checkTokenValidity() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            this.showAlert('Liên kết không hợp lệ hoặc đã hết hạn.', 'error');
            setTimeout(() => {
                window.location.href = '/forgot-password';
            }, 3000);
        }
    }

    // Setup form validation
    setupFormValidation() {
        const inputs = this.form?.querySelectorAll('input[required]');
        inputs?.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name');

        if (!value) {
            this.showFieldError(field, 'Trường này không được để trống');
            return false;
        }

        if (fieldName === 'password') {
            if (value.length < 8) {
                this.showFieldError(field, 'Mật khẩu phải có ít nhất 8 ký tự');
                return false;
            }
        }

        this.clearFieldError(field);
        return true;
    }

    // Clear field error
    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error');
    }

    // Show field error
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = 'color: #F87171; font-size: 12px; margin-top: 4px; animation: slideIn 0.3s ease-out;';
        errorElement.textContent = message;
        
        field.classList.add('error');
        field.parentNode.appendChild(errorElement);
    }

    // Check password strength
    checkPasswordStrength() {
        const password = this.passwordInput.value;
        const strength = this.getPasswordStrength(password);
        
        if (!this.strengthIndicator) return;

        this.strengthIndicator.className = `password-strength ${strength.level}`;
        this.strengthIndicator.textContent = strength.message;
        this.strengthIndicator.style.display = password ? 'block' : 'none';
    }

    // Calculate password strength
    getPasswordStrength(password) {
        if (password.length === 0) {
            return { level: '', message: '' };
        }

        let score = 0;
        
        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        
        // Character types
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (score < 3) {
            return { level: 'weak', message: '🔒 Mật khẩu yếu - Thêm chữ hoa, số và ký tự đặc biệt' };
        } else if (score < 5) {
            return { level: 'medium', message: '🟡 Mật khẩu trung bình - Có thể cải thiện thêm' };
        } else {
            return { level: 'strong', message: '✅ Mật khẩu mạnh - Rất tốt!' };
        }
    }

    // Validate password confirmation
    validatePasswords() {
        if (!this.passwordInput || !this.confirmPasswordInput) return;

        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;

        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError(this.confirmPasswordInput, 'Mật khẩu xác nhận không khớp');
        } else if (confirmPassword && password === confirmPassword) {
            this.clearFieldError(this.confirmPasswordInput);
        }
    }

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.submitButton.disabled) return;

        // Validate all fields
        const formData = new FormData(this.form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!password || !confirmPassword) {
            this.showAlert('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAlert('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        if (password.length < 8) {
            this.showAlert('Mật khẩu phải có ít nhất 8 ký tự', 'error');
            return;
        }

        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            this.showAlert('Token không hợp lệ', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('✅ Mật khẩu đã được đặt lại thành công!', 'success');
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                this.showAlert(result.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
            }

        } catch (error) {
            console.error('Reset password error:', error);
            this.showAlert('Có lỗi kết nối. Vui lòng kiểm tra internet và thử lại.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    // Set loading state for button
    setLoadingState(loading) {
        if (!this.submitButton) return;

        this.submitButton.disabled = loading;
        
        if (loading) {
            this.submitButton.classList.add('btn-loading');
            this.submitButton.setAttribute('data-original-text', this.submitButton.textContent);
            this.submitButton.textContent = 'Đang xử lý...';
        } else {
            this.submitButton.classList.remove('btn-loading');
            const originalText = this.submitButton.getAttribute('data-original-text');
            this.submitButton.textContent = originalText || 'Đặt lại mật khẩu';
        }
    }

    // Add ripple effect to button
    addRippleEffect(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            background-color: rgba(255, 255, 255, 0.3);
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        // Add ripple keyframes if not exists
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.remove();
            }
        }, 600);
    }

    // Show alert message
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at the top of the form
        const formCard = document.querySelector('.form-card');
        if (formCard) {
            formCard.insertBefore(alert, formCard.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordPage();
});

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
            padding: 0;
            margin: 0;
        }
    }
`;
document.head.appendChild(style);
