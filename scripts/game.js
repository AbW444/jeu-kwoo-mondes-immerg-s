// scripts/game.js
// Gestion des erreurs pour éviter de spammer la console
let errorCount = 0;
let lastErrorTime = Date.now();
const MAX_ERRORS_PER_SECOND = 5;

function logError(message, ...args) {
    const now = Date.now();
    
    // Réinitialiser le compteur après une seconde
    if (now - lastErrorTime > 1000) {
        errorCount = 0;
        lastErrorTime = now;
    }
    
    // Limiter le nombre d'erreurs par seconde
    if (errorCount < MAX_ERRORS_PER_SECOND) {
        console.error(message, ...args);
        errorCount++;
    } else if (errorCount === MAX_ERRORS_PER_SECOND) {
        console.error("Trop d'erreurs, limitation des messages...");
        errorCount++;
    }
}

// Récupérer le canvas et le contexte
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuration du canvas pour qu'il prenne toute la taille du conteneur
function resizeCanvas() {
    // Étendre pour remplir complètement le conteneur
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}

// Appeler au chargement et lors du redimensionnement
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Appliquer l'arrière-plan du site
document.body.style.backgroundImage = 'url("assets/background.jpg")';
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundPosition = 'center';
document.body.style.backgroundRepeat = 'no-repeat';

// Initialisation du timer de jeu
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

// Initialisation des objets du jeu
let player = null;
let gameMap = null;
let pokemonSystem = null;
let gameInitialized = false;

// Variable pour la gestion de la performance
let lastFrameTime = 0;
let frameCount = 0;
let fps = 0;
let fpsUpdateTime = 0;

// État du jeu
const gameState = {
    loading: true,
    error: false,
    errorMessage: ""
};

// Variables de contrôle
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

// Gestionnaires d'événements pour les touches
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
    
    // Seulement si le jeu est initialisé
    if (!gameInitialized) return;
    
    // Touches pour lancer des Pokéballs
    if (e.code === 'Digit1' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
        pokemonSystem.attemptCapture('normal');
    } else if (e.code === 'Digit2' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
        pokemonSystem.attemptCapture('super');
    } else if (e.code === 'Digit3' && pokemonSystem.isEncountering && !pokemonSystem.captureAnimation.active) {
        pokemonSystem.attemptCapture('hyper');
    }
    
    // Touche Escape pour fuir un combat
    if (e.code === 'Escape' && pokemonSystem.isEncountering) {
        pokemonSystem.escape();
    }
});

