class GameMap {
  constructor() {
    this.image = new Image();
    this.image.src = 'Assets/maps/world_map.png';
    
    this.width = 8192;
    this.height = 4096;
    
    this.positionX = 0;
    this.positionY = 0;
    this.baseSpeed = 6;
    this.currentSpeed = this.baseSpeed;
    this.movingX = false;
    this.movingY = false;
    this.directionX = 0;
    this.directionY = 0;
    
    this.pokeballs = [];
    this.pokeballsVisible = [];
    this.lastViewportInfo = null;
    this.mapLoaded = false;
    
    this.errorCount = 0;
    this.lastErrorTime = Date.now();
    
    this.image.onload = () => {
      console.log("Image de la carte chargée avec succès:", this.image.width, "x", this.image.height);
      if (this.image.width !== this.width || this.image.height !== this.height) {
        console.warn("La taille de l'image ne correspond pas aux dimensions attendues!");
        this.width = this.image.width;
        this.height = this.image.height;
      }
      
      this.mapLoaded = true;
      this.findSafeStartPosition();
      this.generateInitialPokeballs(150);
    };
    
    this.image.onerror = () => {
      console.error("ERREUR: Impossible de charger l'image de la carte");
      this.createFallbackMap();
    };
    
    this.pokeballSprites = {};
    this.loadPokeballSprites();
  }
  
  loadPokeballSprites() {
    const types = ['normal', 'super', 'hyper'];
    
    types.forEach(type => {
      const spritePath = type === 'normal' 
        ? 'Assets/sprites/pokeball.png'
        : `Assets/sprites/${type}ball.png`;
        
      const img = new Image();
      img.src = spritePath;
      
      console.log(`Chargement du sprite ${type}ball depuis ${spritePath}`);
      
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
      
      loadPromise.then(success => {
        this.pokeballSprites[type].loaded = success;
      });
    });
  }
  
  findSafeStartPosition() {
    this.positionX = Math.random() * this.width;
    this.positionY = Math.random() * this.height;
    console.log("Position initiale définie:", this.positionX, this.positionY);
  }
  
  createFallbackMap() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'tan';
    ctx.fillRect(this.width * 0.1, this.height * 0.1, this.width * 0.3, this.height * 0.2);
    ctx.fillRect(this.width * 0.5, this.height * 0.3, this.width * 0.4, this.height * 0.3);
    
    this.image.src = canvas.toDataURL();
    this.mapLoaded = true;
    
