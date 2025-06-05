class Player {
  constructor() {
    this.width = 32;
    this.height = 32;
    this.frameX = 0;
    this.frameY = 0;
    
    this.sprite = new Image();
    this.sprite.src = 'Assets/sprites/player_01.png';
    
    this.darkSprite = new Image();
    this.darkSprite.src = 'Assets/sprites/player_02.png';
    
    this.isOnDarkZone = false;
    
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.spriteLoaded = false;
    this.darkSpriteLoaded = false;
    
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
  
  createFallbackSprite(targetSprite, isDark) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    const baseColor = isDark ? 'purple' : 'blue';
    
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 2; x++) {
        const baseX = x * 32;
        const baseY = y * 32;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(baseX + 8, baseY + 8, 16, 16);
        
        ctx.fillStyle = isDark ? 'magenta' : 'pink';
        ctx.fillRect(baseX + 12, baseY + 4, 8, 8);
        
        ctx.fillStyle = 'black';
        if (x === 0) {
          ctx.fillRect(baseX + 8, baseY + 24, 6, 4);
          ctx.fillRect(baseX + 18, baseY + 24, 6, 4);
        } else {
          ctx.fillRect(baseX + 13, baseY + 24, 6, 4);
        }
      }
    }
    
    targetSprite.src = canvas.toDataURL();
    
    if (isDark) {
      this.darkSpriteLoaded = true;
    } else {
      this.spriteLoaded = true;
    }
  }
  
  updateZoneStatus(isOnDark) {
    this.isOnDarkZone = false;
  }
  
  animate() {
    this.animationTimer++;
    if (this.animationTimer > 15) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % 2;
      this.frameX = this.animationFrame;
    }
  }
  
  draw(ctx) {
    const centerX = ctx.canvas.width / 2 - this.width * 1.1;
    const centerY = ctx.canvas.height / 2 - this.height * 1.1;
    
    const currentSprite = this.sprite;
    
    if (!this.spriteLoaded && !this.darkSpriteLoaded) {
      ctx.fillStyle = 'red';
      ctx.fillRect(centerX, centerY, 32, 32);
      return;
    }
    
    try {
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
