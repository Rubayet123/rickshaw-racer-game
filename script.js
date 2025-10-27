const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 380;
canvas.height = 500;

let score = 0;
let gameRunning = false;
let animationId;
let bgOffset = 0;

// Load assets
const assets = {
  rickshawSheet: new Image(),
  bus: new Image(),
  pothole: new Image(),
  taka: new Image(),
  bell: new Audio('assets/bell.mp3'),
  bg: new Image()
};

assets.rickshawSheet.src = 'assets/rickshaw-spritesheet.png';
assets.bus.src = 'assets/bus.png';
assets.pothole.src = 'assets/pothole.png';
assets.taka.src = 'assets/taka.png';
assets.bg.src = 'assets/bg.jpg';

// Player with sprite animation
const player = {
  x: 50,
  y: canvas.height - 120,
  width: 48,
  height: 64,
  jumping: false,
  velocityY: 0,
  frame: 0,
  frameCount: 8,   // Use first 8 frames for run cycle
  frameTime: 0,
  animSpeed: 5     // Change frame every 5 ticks
};

// Game objects
let obstacles = [];
let coins = [];

// Wait for images to load
let loadedAssets = 0;
const totalAssets = 5;

function assetLoaded() {
  loadedAssets++;
  if (loadedAssets === totalAssets) {
    console.log('All assets loaded!');
  }
}

Object.values(assets).forEach(asset => {
  if (asset instanceof Image) {
    asset.onload = assetLoaded;
  }
});

// Start & Restart
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Jump on click/touch
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  jump();
});

function jump() {
  if (!player.jumping && gameRunning) {
    player.jumping = true;
    player.velocityY = -15;
    player.frame = 0; // Reset animation
    assets.bell.currentTime = 0;
    assets.bell.play().catch(() => {});
  }
}

function startGame() {
  if (loadedAssets < totalAssets) {
    alert('Loading assets... Please wait!');
    return;
  }

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

function gameLoop() {
  if (!gameRunning) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scroll background
  bgOffset -= 4;
  if (bgOffset <= -canvas.width) bgOffset = 0;
  ctx.drawImage(assets.bg, bgOffset, 0, canvas.width, canvas.height);
  ctx.drawImage(assets.bg, bgOffset + canvas.width, 0, canvas.width, canvas.height);

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

  // Update animation
  player.frameTime++;
  if (player.frameTime >= player.animSpeed) {
    player.frame = (player.frame + 1) % player.frameCount;
    player.frameTime = 0;
  }

  // Draw animated player
  drawPlayer();

  // Spawn obstacles
  if (Math.random() < 0.02) {
    obstacles.push({
      x: canvas.width,
      y: canvas.height - 80,
      width: 70,
      height: 90,
      type: Math.random() < 0.6 ? 'bus' : 'pothole'
    });
  }

  // Spawn coins
  if (Math.random() < 0.015) {
    coins.push({
      x: canvas.width,
      y: Math.random() * (canvas.height - 200) + 50,
      width: 30,
      height: 30
    });
  }

  // Update & draw obstacles
  obstacles = obstacles.filter(obs => {
    obs.x -= 6;
    const img = obs.type === 'bus' ? assets.bus : assets.pothole;
    ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);

    // Collision
    if (
      player.x + player.width > obs.x &&
      player.x < obs.x + obs.width &&
      player.y + player.height > obs.y
    ) {
      endGame();
    }

    return obs.x > -100;
  });

  // Update & draw coins
  coins = coins.filter(coin => {
    coin.x -= 5;
    ctx.drawImage(assets.taka, coin.x, coin.y, coin.width, coin.height);

    // Collect
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

function drawPlayer() {
  const frameWidth = 48;
  const frameHeight = 64;
  const sourceX = (player.frame % 4) * frameWidth;  // 4 per row
  const sourceY = Math.floor(player.frame / 4) * frameHeight;

  ctx.drawImage(
    assets.rickshawSheet,
    sourceX, sourceY, frameWidth, frameHeight,
    player.x, player.y, player.width, player.height
  );
}

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
