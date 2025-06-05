	// scripts/map.js - Dans constructor
class GameMap {
    constructor() {
		// Charger la carte du monde avec chemin absolu
		this.image = new Image();
		this.image.src = 'assets/maps/world_map.png';
		
		// Dimensions réelles de la carte
		this.width = 8192;
		this.height = 4096;
		
		this.positionX = 0; // Position horizontale
		this.positionY = 0; // Position verticale
		this.baseSpeed = 6; // Vitesse de base divisée par 2 (de 12 à 6)
		this.currentSpeed = this.baseSpeed; // Vitesse actuelle
		this.movingX = false;
		this.movingY = false;
		this.directionX = 0; // -1: gauche, 0: arrêt, 1: droite
		this.directionY = 0; // -1: haut, 0: arrêt, 1: bas
		
		// Pokéballs sur la carte - ajout de cache pour l'optimisation
		this.pokeballs = [];
		this.pokeballsVisible = []; // Cache des pokéballs visibles
		this.lastViewportInfo = null; // Cache du dernier viewport
		this.mapLoaded = false;
		
		// Compteur pour limiter les erreurs affichées
		this.errorCount = 0;
		this.lastErrorTime = Date.now();
		
		// Ajouter des gestionnaires d'événement pour vérifier le chargement
		this.image.onload = () => {
			console.log("Image de la carte chargée avec succès:", this.image.width, "x", this.image.height);
			// Ajuster la taille si nécessaire
			if (this.image.width !== this.width || this.image.height !== this.height) {
				console.warn("La taille de l'image ne correspond pas aux dimensions attendues!");
				this.width = this.image.width;
				this.height = this.image.height;
			}
			
			this.mapLoaded = true;
			// Trouver une position initiale aléatoire
			this.findSafeStartPosition();
			// Générer des Pokéballs initiales
			this.generateInitialPokeballs(150); // Doublé de 75 à 150
		};
		
		this.image.onerror = () => {
			console.error("ERREUR: Impossible de charger l'image de la carte (assets/maps/world_map.png)");
			this.createFallbackMap();
		};
		
		// Pré-chargement des sprites de Pokéballs pour optimisation
		this.pokeballSprites = {};
		this.loadPokeballSprites();
	}
		
	// scripts/map.js - Méthode loadPokeballSprites
	loadPokeballSprites() {
		const types = ['normal', 'super', 'hyper'];
		
		types.forEach(type => {
			// Chemin absolu sans point ni slash au début
			const spritePath = `assets/sprites/${type}ball.png`;
			
			const img = new Image();
			img.src = spritePath;
			
			// Log pour déboguer
			console.log(`Chargement du sprite ${type}ball depuis ${spritePath}`);
			
			// Stocker la promesse de chargement pour optimisation
			const loadPromise = new Promise((resolve) => {
				img.onload = () => {
					console.log(`Sprite de ${type}ball chargé avec succès depuis ${spritePath}`);
					resolve(true);
				};
				img.onerror = (e) => {
					console.error(`ERREUR: Impossible de charger le sprite de ${type}ball depuis ${spritePath}`, e);
					resolve(false);
				};
			});
			
			this.pokeballSprites[type] = {
				image: img,
				loaded: false,
				loadPromise: loadPromise
			};
			
			// Mettre à jour l'état une fois chargé
			loadPromise.then(success => {
				this.pokeballSprites[type].loaded = success;
			});
		});
	}
		
    // Position initiale aléatoire
    findSafeStartPosition() {
        this.positionX = Math.random() * this.width;
        this.positionY = Math.random() * this.height;
        console.log("Position initiale définie:", this.positionX, this.positionY);
    }
    
    // Méthode pour créer une carte de remplacement
    createFallbackMap() {
        // Créer un canvas comme fallback
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');
        
        // Remplir avec une couleur de fond (eau)
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner quelques zones de terre
        ctx.fillStyle = 'tan';
        ctx.fillRect(this.width * 0.1, this.height * 0.1, this.width * 0.3, this.height * 0.2);
        ctx.fillRect(this.width * 0.5, this.height * 0.3, this.width * 0.4, this.height * 0.3);
        
        // Utiliser ce canvas comme image de carte
        this.image.src = canvas.toDataURL();
        this.mapLoaded = true;
        
        // Trouver une position initiale aléatoire
        this.findSafeStartPosition();
        // Générer des Pokéballs initiales
        this.generateInitialPokeballs(150);
    }
    
