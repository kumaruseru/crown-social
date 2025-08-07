// --- Script hiệu ứng 3D nghiêng cho thẻ ---
const cardContainer = document.querySelector('.form-card-container');
const card = document.querySelector('.form-card');

cardContainer.addEventListener('mousemove', (e) => {
    let xAxis = (cardContainer.offsetWidth / 2 - (e.pageX - cardContainer.offsetLeft)) / 20;
    let yAxis = (cardContainer.offsetHeight / 2 - (e.pageY - cardContainer.offsetTop)) / 20;
    card.style.transform = `rotateY(${xAxis}deg) rotateX(${-yAxis}deg)`;
});

cardContainer.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
});

cardContainer.addEventListener('mouseenter', () => card.style.transition = 'none');

// --- Script hiệu ứng nền hạt ---
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particlesArray;
let mouse = { x: null, y: null, radius: (canvas.height / 120) * (canvas.width / 120) };

window.addEventListener('mousemove', (event) => { mouse.x = event.x; mouse.y = event.y; });

class Particle {
    constructor(x, y, dX, dY, s, c) { this.x=x; this.y=y; this.directionX=dX; this.directionY=dY; this.size=s; this.color=c; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2, false); ctx.fillStyle=this.color; ctx.fill(); }
    update() {
        if(this.x > canvas.width || this.x < 0) { this.directionX = -this.directionX; }
        if(this.y > canvas.height || this.y < 0) { this.directionY = -this.directionY; }
        this.x += this.directionX; this.y += this.directionY; this.draw();
    }
}

function init() {
    particlesArray = [];
    let num = (canvas.height * canvas.width) / 9000;
    for(let i = 0; i < num; i++){
        let s = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - s * 2) - (s * 2)) + s * 2);
        let y = (Math.random() * ((innerHeight - s * 2) - (s * 2)) + s * 2);
        let dX = (Math.random() * 0.4) - 0.2;
        let dY = (Math.random() * 0.4) - 0.2;
        let c = 'rgba(255, 255, 255, 0.5)';
        particlesArray.push(new Particle(x, y, dX, dY, s, c));
    }
}

function connect() {
    let op;
    for(let a = 0; a < particlesArray.length; a++){
        for(let b = a; b < particlesArray.length; b++){
            let dist = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if(dist < (canvas.width / 7) * (canvas.height / 7)){
                op = 1 - (dist / 20000);
                let dx = mouse.x - particlesArray[a].x;
                let dy = mouse.y - particlesArray[a].y;
                if(Math.sqrt(dx * dx + dy * dy) < mouse.radius) {
                    ctx.strokeStyle = `rgba(251, 191, 36, ${op})`; // Màu vàng khi chuột lại gần
                } else {
                    ctx.strokeStyle = `rgba(156, 163, 175, ${op})`; // Màu xám mặc định
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
    for(let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); }
    connect();
}

window.addEventListener('resize', () => {
    canvas.width = innerWidth; 
    canvas.height = innerHeight; 
    mouse.radius = (canvas.height / 120) * (canvas.width / 120); 
    init();
});

window.addEventListener('mouseout', () => { mouse.x = undefined; mouse.y = undefined; });

init(); 
animate();