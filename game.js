export class Game {
  constructor() {
    // Add animation timing
    this.coinAnimationTime = 0;
    this.mysteryAnimationTime = 0;
    this.spineyAnimationTime = 0; // Add spiney animation time
    
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.blocks = [];
    this.coins = []; 
    this.coinsCollected = 0; 
    this.player = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      width: 28, // Reduced from 32 (about 10% smaller)
      height: 28, // Reduced from 32 (about 10% smaller)
      facing: 1, 
      walkFrame: 0,
      walkTimer: 0,
      state: 'stand', 
      isRunning: false,
      walkSpeed: 3.75, 
      runSpeed: 6, 
      canJump: false,
      isSkidding: false,
      skidTimer: 0,
      lastDirection: 1,
      isBig: false, 
      powerUpTimer: 0, 
      isInvincible: false, 
      invincibilityTimer: 0,
      stoppingMomentum: 0,
      stoppingDirection: 0,
      stoppingTimer: 0,
    };

    // Add camera properties
    this.camera = {
      x: 0,
      y: 0,
      scale: 1.35,
      verticalDeadzone: 60
    };

    this.keys = new Set();
    this.resize();
    this.setupEvents();
    this.loadImages();
    this.animatingBlocks = new Map(); 
    this.scenery = [];
    this.sceneryTypes = {
      'cloud': { width: 2, height: 1 }, 
      'hill': { width: 4, height: 2 }, 
      'bush1': { width: 2, height: 1 },
      'bush2': { width: 3, height: 1 },
      'pipe': { width: 2, height: 2 }
    };
    this.emptyBlocks = new Set(); 
    this.mysteryCounts = new Map(); 
    this.coinAnimations = []; 
    this.goombas = []; 
    this.goombaAnimationTimer = 0;
    this.koopas = []; 
    this.spineys = []; // Add spineys array
    this.spineyAnimationTimer = 0; // Add spiney animation timer
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.endGoalPosition = null;
    this.mushrooms = [];
    this.mysteryContents = new Map();
    this.usedMysteryBoxes = new Set();
    this.particles = [];
    this.isPaused = false;
    this.isTestingMode = false; // Add this flag
    this.isClearCheck = false; // Add clear check flag
    this.levelCleared = false; // Track if level has been cleared
    this.goalPost = null; // Add goal post tracking
    this.isCompleted = false;
    this.fadeAlpha = 0;
    this.showingCompletionScreen = false;
    this.showingGameOverScreen = false;
    this.isDead = false; // Add new flag to track if player is dead
    
    // Add pause menu elements
    this.pauseMenu = document.getElementById('pause-menu');
    this.saveLevelBtn = document.getElementById('saveLevelBtn');
    this.testLevelBtn = document.getElementById('testLevelBtn');
    
    // Set up pause menu only if we actually have the element
    if (this.pauseMenu) {
      this.setupPauseMenu();
    }
    
    // Add level completion elements
    this.completionScreen = document.createElement('div');
    this.completionScreen.className = 'completion-screen hidden';
    const content = document.createElement('div');
    content.className = 'completion-content';
    content.innerHTML = `
      <h2>Level Complete!</h2>
      ${this.isTestingMode ? `
        <div class="completion-buttons">
          <button id="completionBackBtn" class="menu-button">Back to Editor</button>
        </div>
      ` : `
        <div class="completion-buttons">
          <div class="like-buttons">
            <button id="completionLikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userLiked ? 'selected' : ''}">❤️</button>
            <button id="completionDislikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userDisliked ? 'selected' : ''}">💔</button>
          </div>
          <button id="completionReplayBtn" class="menu-button">Replay</button>
          <button id="completionBackBtn" class="menu-button">Back to Course World</button>
        </div>
      `}
    `;
    this.completionScreen.appendChild(content);
    document.getElementById('game-container').appendChild(this.completionScreen);

    // Add game over screen
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.className = 'completion-screen hidden';
    const gameOverContent = document.createElement('div');
    gameOverContent.className = 'completion-content game-over-content';
    gameOverContent.innerHTML = `
      <h2>Game Over!</h2>
      <div class="completion-buttons">
        <button id="retryBtn" class="menu-button">Retry</button>
        <button id="gameOverBackBtn" class="menu-button">Back to Course World</button>
      </div>
    `;
    this.gameOverScreen.appendChild(gameOverContent);
    document.getElementById('game-container').appendChild(this.gameOverScreen);

    // Set up completion screen buttons
    this.setupCompletionScreen();
    this.setupGameOverScreen();
    
    this.animate();
    this.enteredPipe = false;
    this.pipeEnterTimer = 0;
    this.pipeExitTimer = 0;
    this.transportDestination = null;
    this.pipeTransportations = new Map(); // store pipe transportation points
  }

  loadImages() {
    this.images = {
      floor: new Image(),
      brick: new Image(),
      mystery: new Image(),
      stand: new Image(),
      walk1: new Image(),
      walk2: new Image(),
      walk3: new Image(),
      jump: new Image(),
      coin: new Image(),
      cloud: new Image(),
      hill: new Image(),
      bush1: new Image(),
      bush2: new Image(),
      empty: new Image(),
      pipe: new Image(),
      skid: new Image(),
      goomba: new Image(),
      hardblock: new Image(),
      koopa1: new Image(),
      koopa2: new Image(),
      koopashell: new Image(),
      koopaready: new Image(),
      mushroom: new Image(),
      spiney1: new Image(), // Add spiney images
      spiney2: new Image(), 
      BMstand: new Image(),
      BMwalk1: new Image(),
      BMwalk2: new Image(),
      BMwalk3: new Image(),
      BMjump: new Image(),
      BMskid: new Image(),
      cloudblock: new Image(),
      endpoint: new Image(), // Add endpoint image
    };
    this.images.floor.src = 'floor.png';
    this.images.brick.src = 'brick.png';
    this.images.mystery.src = 'mario-mystery-box';
    this.images.stand.src = 'Mstand.png';
    this.images.walk1.src = 'Mwalk1.png';
    this.images.walk2.src = 'Mwalk2.png';
    this.images.walk3.src = 'Mwalk3.png';
    this.images.jump.src = 'Mjump.png';
    this.images.coin.src = 'coin.png';
    this.images.cloud.src = 'cloud1bg.png';
    this.images.hill.src = 'Hill1bg.png';
    this.images.bush1.src = 'bush1bg.png';
    this.images.bush2.src = 'bush2.png';
    this.images.empty.src = 'emptyblock.png';
    this.images.pipe.src = 'Pipe.png';
    this.images.skid.src = 'Mskid.png';
    this.images.goomba.src = 'Goomba.png';
    this.images.hardblock.src = 'hardblock.png';
    this.images.koopa1.src = 'Koopa1.png';
    this.images.koopa2.src = 'Koopa2.png';
    this.images.koopashell.src = 'Koopashell.png';
    this.images.koopaready.src = 'Koopaready.png';
    this.images.mushroom.src = 'mushroom.png';
    this.images.spiney1.src = 'spiney1.png'; // Load spiney images
    this.images.spiney2.src = 'spiney2.png';
    this.images.BMstand.src = 'BMstand.png';
    this.images.BMwalk1.src = 'BMrun1.png';
    this.images.BMwalk2.src = 'BMrun2.png';
    this.images.BMwalk3.src = 'BMrun3.png';
    this.images.BMjump.src = 'BMjump.png';
    this.images.BMskid.src = 'BMskid.png';
    this.images.cloudblock.src = 'Cloud.png';
    this.images.endpoint.src = 'Endpoint.png';
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 80;
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());

      // Add arrow keys mapping to WASD
      if (e.key === 'ArrowLeft') this.keys.add('a');
      if (e.key === 'ArrowRight') this.keys.add('d');
      if (e.key === 'ArrowUp') this.keys.add('w');
      if (e.key === 'ArrowDown') this.keys.add('s');
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      
      // Remove arrow keys mapping when released
      if (e.key === 'ArrowLeft') this.keys.delete('a');
      if (e.key === 'ArrowRight') this.keys.delete('d');
      if (e.key === 'ArrowUp') this.keys.delete('w');
      if (e.key === 'ArrowDown') this.keys.delete('s');
    });
  }

  setupPauseMenu() {
    // Only set up if all required elements exist
    const resumeBtn = document.getElementById('resumeBtn');
    const saveLevelBtn = document.getElementById('saveLevelBtn');
    const testLevelBtn = document.getElementById('testLevelBtn');
    const pauseBackBtn = document.getElementById('pauseBackBtn');
    
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.unpause();
      });
    }

    if (saveLevelBtn) {
      saveLevelBtn.addEventListener('click', () => {
        // Show save modal with level ID
        const modal = document.getElementById('modal');
        const levelIdText = document.getElementById('levelIdText');
        if (window.editorInstance) {
          const levelData = window.editorInstance.saveLevel();
          const levelId = btoa(JSON.stringify(levelData))
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
          levelIdText.value = levelId;
          modal.classList.remove('hidden');
        }
      });
    }

    if (testLevelBtn) {
      testLevelBtn.addEventListener('click', () => {
        this.unpause();
        this.resetLevel();
      });
    }

    if (pauseBackBtn) {
      pauseBackBtn.addEventListener('click', () => {
        this.unpause();
        const gameContainer = document.getElementById('game-container');
        const editor = document.getElementById('editor');
        const menu = document.getElementById('menu');
        
        gameContainer.classList.add('hidden');
        if (this.isTestingMode) {
          editor.classList.remove('hidden');
        } else {
          menu.classList.remove('hidden');
        }
        
        if (this.destroy) {
          this.destroy();
        }
      });
    }
  }

  setupCompletionScreen() {
    const completionContent = this.completionScreen.querySelector('.completion-content');
    
    // Dynamically update completion screen content based on mode
    if (this.isTestingMode) {
      completionContent.innerHTML = `
        <h2>Level Complete!</h2>
        <div class="completion-buttons">
          <button id="completionBackBtn" class="menu-button">Back to Editor</button>
        </div>
      `;
    } else {
      completionContent.innerHTML = `
        <h2>Level Complete!</h2>
        <div class="completion-buttons">
          <div class="like-buttons">
            <button id="completionLikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userLiked ? 'selected' : ''}">❤️</button>
            <button id="completionDislikeBtn" class="like-btn ${window.currentCourse && window.currentCourse.userDisliked ? 'selected' : ''}">💔</button>
          </div>
          <button id="completionReplayBtn" class="menu-button">Replay</button>
          <button id="completionBackBtn" class="menu-button">Back to Course World</button>
        </div>
      `;
    }

    const backBtn = document.getElementById('completionBackBtn');
    const replayBtn = document.getElementById('completionReplayBtn');
    const likeBtn = document.getElementById('completionLikeBtn');
    const dislikeBtn = document.getElementById('completionDislikeBtn');
    const uploadLevelBtn = document.getElementById('uploadLevelBtn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.isTestingMode || this.isClearCheck) {
          document.getElementById('game-container').classList.add('hidden');
          document.getElementById('editor').classList.remove('hidden');
        } else {
          document.getElementById('game-container').classList.add('hidden');
          document.getElementById('courses-menu').classList.remove('hidden');
        }
        if (this.destroy) {
          this.destroy();
        }
      });
    }

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.completionScreen.classList.add('hidden');
        this.isCompleted = false;
        this.fadeAlpha = 0;
        this.showingCompletionScreen = false;
        this.resetLevel();
        this.unpause();
      });
    }

    if (uploadLevelBtn) {
      uploadLevelBtn.addEventListener('click', () => {
        const levelId = generateLevelId();
        document.getElementById('levelIdDisplay').textContent = levelId;
        document.getElementById('upload-modal').classList.remove('hidden');
        this.completionScreen.classList.add('hidden');
        document.getElementById('game-container').classList.add('hidden');
        document.getElementById('editor').classList.remove('hidden');
      });
    }

    if (likeBtn && dislikeBtn && window.currentCourse) {
      likeBtn.addEventListener('click', () => {
        if (!window.currentCourse.userLiked) {
          window.currentCourse.likes++;
          window.currentCourse.userLiked = true;
          window.currentCourse.userDisliked = false;
          likeBtn.classList.add('selected');
          dislikeBtn.classList.remove('selected');
          localStorage.setItem('courses', JSON.stringify(window.courses));
        }
      });

      dislikeBtn.addEventListener('click', () => {
        if (!window.currentCourse.userDisliked) {
          if (window.currentCourse.userLiked) {
            window.currentCourse.likes--;
          }
          window.currentCourse.userLiked = false;
          window.currentCourse.userDisliked = true;
          likeBtn.classList.remove('selected');
          dislikeBtn.classList.add('selected');
          localStorage.setItem('courses', JSON.stringify(window.courses));
        }
      });
    }
  }

  setupGameOverScreen() {
    const retryBtn = document.getElementById('retryBtn');
    const gameOverBackBtn = document.getElementById('gameOverBackBtn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.gameOverScreen.classList.add('hidden');
        this.showingGameOverScreen = false;
        this.isDead = false; // Reset dead flag when retrying
        this.resetLevel();
      });
    }

    if (gameOverBackBtn) {
      gameOverBackBtn.addEventListener('click', () => {
        if (this.isTestingMode) {
          document.getElementById('game-container').classList.add('hidden');
          document.getElementById('editor').classList.remove('hidden');
        } else {
          document.getElementById('game-container').classList.add('hidden');
          document.getElementById('courses-menu').classList.remove('hidden');
        }
        this.destroy();
      });
    }
  }

  loadLevel(levelData) {
    // Reset any screens that might be showing from previous levels
    this.isCompleted = false;
    this.fadeAlpha = 0;
    this.showingCompletionScreen = false;
    this.completionScreen.classList.add('hidden');
    this.showingGameOverScreen = false;
    this.gameOverScreen.classList.add('hidden');
    
    this.blocks = levelData.b.map(block => ({
      x: block[0],
      y: block[1],
      type: block[2] === 'f' ? 'floor' : 
            block[2] === 'b' ? 'brick' :
            block[2] === 'h' ? 'hardblock' :  
            block[2] === 'm' ? 'mystery' :
            block[2] === 'c' ? 'coin' :
            block[2] === 'g' ? 'goomba' :
            block[2] === 'k' ? 'koopa' :
            block[2] === 's' ? 'spiney' : // Add spiney type
            block[2] === 'l' ? 'cloudblock' : block[2]  
    }));

    this.coins = this.blocks.filter(block => block.type === 'coin');
    this.blocks = this.blocks.filter(block => block.type !== 'coin');
    this.coinsCollected = 0;
    
    this.goombas = this.blocks
      .filter(block => block.type === 'goomba')
      .map(goomba => ({
        x: goomba.x * 32,
        y: goomba.y * 32,
        vx: -1.4, 
        vy: 0,
        width: 32,
        height: 32,
        facing: -1
      }));
    
    // Remove goombas from blocks array
    this.blocks = this.blocks.filter(block => block.type !== 'goomba');
    
    this.koopas = this.blocks
      .filter(block => block.type === 'koopa')
      .map(koopa => ({
        x: koopa.x * 32,
        y: koopa.y * 32,
        vx: -1.4,
        vy: 0,
        width: 32,
        height: 32,
        facing: -1,
        state: 'walk', 
        walkFrame: 0,
        walkTimer: 0,
        shellTimer: 0,
        readyTimer: 0,
        kickedTimer: 0
      }));

    // Remove koopas from blocks array
    this.blocks = this.blocks.filter(block => block.type !== 'koopa');
    
    this.spineys = this.blocks
      .filter(block => block.type === 'spiney')
      .map(spiney => ({
        x: spiney.x * 32,
        y: spiney.y * 32,
        vx: -1.4,
        vy: 0,
        width: 32,
        height: 32,
        facing: -1,
        frame: 0,
        animationTimer: 0
      }));
      
    // Remove spineys from blocks array
    this.blocks = this.blocks.filter(block => block.type !== 'spiney');
    
    if (levelData.s) {
      this.player.x = levelData.s[0] * 32;
      this.player.y = levelData.s[1] * 32;
    } else {
      this.player.x = 100;
      this.player.y = 100;
    }
    
    this.endGoalPosition = null;
    if (levelData.d) {
      this.scenery = levelData.d.map(item => {
        return {
          x: item[0],
          y: item[1],
          type: item[2],
          width: this.sceneryTypes[item[2]].width,
          height: this.sceneryTypes[item[2]].height
        };
      });
    } else {
      this.scenery = [];
    }

    // Initialize mystery box contents
    levelData.b.forEach(block => {
      if (block[0] && block[1] && block[2] === 'm' && block[3]) {
        this.mysteryContents.set(`${block[0]},${block[1]}`, block[3]);
      }
    });

    this.player = {
      ...this.player,
      height: this.player.isBig ? 50 : 28 // Changed from 64 to 56 for big Mario and reduced from 56 to 50
    };

    if (levelData.g && levelData.g.length >= 2) {
      this.goalPost = { 
        x: levelData.g[0], 
        y: levelData.g[1], 
        width: levelData.g[2] || 2, // Default to 2 if not specified
        height: levelData.g[3] || 2  // Default to 2 if not specified
      };
    } else {
      this.goalPost = null;
    }
    
    this.pipeTransportations = new Map(); // store pipe transportation points
    if (levelData.p) {
      levelData.p.forEach(pipe => {
        this.pipeTransportations.set(`${pipe[0]},${pipe[1]}`, {x: pipe[2], y: pipe[3]});
      });
    }
  }

  update() {
    if (this.isPaused || this.isDead) return; // Skip update if paused or player is dead
    
    // Optimize performance by skipping unnecessary operations when off-screen
    if (this.player.x < this.camera.x - 200 || 
        this.player.x > this.camera.x + this.canvas.width / this.camera.scale + 200 ||
        this.player.y < this.camera.y - 200 || 
        this.player.y > this.camera.y + this.canvas.height / this.camera.scale + 200) {
      // Player is far off screen, do minimal updates
      this.player.vy += 0.465;
      this.player.y += this.player.vy;
      return;
    }
    
    // Check for goal post collision
    if (this.goalPost) {
      const goalRect = {
        x: this.goalPost.x * 32,
        y: this.goalPost.y * 32,
        width: (this.goalPost.width || 2) * 32, // Use width from goalPost or default to 2
        height: (this.goalPost.height || 2) * 32 // Use height from goalPost or default to 2
      };
      
      if (this.checkCollision(
        { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
        goalRect
      )) {
        // Player reached the goal
        this.isCompleted = true;
        this.fadeAlpha = 0;
        
        // Mark level as cleared if this is a clear check
        if (this.isClearCheck) {
          this.levelCleared = true;
        }
        
        this.completionScreen.classList.remove('hidden');
        this.showingCompletionScreen = true;
        return;
      }
    }
    
    // Handle pipe transportation
    if (this.enteredPipe) {
      this.pipeEnterTimer++;
      
      if (this.pipeEnterTimer < 45) {
        // Slowly move player down into the pipe
        this.player.y += 1;
      } else if (this.pipeEnterTimer >= 45 && this.pipeEnterTimer < 60) {
        // Fade to black
        this.fadeAlpha = (this.pipeEnterTimer - 45) / 15;
      } else {
        // Reset pipe entering state and teleport player
        this.enteredPipe = false;
        this.pipeEnterTimer = 0;
        this.fadeAlpha = 0;
        
        if (this.transportDestination) {
          this.player.x = this.transportDestination.x * 32;
          this.player.y = (this.transportDestination.y - 1) * 32; // Position slightly above exit pipe
          this.pipeExitTimer = 30; // Start exit animation
        }
      }
      
      return; // Skip other updates while in pipe
    }
    
    // Handle pipe exit animation
    if (this.pipeExitTimer > 0) {
      this.pipeExitTimer--;
      return; // Skip other updates while exiting pipe
    }

    // Add frame counter for goomba animation
    if (!this.goombaAnimationTimer) {
      this.goombaAnimationTimer = 0;
    }
    this.goombaAnimationTimer++;
    if (this.goombaAnimationTimer >= 12) { 
      this.goombaAnimationTimer = 0;
      this.goombas.forEach(goomba => {
        goomba.facing *= -1; 
      });
    }
    
    // Add spiney animation
    if (!this.spineyAnimationTimer) {
      this.spineyAnimationTimer = 0;
    }
    this.spineyAnimationTimer++;
    if (this.spineyAnimationTimer >= 12) {
      this.spineyAnimationTimer = 0;
      this.spineys.forEach(spiney => {
        spiney.frame = spiney.frame === 0 ? 1 : 0;
      });
    }

    for (const [key, animation] of this.animatingBlocks.entries()) {
      animation.progress += 0.16; 
      if (animation.progress >= 1) {
        this.animatingBlocks.delete(key);
      }
    }

    this.coinAnimations = this.coinAnimations.filter(anim => {
      anim.progress += 0.1;
      return anim.progress < 1;
    });

    this.player.isRunning = this.keys.has('shift');
    const speed = this.player.isRunning ? this.player.runSpeed : this.player.walkSpeed;

    const previousDirection = this.player.lastDirection;

    let currentDirection = 0;
    if (this.keys.has('a')) currentDirection = -1;
    if (this.keys.has('d')) currentDirection = 1;

    // Only trigger skidding when:
    // 1. Player is running
    // 2. Has significant speed
    // 3. Changes direction to the opposite of current movement
    if (this.player.isRunning && 
        Math.abs(this.player.vx) > this.player.walkSpeed && 
        currentDirection !== 0 && 
        Math.sign(this.player.vx) !== currentDirection) {
      this.player.isSkidding = true;
      this.player.skidTimer = 12;
    }

    if (this.player.skidTimer > 0) {
      this.player.skidTimer--;
      if (this.player.skidTimer === 0) {
        this.player.isSkidding = false;
      }
    }

    // Update last direction only when actually moving
    if (currentDirection !== 0) {
      this.player.lastDirection = currentDirection;
    }

    // Momentum logic
    if (this.player.isRunning && Math.abs(this.player.vx) > this.player.walkSpeed) {
      if (!this.keys.has('a') && !this.keys.has('d')) {
        // Start stopping momentum when player releases movement keys
        this.player.stoppingMomentum = this.player.vx;
        this.player.stoppingDirection = Math.sign(this.player.vx);
        this.player.stoppingTimer = 15; // 0.25 seconds at 60fps
      }
    }

    // Handle stopping momentum
    if (this.player.stoppingTimer > 0) {
      this.player.stoppingTimer--;
      if (!this.player.isDucking || (this.player.isDucking && this.player.canJump)) {
        this.player.vx = this.player.stoppingMomentum * (this.player.stoppingTimer / 15);
      }
      
      if (this.player.stoppingTimer === 0) {
        this.player.stoppingMomentum = 0;
      }

      // Keep the walking animation during momentum
      if (this.player.canJump) {
        this.player.state = 'walk';
        const animSpeed = 6;
        this.player.walkTimer++;
        if (this.player.walkTimer >= animSpeed) {
          this.player.walkTimer = 0;
          this.player.walkFrame = (this.player.walkFrame + 1) % 3;
        }
      }
    }

    // Modify movement logic
    if (this.keys.has('a')) {
      const targetSpeed = -speed;
      this.player.vx = this.player.isSkidding ? targetSpeed * 0.4 : targetSpeed;
      this.player.facing = -1;
      this.player.stoppingTimer = 0; // Reset stopping timer when moving
      this.player.stoppingMomentum = 0;
    } else if (this.keys.has('d')) {
      const targetSpeed = speed;
      this.player.vx = this.player.isSkidding ? targetSpeed * 0.4 : targetSpeed;
      this.player.facing = 1;
      this.player.stoppingTimer = 0; // Reset stopping timer when moving
      this.player.stoppingMomentum = 0;
    } else if (this.player.stoppingTimer === 0) {
      // Only reset velocity if not in stopping momentum phase
      this.player.vx = 0;
      this.player.isSkidding = false;
      this.player.skidTimer = 0;
    }

    // Add jump charge logic at the start of update()
    if (this.keys.has('w') && this.player.canJump) {
      this.player.vy = -10.27;
      this.player.canJump = false;
    }

    this.player.vy += 0.465; 

    let newX = this.player.x + this.player.vx;
    let newY = this.player.y + this.player.vy;

    if (!this.player.canJump) {
      this.player.state = 'jump';
    } else if (this.player.isSkidding) {
      this.player.state = 'skid';
    } else if (this.player.vx !== 0) {
      this.player.state = 'walk';
      const animSpeed = this.player.isRunning ? 4 : 6;
      this.player.walkTimer++;
      if (this.player.walkTimer >= animSpeed) {
        this.player.walkTimer = 0;
        this.player.walkFrame = (this.player.walkFrame + 1) % 3;
      }
    } else {
      this.player.state = 'stand';
      this.player.walkFrame = 0;
      this.player.walkTimer = 0;
    }

    this.player.canJump = false;
    
    let collisionY = false;
    let collisionX = false;
    
    this.blocks.forEach(block => {
      if (['floor', 'brick', 'mystery', 'hardblock', 'cloudblock'].includes(block.type)) {
        const blockRect = {
          x: block.x * 32,
          y: block.y * 32,
          width: 32,
          height: 32
        };

        // For cloud blocks, only check collision if falling onto them from above
        if (block.type === 'cloudblock') {
          if (this.player.vy > 0 && // Only if falling
              this.player.y + this.player.height <= blockRect.y && // Was above the block
              this.checkCollision(
                { x: this.player.x, y: newY, width: this.player.width, height: this.player.height },
                blockRect
              )) {
            collisionY = true;
            newY = blockRect.y - this.player.height;
            this.player.vy = 0;
            this.player.canJump = true;
          }
        } else {
          // Normal collision checks for other block types
          if (this.checkCollision(
            { x: this.player.x, y: newY, width: this.player.width, height: this.player.height },
            blockRect
          )) {
            collisionY = true;
            if (this.player.vy > 0) {
              newY = blockRect.y - this.player.height;
              this.player.vy = 0;
              this.player.canJump = true;
            } else if (this.player.vy < 0) {
              newY = blockRect.y + blockRect.height;
              this.player.vy = 0;
              
              if (block.type === 'brick' || block.type === 'mystery') {
                const blockKey = `${block.x},${block.y}`;
                if (!this.emptyBlocks.has(blockKey)) {
                  if (!this.animatingBlocks.has(blockKey)) {
                    this.animatingBlocks.set(blockKey, {
                      progress: 0,
                      x: block.x,
                      y: block.y
                    });
                    
                    if (block.type === 'mystery') {
                      if (!this.mysteryCounts.has(blockKey)) {
                        this.mysteryCounts.set(blockKey, 1);
                      } else {
                        this.mysteryCounts.set(blockKey, this.mysteryCounts.get(blockKey) + 1);
                      }
                      
                      if (this.mysteryCounts.get(blockKey) === 5) {
                        this.emptyBlocks.add(blockKey);
                      }
                      
                      this.coinAnimations.push({
                        x: block.x * 32,
                        y: block.y * 32,
                        progress: 0
                      });
                      
                      this.coinsCollected++;
                    }
                  }
                }
              }
            }
          }

          if (this.checkCollision(
            { x: newX, y: this.player.y, width: this.player.width, height: this.player.height },
            blockRect
          )) {
            collisionX = true;
            if (this.player.vx > 0) {
              newX = blockRect.x - this.player.width;
            } else if (this.player.vx < 0) {
              newX = blockRect.x + blockRect.width;
            }
          }
        }
      }
    });

    this.scenery.forEach(item => {
      if (item.type === 'pipe') {
        const pipeRect = {
          x: item.x * 32,
          y: item.y * 32,
          width: 32 * item.width,
          height: 32 * item.height
        };

        if (this.checkCollision(
          { x: this.player.x, y: newY, width: this.player.width, height: this.player.height },
          pipeRect
        )) {
          collisionY = true;
          if (this.player.vy > 0) {
            newY = pipeRect.y - this.player.height;
            this.player.vy = 0;
            this.player.canJump = true;
          } else if (this.player.vy < 0) {
            newY = pipeRect.y + pipeRect.height;
            this.player.vy = 0;
          }
        }

        if (this.checkCollision(
          { x: newX, y: this.player.y, width: this.player.width, height: this.player.height },
          pipeRect
        )) {
          collisionX = true;
          if (this.player.vx > 0) {
            newX = pipeRect.x - this.player.width;
          } else if (this.player.vx < 0) {
            newX = pipeRect.x + pipeRect.width;
          }
        }
      }
    });

    const playerRect = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height
    };

    this.coins = this.coins.filter(coin => {
      const coinRect = {
        x: coin.x * 32,
        y: coin.y * 32,
        width: 32,
        height: 32
      };
      
      if (this.checkCollision(playerRect, coinRect)) {
        this.coinsCollected++;
        return false;
      }
      return true;
    });

    this.player.x = newX;
    this.player.y = newY;

    // Update goombas
    this.goombas = this.goombas.filter(goomba => {
      goomba.vy += 0.465; // Same gravity as player
      
      let newX = goomba.x + goomba.vx;
      let newY = goomba.y + goomba.vy;
      
      let collisionY = false;
      
      // Check collisions with blocks
      this.blocks.forEach(block => {
        if (['floor', 'brick', 'mystery', 'hardblock', 'cloudblock'].includes(block.type)) {
          const blockRect = {
            x: block.x * 32,
            y: block.y * 32,
            width: 32,
            height: 32
          };

          // Cloud block collision only when falling
          if (block.type === 'cloudblock') {
            if (goomba.vy > 0 && // Only if falling
                goomba.y + goomba.height <= blockRect.y && // Was above the block
                this.checkCollision(
                  { x: goomba.x, y: newY, width: goomba.width, height: goomba.height },
                  blockRect
                )) {
              collisionY = true;
              newY = blockRect.y - goomba.height;
              goomba.vy = 0;
            }
          } else {
            // Normal collision for other blocks
            if (this.checkCollision(
              { x: goomba.x, y: newY, width: goomba.width, height: goomba.height },
              blockRect
            )) {
              collisionY = true;
              if (goomba.vy > 0) {
                newY = blockRect.y - goomba.height;
                goomba.vy = 0;
              } else if (goomba.vy < 0) {
                newY = blockRect.y + blockRect.height;
                goomba.vy = 0;
              }
            }

            if (this.checkCollision(
              { x: newX, y: goomba.y, width: goomba.width, height: goomba.height },
              blockRect
            )) {
              goomba.vx *= -1; // Reverse direction on collision
              goomba.facing *= -1; // Flip facing direction
              newX = goomba.x;
            }
          }
        }
      });

      // Add pipe collision detection for goombas
      this.scenery.forEach(item => {
        if (item.type === 'pipe') {
          const pipeRect = {
            x: item.x * 32,
            y: item.y * 32,
            width: 32 * item.width,
            height: 32 * item.height
          };

          if (this.checkCollision(
            { x: goomba.x, y: newY, width: goomba.width, height: goomba.height },
            pipeRect
          )) {
            collisionY = true;
            if (goomba.vy > 0) {
              newY = pipeRect.y - goomba.height;
              goomba.vy = 0;
            } else if (goomba.vy < 0) {
              newY = pipeRect.y + pipeRect.height;
              goomba.vy = 0;
            }
          }

          if (this.checkCollision(
            { x: newX, y: goomba.y, width: goomba.width, height: goomba.height },
            pipeRect
          )) {
            goomba.vx *= -1;
            goomba.facing *= -1;
            newX = goomba.x;
          }
        }
      });

      // Player collision detection
      const playerRect = {
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };

      const goombaRect = {
        x: newX,
        y: newY,
        width: goomba.width,
        height: goomba.height
      };

      if (this.checkCollision(playerRect, goombaRect)) {
        // Check if player is above goomba (stomping)
        if (this.player.vy > 0 && 
            this.player.y + this.player.height < goomba.y + goomba.height * 0.7) {
          // Squish goomba
          this.player.vy = -8; // Bounce player up
          return false; // Remove goomba
        } else {
          // Player dies - reset level
          this.playerDied();
        }
      }

      goomba.x = newX;
      goomba.y = newY;
      return true;
    });

    // Update koopas
    this.koopas = this.koopas.filter(koopa => {
      // Apply gravity
      koopa.vy += 0.465; 
      
      let newX = koopa.x + koopa.vx;
      let newY = koopa.y + koopa.vy;
      let collisionY = false;
      
      // Block collisions
      this.blocks.forEach(block => {
        if (['floor', 'brick', 'mystery', 'hardblock', 'cloudblock'].includes(block.type)) {
          const blockRect = {
            x: block.x * 32,
            y: block.y * 32,
            width: 32,
            height: 32
          };

          // Cloud block collision only when falling
          if (block.type === 'cloudblock') {
            if (koopa.vy > 0 && // Only if falling
                koopa.y + koopa.height <= blockRect.y && // Was above the block
                this.checkCollision(
                  { x: koopa.x, y: newY, width: koopa.width, height: koopa.height },
                  blockRect
                )) {
              collisionY = true;
              newY = blockRect.y - koopa.height;
              koopa.vy = 0;
            }
          } else {
            // Normal collision for other blocks
            if (this.checkCollision(
              { x: koopa.x, y: newY, width: koopa.width, height: koopa.height },
              blockRect
            )) {
              collisionY = true;
              if (koopa.vy > 0) {
                newY = blockRect.y - koopa.height;
                koopa.vy = 0;
              } else if (koopa.vy < 0) {
                newY = blockRect.y + blockRect.height;
                koopa.vy = 0;
                
                if (block.type === 'mystery') {
                  const blockKey = `${block.x},${block.y}`;
                  if (!this.emptyBlocks.has(blockKey)) {
                    if (!this.animatingBlocks.has(blockKey)) {
                      this.animatingBlocks.set(blockKey, {
                        progress: 0,
                        x: block.x,
                        y: block.y
                      });
                      
                      if (!this.mysteryCounts.has(blockKey)) {
                        this.mysteryCounts.set(blockKey, 1);
                      } else {
                        this.mysteryCounts.set(blockKey, this.mysteryCounts.get(blockKey) + 1);
                      }
                      
                      if (this.mysteryCounts.get(blockKey) === 5) {
                        this.emptyBlocks.add(blockKey);
                      }
                      
                      this.coinAnimations.push({
                        x: block.x * 32,
                        y: block.y * 32,
                        progress: 0
                      });
                      
                      this.coinsCollected++;
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Add pipe collision detection for koopas
      this.scenery.forEach(item => {
        if (item.type === 'pipe') {
          const pipeRect = {
            x: item.x * 32,
            y: item.y * 32,
            width: 32 * item.width,
            height: 32 * item.height
          };

          if (this.checkCollision(
            { x: koopa.x, y: newY, width: koopa.width, height: koopa.height },
            pipeRect
          )) {
            collisionY = true;
            if (koopa.vy > 0) {
              newY = pipeRect.y - koopa.height;
              koopa.vy = 0;
            } else if (koopa.vy < 0) {
              newY = pipeRect.y + pipeRect.height;
              koopa.vy = 0;
            }
          }

          if (this.checkCollision(
            { x: newX, y: koopa.y, width: koopa.width, height: koopa.height },
            pipeRect
          )) {
            koopa.vx *= -1;
            koopa.facing *= -1;
            newX = koopa.x;
          }
        }
      });

      // Player collision detection
      const playerRect = {
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };

      const koopaRect = {
        x: newX,
        y: newY,
        width: koopa.width,
        height: koopa.height
      };

      if (this.checkCollision(playerRect, koopaRect)) {
        if (koopa.state === 'walk') {
          if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height * 0.7) {
            // Normal stomping behavior
            koopa.state = 'shell';
            koopa.vx = 0;
            koopa.shellTimer = 0;
            this.player.vy = -8;
          } else if (this.player.isBig) {
            // Big Mario gets hit
            this.player.isBig = false;
            this.player.height = 28;
            this.player.isInvincible = true;
            this.player.invincibilityTimer = 120;
          } else {
            // Small Mario dies
            this.playerDied();
          }
        } else if (koopa.state === 'shell' || koopa.state === 'ready') {
          // If shell is moving fast enough AND player isn't above it, kill player
          if (Math.abs(koopa.vx) > 3 && 
              !(this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2)) {
            this.playerDied();
          } else if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2) {
            // Player jumped on shell
            if (koopa.state === 'ready') {
              // Reset ready timer if in ready state
              koopa.readyTimer = 0;
              koopa.state = 'ready';
              this.player.vy = -8;
            } else if (Math.abs(koopa.vx) < 0.1) {
              // Shell is stationary - kick in random direction
              const randomDirection = Math.random() < 0.5 ? -1 : 1;
              koopa.vx = randomDirection * 7;
              koopa.state = 'shell';
              koopa.kickedTimer = 0;
              koopa.shellTimer = 0;
              this.player.vy = -8;
            } else {
              // Shell is moving - stop it
              koopa.vx = 0;
              koopa.state = 'shell';
              koopa.shellTimer = 0;
              koopa.kickedTimer = 0;
              this.player.vy = -8;
            }
          } else {
            // Kick the shell
            const kickDirection = this.player.x < koopa.x ? 1 : -1;
            koopa.vx = kickDirection * 7;
            koopa.state = 'shell';
            koopa.kickedTimer = 0;
            koopa.shellTimer = 0;
          }
        }
      }

      // Update timers and state
      if (koopa.state === 'walk') {
        koopa.walkTimer++;
        if (koopa.walkTimer >= 12) {
          koopa.walkTimer = 0;
          koopa.walkFrame = koopa.walkFrame === 0 ? 1 : 0;
        }
      } else if (koopa.state === 'shell') {
        if (Math.abs(koopa.vx) < 0.1) {
          koopa.shellTimer++;
          if (koopa.shellTimer >= 600) { // Changed to 10 seconds (60 fps * 10)
            koopa.state = 'ready';
            koopa.shellTimer = 0;
          }
        } else {
          koopa.shellTimer = 0; // Reset timer when shell is moving
        }
      } else if (koopa.state === 'ready') {
        koopa.readyTimer++;
        if (koopa.readyTimer >= 120) { // 2 seconds
          koopa.state = 'walk';
          koopa.vx = -1.4;
          koopa.readyTimer = 0;
        }
      }

      koopa.x = newX;
      koopa.y = newY;
      return true;
    });

    // Update spineys
    this.spineys = this.spineys.filter(spiney => {
      spiney.vy += 0.465; // Same gravity as player
      
      let newX = spiney.x + spiney.vx;
      let newY = spiney.y + spiney.vy;
      
      let collisionY = false;
      
      // Check collisions with blocks
      this.blocks.forEach(block => {
        if (['floor', 'brick', 'mystery', 'hardblock', 'cloudblock'].includes(block.type)) {
          const blockRect = {
            x: block.x * 32,
            y: block.y * 32,
            width: 32,
            height: 32
          };

          // Cloud block collision only when falling
          if (block.type === 'cloudblock') {
            if (spiney.vy > 0 && // Only if falling
                spiney.y + spiney.height <= blockRect.y && // Was above the block
                this.checkCollision(
                  { x: spiney.x, y: newY, width: spiney.width, height: spiney.height },
                  blockRect
                )) {
              collisionY = true;
              newY = blockRect.y - spiney.height;
              spiney.vy = 0;
            }
          } else {
            // Normal collision for other blocks
            if (this.checkCollision(
              { x: spiney.x, y: newY, width: spiney.width, height: spiney.height },
              blockRect
            )) {
              collisionY = true;
              if (spiney.vy > 0) {
                newY = blockRect.y - spiney.height;
                spiney.vy = 0;
              } else if (spiney.vy < 0) {
                newY = blockRect.y + blockRect.height;
                spiney.vy = 0;
              }
            }

            if (this.checkCollision(
              { x: newX, y: spiney.y, width: spiney.width, height: spiney.height },
              blockRect
            )) {
              spiney.vx *= -1; // Reverse direction on collision
              spiney.facing *= -1; // Flip facing direction
              newX = spiney.x;
            }
          }
        }
      });

      // Add pipe collision detection for spineys
      this.scenery.forEach(item => {
        if (item.type === 'pipe') {
          const pipeRect = {
            x: item.x * 32,
            y: item.y * 32,
            width: 32 * item.width,
            height: 32 * item.height
          };

          if (this.checkCollision(
            { x: spiney.x, y: newY, width: spiney.width, height: spiney.height },
            pipeRect
          )) {
            collisionY = true;
            if (spiney.vy > 0) {
              newY = pipeRect.y - spiney.height;
              spiney.vy = 0;
            } else if (spiney.vy < 0) {
              newY = pipeRect.y + pipeRect.height;
              spiney.vy = 0;
            }
          }

          if (this.checkCollision(
            { x: newX, y: spiney.y, width: spiney.width, height: spiney.height },
            pipeRect
          )) {
            spiney.vx *= -1;
            spiney.facing *= -1;
            newX = spiney.x;
          }
        }
      });

      // Player collision detection
      const playerRect = {
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height
      };

      const spineyRect = {
        x: newX,
        y: newY,
        width: spiney.width,
        height: spiney.height
      };

      if (this.checkCollision(playerRect, spineyRect)) {
        // Spiney always hurts the player, can't be jumped on
        if (this.player.isBig) {
          // Big Mario gets hit
          this.player.isBig = false;
          this.player.height = 28;
          this.player.isInvincible = true;
          this.player.invincibilityTimer = 120;
        } else {
          // Small Mario dies
          this.playerDied();
        }
      }

      spiney.x = newX;
      spiney.y = newY;
      return true;
    });
    
    // Update mushrooms
    this.mushrooms = this.mushrooms.filter(mushroom => {
      mushroom.x += mushroom.vx;
      mushroom.vy += 0.465;
      let newY = mushroom.y + mushroom.vy;

      // Check block collisions
      this.blocks.forEach(block => {
        if (['floor', 'brick', 'mystery', 'hardblock', 'cloudblock'].includes(block.type)) {
          const blockRect = {
            x: block.x * 32,
            y: block.y * 32,
            width: 32,
            height: 32
          };

          if (this.checkCollision(
            { x: mushroom.x, y: newY, width: 32, height: 32 },
            blockRect
          )) {
            if (mushroom.vy > 0) {
              newY = blockRect.y - 32;
              mushroom.vy = 0;
            } else if (mushroom.vy < 0) {
              newY = blockRect.y + 32;
              mushroom.vy = 0;
            }
          }

          // Change direction when hitting wall
          if (this.checkCollision(
            { x: mushroom.x + mushroom.vx, y: mushroom.y, width: 32, height: 32 },
            blockRect
          )) {
            mushroom.vx *= -1;
          }
        }
      });

      mushroom.y = newY;

      // Check player collision
      if (this.checkCollision(
        { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
        { x: mushroom.x, y: mushroom.y, width: 32, height: 32 }
      )) {
        if (!this.player.isBig) {
          this.player.isBig = true;
          this.player.powerUpTimer = 60; // 1 second of animation
          this.player.height = 50; // Double height when big
          // Adjust y position to prevent clipping into ground
          this.player.y -= 22;
        }
        return false;
      }

      return true;
    });

    // Update power-up animation timer
    if (this.player.powerUpTimer > 0) {
      this.player.powerUpTimer--;
    }

    // Update invincibility timer
    if (this.player.invincibilityTimer > 0) {
      this.player.invincibilityTimer--;
      if (this.player.invincibilityTimer === 0) {
        this.player.isInvincible = false;
      }
    }

    if (this.player.vy < 0) {
      this.blocks.forEach(block => {
        if (block.type === 'mystery') {
          const blockKey = `${block.x},${block.y}`;
          if (!this.emptyBlocks.has(blockKey)) {
            if (this.checkCollision(
              { x: this.player.x, y: this.player.y + this.player.vy, width: this.player.width, height: this.player.height },
              { x: block.x * 32, y: block.y * 32, width: 32, height: 32 }
            )) {
              if (!this.animatingBlocks.has(blockKey)) {
                this.animatingBlocks.set(blockKey, {
                  progress: 0,
                  x: block.x,
                  y: block.y
                });

                if (this.mysteryContents.get(blockKey) === 'mushroom') {
                  // Spawn mushroom
                  this.mushrooms.push({
                    x: block.x * 32,
                    y: (block.y - 1) * 32,
                    vx: 2,
                    vy: 0
                  });
                } else {
                  // Spawn coin
                  this.coinAnimations.push({
                    x: block.x * 32,
                    y: block.y * 32,
                    progress: 0
                  });
                  this.coinsCollected++;
                }

                if (!this.mysteryCounts.has(blockKey)) {
                  this.mysteryCounts.set(blockKey, 1);
                } else {
                  this.mysteryCounts.set(blockKey, this.mysteryCounts.get(blockKey) + 1);
                }

                if (this.mysteryCounts.get(blockKey) === 5) {
                  this.emptyBlocks.add(blockKey);
                }
              }
            }
          }
        }
      });
    }

    if (!this.player.isInvincible) {
      // Goomba collision
      for (const goomba of this.goombas) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: goomba.x, y: goomba.y, width: goomba.width, height: goomba.height }
        )) {
          if (this.player.vy > 0 && this.player.y + this.player.height < goomba.y + goomba.height * 0.7) {
            // Stomping goomba - normal behavior
            this.player.vy = -8;
            this.goombas = this.goombas.filter(g => g !== goomba);
          } else if (this.player.isBig) {
            // Big Mario gets hit
            this.player.isBig = false;
            this.player.height = 28;
            this.player.isInvincible = true;
            this.player.invincibilityTimer = 120; // 2 seconds of invincibility
          } else {
            // Small Mario dies
            this.playerDied();
          }
        }
      }

      // Koopa collision - similar logic for koopas
      for (const koopa of this.koopas) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: koopa.x, y: koopa.y, width: koopa.width, height: koopa.height }
        )) {
          if (koopa.state === 'walk') {
            if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height * 0.7) {
              // Normal stomping behavior
              koopa.state = 'shell';
              koopa.vx = 0;
              koopa.shellTimer = 0;
              this.player.vy = -8;
            } else if (this.player.isBig) {
              // Big Mario gets hit
              this.player.isBig = false;
              this.player.height = 28;
              this.player.isInvincible = true;
              this.player.invincibilityTimer = 120;
            } else {
              // Small Mario dies
              this.playerDied();
            }
          } else if (koopa.state === 'shell' || koopa.state === 'ready') {
            // If shell is moving fast enough AND player isn't above it, kill player
            if (Math.abs(koopa.vx) > 3 && 
                !(this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2)) {
              this.playerDied();
            } else if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2) {
              // Player jumped on shell
              if (koopa.state === 'ready') {
                // Reset ready timer if in ready state
                koopa.readyTimer = 0;
                koopa.state = 'ready';
                this.player.vy = -8;
              } else if (Math.abs(koopa.vx) < 0.1) {
                // Shell is stationary - kick in random direction
                const randomDirection = Math.random() < 0.5 ? -1 : 1;
                koopa.vx = randomDirection * 7;
                koopa.state = 'shell';
                koopa.kickedTimer = 0;
                koopa.shellTimer = 0;
                this.player.vy = -8;
              } else {
                // Shell is moving - stop it
                koopa.vx = 0;
                koopa.state = 'shell';
                koopa.shellTimer = 0;
                koopa.kickedTimer = 0;
                this.player.vy = -8;
              }
            } else {
              // Kick the shell
              const kickDirection = this.player.x < koopa.x ? 1 : -1;
              koopa.vx = kickDirection * 7;
              koopa.state = 'shell';
              koopa.kickedTimer = 0;
              koopa.shellTimer = 0;
            }
          }
        }
      }

      // Spiney collision - always hurts the player
      for (const spiney of this.spineys) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: spiney.x, y: spiney.y, width: spiney.width, height: spiney.height }
        )) {
          if (this.player.isBig) {
            // Big Mario gets hit
            this.player.isBig = false;
            this.player.height = 28;
            this.player.isInvincible = true;
            this.player.invincibilityTimer = 120;
          } else {
            // Small Mario dies
            this.playerDied();
          }
        }
      }
    }

    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.465; // Same gravity as other objects
      particle.life--;
      return particle.life > 0;
    });

    // Modify block collision check for breaking bricks
    if (this.player.vy < 0) {
      this.blocks.forEach((block, index) => {
        if (block.type === 'brick' && this.player.isBig) {
          if (this.checkCollision(
            { x: this.player.x, y: this.player.y + this.player.vy, width: this.player.width, height: this.player.height },
            { x: block.x * 32, y: block.y * 32, width: 32, height: 32 }
          )) {
            // Create particles
            for (let i = 0; i < 4; i++) {
              const angle = (Math.PI * 2 * i) / 4;
              this.particles.push({
                x: block.x * 32 + 16,
                y: block.y * 32 + 16,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5 - 2,
                size: 6,
                life: 30,
                color: '#8B4513' // Brown color for brick particles
              });
            }
            
            // Remove the brick
            this.blocks = this.blocks.filter((_, i) => i !== index);
          }
        }
      });
    }

    if (!this.player.isInvincible) {
      // Goomba collision
      for (const goomba of this.goombas) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: goomba.x, y: goomba.y, width: goomba.width, height: goomba.height }
        )) {
          if (this.player.vy > 0 && this.player.y + this.player.height < goomba.y + goomba.height * 0.7) {
            // Stomping goomba - normal behavior
            this.player.vy = -8;
            this.goombas = this.goombas.filter(g => g !== goomba);
          } else if (this.player.isBig) {
            // Big Mario gets hit
            this.player.isBig = false;
            this.player.height = 28;
            this.player.isInvincible = true;
            this.player.invincibilityTimer = 120; // 2 seconds of invincibility
          } else {
            // Small Mario dies
            this.playerDied();
          }
        }
      }

      // Koopa collision - similar logic for koopas
      for (const koopa of this.koopas) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: koopa.x, y: koopa.y, width: koopa.width, height: koopa.height }
        )) {
          if (koopa.state === 'walk') {
            if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height * 0.7) {
              // Normal stomping behavior
              koopa.state = 'shell';
              koopa.vx = 0;
              koopa.shellTimer = 0;
              this.player.vy = -8;
            } else if (this.player.isBig) {
              // Big Mario gets hit
              this.player.isBig = false;
              this.player.height = 28;
              this.player.isInvincible = true;
              this.player.invincibilityTimer = 120;
            } else {
              // Small Mario dies
              this.playerDied();
            }
          } else if (koopa.state === 'shell' || koopa.state === 'ready') {
            // If shell is moving fast enough AND player isn't above it, kill player
            if (Math.abs(koopa.vx) > 3 && 
                !(this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2)) {
              this.playerDied();
            } else if (this.player.vy > 0 && this.player.y + this.player.height < koopa.y + koopa.height / 2) {
              // Player jumped on shell
              if (koopa.state === 'ready') {
                // Reset ready timer if in ready state
                koopa.readyTimer = 0;
                koopa.state = 'ready';
                this.player.vy = -8;
              } else if (Math.abs(koopa.vx) < 0.1) {
                // Shell is stationary - kick in random direction
                const randomDirection = Math.random() < 0.5 ? -1 : 1;
                koopa.vx = randomDirection * 7;
                koopa.state = 'shell';
                koopa.kickedTimer = 0;
                koopa.shellTimer = 0;
                this.player.vy = -8;
              } else {
                // Shell is moving - stop it
                koopa.vx = 0;
                koopa.state = 'shell';
                koopa.shellTimer = 0;
                koopa.kickedTimer = 0;
                this.player.vy = -8;
              }
            } else {
              // Kick the shell
              const kickDirection = this.player.x < koopa.x ? 1 : -1;
              koopa.vx = kickDirection * 7;
              koopa.state = 'shell';
              koopa.kickedTimer = 0;
              koopa.shellTimer = 0;
            }
          }
        }
      }

      // Spiney collision - always hurts the player
      for (const spiney of this.spineys) {
        if (this.checkCollision(
          { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height },
          { x: spiney.x, y: spiney.y, width: spiney.width, height: spiney.height }
        )) {
          if (this.player.isBig) {
            // Big Mario gets hit
            this.player.isBig = false;
            this.player.height = 28;
            this.player.isInvincible = true;
            this.player.invincibilityTimer = 120;
          } else {
            // Small Mario dies
            this.playerDied();
          }
        }
      }
    }

    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.465; // Same gravity as other objects
      particle.life--;
      return particle.life > 0;
    });

    // Modify block collision check for breaking bricks
    if (this.player.vy < 0) {
      this.blocks.forEach((block, index) => {
        if (block.type === 'brick' && this.player.isBig) {
          if (this.checkCollision(
            { x: this.player.x, y: this.player.y + this.player.vy, width: this.player.width, height: this.player.height },
            { x: block.x * 32, y: block.y * 32, width: 32, height: 32 }
          )) {
            // Create particles
            for (let i = 0; i < 4; i++) {
              const angle = (Math.PI * 2 * i) / 4;
              this.particles.push({
                x: block.x * 32 + 16,
                y: block.y * 32 + 16,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5 - 2,
                size: 6,
                life: 30,
                color: '#8B4513' // Brown color for brick particles
              });
            }
            
            // Remove the brick
            this.blocks = this.blocks.filter((_, i) => i !== index);
          }
        }
      });
    }

    if (this.keys.has('s') || this.keys.has('ArrowDown')) {
      // Check if player is standing on top of an enterable pipe
      this.scenery.forEach((item, index) => {
        if (item.type === 'pipe') {
          const pipeKey = `${item.x},${item.y}`;
          if (this.pipeTransportations.has(pipeKey)) {
            const pipeWidth = this.sceneryTypes[item.type].width * 32;
            
            // Check if player is centered on the pipe and standing on top of it
            const playerCenterX = this.player.x + this.player.width / 2;
            const pipeCenterX = item.x * 32 + pipeWidth / 2;
            
            if (Math.abs(playerCenterX - pipeCenterX) < 16 && 
                Math.abs(this.player.y + this.player.height - item.y * 32) < 5 &&
                this.player.canJump) {
              // Enter the pipe
              this.enteredPipe = true;
              this.pipeEnterTimer = 0;
              this.player.vx = 0;
              this.player.vy = 0;
              // Center the player on the pipe
              this.player.x = pipeCenterX - this.player.width / 2;
              
              // Get destination coordinates from the map
              const dest = this.pipeTransportations.get(pipeKey);
              this.transportDestination = dest;
            }
          }
        }
      });
    }
  }

  draw() {
    this.ctx.fillStyle = '#6185f8';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update animation timers
    this.coinAnimationTime += 0.05;
    this.mysteryAnimationTime += 0.05;

    // Calculate brightness values using sine waves for smooth animation
    const coinBrightness = 1 + Math.sin(this.coinAnimationTime) * 0.2;
    const mysteryBrightness = 1 + Math.sin(this.mysteryAnimationTime) * 0.15;

    // Update camera position with vertical deadzone and smooth movement
    const targetY = this.player.y - this.canvas.height / (2 * this.camera.scale) - 96;
    const currentY = this.camera.y;
    const deltaY = targetY - currentY;

    // Only move camera vertically if player is outside deadzone
    if (Math.abs(deltaY) > this.camera.verticalDeadzone) {
      this.camera.y += deltaY * 0.072; 
    }

    // Add a small amount of smoothing even within deadzone to prevent jitter
    else if (Math.abs(deltaY) > 1) {
      this.camera.y += deltaY * 0.036; 
    }

    // Horizontal camera follows player directly with 20% faster speed
    const targetX = this.player.x - this.canvas.width / (2 * this.camera.scale);
    const deltaX = targetX - this.camera.x;
    this.camera.x += deltaX * 0.12; // New smoothing for horizontal movement (20% faster than standard)

    // Apply camera transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x * this.camera.scale, -this.camera.y * this.camera.scale);
    this.ctx.scale(this.camera.scale, this.camera.scale);

    // Draw scenery
    this.scenery.forEach(item => {
      if (item.type === 'flagpole') {
        // Make flagpole slightly wider
        this.ctx.drawImage(
          this.images[item.type],
          item.x * 32,
          item.y * 32,
          32 * item.width * 1.2, // Multiply width by 1.2 for slightly wider appearance
          32 * item.height
        );
      } else {
        this.ctx.drawImage(
          this.images[item.type],
          item.x * 32,
          item.y * 32,
          32 * item.width,
          32 * item.height
        );
      }
    });

    // Draw goal post if exists
    if (this.goalPost) {
      this.ctx.drawImage(
        this.images.endpoint,
        this.goalPost.x * 32,
        this.goalPost.y * 32,
        64,  // Change width from 32 to 64 (2 blocks wide)
        64   // Already 2 blocks tall
      );
    }

    // Optimize rendering by only drawing elements visible on screen
    this.scenery.forEach(item => {
      const itemRight = (item.x + item.width) * 32;
      const itemBottom = (item.y + item.height) * 32;
      
      // Check if item is visible on screen before drawing
      if (itemRight >= this.camera.x && item.x * 32 <= this.camera.x + this.canvas.width / this.camera.scale &&
          itemBottom >= this.camera.y && item.y * 32 <= this.camera.y + this.canvas.height / this.camera.scale) {
        if (item.type === 'flagpole') {
          // Make flagpole slightly wider
          this.ctx.drawImage(
            this.images[item.type],
            item.x * 32,
            item.y * 32,
            32 * item.width * 1.2, // Multiply width by 1.2 for slightly wider appearance
            32 * item.height
          );
        } else {
          this.ctx.drawImage(
            this.images[item.type],
            item.x * 32,
            item.y * 32,
            32 * item.width,
            32 * item.height
          );
        }
      }
    });

    // Only draw blocks that are visible on screen
    this.blocks.forEach(block => {
      const blockX = block.x * 32;
      const blockY = block.y * 32;
      
      // Check if block is visible on screen
      if (blockX + 32 >= this.camera.x && blockX <= this.camera.x + this.canvas.width / this.camera.scale &&
          blockY + 32 >= this.camera.y && blockY <= this.camera.y + this.canvas.height / this.camera.scale) {
        
        if (block.type === 'mystery' && this.emptyBlocks.has(`${block.x},${block.y}`)) {
          this.ctx.drawImage(
            this.images.empty,
            block.x * 32,
            block.y * 32,
            32,
            32
          );
        } else if (this.images[block.type]) {
          if (block.type === 'mystery') {
            this.ctx.filter = `brightness(${mysteryBrightness})`;
          } else {
            this.ctx.filter = 'none';
          }
          
          const animation = this.animatingBlocks.get(`${block.x},${block.y}`);
          if (animation && (block.type === 'brick' || block.type === 'mystery')) {
            this.ctx.save();
            const centerX = block.x * 32 + 16;
            const centerY = block.y * 32 + 16;
            const progress = animation.progress;
            const verticalOffset = Math.sin(progress * Math.PI) * 8;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(scale, 1);
            this.ctx.translate(-centerX, -centerY);
            this.ctx.drawImage(
              this.images[block.type],
              block.x * 32,
              block.y * 32 - verticalOffset,
              32,
              32
            );
            this.ctx.restore();
          } else {
            this.ctx.drawImage(
              this.images[block.type],
              block.x * 32,
              block.y * 32,
              32,
              32
            );
          }
        }
      }
    });

    this.ctx.filter = 'none';

    let playerImage;
    const prefix = this.player.isBig ? 'BM' : '';

    if (this.player.powerUpTimer > 0) {
      // During power-up animation, alternate between big and small
      const useSmall = Math.floor(this.player.powerUpTimer / 4) % 2 === 0;
      playerImage = useSmall ? this.images.stand : this.images.BMstand;
    } else {
      if (this.player.state === 'jump') {
        playerImage = this.images[prefix + 'jump'];
      } else if (this.player.state === 'skid') {
        playerImage = this.images[prefix + 'skid'];
      } else if (this.player.state === 'walk') {
        const walkImages = [
          this.images[prefix + 'walk1'],
          this.images[prefix + 'walk2'],
          this.images[prefix + 'walk3']
        ];
        playerImage = walkImages[this.player.walkFrame];
      } else {
        playerImage = this.images[prefix + 'stand'];
      }
    }

    // Make player flash when invincible
    if (this.player.isInvincible && Math.floor(this.player.invincibilityTimer / 4) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.save();
    let spriteWidth = this.player.isBig ? 36 : 28;
    let xOffset = 0;
    
    if (this.player.state === 'stand') {
      spriteWidth = this.player.isBig ? 36 : 28;
    } else if (this.player.state === 'walk') {
      // Make walk animation sprites 15% wider
      spriteWidth = this.player.isBig ? 44 : 34; 
      xOffset = this.player.facing * 2;
    }
    
    if (this.player.facing === -1) {
      this.ctx.translate(this.player.x + spriteWidth, this.player.y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(playerImage, 0, 0, spriteWidth, this.player.height);
    } else {
      this.ctx.drawImage(playerImage, this.player.x + xOffset, this.player.y, spriteWidth, this.player.height);
    }
    this.ctx.restore();
    this.ctx.globalAlpha = 1.0;

    this.goombas.forEach(goomba => {
      this.ctx.save();
      if (goomba.facing === 1) {
        this.ctx.translate(goomba.x + goomba.width, goomba.y);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.images.goomba, 0, 0, goomba.width, goomba.height);
      } else {
        this.ctx.drawImage(this.images.goomba, goomba.x, goomba.y, goomba.width, goomba.height);
      }
      this.ctx.restore();
    });

    this.mushrooms.forEach(mushroom => {
      this.ctx.drawImage(this.images.mushroom, mushroom.x, mushroom.y, 32, 32);
    });

    // Modified coin drawing with brightness animation
    this.coins.forEach(coin => {
      this.ctx.filter = `brightness(${coinBrightness})`;
      this.ctx.drawImage(
        this.images.coin,
        coin.x * 32,
        coin.y * 32,
        32,
        32
      );
    });
    
    this.ctx.filter = 'none';

    // Ensure coin animations also use the brightness effect
    this.coinAnimations.forEach(anim => {
      const yOffset = -32 * Math.sin(anim.progress * Math.PI);
      const opacity = 1 - anim.progress;
      this.ctx.globalAlpha = opacity;
      this.ctx.filter = `brightness(${coinBrightness})`;
      this.ctx.drawImage(
        this.images.coin,
        anim.x,
        anim.y + yOffset,
        32,
        32
      );
    });
    
    this.ctx.filter = 'none';
    this.ctx.globalAlpha = 1;

    // Draw spineys
    this.spineys.forEach(spiney => {
      this.ctx.save();
      let spineyImage = spiney.frame === 0 ? this.images.spiney1 : this.images.spiney2;
      
      if (spiney.facing === 1) {
        this.ctx.translate(spiney.x + spiney.width, spiney.y);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(spineyImage, 0, 0, spiney.width, spiney.height);
      } else {
        this.ctx.drawImage(spineyImage, spiney.x, spiney.y, spiney.width, spiney.height);
      }
      this.ctx.restore();
    });
    
    // Reset transform for UI elements
    this.ctx.restore();

    // Draw UI elements without camera transform
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px Arial';
    this.ctx.drawImage(this.images.coin, 10, 10, 20, 20);
    this.ctx.fillText(`× ${this.coinsCollected}`, 35, 28);

    // Draw fade overlay
    if (this.isCompleted) {
      this.ctx.fillStyle = `rgba(255, 255, 0, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw fade overlay for pipe transitions
    if (this.enteredPipe && this.pipeEnterTimer >= 45) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  pause() {
    if (!this.pauseMenu) return;
    
    if (window.currentCourse) {
      const pauseContent = this.pauseMenu.querySelector('.pause-content');
      pauseContent.innerHTML = `
        <h2>PAUSED</h2>
        <div class="pause-buttons">
          <div class="like-buttons">
            <button id="likeBtn" class="like-btn ${window.currentCourse.userLiked ? 'selected' : ''}">❤️</button>
            <button id="dislikeBtn" class="like-btn ${window.currentCourse.userDisliked ? 'selected' : ''}">💔</button>
          </div>
          <button id="resumeBtn" class="menu-button">Resume</button>
          <button id="pauseBackBtn" class="menu-button">Back to Course World</button>
        </div>
      `;
    } else {
      const pauseContent = this.pauseMenu.querySelector('.pause-content');
      pauseContent.innerHTML = `
        <h2>PAUSED</h2>
        <div class="pause-buttons">
          <button id="resumeBtn" class="menu-button">Resume</button>
          <button id="pauseBackBtn" class="menu-button">Back to Menu</button>
        </div>
      `;
    }
    
    this.isPaused = true;
    this.pauseMenu.classList.remove('hidden');
    this.setupPauseMenu();
  }

  unpause() {
    this.isPaused = false;
    this.pauseMenu.classList.add('hidden');
  }

  animate() {
    if (!this.isPaused) {
      this.update();
    }
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  resetLevel() {
    // Reset player position to spawn point
    const spawnBlock = this.blocks.find(block => block.type === 'spawn');
    if (spawnBlock) {
      this.player.x = spawnBlock.x * 32;
      this.player.y = spawnBlock.y * 32;
    } else {
      this.player.x = 100;
      this.player.y = 100;
    }
    this.player.vx = 0;
    this.player.vy = 0;
    
    // Reset player state
    this.player.isBig = false;
    this.player.height = 28;
    this.player.powerUpTimer = 0;
    this.player.isInvincible = false;
    this.player.invincibilityTimer = 0;
    this.isDead = false; // Reset dead flag when resetting level

    // Reset completion state
    this.isCompleted = false;
    this.fadeAlpha = 0;
    this.showingCompletionScreen = false;
    this.completionScreen.classList.add('hidden');
    this.showingGameOverScreen = false;
    this.gameOverScreen.classList.add('hidden');
    
    // Do NOT reset enemies and objects - removed code that reset goombas, koopas, spineys

    // Reset camera position
    this.camera.x = 0;
    this.camera.y = 0;
  }

  playerDied() {
    // Show game over screen when player dies
    this.gameOverScreen.classList.remove('hidden');
    this.showingGameOverScreen = true;
    this.isDead = true; // Set dead flag when player dies
  }

  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    // Remove listeners when destroying game
    const buttons = ['completionBackBtn', 'completionReplayBtn', 'uploadLevelBtn', 'completionLikeBtn', 'completionDislikeBtn', 'retryBtn', 'gameOverBackBtn'];
    buttons.forEach(id => {
      const button = document.getElementById(id);
      if (button) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      }
    });
    
    // Clean up any screens that might be showing
    if (this.completionScreen) {
      this.completionScreen.remove();
    }
    if (this.gameOverScreen) {
      this.gameOverScreen.remove();
    }
  }

  showCompletion() {
    this.isCompleted = true;
    this.fadeAlpha = 0;
    this.showingCompletionScreen = true; 
    this.completionScreen.classList.remove('hidden');
    
    // Properly set up completion screen when showing
    this.setupCompletionScreen();
  }
}