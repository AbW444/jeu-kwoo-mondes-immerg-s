// scripts/pokemon_core.js
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
    
    // Méthode optimisée pour charger les sprites de pokéballs
    loadPokeballSprites() {
        const types = ['normal', 'super', 'hyper'];
        
        types.forEach(type => {
            // Correction du chemin pour le type 'normal'
            const spritePath = type === 'normal' 
                ? 'assets/sprites/pokeball.png'  // Chemin explicite pour normal
                : `assets/sprites/${type}ball.png`;
                
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
    
    // Méthode optimisée pour précharger les sprites Pokémon
    preloadPokemonSprites() {
        this.waterPokemons.forEach(pokemon => {
            const img = new Image();
            img.src = `assets/sprites/pokemon/${pokemon.sprite}`;
            
            // Stocker la promesse de chargement pour optimisation
            const loadPromise = new Promise((resolve) => {
                img.onload = () => {
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
                    }
                    
                    // Nom du Pokémon en bas
                    ctx.fillStyle = 'black';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(pokemon.name, 28, 53);
                    
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
}