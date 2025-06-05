class PokemonSystem {
  constructor() {
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
    
    this.pokeballs = { normal: 0, super: 0, hyper: 0 };
    this.capturedPokemons = [];
    this.wildPokemons = [];
    this.currentEncounter = null;
    this.isEncountering = false;
    
    this.captureAnimation = {
      active: false, type: 'normal', x: 0, y: 0, targetX: 0, targetY: 0,
      progress: 0, shakeCount: 0, maxShakes: 3, currentShake: 0, result: null
    };
    
    this.lastPokemonGenTime = 0;
    this.pokeballSprites = {};
    this.loadPokeballSprites();
    
    this.pokeballCountElement = document.getElementById('pokeball-count');
    this.superballCountElement = document.getElementById('superball-count');
    this.hyperballCountElement = document.getElementById('hyperball-count');
    this.notificationArea = document.getElementById('notification-area');
    
    this.battleText = document.getElementById('battle-text');
    if (!this.battleText) {
      this.battleText = document.createElement('div');
      this.battleText.id = 'battle-text';
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) gameContainer.appendChild(this.battleText);
    }
    
    this.updateCounters();
    this.initButtons();
    this.animationTimer = 0;
    
    this.escapeButton = document.createElement('div');
    this.escapeButton.className = 'escape-button';
    this.escapeButton.textContent = 'Fuite';
    this.escapeButton.addEventListener('click', () => {
      if (this.isEncountering) this.escape();
    });
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.appendChild(this.escapeButton);
    this.escapeButton.style.display = 'none';
    
    this.pokemonSprites = {};
    this.preloadPokemonSprites();
    this.createFallbackPokemonSprites();
  }
  
  loadPokeballSprites() {
    ['normal', 'super', 'hyper'].forEach(type => {
      const spritePath = type === 'normal' ? 'Assets/sprites/pokeball.png' : `Assets/sprites/${type}ball.png`;
      const img = new Image();
      img.src = spritePath;
      
      const loadPromise = new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => {
          console.error(`ERREUR: Impossible de charger le sprite de ${type}ball depuis ${spritePath}`);
          resolve(false);
        };
      });
      
      this.pokeballSprites[type] = { image: img, loaded: false, loadPromise };
      loadPromise.then(success => this.pokeballSprites[type].loaded = success);
    });
  }
  
  preloadPokemonSprites() {
    this.waterPokemons.forEach(pokemon => {
      const img = new Image();
      img.src = `Assets/sprites/pokemon/${pokemon.sprite}`;
      
      const loadPromise = new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => {
          console.error(`ERREUR: Impossible de charger le sprite de ${pokemon.name}`);
          resolve(false);
        };
      });
      
      this.pokemonSprites[pokemon.name] = { image: img, loaded: false, loadPromise };
      loadPromise.then(success => this.pokemonSprites[pokemon.name].loaded = success);
    });
  }
  
  createFallbackPokemonSprites() {
    const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#9932CC', '#FF8C00', '#20B2AA', '#FF69B4'];
    
    this.waterPokemons.forEach((pokemon, index) => {
      const spriteData = this.pokemonSprites[pokemon.name];
      if (!spriteData) return;
      
      const color = colors[index % colors.length];
      
      spriteData.loadPromise.then(success => {
        if (success) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 56;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 56, 56);
        
        if (pokemon.rarity === 3) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(28, 5);
          ctx.lineTo(50, 20);
          ctx.lineTo(45, 45);
          ctx.lineTo(15, 45);
          ctx.lineTo(5, 20);
          ctx.closePath();
          ctx.fill();
          
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
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(28, 25, 20, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(48, 25);
          ctx.lineTo(56, 15);
          ctx.lineTo(56, 35);
          ctx.closePath();
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(22, 20, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(22, 20, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(28, 28, 18, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(22, 23, 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(22, 23, 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.arc(28, 33, 5, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
        }
        
        ctx.fillStyle = 'black';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(pokemon.name, 28, 53);
        
        spriteData.image.src = canvas.toDataURL();
        spriteData.loaded = true;
      });
    });
  }
  
  updateCounters() {
    if (this.pokeballCountElement) this.pokeballCountElement.textContent = this.pokeballs.normal;
    if (this.superballCountElement) this.superballCountElement.textContent = this.pokeballs.super;
    if (this.hyperballCountElement) this.hyperballCountElement.textContent = this.pokeballs.hyper;
  }
  
  initButtons() {
    const buttons = [
      { id: 'pokeball-btn', type: 'normal' },
      { id: 'superball-btn', type: 'super' },
      { id: 'hyperball-btn', type: 'hyper' }
    ];
    
    buttons.forEach(({ id, type }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.isEncountering && !this.captureAnimation.active) {
            this.attemptCapture(type);
          }
        });
      }
    });
  }
  
  showNotification(message) {
    if (!this.battleText) return;
    
    this.battleText.textContent = message;
    this.battleText.style.display = 'block';
    
    if (!this.isEncountering) {
      setTimeout(() => this.battleText.style.display = 'none', 3000);
    }
  }
  
  addPokeballs(collectedBalls) {
    if (!collectedBalls?.length) return;
    
    collectedBalls.forEach(({ type }) => {
      this.pokeballs[type]++;
      const ballName = type === 'normal' ? 'Pokéball' : type === 'super' ? 'Superball' : 'Hyperball';
      this.showNotification(`Vous avez trouvé une ${ballName}!`);
    });
    
    this.updateCounters();
  }
  
  showCaptureSuccessAnimation() {
    const successElement = document.createElement('div');
    successElement.className = 'capture-success';
    successElement.textContent = 'CAPTURE RÉUSSIE!';
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.appendChild(successElement);
      setTimeout(() => {
        if (gameContainer.contains(successElement)) successElement.remove();
      }, 2000);
    }
  }
  
  spawnWildPokemon(gameMap) {
    if (this.wildPokemons.length >= 20) return;
    
    const now = Date.now();
    if (now - this.lastPokemonGenTime < 750) return;
    this.lastPokemonGenTime = now;
    
    const rarityRoll = Math.random();
    let selectedPokemon;
    
    if (rarityRoll < 0.7) {
      const common = this.waterPokemons.filter(p => p.rarity === 1);
      selectedPokemon = common[Math.floor(Math.random() * common.length)];
    } else if (rarityRoll < 0.95) {
      const uncommon = this.waterPokemons.filter(p => p.rarity === 2);
      selectedPokemon = uncommon[Math.floor(Math.random() * uncommon.length)];
    } else {
      const rare = this.waterPokemons.filter(p => p.rarity === 3);
      selectedPokemon = rare[Math.floor(Math.random() * rare.length)];
    }
    
    if (!selectedPokemon) return;
    
    this.wildPokemons.push({
      type: selectedPokemon,
      x: Math.random() * gameMap.width,
      y: Math.random() * gameMap.height,
      dirX: 0, dirY: 0, moveTimer: 0,
      despawnTime: now + 15000,
      bounceOffset: 0, bounceDirection: 1,
      bounceSpeed: 0.05 + Math.random() * 0.05
    });
  }
  
  updateWildPokemons(gameMap) {
    const now = Date.now();
    
    if (Math.random() < 0.08) this.spawnWildPokemon(gameMap);
    
    for (let i = this.wildPokemons.length - 1; i >= 0; i--) {
      const pokemon = this.wildPokemons[i];
      
      if (now > pokemon.despawnTime) {
        this.wildPokemons.splice(i, 1);
        continue;
      }
      
      pokemon.bounceOffset += pokemon.bounceDirection * pokemon.bounceSpeed;
      if (pokemon.bounceOffset > 5 || pokemon.bounceOffset < -5) {
        pokemon.bounceDirection *= -1;
      }
      
      pokemon.moveTimer--;
      if (pokemon.moveTimer <= 0) {
        pokemon.moveTimer = 60 + Math.floor(Math.random() * 120);
        
        if (Math.random() < 0.2) {
          pokemon.dirX = pokemon.dirY = 0;
        } else {
          const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          pokemon.dirX = dir.x;
          pokemon.dirY = dir.y;
        }
      }
      
      pokemon.x += pokemon.dirX * 0.3;
      pokemon.y += pokemon.dirY * 0.3;
      
      pokemon.x = Math.max(0, Math.min(gameMap.width, pokemon.x));
      pokemon.y = Math.max(0, Math.min(gameMap.height, pokemon.y));
    }
  }
  
  checkWildPokemonCollisions(playerPosition, gameMap) {
    for (let i = 0; i < this.wildPokemons.length; i++) {
      const pokemon = this.wildPokemons[i];
      
      const dx = (playerPosition.x - pokemon.x + gameMap.width/2) % gameMap.width - gameMap.width/2;
      const dy = playerPosition.y - pokemon.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance < 40) {
        this.currentEncounter = pokemon.type;
        this.isEncountering = true;
        
        this.escapeButton.style.display = 'block';
        this.battleText.textContent = `Un ${this.currentEncounter.name} sauvage apparaît!`;
        this.battleText.style.display = 'block';
        
        this.wildPokemons.splice(i, 1);
        return true;
      }
    }
    return false;
  }
  
  escape() {
    this.showNotification('Vous avez fui le combat!');
    setTimeout(() => this.battleText.style.display = 'none', 3000);
    
    this.isEncountering = false;
    this.currentEncounter = null;
    this.captureAnimation.active = false;
    this.escapeButton.style.display = 'none';
  }
  
  attemptCapture(ballType) {
    if (!this.isEncountering || !this.currentEncounter || this.captureAnimation.active) return false;
    
    if (this.pokeballs[ballType] <= 0) {
      this.battleText.textContent = `Vous n'avez plus de ${ballType}ball!`;
      return false;
    }
    
    this.pokeballs[ballType]--;
    this.updateCounters();
    
    let captureRate = 1.5;
    if (this.currentEncounter.rarity === 2) captureRate /= 2;
    if (this.currentEncounter.rarity === 3) captureRate /= 3;
    if (ballType === 'super') captureRate *= 1.5;
    if (ballType === 'hyper') captureRate *= 2.5;
    
    let shakeCount = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.random() < captureRate) shakeCount++;
      else break;
    }
    
    this.captureAnimation = {
      active: true, type: ballType, x: 150, y: 400, targetX: 400, targetY: 250,
      progress: 0, shakeCount, maxShakes: 3, currentShake: 0, result: shakeCount === 3
    };
    
    return true;
  }
  
  updateCaptureAnimation() {
    if (!this.captureAnimation.active) return;
    
    if (this.captureAnimation.progress < 0.25) {
      this.captureAnimation.progress += 0.01;
      this.battleText.textContent = `Lancer de ${this.captureAnimation.type}ball...`;
    } else if (this.captureAnimation.progress < 0.85) {
      if (this.captureAnimation.currentShake < this.captureAnimation.shakeCount) {
        const shakeProgress = (this.captureAnimation.progress - 0.25) / 0.6;
        const shakeStage = Math.floor(shakeProgress * this.captureAnimation.maxShakes);
        
        if (shakeStage > this.captureAnimation.currentShake) {
          this.captureAnimation.currentShake = shakeStage;
          this.battleText.textContent = `${this.captureAnimation.currentShake + 1}...`;
        }
      }
      this.captureAnimation.progress += 0.005;
    } else if (this.captureAnimation.progress < 1.0) {
      this.captureAnimation.progress += 0.01;
    }
    
    if (this.captureAnimation.progress >= 1) {
      if (this.captureAnimation.result) {
        const capturedPokemon = {...this.currentEncounter};
        const alreadyCaptured = this.capturedPokemons.some(p => p.name === capturedPokemon.name);
        
        if (!alreadyCaptured) {
          this.capturedPokemons.push(capturedPokemon);
          this.showCaptureSuccessAnimation();
        }
        
        this.battleText.textContent = `Vous avez capturé ${this.currentEncounter.name}!`;
        setTimeout(() => this.battleText.style.display = 'none', 3000);
        
        this.isEncountering = false;
        this.currentEncounter = null;
        this.escapeButton.style.display = 'none';
      } else {
        this.battleText.textContent = `${this.currentEncounter.name} s'est échappé!`;
      }
      
      this.captureAnimation.active = false;
    }
  }
  
  update(gameMap) {
    this.updateWildPokemons(gameMap);
    
    if (!this.isEncountering) {
      this.checkWildPokemonCollisions({
        x: gameMap.positionX,
        y: gameMap.positionY
      }, gameMap);
    }
  }
  
  drawWildPokemons(ctx, gameMap) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const scale = (canvasHeight / gameMap.height) * 3;
    const visibleWidth = canvasWidth / scale;
    const visibleHeight = canvasHeight / scale;
    
    this.wildPokemons.forEach(pokemon => {
      const spriteData = this.pokemonSprites[pokemon.type.name];
      if (!spriteData?.loaded || !spriteData.image.complete) return;
      
      const dx = (pokemon.x - gameMap.positionX + gameMap.width/2) % gameMap.width - gameMap.width/2;
      const dy = pokemon.y - gameMap.positionY;
      
      if (Math.abs(dx) < visibleWidth/2 + 50 && Math.abs(dy) < visibleHeight/2 + 50) {
        const screenX = dx * scale + canvasWidth/2;
        const screenY = dy * scale + canvasHeight/2 + pokemon.bounceOffset;
        
        if (screenX > -56 && screenX < canvasWidth + 56 && screenY > -56 && screenY < canvasHeight + 56) {
          ctx.drawImage(spriteData.image, 0, 0, spriteData.image.width, spriteData.image.height,
                       screenX - 28, screenY - 28, 56, 56);
        }
      }
    });
  }
  
  drawEncounterScreen(ctx) {
    if (!this.isEncountering) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    try {
      const spriteData = this.pokemonSprites[this.currentEncounter.name];
      if (!spriteData?.loaded || !spriteData.image.complete) return;
      
      const pokemonSize = 168;
      const pokemonY = ctx.canvas.height/2 - 100;
      const verticalOffset = Math.sin(Date.now() * 0.003) * 5;
      
      const shouldShow = !this.captureAnimation.active || this.captureAnimation.progress < 0.25 ||
                        (this.captureAnimation.progress < 0.85 && Math.floor(Date.now() / 150) % 2 === 0);
      
      if (shouldShow) {
        ctx.drawImage(spriteData.image, ctx.canvas.width/2 - pokemonSize/2, 
                     pokemonY + verticalOffset, pokemonSize, pokemonSize);
      }
      
      if (this.captureAnimation.active) {
        const ballSprite = this.pokeballSprites[this.captureAnimation.type];
        if (!ballSprite?.loaded || !ballSprite.image.complete) return;
        
        if (this.captureAnimation.progress < 0.25) {
          const progress = this.captureAnimation.progress * 4;
          const startX = ctx.canvas.width/2 - 150;
          const startY = ctx.canvas.height - 150;
          const targetX = ctx.canvas.width/2;
          const targetY = pokemonY + pokemonSize/2;
          
          const currentX = startX + (targetX - startX) * progress;
          const currentY = startY - 250 * Math.sin(progress * Math.PI) + (targetY - startY) * progress;
          const rotation = progress * Math.PI * 4;
          
          ctx.save();
          ctx.translate(currentX, currentY);
          ctx.rotate(rotation);
          ctx.drawImage(ballSprite.image, -16, -16, 32, 32);
          ctx.restore();
        } else {
          const targetX = ctx.canvas.width/2;
          const targetY = pokemonY + pokemonSize/2;
          
          let shakeOffset = 0;
          if (this.captureAnimation.progress < 0.85) {
            const shakeProgress = (this.captureAnimation.progress - 0.25) / 0.6;
            const shakePhase = (shakeProgress * 10) % 1;
            shakeOffset = Math.sin(shakePhase * Math.PI * 2) * 10 * 
                         Math.max(0, 1 - (this.captureAnimation.currentShake / 3));
          }
          
          ctx.drawImage(ballSprite.image, targetX - 16 + shakeOffset, 
                       targetY - 16 + Math.sin(Date.now() * 0.01) * 2, 32, 32);
          
          if (this.captureAnimation.progress >= 0.85 && this.captureAnimation.result) {
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
    if (!this.capturedPokemons.length) return;
    
    const spriteSize = 80;
    const padding = 10;
    const startX = ctx.canvas.width - spriteSize - padding - 20;
    const startY = 100;
    
    ctx.fillStyle = 'white';
    ctx.font = '18px monospace';
    ctx.fillText(`${this.capturedPokemons.length} / ${this.waterPokemons.length}`,
                startX - 10, startY + this.capturedPokemons.length * (spriteSize + padding/2) + padding);
    
    this.animationTimer += 0.03;
    
    this.capturedPokemons.forEach((pokemon, index) => {
      try {
        const spriteData = this.pokemonSprites[pokemon.name];
        if (!spriteData?.loaded || !spriteData.image.complete) return;
        
        const y = startY + index * (spriteSize + padding/2);
        const bounceOffset = Math.sin(this.animationTimer + index * 0.5) * 5;
        
        ctx.drawImage(spriteData.image, startX, y + bounceOffset, spriteSize, spriteSize);
      } catch (e) {
        console.log(`Impossible de charger le sprite du Pokémon ${pokemon.name}`, e);
      }
    });
  }
}
