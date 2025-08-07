// --- 3D Tilt Effect Script ---
const cardContainer = document.querySelector('.register-card-container');
const card = document.querySelector('.register-card');

cardContainer.addEventListener('mousemove', (e) => {
    let xAxis = (cardContainer.offsetWidth / 2 - (e.pageX - cardContainer.offsetLeft)) / 20;
    let yAxis = (cardContainer.offsetHeight / 2 - (e.pageY - cardContainer.offsetTop)) / 20;
    card.style.transform = `rotateY(${xAxis}deg) rotateX(${-yAxis}deg)`;
});

cardContainer.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
});

cardContainer.addEventListener('mouseenter', () => {
    card.style.transition = 'none';
});


// --- Particle Background Script ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particlesArray;

let mouse = {
    x: null,
    y: null,
    radius: (canvas.height / 120) * (canvas.width / 120)
};

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor(x, y, dX, dY, s, c) {
        this.x = x;
        this.y = y;
        this.directionX = dX;
        this.directionY = dY;
        this.size = s;
        this.color = c;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let num = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < num; i++) {
        let s = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - s * 2) - (s * 2)) + s * 2);
        let y = (Math.random() * ((innerHeight - s * 2) - (s * 2)) + s * 2);
        let dX = (Math.random() * .4) - .2;
        let dY = (Math.random() * .4) - .2;
        let c = 'rgba(255,255,255,0.5)';
        particlesArray.push(new Particle(x, y, dX, dY, s, c));
    }
}

function connect() {
    let op;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dist = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                       ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (dist < (canvas.width / 7) * (canvas.height / 7)) {
                op = 1 - (dist / 20000);
                let dx = mouse.x - particlesArray[a].x;
                let dy = mouse.y - particlesArray[a].y;
                if (Math.sqrt(dx * dx + dy * dy) < mouse.radius) {
                    ctx.strokeStyle = `rgba(251,191,36,${op})`;
                } else {
                    ctx.strokeStyle = `rgba(156,163,175,${op})`;
                }
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

window.addEventListener('resize', () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    mouse.radius = (canvas.height / 120) * (canvas.width / 120);
    init();
});

window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
});

init();
animate();

// --- Form Handling Script ---
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    const submitButton = document.querySelector('.register-button');
    const errorMessage = document.getElementById('error-message');
    
    // Add dropdown animation effects
    const dropdowns = document.querySelectorAll('.custom-select');
    
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('selected');
                // Add ripple effect
                addRippleEffect(this);
                // Remove selected class after animation
                setTimeout(() => {
                    this.classList.remove('selected');
                }, 300);
            }
        });
        
        // Add focus effects
        dropdown.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        dropdown.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    function addRippleEffect(element) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(251, 191, 36, 0.3);
            transform: scale(0);
            animation: rippleAnimation 0.6s linear;
            left: 50%;
            top: 50%;
            width: 20px;
            height: 20px;
            margin-left: -10px;
            margin-top: -10px;
        `;
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Add ripple animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleAnimation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Disable button during submission
            submitButton.disabled = true;
            submitButton.textContent = 'Đang đăng ký...';
            
            // Clear previous error messages
            if (errorMessage) {
                errorMessage.textContent = '';
                errorMessage.style.display = 'none';
            }
            
            // Get form data
            const formData = new FormData(registerForm);
            const registerData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                firstName: formData.get('first_name'),
                lastName: formData.get('last_name'),
                day: formData.get('day'),
                month: formData.get('month'),
                year: formData.get('year'),
                gender: formData.get('gender')
            };
            
            // Basic client-side validation
            if (!registerData.username || !registerData.email || !registerData.password || !registerData.confirmPassword || !registerData.firstName || !registerData.lastName) {
                showError('Vui lòng điền đầy đủ thông tin bắt buộc');
                resetButton();
                return;
            }

            // Date validation
            if (!registerData.day || !registerData.month || !registerData.year) {
                showError('Vui lòng chọn đầy đủ ngày sinh');
                resetButton();
                return;
            }

            // Validate age (must be at least 13 years old)
            const birthDate = new Date(registerData.year, registerData.month - 1, registerData.day);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 13) {
                showError('Bạn phải ít nhất 13 tuổi để đăng ký');
                resetButton();
                return;
            }

            if (age > 120) {
                showError('Vui lòng kiểm tra lại ngày sinh');
                resetButton();
                return;
            }

            // Gender validation
            if (!registerData.gender) {
                showError('Vui lòng chọn giới tính');
                resetButton();
                return;
            }
            
            if (registerData.password !== registerData.confirmPassword) {
                showError('Mật khẩu xác nhận không khớp');
                resetButton();
                return;
            }
            
            if (registerData.password.length < 6) {
                showError('Mật khẩu phải có ít nhất 6 ký tự');
                resetButton();
                return;
            }
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Registration successful, redirect to login
                    window.location.href = data.redirect || '/login.html';
                } else {
                    // Show error message
                    showError(data.message || 'Đăng ký thất bại');
                    resetButton();
                }
            } catch (error) {
                console.error('Registration error:', error);
                showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
                resetButton();
            }
        });
    }
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            errorMessage.classList.add('shake');
            setTimeout(() => {
                errorMessage.classList.remove('shake');
            }, 600);
        }
    }
    
    function resetButton() {
        submitButton.disabled = false;
        submitButton.textContent = 'Đăng ký';
    }
});