    // Simplification - tout terrain est normal
    getTerrainType(x, y) {
        return "land";
    }
    
    generateInitialPokeballs(count) {
        for (let i = 0; i < count; i++) {
            this.tryGeneratePokeball();
        }
    }
    
    tryGeneratePokeball() {
        // Position aléatoire simple
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        
        const pokeball = this.createRandomPokeball(x, y);
        if (pokeball) {
            this.pokeballs.push(pokeball);
            return true;
        }
        return false;
    }
    
    createRandomPokeball(x, y) {
        const types = ['normal', 'super', 'hyper'];
        const weights = [0.7, 0.25, 0.05]; // 70% normale, 25% super, 5% hyper
        
        let randomValue = Math.random();
        let cumulativeWeight = 0;
        let selectedType = types[0];
        
        for (let i = 0; i < types.length; i++) {
            cumulativeWeight += weights[i];
            if (randomValue <= cumulativeWeight) {
                selectedType = types[i];
                break;
            }
        }
        
        return {
            type: selectedType,
            x: x,
            y: y,
            bounceOffset: 0,
            bounceDirection: 1,
            bounceSpeed: 0.1 + Math.random() * 0.1
        };
    }
    
    update(ctx, player) {
        // Obtenir la position du joueur au centre
        const playerPosition = {
            x: this.positionX,
            y: this.positionY
        };
        
        // Le joueur n'est jamais dans une zone sombre
        player.updateZoneStatus(false);
        
        // Vitesse constante et modérée
        this.currentSpeed = this.baseSpeed;
        
// Mise à jour horizontale
        if (this.movingX && !this.movingY) { // Empêcher le mouvement diagonal
            const newPositionX = this.positionX + this.currentSpeed * this.directionX;
            this.positionX = newPositionX;
            
            // Effet de globe (boucle continue horizontale)
            if (this.positionX < 0) {
                this.positionX += this.width;
            } else if (this.positionX >= this.width) {
                this.positionX -= this.width;
            }
        }
        
        // Mise à jour verticale - sans limite pour permettre un mouvement continu
        if (this.movingY && !this.movingX) { // Empêcher le mouvement diagonal
            const newPositionY = this.positionY + this.currentSpeed * this.directionY;
            this.positionY = newPositionY;
            
            // Effet de globe vertical
            if (this.positionY < -this.height) {
                this.positionY += this.height * 2;
            } else if (this.positionY > this.height) {
                this.positionY -= this.height * 2;
            }
        }
        
        // Générer aléatoirement des Pokéballs avec 20 fois plus de chance (0.15 au lieu de 0.015)
        if (Math.random() < 0.15 && this.pokeballs.length < 300) { // Limite augmentée à 300
            // Spawn multiple - générer jusqu'à 3 pokéballs à la fois
            for (let i = 0; i < 3 && this.pokeballs.length < 300; i++) {
                this.tryGeneratePokeball();
            }
        }
        
        // Mettre à jour les animations des Pokéballs de manière optimisée
        // Ne mettre à jour que les pokéballs visibles ou à proximité
        const scale = 3 * (ctx.canvas.height / this.height);
        const viewportWidth = ctx.canvas.width / scale;
        const viewportHeight = ctx.canvas.height / scale;
        
        // Calculer les limites de la vue actuelle
        const viewMinX = this.positionX - viewportWidth/2 - 100; // Marge de 100 unités
        const viewMaxX = this.positionX + viewportWidth/2 + 100;
        const viewMinY = this.positionY - viewportHeight/2 - 100;
        const viewMaxY = this.positionY + viewportHeight/2 + 100;
        
        // Mettre à jour uniquement les pokéballs visibles ou proches
        for (let i = 0; i < this.pokeballs.length; i++) {
            const ball = this.pokeballs[i];
            
            // Calculer la distance X cyclique (monde qui boucle)
            const dx = (ball.x - this.positionX + this.width/2) % this.width - this.width/2;
            const dy = ball.y - this.positionY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            // Mettre à jour seulement si pokéball visible ou proche
            if (Math.abs(dx) < viewportWidth/2 + 50 && Math.abs(dy) < viewportHeight/2 + 50) {
                ball.bounceOffset += ball.bounceDirection * ball.bounceSpeed;
                if (ball.bounceOffset > 3 || ball.bounceOffset < -3) {
                    ball.bounceDirection *= -1;
                }
            }
        }
        
        // Vérifier les collisions avec les Pokéballs
        return this.checkPokeballCollisions(playerPosition, ctx);
    }
    
