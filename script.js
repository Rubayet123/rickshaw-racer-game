/* --------------------------------------------------------------
   Rickshaw Runner – NO LOADING BLOCK – works even with missing assets
   -------------------------------------------------------------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 380;
canvas.height = 500;

/* ---------- Game state ---------- */
let score = 0;
let gameRunning = false;
let animationId;
let bgOffset = 0;

/* ---------- Assets ---------- */
const assets = {
  rickshawSheet: new Image(),
  bus: new Image(),
  pothole: new Image(),
  taka: new Image(),
  bg: new Image(),
  bell: new Audio('assets/bell.mp3')
};

assets.rickshawSheet.src = 'assets/rickshaw-spritesheet.png';
assets.bus.src          = 'assets/bus.png';
assets.pothole.src      = 'assets/pothole.png';
assets.taka.src         = 'assets/taka.png';
assets.bg.src           = 'assets/bg.jpg';

/* ---------- Critical assets (must load) ---------- */
const critical = ['rickshawSheet', 'bg'];
let criticalLoaded = 0;

critical.forEach(key => {
  assets[key].onload = () => {
    criticalLoaded++;
    if (criticalLoaded === critical.length) hideLoader();
  };
});

/* ---------- Loading overlay ---------- */
const loader = document.createElement('div');
loader.id = 'loader';
loader.style.cssText = `
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,100,0,0.9); color: white; padding: 15px 30px;
  border-radius: 12px; font-weight: bold; font-size: 1.2em; z-index: 100;
  box-shadow: 0 0 20px rgba(0,0,0,0.3);
`;
loader.textContent = 'Loading…';
document.body.appendChild(loader);

/* Hide loader when critical assets are ready */
function hideLoader() {
  loader.style.transition = 'opacity 0.5s';
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 600);
}

/* Fallback: hide loader after 3 seconds even if assets fail */
setTimeout(hideLoader, 3000);

/* ---------- Player ---------- */
const player = {
  x: 50,
  y: canvas.height - 120,
  width: 48,
  height: 64,
  jumping: false,
  velocityY: 0,
  frame: 0,
  frameCount: 8,
  frameTime: 0,
  animSpeed: 5
};

/* ---------- Game objects ---------- */
let obstacles = [];
let coins = [];

/* ---------- UI ---------- */
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); });

function jump() {
  if (!player.jumping && gameRunning) {
    player.jumping = true;
    player.velocityY = -15;
    player.frame = 0;
    assets.bell.currentTime = 0;
    assets.bell.play().catch(() => {});
  }
}

/* ---------- Start game (no blocking) ---------- */
function startGame() {
  // Reset
  score = 0;
  obstacles = [];
  coins = [];
  player.y = canvas.height - 120;
  player.jumping = false;
  player.velocityY = 0;
  player.frame = 0;
  player.frameTime = 0;
  bgOffset = 0;

  document.getElementById('startBtn').classList.add('hidden');
  document.getElementById('gameOver').classList.add('hidden');
  document.getElementById('score').classList.remove('hidden');

  gameRunning = true;
  updateScore();
  requestAnimationFrame(gameLoop);
}

/* ---------- Main loop ---------- */
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background (fallback to sky blue if missing)
  if (assets.bg.complete && assets.bg.naturalWidth > 0) {
    bgOffset -= 4;
    if (bgOffset <= -canvas.width) bgOffset = 0;
    ctx.drawImage(assets.bg, bgOffset, 0, canvas.width, canvas.height);
    ctx.drawImage(assets.bg, bgOffset + canvas.width, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Player physics
  if (player.jumping) {
    player.velocityY += 0.8;
    player.y += player.velocityY;
    if (player.y >= canvas.height - 120) {
      player.y = canvas.height - 120;
      player.jumping = false;
      player.velocityY = 0;
    }
  }

  // Animate
  player.frameTime++;
  if (player.frameTime >= player.animSpeed) {
    player.frame = (player.frame + 1) % player.frameCount;
    player.frameTime = 0;
  }
  drawPlayer();

  // Spawn
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - 80,
      width: 70,
      height: 90,
      type: Math.random() < 0.6 ? 'bus' : 'pothole'
    });
  }
  if (Math.random() < 0.015) {
    coins.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 200) + 50,
      width: 30,
      height: 30
    });
  }

  // Obstacles
  obstacles = obstacles.filter(obs => {
    obs.x -= 6;
    const img = obs.type === 'bus' ? assets.bus : assets.pothole;
    if (img.complete) {
      ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
    } else {
      ctx.fillStyle = '#555';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    if (
      player.x + player.width > obs.x &&
      player.x < obs.x + obs.width &&
      player.y + player.height > obs.y
    ) endGame();

    return obs.x > -100;
  });

  // Coins
  coins = coins.filter(coin => {
    coin.x -= 5;
    if (assets.taka.complete) {
      ctx.drawImage(assets.taka, coin.x, coin.y, coin.width, coin.height);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(coin.x + 15, coin.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    if (
      player.x + player.width > coin.x &&
      player.x < coin.x + coin.width &&
      player.y + player.height > coin.y &&
      player.y < coin.y + coin.height
    ) {
      score += 10;
      updateScore();
      return false;
    }
    return coin.x > -50;
  });

  animationId = requestAnimationFrame(gameLoop);
}

/* ---------- Draw player (fallback if sprite missing) ---------- */
function drawPlayer() {
  if (assets.rickshawSheet.complete && assets.rickshawSheet.naturalWidth > 0) {
    const fw = 48, fh = 64;
    const sx = (player.frame % 4) * fw;
    const sy = Math.floor(player.frame / 4) * fh;
    ctx.drawImage(assets.rickshawSheet, sx, sy, fw, fh, player.x, player.y, player.width, player.height);
  } else {
    // Fallback: red rectangle with face
    ctx.fillStyle = '#C00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#000';
    ctx.fillText('Rickshaw', player.x + 2, player.y + 30);
  }
}

/* ---------- UI ---------- */
function updateScore() {
  document.getElementById('scoreValue').textContent = score;
}
function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOver').classList.remove('hidden');
  document.getElementById('score').classList.add('hidden');
}

/* ---------- Start button always enabled ---------- */
document.getElementById('startBtn').disabled = false;
