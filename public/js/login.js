// --- Password Toggle Script ---
const togglePassword = document.getElementById('togglePassword');
const password = document.getElementById('password');
const eyeOpen = document.getElementById('eye-open');
const eyeClosed = document.getElementById('eye-closed');

togglePassword.addEventListener('click', function (e) {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    eyeOpen.classList.toggle('hidden');
    eyeClosed.classList.toggle('hidden');
});

// --- 3D Tilt Effect Script ---
const cardContainer = document.querySelector('.login-card-container');
const card = document.querySelector('.login-card');

cardContainer.addEventListener('mousemove', (e) => {
    let xAxis = (cardContainer.offsetWidth / 2 - (e.pageX - cardContainer.offsetLeft)) / 20;
    let yAxis = (cardContainer.offsetHeight / 2 - (e.pageY - cardContainer.offsetTop)) / 20;
    card.style.transform = `rotateY(${xAxis}deg) rotateX(${-yAxis}deg)`;
});

cardContainer.addEventListener('mouseleave', (e) => {
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
});
cardContainer.addEventListener('mouseenter', (e) => {
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
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
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
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * .4) - .2;
        let directionY = (Math.random() * .4) - .2;
        let color = 'rgba(255, 255, 255, 0.5)';
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                let dx = mouse.x - particlesArray[a].x;
                let dy = mouse.y - particlesArray[a].y;
                let mouseDistance = Math.sqrt(dx * dx + dy * dy);
                if (mouseDistance < mouse.radius) {
                    ctx.strokeStyle = `rgba(251,191,36,${opacityValue})`;
                } else {
                    ctx.strokeStyle = `rgba(156,163,175,${opacityValue})`;
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

window.addEventListener('resize', function() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    mouse.radius = (canvas.height / 120) * (canvas.width / 120);
    init();
});

window.addEventListener('mouseout', function() {
    mouse.x = undefined;
    mouse.y = undefined;
});

init();
animate();

// --- Form Submission Handler ---
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Đang đăng nhập...';
            submitButton.disabled = true;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (result.success) {
                    // Success - redirect to home
                    window.location.href = result.data.redirect || '/home.html';
                } else {
                    // Error - show message
                    showErrorMessage(result.message || 'Đăng nhập thất bại');
                }

            } catch (error) {
                console.error('Login error:', error);
                showErrorMessage('Có lỗi xảy ra, vui lòng thử lại');
            } finally {
                // Restore button
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
});

// Helper function to show error messages
function showErrorMessage(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4';
    errorDiv.textContent = message;

    // Insert before the form
    const form = document.querySelector('form');
    form.parentNode.insertBefore(errorDiv, form);

    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