    this.findSafeStartPosition();
    this.generateInitialPokeballs(150);
  }
  
  getTerrainType(x, y) {
    return "land";
  }
  
  generateInitialPokeballs(count) {
    for (let i = 0; i < count; i++) {
      this.tryGeneratePokeball();
    }
  }
  
  tryGeneratePokeball() {
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
    const weights = [0.7, 0.25, 0.05];
    
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
    const playerPosition = {
      x: this.positionX,
      y: this.positionY
    };
    
    player.updateZoneStatus(false);
    
    this.currentSpeed = this.baseSpeed;
    
    if (this.movingX && !this.movingY) {
      const newPositionX = this.positionX + this.currentSpeed * this.directionX;
      this.positionX = newPositionX;
      
      if (this.positionX < 0) {
        this.positionX += this.width;
      } else if (this.positionX >= this.width) {
        this.positionX -= this.width;
      }
    }
    
    if (this.movingY && !this.movingX) {
      const newPositionY = this.positionY + this.currentSpeed * this.directionY;
      this.positionY = newPositionY;
      
      if (this.positionY < -this.height) {
        this.positionY += this.height * 2;
      } else if (this.positionY > this.height) {
        this.positionY -= this.height * 2;
      }
    }
    
    if (Math.random() < 0.15 && this.pokeballs.length < 300) {
      for (let i = 0; i < 3 && this.pokeballs.length < 300; i++) {
        this.tryGeneratePokeball();
      }
    }
    
    const scale = 3 * (ctx.canvas.height / this.height);
    const viewportWidth = ctx.canvas.width / scale;
    const viewportHeight = ctx.canvas.height / scale;
    
    const viewMinX = this.positionX - viewportWidth/2 - 100;
    const viewMaxX = this.positionX + viewportWidth/2 + 100;
    const viewMinY = this.positionY - viewportHeight/2 - 100;
    const viewMaxY = this.positionY + viewportHeight/2 + 100;
    
    for (let i = 0; i < this.pokeballs.length; i++) {
      const ball = this.pokeballs[i];
      
      const dx = (ball.x - this.positionX + this.width/2) % this.width - this.width/2;
      const dy = ball.y - this.positionY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (Math.abs(dx) < viewportWidth/2 + 50 && Math.abs(dy) < viewportHeight/2 + 50) {
        ball.bounceOffset += ball.bounceDirection * ball.bounceSpeed;
        if (ball.bounceOffset > 3 || ball.bounceOffset < -3) {
          ball.bounceDirection *= -1;
        }
      }
    }
    
    return this.checkPokeballCollisions(playerPosition, ctx);
  }
  
  checkPokeballCollisions(playerPosition, ctx) {
    const collectDistance = 60;
    const collectedBalls = [];
    
    const scale = 3 * (ctx.canvas.height / this.height);
    
    for (let i = 0; i < this.pokeballs.length; i++) {
      const ball = this.pokeballs[i];
      
      const dx = (playerPosition.x - ball.x + this.width/2) % this.width - this.width/2;
      const dy = playerPosition.y - ball.y;
      const distanceSquared = dx*dx + dy*dy;
      
      if (distanceSquared < collectDistance*collectDistance) {
        collectedBalls.push({ type: ball.type, index: i });
      }
    }
    
    if (collectedBalls.length > 0) {
      const collectIndexes = collectedBalls.map(ball => ball.index).sort((a, b) => b - a);
      
      for (const index of collectIndexes) {
        this.pokeballs.splice(index, 1);
      }
      
      this.pokeballsVisible = null;
    }
    
    return collectedBalls;
  }
  
  getVisiblePokeballs(ctx) {
    if (this.pokeballsVisible && this.lastViewportInfo) {
      const currentViewport = {
        x: this.positionX,
        y: this.positionY,
        width: ctx.canvas.width,
        height: ctx.canvas.height
      };
      
      const dx = Math.abs(currentViewport.x - this.lastViewportInfo.x);
      const dy = Math.abs(currentViewport.y - this.lastViewportInfo.y);
      const sizeChanged = currentViewport.width !== this.lastViewportInfo.width || 
                          currentViewport.height !== this.lastViewportInfo.height;
      
      if (!sizeChanged && dx < 20 && dy < 20) {
        return this.pokeballsVisible;
      }
    }
    
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const baseScale = canvasHeight / this.height;
    const scale = baseScale * 3;
    
    const visibleWidth = canvasWidth / scale;
    const visibleHeight = canvasHeight / scale;
    
    const viewMinX = this.positionX - visibleWidth/2 - 50;
    const viewMaxX = this.positionX + visibleWidth/2 + 50;
    const viewMinY = this.positionY - visibleHeight/2 - 50;
    const viewMaxY = this.positionY + visibleHeight/2 + 50;
    
    this.pokeballsVisible = this.pokeballs.filter(ball => {
      const dx = (ball.x - this.positionX + this.width/2) % this.width - this.width/2;
      const dy = ball.y - this.positionY;
      
      return Math.abs(dx) < visibleWidth/2 + 50 && Math.abs(dy) < visibleHeight/2 + 50;
    });
    
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
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }
    
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const baseScale = canvasHeight / this.height;
    const scale = baseScale * 3;
    
    const visibleWidth = canvasWidth / scale;
    const visibleHeight = canvasHeight / scale;
    
    try {
      const centerX = canvasWidth/2;
      const centerY = canvasHeight/2;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-this.positionX, -this.positionY);
      
      const tileSize = 1024;
      
      const startTileX = Math.floor((this.positionX - visibleWidth/2) / tileSize);
      const startTileY = Math.floor((this.positionY - visibleHeight/2) / tileSize);
      const endTileX = Math.ceil((this.positionX + visibleWidth/2) / tileSize);
      const endTileY = Math.ceil((this.positionY + visibleHeight/2) / tileSize);
      
      for (let tileY = startTileY; tileY <= endTileY; tileY++) {
        for (let tileX = startTileX; tileX <= endTileX; tileX++) {
          const sourceX = ((tileX * tileSize) % this.width + this.width) % this.width;
          const sourceY = ((tileY * tileSize) % this.height + this.height) % this.height;
          
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
      
      ctx.restore();
      
      const visiblePokeballs = this.getVisiblePokeballs(ctx);
      
      visiblePokeballs.forEach(ball => {
        const spriteData = this.pokeballSprites[ball.type];
        if (!spriteData || !spriteData.loaded || !spriteData.image.complete) return;
        
        const sprite = spriteData.image;
        
        const ballX = ((ball.x - this.positionX) % this.width + this.width) % this.width;
        const ballY = ((ball.y - this.positionY) % this.height + this.height) % this.height;
        
        const screenX = ballX * scale + canvasWidth/2;
        const screenY = ballY * scale + canvasHeight/2 + ball.bounceOffset;
        
        if (screenX > -32 && screenX < canvasWidth + 32 &&
            screenY > -32 && screenY < canvasHeight + 32) {
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
  
  isOnDarkZone(x, y) {
    return false;
  }
}