    checkPokeballCollisions(playerPosition, ctx) {
        const collectDistance = 60; // Distance augmentée pour collecter une Pokéball
        const collectedBalls = [];
        
        // Calculer facteur d'échelle
        const scale = 3 * (ctx.canvas.height / this.height); // Zoom x3
        
        for (let i = 0; i < this.pokeballs.length; i++) {
            const ball = this.pokeballs[i];
            
            // Calculer la distance entre le joueur et la Pokéball de manière optimisée
            const dx = (playerPosition.x - ball.x + this.width/2) % this.width - this.width/2;
            const dy = playerPosition.y - ball.y;
            const distanceSquared = dx*dx + dy*dy; // Éviter sqrt pour performance
            
            if (distanceSquared < collectDistance*collectDistance) {
                collectedBalls.push({ type: ball.type, index: i });
            }
        }
        
        // Filtrage des pokéballs à conserver (celles qui n'ont pas été collectées)
        if (collectedBalls.length > 0) {
            // Trier les index dans l'ordre décroissant pour éviter les problèmes de suppression
            const collectIndexes = collectedBalls.map(ball => ball.index).sort((a, b) => b - a);
            
            // Supprimer les pokéballs dans l'ordre décroissant des index
            for (const index of collectIndexes) {
                this.pokeballs.splice(index, 1);
            }
            
            // Invalider le cache des pokéballs visibles après collecte
            this.pokeballsVisible = null;
        }
        
        return collectedBalls;
    }
    
    // Calculer les pokéballs visibles pour optimisation du rendu
    getVisiblePokeballs(ctx) {
        // Si le cache est valide, le retourner
        if (this.pokeballsVisible && this.lastViewportInfo) {
            const currentViewport = {
                x: this.positionX,
                y: this.positionY,
                width: ctx.canvas.width,
                height: ctx.canvas.height
            };
            
            // Vérifier si la position a suffisamment changé pour invalider le cache
            const dx = Math.abs(currentViewport.x - this.lastViewportInfo.x);
            const dy = Math.abs(currentViewport.y - this.lastViewportInfo.y);
            const sizeChanged = currentViewport.width !== this.lastViewportInfo.width || 
                                currentViewport.height !== this.lastViewportInfo.height;
            
            // Si pas de changement significatif, utiliser le cache
            if (!sizeChanged && dx < 20 && dy < 20) {
                return this.pokeballsVisible;
            }
        }
        
        // Calculer les nouvelles pokéballs visibles
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Facteur d'échelle
        const baseScale = canvasHeight / this.height;
        const scale = baseScale * 3; // Zoom x3
        
        // Dimensions visibles
        const visibleWidth = canvasWidth / scale;
        const visibleHeight = canvasHeight / scale;
        
        // Calculer les limites de la vue actuelle avec marge
        const viewMinX = this.positionX - visibleWidth/2 - 50;
        const viewMaxX = this.positionX + visibleWidth/2 + 50;
        const viewMinY = this.positionY - visibleHeight/2 - 50;
        const viewMaxY = this.positionY + visibleHeight/2 + 50;
        
        // Filtrer les pokéballs visibles
        this.pokeballsVisible = this.pokeballs.filter(ball => {
            // Calculer la distance cyclique
            const dx = (ball.x - this.positionX + this.width/2) % this.width - this.width/2;
            const dy = ball.y - this.positionY;
            
            // Vérifier si dans la vue
            return Math.abs(dx) < visibleWidth/2 + 50 && Math.abs(dy) < visibleHeight/2 + 50;
        });
        
        // Mettre à jour l'info du viewport
        this.lastViewportInfo = {
            x: this.positionX,
            y: this.positionY,
            width: canvasWidth,
            height: canvasHeight
        };
        
        return this.pokeballsVisible;
    }
    