// Dessin de l'écran de chargement avec barre de progression
function drawLoadingScreen() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Fond noir sur tout l'écran
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Largeur et hauteur de la barre de progression
    const barWidth = 300;
    const barHeight = 30;
    
    // Simuler une progression basée sur le temps
    const progress = (Date.now() % 3000) / 3000; // Cycle de 3 secondes
    
    // Dessiner la bordure de la barre (rectangle blanc avec contour)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(centerX - barWidth/2 - 3, centerY - barHeight/2 - 3, barWidth + 6, barHeight + 6);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - barWidth/2 - 3, centerY - barHeight/2 - 3, barWidth + 6, barHeight + 6);
    
    // Dessiner le fond de la barre (noir)
    ctx.fillStyle = 'black';
    ctx.fillRect(centerX - barWidth/2, centerY - barHeight/2, barWidth, barHeight);
    
    // Dessiner la progression (vert)
    const gradientFill = ctx.createLinearGradient(
        centerX - barWidth/2, centerY,
        centerX - barWidth/2 + barWidth * progress, centerY
    );
    gradientFill.addColorStop(0, '#00AA00'); // Vert foncé
    gradientFill.addColorStop(1, '#00FF00'); // Vert clair
    
    ctx.fillStyle = gradientFill;
    ctx.fillRect(
        centerX - barWidth/2, 
        centerY - barHeight/2, 
        barWidth * progress, 
        barHeight
    );
    
    // Ajouter des détails visuels (brillance sur la barre)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(
        centerX - barWidth/2, 
        centerY - barHeight/2, 
        barWidth * progress, 
        barHeight/2
    );
    
    // Texte "Chargement..." au-dessus de la barre
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Chargement...', centerX, centerY - barHeight - 20);
    
    // Pourcentage à l'intérieur de la barre
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${Math.floor(progress * 100)}%`, centerX, centerY);
}

// Dessin de l'écran d'erreur
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

// Calcul du FPS pour l'optimisation
function updateFPS() {
    const now = performance.now();
    frameCount++;
    
    // Mettre à jour le FPS une fois par seconde
    if (now - fpsUpdateTime > 1000) {
        fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime));
        fpsUpdateTime = now;
        frameCount = 0;
    }
}

// Boucle de jeu optimisée
function gameLoop(timestamp) {
    // Calculer le délai entre les frames
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }
    
    // Mettre à jour le FPS
    updateFPS();
    
    // Mettre à jour l'état du jeu
    update();
    
    // Dessiner la scène
    render();
    
    // Mettre à jour le timestamp de la dernière frame
    lastFrameTime = timestamp;
    
    // Planifier la prochaine frame
    requestAnimationFrame(gameLoop);
}

// Mise à jour de l'état du jeu
function update() {
    // Mettre à jour le timer
    gameTimer.update();
    
    // Ne pas mettre à jour si le jeu est en chargement ou erreur
    if (gameState.loading || gameState.error || !gameInitialized) return;
    
    // Ne pas mettre à jour le mouvement du joueur si en rencontre
    if (pokemonSystem.isEncountering) {
        // Mettre à jour l'animation de capture
        pokemonSystem.updateCaptureAnimation();
        return;
    }
    
    let isMoving = false;
    
    // Déplacement horizontal (exclure les diagonales)
    if (keys.ArrowLeft && !keys.ArrowUp && !keys.ArrowDown) {
        gameMap.movingX = true;
        gameMap.movingY = false;
        gameMap.directionX = -1;
        player.animate();
        player.frameY = 1; // Direction gauche
        isMoving = true;
    } else if (keys.ArrowRight && !keys.ArrowUp && !keys.ArrowDown) {
        gameMap.movingX = true;
        gameMap.movingY = false;
        gameMap.directionX = 1;
        player.animate();
        player.frameY = 2; // Direction droite
        isMoving = true;
    } else {
        gameMap.movingX = false;
        gameMap.directionX = 0;
    }
    
    // Déplacement vertical (exclure les diagonales)
    if (keys.ArrowUp && !keys.ArrowLeft && !keys.ArrowRight) {
        gameMap.movingY = true;
        gameMap.movingX = false;
        gameMap.directionY = -1;
        player.animate();
        player.frameY = 3; // Direction haut
        isMoving = true;
    } else if (keys.ArrowDown && !keys.ArrowLeft && !keys.ArrowRight) {
        gameMap.movingY = true;
        gameMap.movingX = false;
        gameMap.directionY = 1;
        player.animate();
        player.frameY = 0; // Direction bas
        isMoving = true;
    } else if (!gameMap.movingX) {
        gameMap.movingY = false;
        gameMap.directionY = 0;
    }
    
    // Mise à jour de la position de la carte et vérification des Pokéballs collectées
    const collectedBalls = gameMap.update(ctx, player);
    
    // Ajouter les Pokéballs collectées à l'inventaire
    if (collectedBalls && collectedBalls.length > 0) {
        pokemonSystem.addPokeballs(collectedBalls);
    }
    
    // Mettre à jour les Pokémon sauvages
    pokemonSystem.update(gameMap);
}

// Dessin de l'écran de jeu avec optimisations
function render() {
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Si en chargement, afficher écran de chargement
    if (gameState.loading) {
        drawLoadingScreen();
        return;
    }
    
    // Si erreur, afficher écran d'erreur
    if (gameState.error) {
        drawErrorScreen();
        return;
    }
    
    // Ne pas dessiner si le jeu n'est pas initialisé
    if (!gameInitialized) return;
    
    try {
        // Dessiner la carte
        gameMap.draw(ctx);
        
        // Dessiner les Pokémon sauvages
        pokemonSystem.drawWildPokemons(ctx, gameMap);
        
        // Dessiner le joueur
        player.draw(ctx);
        
        // Dessiner la collection de Pokémon capturés
        pokemonSystem.drawCapturedPokemon(ctx);
        
        // Afficher écran de rencontre si nécessaire
        pokemonSystem.drawEncounterScreen(ctx);
        
        // Afficher le timer en haut de l'écran avec un meilleur style
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
        
        // Afficher le FPS pour le débogage (peut être désactivé en production)
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.fillRect(10, 10, 70, 25);
        // ctx.fillStyle = 'white';
        // ctx.font = '12px monospace';
        // ctx.textAlign = 'left';
        // ctx.fillText(`FPS: ${fps}`, 15, 25);
    } catch (error) {
        logError("Erreur lors du rendu:", error);
        gameState.error = true;
        gameState.errorMessage = "Erreur lors du rendu: " + error.message;
    }
}

// Fonction d'initialisation optimisée
function init() {
    console.log("Initialisation du jeu...");
    
    // Indiquer que le jeu est en cours de chargement
    gameState.loading = true;
    
    try {
        // Créer les objets du jeu dans le bon ordre avec gestion des erreurs
        player = new Player();
        console.log("Joueur créé");
        
        // Création immédiate de la carte sans attendre
        gameMap = new GameMap();
        // Rendre accessible globalement pour les contrôles
        window.gameMap = gameMap;
        console.log("Carte créée");
        
        // Créer le système Pokémon tout de suite également
        pokemonSystem = new PokemonSystem();
        console.log("Système Pokémon créé");
        
        // Attendre un court délai pour permettre le chargement des ressources
        setTimeout(() => {
            // Marquer le jeu comme initialisé
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

// Démarrer le jeu quand la fenêtre est chargée
window.addEventListener('load', () => {
    console.log("Page chargée, démarrage de l'initialisation...");
    
    // Démarrer la boucle de jeu tout de suite avec timestamp
    requestAnimationFrame(gameLoop);
    
    // Initialiser le jeu
    init();
});