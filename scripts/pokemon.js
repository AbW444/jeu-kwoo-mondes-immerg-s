// scripts/pokemon.js
class PokemonSystem {
    constructor() {
        // Pokémon aquatiques disponibles
        this.waterPokemons = [
            { name: 'Magicarpe', rarity: 1, evolution: 1, sprite: 'magicarpe.png' },
            { name: 'Tentacool', rarity: 1, evolution: 1, sprite: 'tentacool.png' },
            { name: 'Poissirène', rarity: 1, evolution: 1, sprite: 'poissirene.png' },
            { name: 'Stari', rarity: 1, evolution: 1, sprite: 'stari.png' },
            { name: 'Otaria', rarity: 2, evolution: 1, sprite: 'otaria.png' },
            { name: 'Hypocéan', rarity: 2, evolution: 1, sprite: 'hypocean.png' },
            { name: 'Lokhlass', rarity: 3, evolution: 3, sprite: 'lokhlass.png' },
            { name: 'Léviator', rarity: 3, evolution: 3, sprite: 'leviator.png' }
        ];
        
        // Inventaire de Pokéballs - commencer avec 0 de chaque
        this.pokeballs = {
            normal: 0,
            super: 0,
            hyper: 0
        };
        
        // Pokémon capturés
        this.capturedPokemons = [];
        
        // Pokémon sauvages sur la carte
        this.wildPokemons = [];
        
        // État de la rencontre courante
        this.currentEncounter = null;
        this.isEncountering = false;
        
        // Animation de capture - positions ajustées pour centrer
        this.captureAnimation = {
            active: false,
            type: 'normal',
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            progress: 0,
            shakeCount: 0,
            maxShakes: 3,
            currentShake: 0,
            result: null
        };
        
        // Dernière fois qu'un Pokémon a été généré
        this.lastPokemonGenTime = 0;
        
        // Pré-chargement des sprites de Pokéballs pour optimisation
        this.pokeballSprites = {};
        this.loadPokeballSprites();
        
        // Référence aux éléments DOM
        this.pokeballCountElement = document.getElementById('pokeball-count');
        this.superballCountElement = document.getElementById('superball-count');
        this.hyperballCountElement = document.getElementById('hyperball-count');
        this.notificationArea = document.getElementById('notification-area');
        
        // Créer la zone de texte de combat
        this.battleText = document.getElementById('battle-text');
        if (!this.battleText) {
            this.battleText = document.createElement('div');
            this.battleText.id = 'battle-text';
            
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(this.battleText);
            }
        }
        
        // Mettre à jour les compteurs
        this.updateCounters();
        
        // Initialiser les boutons cliquables
        this.initButtons();
        
        // Animation des Pokémon capturés
        this.animationTimer = 0;
        
