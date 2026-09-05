// Game Constants
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const GAME_SPEED = 1;

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game object
const game = {
    // Game state
    money: 1000,
    guards: 0,
    health: 100,
    maxHealth: 100,
    day: 1,
    score: 0,
    enemiesDefeated: 0,
    isPaused: false,
    gameRunning: true,
    
    // Game objects
    ronaldo: null,
    enemies: [],
    guardSprites: [],
    particles: [],
    
    // Game settings
    enemySpawnRate: 2,
    baseMoneyPerDay: 500,
    guardCost: 100,
    guardDamagePerSec: 5,
    
    // Initialize game
    init() {
        this.money = 1000;
        this.guards = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.day = 1;
        this.score = 0;
        this.enemiesDefeated = 0;
        this.isPaused = false;
        this.gameRunning = true;
        this.enemies = [];
        this.guardSprites = [];
        this.particles = [];
        
        // Create Ronaldo at center
        this.ronaldo = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            width: 40,
            height: 60,
            speed: 3
        };
        
        this.updateUI();
        this.gameLoop();
    },
    
    // Update UI stats
    updateUI() {
        document.getElementById('money').textContent = this.money;
        document.getElementById('guards').textContent = this.guards;
        document.getElementById('health').textContent = Math.max(0, Math.floor(this.health));
        document.getElementById('day').textContent = this.day;
        document.getElementById('score').textContent = this.score;
        document.getElementById('enemiesDefeated').textContent = this.enemiesDefeated;
        
        // Update hire button
        const hireBtn = document.getElementById('hireBtn');
        hireBtn.disabled = this.money < this.guardCost || this.isPaused;
    },
    
    // Hire a security guard
    hireGuard() {
        if (this.money >= this.guardCost && !this.isPaused) {
            this.money -= this.guardCost;
            this.guards++;
            
            // Create guard sprite at random position around Ronaldo
            const angle = Math.random() * Math.PI * 2;
            const distance = 80;
            const guard = {
                x: this.ronaldo.x + Math.cos(angle) * distance,
                y: this.ronaldo.y + Math.sin(angle) * distance,
                width: 30,
                height: 40,
                angle: angle
            };
            this.guardSprites.push(guard);
            this.score += 10;
            this.updateUI();
        }
    },
    
    // Toggle pause
    togglePause() {
        if (!this.gameRunning) return;
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'Resume Game' : 'Pause Game';
    },
    
    // Reset game
    reset() {
        this.init();
    },
    
    // Game over
    gameOver() {
        this.gameRunning = false;
        
        // Show game over modal
        document.getElementById('finalDay').textContent = this.day;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalEnemies').textContent = this.enemiesDefeated;
        document.getElementById('finalGuards').textContent = this.guards;
        document.getElementById('gameOverModal').classList.add('active');
        
        // Auto restart after 5 seconds
        setTimeout(() => {
            document.getElementById('gameOverModal').classList.remove('active');
            this.init();
        }, 5000);
    },
    
    // Main game loop
    gameLoop() {
        if (!this.gameRunning) return;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (!this.isPaused) {
            // Update game logic
            this.updateEnemies();
            this.updateGuards();
            this.updateParticles();
            this.spawnEnemies();
            this.handleCollisions();
            this.updateHealth();
            this.newDayCheck();
            this.score += 0.5; // Passive score gain
        }
        
        // Draw everything
        this.drawRonaldo();
        this.drawGuards();
        this.drawEnemies();
        this.drawParticles();
        this.drawUI();
        
        requestAnimationFrame(() => this.gameLoop());
    },
    
    // Spawn enemies
    spawnEnemies() {
        // Spawn more enemies as days progress
        const spawnChance = 0.02 + (this.day * 0.005);
        
        if (Math.random() < spawnChance) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            if (side === 0) { // top
                x = Math.random() * CANVAS_WIDTH;
                y = -30;
            } else if (side === 1) { // right
                x = CANVAS_WIDTH + 30;
                y = Math.random() * CANVAS_HEIGHT;
            } else if (side === 2) { // bottom
                x = Math.random() * CANVAS_WIDTH;
                y = CANVAS_HEIGHT + 30;
            } else { // left
                x = -30;
                y = Math.random() * CANVAS_HEIGHT;
            }
            
            const enemy = {
                x: x,
                y: y,
                width: 35,
                height: 35,
                speed: 1.5 + (this.day * 0.1),
                health: 20 + (this.day * 2),
                maxHealth: 20 + (this.day * 2),
                damage: 0.5 + (this.day * 0.1)
            };
            
            this.enemies.push(enemy);
        }
    },
    
    // Update enemies
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards Ronaldo
            const dx = this.ronaldo.x - enemy.x;
            const dy = this.ronaldo.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Remove if off screen
            if (enemy.x < -50 || enemy.x > CANVAS_WIDTH + 50 || 
                enemy.y < -50 || enemy.y > CANVAS_HEIGHT + 50) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            // Remove if health <= 0
            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
                this.enemiesDefeated++;
                this.score += 50;
                
                // Create particles
                for (let j = 0; j < 10; j++) {
                    this.particles.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        life: 1,
                        color: 'rgb(255, 100, 100)'
                    });
                }
            }
        }
    },
    
    // Update guards
    updateGuards() {
        for (let i = this.guardSprites.length - 1; i >= 0; i--) {
            const guard = this.guardSprites[i];
            
            // Move around Ronaldo in circle
            guard.angle += 0.01;
            guard.x = this.ronaldo.x + Math.cos(guard.angle) * 80;
            guard.y = this.ronaldo.y + Math.sin(guard.angle) * 80;
            
            // Guards shoot at enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = enemy.x - guard.x;
                const dy = enemy.y - guard.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    enemy.health -= this.guardDamagePerSec / 60; // per frame
                    
                    // Draw laser
                    if (Math.random() < 0.3) {
                        ctx.strokeStyle = 'rgba(0, 255, 100, 0.6)';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(guard.x, guard.y);
                        ctx.lineTo(enemy.x, enemy.y);
                        ctx.stroke();
                    }
                }
            }
        }
    },
    
    // Handle collisions
    handleCollisions() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Enemy vs Ronaldo
            if (this.checkCollision(enemy, this.ronaldo)) {
                this.health -= enemy.damage;
                this.enemies.splice(i, 1);
                
                // Particles
                for (let j = 0; j < 5; j++) {
                    this.particles.push({
                        x: this.ronaldo.x,
                        y: this.ronaldo.y,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3,
                        life: 0.5,
                        color: 'rgb(255, 0, 0)'
                    });
                }
            }
        }
        
        if (this.health <= 0) {
            this.gameOver();
        }
    },
    
    // Update particles
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
            particle.vy += 0.1; // gravity
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },
    
    // Update health
    updateHealth() {
        // Passive health regeneration (very slow)
        if (this.health < this.maxHealth) {
            this.health += 0.01;
        }
    },
    
    // New day check
    newDayCheck() {
        if (this.enemies.length === 0 && this.day > 0) {
            // Check if enough time has passed
            if (!this.dayTimer) {
                this.dayTimer = 0;
            }
            this.dayTimer++;
            
            if (this.dayTimer > 300) { // ~5 seconds at 60 FPS
                this.day++;
                this.money += this.baseMoneyPerDay;
                this.score += 100;
                this.dayTimer = 0;
                this.updateUI();
            }
        } else {
            this.dayTimer = 0;
        }
    },
    
    // Collision detection
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },
    
    // Draw Ronaldo
    drawRonaldo() {
        // Body
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.ronaldo.x - this.ronaldo.width / 2, 
                     this.ronaldo.y - this.ronaldo.height / 2, 
                     this.ronaldo.width, this.ronaldo.height);
        
        // Head
        ctx.fillStyle = '#f4a460';
        ctx.beginPath();
        ctx.arc(this.ronaldo.x, this.ronaldo.y - 25, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.ronaldo.x - 6, this.ronaldo.y - 28, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.ronaldo.x + 6, this.ronaldo.y - 28, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Jersey number
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('7', this.ronaldo.x, this.ronaldo.y + 5);
        
        // Health bar
        const barWidth = 50;
        const barHeight = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.ronaldo.x - barWidth / 2, this.ronaldo.y - 40, barWidth, barHeight);
        ctx.fillStyle = `hsl(${(this.health / this.maxHealth) * 120}, 100%, 50%)`;
        ctx.fillRect(this.ronaldo.x - barWidth / 2, this.ronaldo.y - 40, 
                     (barWidth * this.health) / this.maxHealth, barHeight);
    },
    
    // Draw guards
    drawGuards() {
        for (let guard of this.guardSprites) {
            // Body
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(guard.x - guard.width / 2, guard.y - guard.height / 2, 
                        guard.width, guard.height);
            
            // Head
            ctx.fillStyle = '#8b6914';
            ctx.beginPath();
            ctx.arc(guard.x, guard.y - 18, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Badge
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(guard.x - 8, guard.y - 2, 16, 12);
            
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(guard.x - 4, guard.y - 20, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(guard.x + 4, guard.y - 20, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Draw enemies
    drawEnemies() {
        for (let enemy of this.enemies) {
            // Enemy body
            ctx.fillStyle = `hsl(0, 100%, ${30 + (enemy.health / enemy.maxHealth) * 20}%)`;
            ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, 
                        enemy.width, enemy.height);
            
            // Enemy face
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(enemy.x - 8, enemy.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(enemy.x + 8, enemy.y - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Health bar
            ctx.fillStyle = '#333';
            ctx.fillRect(enemy.x - 15, enemy.y - 20, 30, 3);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(enemy.x - 15, enemy.y - 20, 30 * (enemy.health / enemy.maxHealth), 3);
        }
    },
    
    // Draw particles
    drawParticles() {
        for (let particle of this.particles) {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    },
    
    // Draw UI overlay
    drawUI() {
        // Day indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText(`Day: ${this.day}`, 20, 30);
        ctx.fillText(`Enemies: ${this.enemies.length}`, 20, 50);
        ctx.fillText(`Guards: ${this.guards}`, 20, 70);
        
        // Pause indicator
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⏸ PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            ctx.textAlign = 'left';
        }
    }
};

// Canvas click handler
canvas.addEventListener('click', (e) => {
    if (!game.gameRunning || game.isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click hits an enemy
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        if (x > enemy.x - enemy.width / 2 && x < enemy.x + enemy.width / 2 &&
            y > enemy.y - enemy.height / 2 && y < enemy.y + enemy.height / 2) {
            
            enemy.health -= 30; // Damage from click
            game.score += 5;
            
            // Create particles
            for (let j = 0; j < 8; j++) {
                game.particles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 0.8,
                    color: 'rgb(255, 200, 0)'
                });
            }
            break;
        }
    }
});

// Start game on load
window.addEventListener('load', () => {
    game.init();
});
