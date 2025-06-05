let errorCount = 0;
let lastErrorTime = Date.now();
const MAX_ERRORS_PER_SECOND = 5;

function logError(message, ...args) {
  const now = Date.now();
  
  if (now - lastErrorTime > 1000) {
    errorCount = 0;
    lastErrorTime = now;
  }
  
  if (errorCount < MAX_ERRORS_PER_SECOND) {
    console.error(message, ...args);
    errorCount++;
  } else if (errorCount === MAX_ERRORS_PER_SECOND) {
    console.error("Trop d'erreurs, limitation des messages...");
    errorCount++;
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.body.style.backgroundImage = 'url("Assets/background.jpg")';
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundPosition = 'center';
document.body.style.backgroundRepeat = 'no-repeat';

const gameTimer = {
  startTime: Date.now(),
  elapsedTimeInSeconds: 0,
  update: function() {
    this.elapsedTimeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
  },
  getTimeString: function() {
    const hours = Math.floor(this.elapsedTimeInSeconds / 3600);
    const minutes = Math.floor((this.elapsedTimeInSeconds % 3600) / 60);
    const seconds = this.elapsedTimeInSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
};

let player = null;
let gameMap = null;
let pokemonSystem = null;
let gameInitialized = false;

let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;
let fpsUpdateTime = 0;

const gameState = {
  loading: true,
  error: false,
  errorMessage: ""
};

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
  Digit1: false,
  Digit2: false,
  Digit3: false
};

window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = false;
  }
  
  if (!gameInitialized) return;
  
  if (e.code === 'Digit1' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
    pokemonSystem.attemptCapture('normal');
  } else if (e.code === 'Digit2' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
    pokemonSystem.attemptCapture('super');
  } else if (e.code === 'Digit3' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
    pokemonSystem.attemptCapture('hyper');
  }
  
  if (e.code === 'Escape' && pokemonSystem.isEncountering) {
    pokemonSystem.escape();
  }
});

function drawLoadingScreen() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const barWidth = 300;
  const barHeight = 30;
  
  const progress = (Date.now() % 3000) / 3000;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(centerX - barWidth/2 - 3, centerY - barHeight/2 - 3, barWidth + 6, barHeight + 6);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.strokeRect(centerX - barWidth/2 - 3, centerY - barHeight/2 - 3, barWidth + 6, barHeight + 6);
  
  ctx.fillStyle = 'black';
  ctx.fillRect(centerX - barWidth/2, centerY - barHeight/2, barWidth, barHeight);
  
  const gradientFill = ctx.createLinearGradient(
    centerX - barWidth/2, centerY,
    centerX - barWidth/2 + barWidth * progress, centerY
  );
  gradientFill.addColorStop(0, '#00AA00');
  gradientFill.addColorStop(1, '#00FF00');
  
  ctx.fillStyle = gradientFill;
  ctx.fillRect(
    centerX - barWidth/2, 
    centerY - barHeight/2, 
    barWidth * progress, 
    barHeight
  );
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(
    centerX - barWidth/2, 
    centerY - barHeight/2, 
    barWidth * progress, 
    barHeight/2
  );
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Chargement...', centerX, centerY - barHeight - 20);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`${Math.floor(progress * 100)}%`, centerX, centerY);
}

function drawErrorScreen() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'red';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Erreur!', centerX, centerY - 40);
  
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText(gameState.errorMessage, centerX, centerY);
  
  ctx.fillText('Rafraîchissez la page pour réessayer.', centerX, centerY + 40);
}

function updateFPS() {
  const now = performance.now();
  frameCount++;
  
  if (now - fpsUpdateTime > 1000) {
    fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime));
    fpsUpdateTime = now;
    frameCount = 0;
  }
}

function gameLoop(timestamp) {
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }
  
  updateFPS();
  update();
  render();
  
  lastFrameTime = timestamp;
  requestAnimationFrame(gameLoop);
}

function update() {
  gameTimer.update();
  
  if (gameState.loading || gameState.error || !gameInitialized) return;
  
  if (pokemonSystem.isEncountering) {
    pokemonSystem.updateCaptureAnimation();
    return;
  }
  
  let isMoving = false;
  
  if (keys.ArrowLeft && !keys.ArrowUp && !keys.ArrowDown) {
    gameMap.movingX = true;
    gameMap.movingY = false;
    gameMap.directionX = -1;
    player.animate();
    player.frameY = 1;
    isMoving = true;
  } else if (keys.ArrowRight && !keys.ArrowUp && !keys.ArrowDown) {
    gameMap.movingX = true;
    gameMap.movingY = false;
    gameMap.directionX = 1;
    player.animate();
    player.frameY = 2;
    isMoving = true;
  } else {
    gameMap.movingX = false;
    gameMap.directionX = 0;
  }
  
  if (keys.ArrowUp && !keys.ArrowLeft && !keys.ArrowRight) {
    gameMap.movingY = true;
    gameMap.movingX = false;
    gameMap.directionY = -1;
    player.animate();
    player.frameY = 3;
    isMoving = true;
  } else if (keys.ArrowDown && !keys.ArrowLeft && !keys.ArrowRight) {
    gameMap.movingY = true;
    gameMap.movingX = false;
    gameMap.directionY = 1;
    player.animate();
    player.frameY = 0;
    isMoving = true;
  } else if (!gameMap.movingX) {
    gameMap.movingY = false;
    gameMap.directionY = 0;
  }
  
  const collectedBalls = gameMap.update(ctx, player);
  
  if (collectedBalls && collectedBalls.length > 0) {
    pokemonSystem.addPokeballs(collectedBalls);
  }
  
  pokemonSystem.update(gameMap);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (gameState.loading) {
    drawLoadingScreen();
    return;
  }
  
  if (gameState.error) {
    drawErrorScreen();
    return;
  }
  
  if (!gameInitialized) return;
  
  try {
    gameMap.draw(ctx);
    pokemonSystem.drawWildPokemons(ctx, gameMap);
    player.draw(ctx);
    pokemonSystem.drawCapturedPokemon(ctx);
    pokemonSystem.drawEncounterScreen(ctx);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width / 2 - 60, 10, 120, 30);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 60, 10, 120, 30);

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const timeText = gameTimer.getTimeString();
    ctx.fillText(timeText, canvas.width / 2, 25);
    
  } catch (error) {
    logError("Erreur lors du rendu:", error);
    gameState.error = true;
    gameState.errorMessage = "Erreur lors du rendu: " + error.message;
  }
}

function init() {
  console.log("Initialisation du jeu...");
  
  gameState.loading = true;
  
  try {
    player = new Player();
    console.log("Joueur créé");
    
    gameMap = new GameMap();
    window.gameMap = gameMap;
    console.log("Carte créée");
    
    pokemonSystem = new PokemonSystem();
    console.log("Système Pokémon créé");
    
    setTimeout(() => {
      gameInitialized = true;
      gameState.loading = false;
      console.log("Tout est prêt, démarrage du jeu!");
    }, 2000);
  } catch (error) {
    logError("Erreur d'initialisation:", error);
    gameState.error = true;
    gameState.errorMessage = "Erreur d'initialisation: " + error.message;
    gameState.loading = false;
  }
}

window.addEventListener('load', () => {
  console.log("Page chargée, démarrage de l'initialisation...");
  requestAnimationFrame(gameLoop);
  init();
});