        // Bouton Fuite pour quitter les combats
        this.escapeButton = document.createElement('div');
        this.escapeButton.className = 'escape-button';
        this.escapeButton.textContent = 'Fuite';
        this.escapeButton.addEventListener('click', () => {
            if (this.isEncountering) {
                this.escape();
            }
        });
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.escapeButton);
        }
        this.escapeButton.style.display = 'none';
        
        // Précharger tous les sprites de Pokémon de manière optimisée
        this.pokemonSprites = {};
        this.preloadPokemonSprites();
        
        // Créer une alternative aux sprites pour les Pokémon
        this.createFallbackPokemonSprites();
    }
    
    // Méthode optimisée pour charger les sprites de pokéballs - CHEMINS CORRIGÉS
    loadPokeballSprites() {
        const types = ['normal', 'super', 'hyper'];
        
        types.forEach(type => {
            // Correction du chemin pour le type 'normal' - CHEMIN CORRIGÉ
            const spritePath = type === 'normal' 
                ? 'Assets/sprites/pokeball.png'  // Chemin explicite pour normal
                : `Assets/sprites/${type}ball.png`;
                
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
    
    // Méthode optimisée pour précharger les sprites Pokémon - CHEMINS CORRIGÉS
    preloadPokemonSprites() {
        this.waterPokemons.forEach(pokemon => {
            const img = new Image();
            img.src = `Assets/sprites/pokemon/${pokemon.sprite}`;
            
            // Stocker la promesse de chargement pour optimisation
            const loadPromise = new Promise((resolve) => {
                img.onload = () => {
                    //console.log(`Sprite de ${pokemon.name} chargé avec succès`);
                    resolve(true);
                };
                img.onerror = () => {
                    console.error(`ERREUR: Impossible de charger le sprite de ${pokemon.name}`);
                    resolve(false);
                };
            });
            
            this.pokemonSprites[pokemon.name] = {
                image: img,
                loaded: false,
                loadPromise: loadPromise
            };
            
            // Mettre à jour l'état une fois chargé
            loadPromise.then(success => {
                this.pokemonSprites[pokemon.name].loaded = success;
            });
        });
    }
    
    // Méthode pour créer des sprites de secours pour les Pokémon
    createFallbackPokemonSprites() {
        // Palette de couleurs pour différencier les Pokémon
        const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#9932CC', '#FF8C00', '#20B2AA', '#FF69B4'];
        
        // Pour chaque Pokémon, créer un sprite de secours si le chargement échoue
        this.waterPokemons.forEach((pokemon, index) => {
            const spriteData = this.pokemonSprites[pokemon.name];
            if (!spriteData) return;
            
            const color = colors[index % colors.length]; // Couleur basée sur l'index
            
            spriteData.loadPromise.then(success => {
                if (!success) {
                    console.log(`Création d'un sprite de secours pour ${pokemon.name}`);
                    
                    // Créer un canvas comme sprite de secours
                    const canvas = document.createElement('canvas');
                    canvas.width = 56;
                    canvas.height = 56;
                    const ctx = canvas.getContext('2d');
                    
                    // Fond transparent
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Dessiner une forme simple qui varie selon la rareté
                    if (pokemon.rarity === 3) {
                        // Pokémon rare: forme plus complexe
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.moveTo(28, 5);
                        ctx.lineTo(50, 20);
                        ctx.lineTo(45, 45);
                        ctx.lineTo(15, 45);
                        ctx.lineTo(5, 20);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Détails
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(20, 20, 5, 0, Math.PI * 2);
                        ctx.arc(36, 20, 5, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(20, 20, 2, 0, Math.PI * 2);
                        ctx.arc(36, 20, 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Nom du Pokémon en bas
                        ctx.fillStyle = 'black';
                        ctx.font = '8px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(pokemon.name, 28, 53);
                        
                    } else if (pokemon.rarity === 2) {
                        // Pokémon commun mais pas trop: forme moyenne
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(28, 25, 20, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Nageoires pour Pokémon aquatique
                        ctx.beginPath();
                        ctx.moveTo(48, 25);
                        ctx.lineTo(56, 15);
                        ctx.lineTo(56, 35);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Yeux
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(22, 20, 4, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(22, 20, 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Nom du Pokémon en bas
                        ctx.fillStyle = 'black';
                        ctx.font = '8px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(pokemon.name, 28, 53);
                        
                    } else {
                        // Pokémon commun: forme simple
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(28, 28, 18, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Yeux
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(22, 23, 3, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(22, 23, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Bouche
                        ctx.strokeStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(28, 33, 5, 0.1 * Math.PI, 0.9 * Math.PI);
                        ctx.stroke();
                        
                        // Nom du Pokémon en bas
                        ctx.fillStyle = 'black';
                        ctx.font = '8px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(pokemon.name, 28, 53);
                    }
                    
                    // Utiliser ce canvas comme sprite
                    spriteData.image.src = canvas.toDataURL();
                    spriteData.loaded = true;
                }
            });
        });
    }
    
    updateCounters() {
        if (this.pokeballCountElement) {
            this.pokeballCountElement.textContent = this.pokeballs.normal;
        }
        if (this.superballCountElement) {
            this.superballCountElement.textContent = this.pokeballs.super;
        }
        if (this.hyperballCountElement) {
            this.hyperballCountElement.textContent = this.pokeballs.hyper;
        }
    }
    
    initButtons() {
        const pokeballBtn = document.getElementById('pokeball-btn');
        const superballBtn = document.getElementById('superball-btn');
        const hyperballBtn = document.getElementById('hyperball-btn');
        
        if (pokeballBtn) {
            pokeballBtn.addEventListener('click', () => {
                if (this.isEncountering && !this.captureAnimation.active) {
                    this.attemptCapture('normal');
                }
            });
        }
        
        if (superballBtn) {
            superballBtn.addEventListener('click', () => {
                if (this.isEncountering && !this.captureAnimation.active) {
                    this.attemptCapture('super');
                }
            });
        }
        
        if (hyperballBtn) {
            hyperballBtn.addEventListener('click', () => {
                if (this.isEncountering && !this.captureAnimation.active) {
                    this.attemptCapture('hyper');
                }
            });
        }
    }
    
    showNotification(message) {
        // Utiliser la zone de texte de combat
        if (this.battleText) {
            this.battleText.textContent = message;
            this.battleText.style.display = 'block';
            
            // Si ce n'est pas pendant une rencontre, masquer après un délai
            if (!this.isEncountering) {
                setTimeout(() => {
                    this.battleText.style.display = 'none';
                }, 3000);
            }
        }
    }
    
    addPokeballs(collectedBalls) {
        if (!collectedBalls || collectedBalls.length === 0) return;
        
        collectedBalls.forEach(({ type }) => {
            this.pokeballs[type]++;
            this.showNotification(`Vous avez trouvé une ${type === 'normal' ? 'Pokéball' : type === 'super' ? 'Superball' : 'Hyperball'}!`);
        });
        
        this.updateCounters();
    }
    
    showCaptureSuccessAnimation() {
        // Créer un élément pour l'animation de succès
        const successElement = document.createElement('div');
        successElement.className = 'capture-success';
        successElement.textContent = 'CAPTURE RÉUSSIE!';
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(successElement);
            
            // Supprimer l'élément après l'animation
            setTimeout(() => {
                if (gameContainer.contains(successElement)) {
                    successElement.remove();
                }
            }, 2000);
        }
    }
    
    // === MÉTHODES DE GAMEPLAY ===
    
    // Générer un Pokémon sauvage sur la carte
    spawnWildPokemon(gameMap) {
        // Limiter le nombre total de Pokémon sur la carte à 20 (augmenté de 5 à 20)
        if (this.wildPokemons.length >= 20) return;
        
        // Limiter la fréquence de génération (toutes les 0.75 secondes - divisé par 4)
        const now = Date.now();
        if (now - this.lastPokemonGenTime < 750) return;
        this.lastPokemonGenTime = now;
        
        // Sélectionner un Pokémon en fonction de sa rareté
        let selectedPokemon = null;
        
        // Tirer au sort avec pondération pour la rareté
        const rarityRoll = Math.random();
        
        if (rarityRoll < 0.7) { // 70% chance d'un Pokémon commun (rareté 1)
            const commonPokemon = this.waterPokemons.filter(p => p.rarity === 1);
            selectedPokemon = commonPokemon[Math.floor(Math.random() * commonPokemon.length)];
        } else if (rarityRoll < 0.95) { // 25% chance d'un Pokémon peu commun (rareté 2)
            const uncommonPokemon = this.waterPokemons.filter(p => p.rarity === 2);
            selectedPokemon = uncommonPokemon[Math.floor(Math.random() * uncommonPokemon.length)];
        } else { // 5% chance d'un Pokémon rare (rareté 3)
            const rarePokemon = this.waterPokemons.filter(p => p.rarity === 3);
            selectedPokemon = rarePokemon[Math.floor(Math.random() * rarePokemon.length)];
        }
        
        if (!selectedPokemon) return;
        
        // Position aléatoire pour le Pokémon
        const randX = Math.random() * gameMap.width;
        const randY = Math.random() * gameMap.height;
        
        // Créer un nouveau Pokémon sauvage
        const wildPokemon = {
            type: selectedPokemon,
            x: randX,
            y: randY,
            dirX: 0,
            dirY: 0,
            moveTimer: 0,
            despawnTime: Date.now() + 15000, // Disparaît après 15 secondes
            bounceOffset: 0,
            bounceDirection: 1,
            bounceSpeed: 0.05 + Math.random() * 0.05
        };
        
        this.wildPokemons.push(wildPokemon);
    }
    
    // Mettre à jour les Pokémon sauvages sur la carte
    updateWildPokemons(gameMap) {
        const now = Date.now();
        
        // Spawner de nouveaux Pokémon sauvages (8% de chance à chaque frame - x4 par rapport à l'original)
        if (Math.random() < 0.08) {
            this.spawnWildPokemon(gameMap);
        }
        
        // Mettre à jour chaque Pokémon sauvage
        for (let i = this.wildPokemons.length - 1; i >= 0; i--) {
            const pokemon = this.wildPokemons[i];
            
            // Vérifier si le Pokémon doit disparaître
            if (now > pokemon.despawnTime) {
                this.wildPokemons.splice(i, 1);
                continue;
            }
            
            // Animation de rebond
            pokemon.bounceOffset += pokemon.bounceDirection * pokemon.bounceSpeed;
            if (pokemon.bounceOffset > 5 || pokemon.bounceOffset < -5) {
                pokemon.bounceDirection *= -1;
            }
            
            // Mouvement aléatoire
            pokemon.moveTimer--;
            if (pokemon.moveTimer <= 0) {
                // Changer de direction toutes les 1-3 secondes (60 frames = 1 seconde approx.)
                pokemon.moveTimer = 60 + Math.floor(Math.random() * 120);
                
                // 20% de chance de s'arrêter
                if (Math.random() < 0.2) {
                    pokemon.dirX = 0;
                    pokemon.dirY = 0;
                } else {
                    // Nouvelle direction aléatoire
                    const directions = [
                        { x: 0, y: 1 },  // bas
                        { x: 0, y: -1 }, // haut
                        { x: 1, y: 0 },  // droite
                        { x: -1, y: 0 }  // gauche
                    ];
                    
                    const dir = directions[Math.floor(Math.random() * directions.length)];
                    pokemon.dirX = dir.x;
                    pokemon.dirY = dir.y;
                }
            }
            
            // Appliquer le mouvement
            const moveSpeed = 0.3;
            const newX = pokemon.x + pokemon.dirX * moveSpeed;
            const newY = pokemon.y + pokemon.dirY * moveSpeed;
            
            // Plus de vérification de zone sombre, déplacer toujours
            pokemon.x = newX;
            pokemon.y = newY;
            
            // Assurer que le Pokémon reste dans les limites de la carte
            if (pokemon.x < 0) pokemon.x = 0;
            if (pokemon.x > gameMap.width) pokemon.x = gameMap.width;
            if (pokemon.y < 0) pokemon.y = 0;
            if (pokemon.y > gameMap.height) pokemon.y = gameMap.height;
        }
    }
    
    // Vérifier les collisions avec les Pokémon sauvages
    checkWildPokemonCollisions(playerPosition, gameMap) {
        const encounterDistance = 40; // Distance pour rencontrer un Pokémon
        
        for (let i = 0; i < this.wildPokemons.length; i++) {
            const pokemon = this.wildPokemons[i];
            
            // Calculer la distance entre le joueur et le Pokémon
            // Tenir compte de la nature cyclique de la carte pour la dimension X
            const dx = (playerPosition.x - pokemon.x + gameMap.width/2) % gameMap.width - gameMap.width/2;
            const dy = playerPosition.y - pokemon.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < encounterDistance) {
                // Déclencher une rencontre
                this.currentEncounter = pokemon.type;
                this.isEncountering = true;
                
                // Afficher le bouton de fuite
                this.escapeButton.style.display = 'block';
                
                // Afficher le texte de combat
                this.battleText.textContent = `Un ${this.currentEncounter.name} sauvage apparaît!`;
                this.battleText.style.display = 'block';
                
                // Supprimer ce Pokémon de la carte
                this.wildPokemons.splice(i, 1);
                
                return true;
            }
        }
        
        return false;
    }
    
    escape() {
        this.showNotification(`Vous avez fui le combat!`);
        
        // Masquer le texte après un délai
        setTimeout(() => {
            this.battleText.style.display = 'none';
        }, 3000);
        
        this.isEncountering = false;
        this.currentEncounter = null;
        this.captureAnimation.active = false;
        this.escapeButton.style.display = 'none';
    }
    
    attemptCapture(ballType) {
        if (!this.isEncountering || !this.currentEncounter || this.captureAnimation.active) return false;
        
        // Vérifier si le joueur a des pokéballs
        if (this.pokeballs[ballType] <= 0) {
            this.battleText.textContent = `Vous n'avez plus de ${ballType}ball!`;
            return false;
        }
        
        // Utiliser une Pokéball
        this.pokeballs[ballType]--;
        this.updateCounters();
        
        // Calculer les chances de capture
        let captureRate = 0.5 * 3; // Taux de base * 3 (1.5 au lieu de 0.5)
        
        // Modifier selon la rareté du Pokémon
        if (this.currentEncounter.rarity === 2) captureRate /= 2;
        if (this.currentEncounter.rarity === 3) captureRate /= 3;
        
        // Modifier selon le type de pokéball
        if (ballType === 'super') captureRate *= 1.5;
        if (ballType === 'hyper') captureRate *= 2.5; // Augmenté pour les Hyperballs
        
        // Calculer le nombre de secousses (entre 0 et 3)
        // 3 secousses = capture réussie
        let shakeCount = 0;
        
        // Algorithme similaire à celui des jeux originaux
        for (let i = 0; i < 3; i++) {
            if (Math.random() < captureRate) {
                shakeCount++;
            } else {
                break;
            }
        }
        
        // Démarrer l'animation de capture (ajustée pour centrer)
        this.captureAnimation = {
            active: true,
            type: ballType,
            x: 150, // Position de départ de la Pokéball
            y: 400,
            targetX: 400, // Position du Pokémon
            targetY: 250, // Position ajustée vers le centre (avant: 200)
            progress: 0,
            shakeCount: shakeCount,
            maxShakes: 3,
            currentShake: 0,
            result: shakeCount === 3 // Capture réussie si 3 secousses
        };
        
        return true;
    }
    
    updateCaptureAnimation() {
        if (!this.captureAnimation.active) return;
        
        // Phase de lancer et d'attraction (0-0.25)
        if (this.captureAnimation.progress < 0.25) {
            this.captureAnimation.progress += 0.01;
            // Mise à jour du texte pendant cette phase
            this.battleText.textContent = `Lancer de ${this.captureAnimation.type}ball...`;
        } 
        // Phase de secousses (0.25-0.85)
        else if (this.captureAnimation.progress < 0.85) {
            if (this.captureAnimation.currentShake < this.captureAnimation.shakeCount) {
                // Calculer l'étape de la secousse actuelle
                const shakeProgress = (this.captureAnimation.progress - 0.25) / 0.6;
                const shakeStage = Math.floor(shakeProgress * this.captureAnimation.maxShakes);
                
                if (shakeStage > this.captureAnimation.currentShake) {
                    this.captureAnimation.currentShake = shakeStage;
                    // Mettre à jour le texte pour chaque secousse
                    this.battleText.textContent = `${this.captureAnimation.currentShake + 1}...`;
                }
            }
            this.captureAnimation.progress += 0.005;
        } 
        // Phase finale (0.85-1.0)
        else if (this.captureAnimation.progress < 1.0) {
            this.captureAnimation.progress += 0.01;
        }
        
        // Si l'animation est terminée
        if (this.captureAnimation.progress >= 1) {
            // Finaliser la capture
            if (this.captureAnimation.result) {
                // Précharger l'image du Pokémon pour éviter les problèmes d'affichage
                const capturedPokemon = {...this.currentEncounter};
                
                // Vérifier si ce Pokémon n'est pas déjà dans la collection
                const alreadyCaptured = this.capturedPokemons.some(p => p.name === capturedPokemon.name);
                
                if (!alreadyCaptured) {
                    // Ajouter le Pokémon à la collection uniquement s'il n'y est pas déjà
                    this.capturedPokemons.push(capturedPokemon);
                    
                    // Animation de succès spéciale
                    this.showCaptureSuccessAnimation();
                }
                
                this.battleText.textContent = `Vous avez capturé ${this.currentEncounter.name}!`;
                
                // Masquer le texte après un délai
                setTimeout(() => {
                    this.battleText.style.display = 'none';
                }, 3000);
                
                this.isEncountering = false;
                this.currentEncounter = null;
                
                // Cacher le bouton de fuite
                this.escapeButton.style.display = 'none';
            } else {
                this.battleText.textContent = `${this.currentEncounter.name} s'est échappé!`;
            }
            
            // Réinitialiser l'animation
            this.captureAnimation.active = false;
        }
    }
    
    // Mettre à jour l'ensemble du système Pokémon
    update(gameMap) {
        // Mettre à jour les Pokémon sauvages
        this.updateWildPokemons(gameMap);
        
        // Vérifier les collisions avec les Pokémon sauvages si pas déjà en rencontre
        if (!this.isEncountering) {
    // Mettre à jour l'ensemble du système Pokémon
    update(gameMap) {
        // Mettre à jour les Pokémon sauvages
        this.updateWildPokemons(gameMap);
        
        // Vérifier les collisions avec les Pokémon sauvages si pas déjà en rencontre
        if (!this.isEncountering) {
            const playerPosition = {
                x: gameMap.positionX,
                y: gameMap.positionY
            };
            
            this.checkWildPokemonCollisions(playerPosition, gameMap);
        }
    }
    
    // Dessiner les Pokémon sauvages sur la carte
    drawWildPokemons(ctx, gameMap) {
        // Obtenir les dimensions actuelles du canvas
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        
        // Calculer le facteur d'échelle
        const baseScale = canvasHeight / gameMap.height;
        const scale = baseScale * 3; // Zoom x3
        
        // Calculer les dimensions visibles pour optimisation
        const visibleWidth = canvasWidth / scale;
        const visibleHeight = canvasHeight / scale;
        
        // Dessiner chaque Pokémon sauvage de manière optimisée
        this.wildPokemons.forEach(pokemon => {
            const spriteData = this.pokemonSprites[pokemon.type.name];
            if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
            
            const sprite = spriteData.image;
            
            // Calculer la distance par rapport au joueur
            const dx = (pokemon.x - gameMap.positionX + gameMap.width/2) % gameMap.width - gameMap.width/2;
            const dy = pokemon.y - gameMap.positionY;
            
            // Ne dessiner que si proche du joueur (pour éviter des calculs inutiles)
            if (Math.abs(dx) < visibleWidth/2 + 50 && Math.abs(dy) < visibleHeight/2 + 50) {
                // Calculer la position à l'écran
                const screenX = dx * scale + canvasWidth/2;
                const screenY = dy * scale + canvasHeight/2 + pokemon.bounceOffset;
                
                // Dessiner le Pokémon seulement si visible
                if (screenX > -56 && screenX < canvasWidth + 56 &&
                    screenY > -56 && screenY < canvasHeight + 56) {
                    ctx.drawImage(
                        sprite,
                        0, 0,
                        sprite.width, sprite.height,
                        screenX - 28, screenY - 28,
                        56, 56 // Taille 56x56
                    );
                }
            }
        });
    }
    
    drawEncounterScreen(ctx) {
        if (!this.isEncountering) return;
        
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Animation du Pokémon - position ajustée vers le centre
        try {
            // Utiliser les sprites préchargés
            const spriteData = this.pokemonSprites[this.currentEncounter.name];
            if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
            
            const pokemonSprite = spriteData.image;
            
            // Taille 3 fois plus grande (168x168 au lieu de 56x56)
            const pokemonSize = 56 * 3;
            
            // Position ajustée au centre (avant: -200, maintenant: -100)
            const pokemonY = ctx.canvas.height/2 - 100;
            
            // Animation simple: légère oscillation verticale basée sur le temps
            const bounceHeight = 5; // Hauteur de l'oscillation en pixels
            const bounceSpeed = 0.003; // Vitesse de l'oscillation
            const verticalOffset = Math.sin(Date.now() * bounceSpeed) * bounceHeight;
            
            // Animation de capture
            if (this.captureAnimation.active && this.captureAnimation.progress > 0.25) {
                // La Pokéball a atteint le Pokémon, ne plus afficher le Pokémon
                if (this.captureAnimation.progress < 0.85 && Math.floor(Date.now() / 150) % 2 === 0) {
                    // Faire clignoter le Pokémon pendant la phase d'attraction
                    ctx.drawImage(
                        pokemonSprite, 
                        ctx.canvas.width/2 - pokemonSize/2, 
                        pokemonY + verticalOffset, 
                        pokemonSize, 
                        pokemonSize
                    );
                }
            } else if (!this.captureAnimation.active || this.captureAnimation.progress < 0.25) {
                // Afficher normalement
                ctx.drawImage(
                    pokemonSprite, 
                    ctx.canvas.width/2 - pokemonSize/2, 
                    pokemonY + verticalOffset, 
                    pokemonSize, 
                    pokemonSize
                );
            }
            
            // Dessiner l'animation de lancer de Pokéball - positions ajustées
            if (this.captureAnimation.active) {
                const spriteData = this.pokeballSprites[this.captureAnimation.type];
                if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
                
                const ballSprite = spriteData.image;
                
                if (this.captureAnimation.progress < 0.25) {
                    // Phase de lancer
                    const progress = this.captureAnimation.progress * 4; // 0-1 pour cette phase
                    
                    // Trajectoire en arc ajustée
                    const startX = ctx.canvas.width/2 - 150;
                    const startY = ctx.canvas.height - 150; // Position plus haute
                    const targetX = ctx.canvas.width/2;
                    const targetY = pokemonY + pokemonSize/2; // Cibler le centre du Pokémon
                    
                    const currentX = startX + (targetX - startX) * progress;
                    // Trajectoire parabolique: y = ax² + bx + c
                    const currentY = startY - 250 * Math.sin(progress * Math.PI) + (targetY - startY) * progress;
                    
                    // Calculer la rotation (la Pokéball tourne en vol)
                    const rotation = progress * Math.PI * 4; // 2 tours complets
                    
                    // Sauvegarder le contexte pour la rotation
                    ctx.save();
                    
                    // Déplacer l'origine au centre de la Pokéball
                    ctx.translate(currentX, currentY);
                    
                    // Appliquer la rotation
                    ctx.rotate(rotation);
                    
                    // Dessiner la Pokéball
                    ctx.drawImage(
                        ballSprite,
                        -16, -16,
                        32, 32
                    );
                    
                    // Restaurer le contexte
                    ctx.restore();
                } else {
                    // Phase de secousses et de capture sur le Pokémon centré
                    const targetX = ctx.canvas.width/2;
                    const targetY = pokemonY + pokemonSize/2; // Position centrée
                    
                    // Calculer le mouvement de secousse
                    let shakeOffset = 0;
                    if (this.captureAnimation.progress < 0.85) {
                        const shakeProgress = (this.captureAnimation.progress - 0.25) / 0.6;
                        const shakePhase = (shakeProgress * 10) % 1; // 0-1 pour chaque secousse
                        
                        // Oscillation sinusoïdale pour les secousses
                        shakeOffset = Math.sin(shakePhase * Math.PI * 2) * 10 * 
                            Math.max(0, 1 - (this.captureAnimation.currentShake / 3));
                    }
                    
                    // Dessiner la Pokéball
                    ctx.drawImage(
                        ballSprite,
                        targetX - 16 + shakeOffset, 
                        targetY - 16 + Math.sin(Date.now() * 0.01) * 2,
                        32, 32
                    );
                    
                    // Si la capture est terminée et réussie
                    if (this.captureAnimation.progress >= 0.85 && this.captureAnimation.result) {
                        // Animation de succès: petites étoiles ou particules autour de la ball
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.003;
                            const distance = 20 + Math.sin(Date.now() * 0.01 + i) * 5;
                            const x = targetX + Math.cos(angle) * distance;
                            const y = targetY + Math.sin(angle) * distance;
                            
                            ctx.fillStyle = 'yellow';
                            ctx.beginPath();
                            ctx.arc(x, y, 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Impossible de charger le sprite du Pokémon", e);
        }
    }
    
    drawCapturedPokemon(ctx) {
        // Si aucun Pokémon capturé, ne rien afficher
        if (this.capturedPokemons.length === 0) return;
        
        // Taille des sprites dans la collection (2 fois plus grands que précédemment)
        const spriteSize = 80; // (au lieu de 40)
        const padding = 10;
        
        // Position de départ (côté droit, légèrement plus à gauche)
        const startX = ctx.canvas.width - spriteSize - padding - 20; // 20px plus à gauche
        const startY = 100; // Commencer en haut avec un peu d'espace
        
        // Afficher le compteur de Pokémon capturés
        ctx.fillStyle = 'white';
        ctx.font = '18px monospace';
        ctx.fillText(
            `${this.capturedPokemons.length} / ${this.waterPokemons.length}`,
            startX - 10, 
            startY + this.capturedPokemons.length * (spriteSize + padding / 2) + padding
        );
        
        // Mettre à jour l'animation - 3 fois plus rapide
        this.animationTimer += 0.03;
        
        // Afficher chaque Pokémon capturé de manière optimisée
        this.capturedPokemons.forEach((pokemon, index) => {
            try {
                // Utiliser les sprites préchargés
                const spriteData = this.pokemonSprites[pokemon.name];
                if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
                
                const pokemonSprite = spriteData.image;
                
                // Position de ce Pokémon
                const y = startY + index * (spriteSize + padding / 2);
                
                // Animation: légère oscillation verticale unique à chaque Pokémon - 3 fois plus rapide
                const bounceOffset = Math.sin(this.animationTimer + index * 0.5) * 5;
                
                // Dessiner uniquement le sprite sans fond ni cadre
                ctx.drawImage(pokemonSprite, startX, y + bounceOffset, spriteSize, spriteSize);
            } catch (e) {
                console.log(`Impossible de charger le sprite du Pokémon ${pokemon.name}`, e);
            }
        });
    }
}