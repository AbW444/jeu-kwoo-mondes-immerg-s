// scripts/player.js
class Player {
    constructor() {
        // Dimensions des frames du sprite - corrigées selon l'image
        this.width = 32; // Largeur d'une frame
        this.height = 32; // Hauteur d'une frame (corrigé de 28 à 32)
        this.frameX = 0;
        this.frameY = 0; // Direction (0:bas, 1:gauche, 2:droite, 3:haut)
        
        // Charger le sprite du joueur normal - CHEMIN CORRIGÉ
        this.sprite = new Image();
        this.sprite.src = 'Assets/sprites/player_01.png';
        
        // Charger le sprite du joueur pour les zones sombres - CHEMIN CORRIGÉ
        this.darkSprite = new Image();
        this.darkSprite.src = 'Assets/sprites/player_02.png';
        
        // Indicateur pour savoir quel sprite utiliser
        this.isOnDarkZone = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.spriteLoaded = false;
        this.darkSpriteLoaded = false;
        
        // Ajouter des gestionnaires d'événement pour vérifier le chargement
        this.sprite.onload = () => {
            console.log("Sprite normal du joueur chargé avec succès:", this.sprite.width, "x", this.sprite.height);
            this.spriteLoaded = true;
        };
        
        this.darkSprite.onload = () => {
            console.log("Sprite sombre du joueur chargé avec succès:", this.darkSprite.width, "x", this.darkSprite.height);
            this.darkSpriteLoaded = true;
        };
        
        this.sprite.onerror = () => {
            console.error("ERREUR: Impossible de charger le sprite normal du joueur");
            this.createFallbackSprite(this.sprite, false);
        };
        
        this.darkSprite.onerror = () => {
            console.error("ERREUR: Impossible de charger le sprite sombre du joueur");
            this.createFallbackSprite(this.darkSprite, true);
        };
    }
    
    // Méthode pour créer un sprite de remplacement
    createFallbackSprite(targetSprite, isDark) {
        // Créer un canvas comme fallback
        const canvas = document.createElement('canvas');
        canvas.width = 64; // 2 frames horizontales
        canvas.height = 128; // 4 directions verticales x 32 pixels (corrigé)
        const ctx = canvas.getContext('2d');
        
        // Couleur de base en fonction du type de sprite
        const baseColor = isDark ? 'purple' : 'blue';
        
        // Dessiner un personnage simple
        for (let y = 0; y < 4; y++) { // 4 directions
            for (let x = 0; x < 2; x++) { // 2 frames d'animation
                // Position de base pour cette frame
                const baseX = x * 32;
                const baseY = y * 32; // Corrigé à 32
                
                // Corps (carré coloré)
                ctx.fillStyle = baseColor;
                ctx.fillRect(baseX + 8, baseY + 8, 16, 16);
                
                // Tête
                ctx.fillStyle = isDark ? 'magenta' : 'pink';
                ctx.fillRect(baseX + 12, baseY + 4, 8, 8);
                
                // Pieds (positionnés différemment selon la frame)
                ctx.fillStyle = 'black';
                if (x === 0) {
                    ctx.fillRect(baseX + 8, baseY + 24, 6, 4); // Pied gauche
                    ctx.fillRect(baseX + 18, baseY + 24, 6, 4); // Pied droit
                } else {
                    ctx.fillRect(baseX + 13, baseY + 24, 6, 4); // Pied au centre
                }
            }
        }
        
        // Utiliser ce canvas comme sprite
        targetSprite.src = canvas.toDataURL();
        
        // Marquer comme chargé
        if (isDark) {
            this.darkSpriteLoaded = true;
        } else {
            this.spriteLoaded = true;
        }
    }
    
    // Mettre à jour l'état de la zone (toujours normale)
    updateZoneStatus(isOnDark) {
        // Toujours en zone normale
        this.isOnDarkZone = false;
    }
    
    animate() {
        // Mettre à jour l'animation du joueur (pour faire marcher le personnage)
        this.animationTimer++;
        if (this.animationTimer > 15) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % 2;
            this.frameX = this.animationFrame;
        }
    }
    
    draw(ctx) {
        // Centre de l'écran
        const centerX = ctx.canvas.width / 2 - this.width * 1.1; // Ajustement du centrage
        const centerY = ctx.canvas.height / 2 - this.height * 1.1; // Ajustement du centrage
        
        // Toujours utiliser le sprite normal
        const currentSprite = this.sprite;
        
        if (!this.spriteLoaded && !this.darkSpriteLoaded) {
            // Si aucun sprite n'est chargé, dessiner un carré rouge à la place
            ctx.fillStyle = 'red';
            ctx.fillRect(centerX, centerY, 32, 32);
            return;
        }
        
        try {
            // Réduire légèrement la taille - facteur de 2.2 au lieu de 3*1.5=4.5 (environ 50% de la taille originale)
            const size = this.width * 2.2;
            
            ctx.drawImage(
                currentSprite,
                this.frameX * this.width, 
                this.frameY * this.height,
                this.width, 
                this.height,
                centerX,
                centerY,
                size,
                size
            );
        } catch (e) {
            console.error("Erreur lors du dessin du joueur:", e);
            ctx.fillStyle = 'purple';
            ctx.fillRect(centerX, centerY, this.width * 2.2, this.height * 2.2);
        }
    }
}