    draw(ctx) {
        if (!this.mapLoaded) {
            // Si l'image n'est pas encore chargée, dessiner un rectangle noir
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }
        
        // Obtenir les dimensions actuelles du canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Calculer le facteur d'échelle
        const baseScale = canvasHeight / this.height;
        const scale = baseScale * 3; // Zoom x3
        
        // Calculer les dimensions visibles de la carte
        const visibleWidth = canvasWidth / scale;
        const visibleHeight = canvasHeight / scale;
        
        try {
            // Position à l'écran
            const centerX = canvasWidth/2;
            const centerY = canvasHeight/2;
            
            // Dessiner la partie visible de la carte
            // Utiliser une approche simplifiée pour éviter les bugs de performance
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);
            ctx.translate(-this.positionX, -this.positionY);
            
            // Dessiner la carte en mosaïque pour couvrir la zone visible
            const tileSize = 1024; // Taille des tuiles pour le rendu
            
            const startTileX = Math.floor((this.positionX - visibleWidth/2) / tileSize);
            const startTileY = Math.floor((this.positionY - visibleHeight/2) / tileSize);
            const endTileX = Math.ceil((this.positionX + visibleWidth/2) / tileSize);
            const endTileY = Math.ceil((this.positionY + visibleHeight/2) / tileSize);
            
            for (let tileY = startTileY; tileY <= endTileY; tileY++) {
                for (let tileX = startTileX; tileX <= endTileX; tileX++) {
                    const sourceX = ((tileX * tileSize) % this.width + this.width) % this.width;
                    const sourceY = ((tileY * tileSize) % this.height + this.height) % this.height;
                    
                    // Calculer la taille de la tuile (gérer les bords)
                    const tileWidth = Math.min(tileSize, this.width - sourceX);
                    const tileHeight = Math.min(tileSize, this.height - sourceY);
                    
                    if (tileWidth <= 0 || tileHeight <= 0) continue;
                    
                    ctx.drawImage(
                        this.image,
                        sourceX, sourceY,
                        tileWidth, tileHeight,
                        tileX * tileSize, tileY * tileSize,
                        tileWidth, tileHeight
                    );
                }
            }
            
            // Restaurer le contexte avant de dessiner les pokéballs
            ctx.restore();
            
            // Obtenir uniquement les pokéballs visibles pour optimisation
            const visiblePokeballs = this.getVisiblePokeballs(ctx);
            
            // Dessiner les Pokéballs visibles sur la carte de manière optimisée
            visiblePokeballs.forEach(ball => {
                // Récupérer le sprite
                const spriteData = this.pokeballSprites[ball.type];
                if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
                
                const sprite = spriteData.image;
                
                // Calculer la position à l'écran
                const ballX = ((ball.x - this.positionX) % this.width + this.width) % this.width;
                const ballY = ((ball.y - this.positionY) % this.height + this.height) % this.height;
                
                const screenX = ballX * scale + canvasWidth/2;
                const screenY = ballY * scale + canvasHeight/2 + ball.bounceOffset;
                
                // Ne dessiner que si visible à l'écran
                if (screenX > -32 && screenX < canvasWidth + 32 &&
                    screenY > -32 && screenY < canvasHeight + 32) {
                    // Dessiner la Pokéball avec taille augmentée (x2)
                    ctx.drawImage(
                        sprite,
                        0, 0,
                        sprite.width, sprite.height,
                        screenX - 16, screenY - 16,
                        32, 32
                    );
                }
            });
            
        } catch (e) {
            console.error("Erreur lors du dessin de la carte:", e);
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
    }
    
    // Méthode simplifiée pour la compatibilité
    isOnDarkZone(x, y) {
        return false;
    }
}
