/* --------------------------------------------------------------
   Rickshaw Runner – fully working with animated sprite sheet
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
  bell: new Audio('assets/bell.mp3')   // audio – no onload
};

assets.rickshawSheet.src = 'assets/rickshaw-spritesheet.png';
assets.bus.src          = 'assets/bus.png';
assets.pothole.src      = 'assets/pothole.png';
assets.taka.src         = 'assets/taka.png';
assets.bg.src           = 'assets/bg.jpg';

/* ---------- Asset loading counter (images only) ---------- */
const imageKeys = ['rickshawSheet', 'bus', 'pothole', 'taka', 'bg'];
let loadedImages = 0;
const totalImages = imageKeys.length;

function imageLoaded() {
  loadedImages++;
  if (loadedImages === totalImages) startButtonEnabled();
}
imageKeys.forEach(k => assets[k].onload = imageLoaded);

/* Fallback – start after 2 s even if something is broken */
setTimeout(() => {
  if (loadedImages < totalImages) startButtonEnabled();
}, 2000);

function startButtonEnabled() {
  document.getElementById('startBtn').disabled = false;
  document.getElementById('startBtn').textContent = 'Start Game';
}

/* ---------- Player (animated sprite) ---------- */
const player = {
  x: 50,
  y: canvas.height - 120,
  width: 48,
  height: 64,
  jumping: false,
  velocityY: 0,
  frame: 0,
  frameCount: 8,          // first 8 frames = run cycle
  frameTime: 0,
  animSpeed: 5            // frames per tick
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
    player.frame = 0;                 // reset animation on jump
    assets.bell.currentTime = 0;
    assets.bell.play().catch(() => {});
  }
}

/* ---------- Game start ---------- */
function startGame() {
  if (loadedImages < totalImages) {
    alert('Assets still loading – try again in a second.');
    return;
  }

  // reset everything
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

  /* ---- background scroll ---- */
  bgOffset -= 4;
  if (bgOffset <= -canvas.width) bgOffset = 0;
  ctx.drawImage(assets.bg, bgOffset, 0, canvas.width, canvas.height);
  ctx.drawImage(assets.bg, bgOffset + canvas.width, 0, canvas.width, canvas.height);

  /* ---- player physics ---- */
  if (player.jumping) {
    player.velocityY += 0.8;
    player.y += player.velocityY;
    if (player.y >= canvas.height - 120) {
      player.y = canvas.height - 120;
      player.jumping = false;
      player.velocityY = 0;
    }
  }

  /* ---- animate sprite ---- */
  player.frameTime++;
  if (player.frameTime >= player.animSpeed) {
    player.frame = (player.frame + 1) % player.frameCount;
    player.frameTime = 0;
  }
  drawPlayer();

  /* ---- spawn obstacles ---- */
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - 80,
      width: 70,
      height: 90,
      type: Math.random() < 0.6 ? 'bus' : 'pothole'
    });
  }

  /* ---- spawn coins ---- */
  if (Math.random() < 0.015) {
    coins.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 200) + 50,
      width: 30,
      height: 30
    });
  }

  /* ---- update & draw obstacles ---- */
  obstacles = obstacles.filter(obs => {
    obs.x -= 6;
    const img = obs.type === 'bus' ? assets.bus : assets.pothole;
    ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);

    // collision
    if (
      player.x + player.width > obs.x &&
      player.x < obs.x + obs.width &&
      player.y + player.height > obs.y
    ) {
      endGame();
    }
    return obs.x > -100;
  });

  /* ---- update & draw coins ---- */
  coins = coins.filter(coin => {
    coin.x -= 5;
    ctx.drawImage(assets.taka, coin.x, coin.y, coin.width, coin.height);

    // collect
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

/* ---------- Draw animated player ---------- */
function drawPlayer() {
  const fw = 48, fh = 64;
  const sx = (player.frame % 4) * fw;          // 4 columns
  const sy = Math.floor(player.frame / 4) * fh; // rows

  ctx.drawImage(
    assets.rickshawSheet,
    sx, sy, fw, fh,
    player.x, player.y, player.width, player.height
  );
}

/* ---------- UI helpers ---------- */
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

/* ---------- Disable start button until ready ---------- */
document.getElementById('startBtn').disabled = true;
document.getElementById('startBtn').textContent = 'Loading…';
