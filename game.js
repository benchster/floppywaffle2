// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 320;
canvas.height = 480;

// Game state
const gameState = {
    isRunning: false,
    gravity: 0.25,  // Reduced from 0.5 to make the game easier
    score: 0,
    speed: 2,  // Speed at which pipes move
    pipeSpawnInterval: 1500  // Spawn new pipes every 1.5 seconds
};

// Add after canvas setup
const sprites = {
    bird: new Image(),
    pipe: new Image(),
    background: new Image(),
    loaded: false
};

// Modify bird object
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    velocity: 0,
    rotation: 0,
    
    draw() {
        if (sprites.loaded && sprites.bird.complete) {
            // Draw sprite version
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            this.rotation = Math.max(-25, Math.min(25, this.velocity * 3));
            ctx.rotate(this.rotation * Math.PI/180);
            ctx.drawImage(sprites.bird, -this.width/2, -this.height/2, this.width, this.height);
            ctx.restore();
        } else {
            // Draw rectangle version (fallback)
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    
    update() {
        // Apply gravity
        this.velocity += gameState.gravity;
        this.y += this.velocity;

        // Add boundary checks
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            gameState.isRunning = false;  // Game over when hitting ground
        }
    }
};

// Add background object
const background = {
    x: 0,
    width: 320,
    speed: 0.5,
    
    update() {
        this.x = (this.x - this.speed) % this.width;
    },
    
    draw() {
        // Draw two backgrounds side by side for seamless scrolling
        ctx.drawImage(sprites.background, this.x, 0, this.width, canvas.height);
        ctx.drawImage(sprites.background, this.x + this.width, 0, this.width, canvas.height);
    }
};

// Pipe class
const pipes = [];
class Pipe {
    constructor() {
        this.width = 50;
        this.gap = 180;  // Increased from 150 to make gaps wider
        this.x = canvas.width;  // Start at the right edge
        
        // Random height for gap position, but ensure it's always reachable
        const minHeight = 100;  // Increased from 50 to prevent pipes from being too high
        const maxHeight = canvas.height - this.gap - 100;  // Ensure bottom pipe isn't too low
        this.topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        this.bottomY = this.topHeight + this.gap;
    }

    draw() {
        if (sprites.loaded && sprites.pipe.complete) {
            // Draw sprite version
            ctx.save();
            ctx.scale(1, -1);
            ctx.drawImage(sprites.pipe, this.x, -this.topHeight, this.width, this.topHeight);
            ctx.restore();
            ctx.drawImage(sprites.pipe, this.x, this.bottomY, this.width, canvas.height - this.bottomY);
        } else {
            // Draw rectangle version (fallback)
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x, 0, this.width, this.topHeight);
            ctx.fillRect(this.x, this.bottomY, this.width, canvas.height - this.bottomY);
        }
    }

    update() {
        this.x -= gameState.speed;
    }

    // Check if pipe is off screen
    isOffScreen() {
        return this.x + this.width < 0;
    }

    // Collision detection
    checkCollision(bird) {
        // Check collision with top pipe
        if (bird.x + bird.width > this.x && 
            bird.x < this.x + this.width && 
            bird.y < this.topHeight) {
            return true;
        }
        
        // Check collision with bottom pipe
        if (bird.x + bird.width > this.x && 
            bird.x < this.x + this.width && 
            bird.y + bird.height > this.bottomY) {
            return true;
        }

        return false;
    }
}

// Game loop
function gameLoop() {
    if (!gameState.isRunning) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background (either image or color)
    if (sprites.loaded && sprites.background.complete) {
        background.update();
        background.draw();
    } else {
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update and draw bird
    bird.update();
    bird.draw();
    
    // Update and draw pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();
        pipes[i].draw();
        
        // Check collision
        if (pipes[i].checkCollision(bird)) {
            gameState.isRunning = false;
            return;
        }
        
        // Remove off-screen pipes
        if (pipes[i].isOffScreen()) {
            pipes.splice(i, 1);
            gameState.score++;  // Increment score when passing pipes
        }
    }

    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    
    requestAnimationFrame(gameLoop);
}

// Add pipe spawning
function spawnPipe() {
    if (gameState.isRunning) {
        pipes.push(new Pipe());
        setTimeout(spawnPipe, gameState.pipeSpawnInterval);
    }
}

// Start the game
function startGame() {
    // Reset game state
    gameState.isRunning = true;
    gameState.score = 0;
    pipes.length = 0;  // Clear existing pipes
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    
    // Start pipe spawning
    spawnPipe();
    
    // Start game loop
    gameLoop();
}

// Handle spacebar for bird jump
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        if (!gameState.isRunning) {
            startGame(); // Restart game if it's not running
        } else {
            bird.velocity = -6;  // Reduced from -8 to match new gravity
        }
    }
});

// Handle click/tap for bird jump
document.addEventListener('click', function() {
    if (!gameState.isRunning) {
        startGame(); // Restart game if it's not running
    } else {
        bird.velocity = -6;  // Reduced from -8 to match new gravity
    }
});

// Start the game when the page loads
window.onload = startGame;

// Create sprites using canvas
function createSprites() {
    // Create bird sprite (waffle)
    const birdCanvas = document.createElement('canvas');
    birdCanvas.width = 30;
    birdCanvas.height = 30;
    const birdCtx = birdCanvas.getContext('2d');
    
    // Draw circular waffle
    birdCtx.beginPath();
    birdCtx.arc(15, 15, 15, 0, Math.PI * 2);
    birdCtx.fillStyle = '#DEB887';  // Light tan color
    birdCtx.fill();
    
    // Draw grid lines in a circular pattern
    birdCtx.strokeStyle = '#CD853F';  // Darker tan for grid
    birdCtx.lineWidth = 2;
    
    // Draw vertical lines
    birdCtx.beginPath();
    birdCtx.moveTo(10, 0);
    birdCtx.lineTo(10, 30);
    birdCtx.moveTo(20, 0);
    birdCtx.lineTo(20, 30);
    birdCtx.stroke();
    
    // Draw horizontal lines
    birdCtx.beginPath();
    birdCtx.moveTo(0, 10);
    birdCtx.lineTo(30, 10);
    birdCtx.moveTo(0, 20);
    birdCtx.lineTo(30, 20);
    birdCtx.stroke();
    
    // Draw circular border
    birdCtx.beginPath();
    birdCtx.arc(15, 15, 15, 0, Math.PI * 2);
    birdCtx.strokeStyle = '#CD853F';
    birdCtx.lineWidth = 2;
    birdCtx.stroke();
    
    // Draw eyes
    birdCtx.fillStyle = 'white';
    birdCtx.beginPath();
    birdCtx.arc(20, 12, 3, 0, Math.PI * 2);
    birdCtx.arc(25, 12, 3, 0, Math.PI * 2);
    birdCtx.fill();
    
    // Draw pupils
    birdCtx.fillStyle = 'black';
    birdCtx.beginPath();
    birdCtx.arc(21, 12, 1.5, 0, Math.PI * 2);
    birdCtx.arc(26, 12, 1.5, 0, Math.PI * 2);
    birdCtx.fill();
    
    // Draw smile
    birdCtx.beginPath();
    birdCtx.arc(22, 18, 5, 0, Math.PI);
    birdCtx.strokeStyle = '#654321';
    birdCtx.lineWidth = 2;
    birdCtx.stroke();
    
    // Create pipe sprite (fork)
    const pipeCanvas = document.createElement('canvas');
    pipeCanvas.width = 50;
    pipeCanvas.height = 400;
    const pipeCtx = pipeCanvas.getContext('2d');
    
    // Draw fork handle
    pipeCtx.fillStyle = '#C0C0C0';  // Silver color for fork
    pipeCtx.fillRect(0, 0, 50, 400);
    
    // Draw fork base (connects all prongs)
    pipeCtx.fillStyle = '#A9A9A9';  // Darker silver for base
    pipeCtx.fillRect(8, 0, 34, 20);  // Base that connects all prongs
    
    // Draw fork prongs (4 prongs with spaces between)
    pipeCtx.fillStyle = '#A9A9A9';  // Darker silver for prongs
    pipeCtx.fillRect(8, 20, 6, 380);   // Leftmost prong
    pipeCtx.fillRect(17, 20, 6, 380);  // Second prong
    pipeCtx.fillRect(26, 20, 6, 380);  // Third prong
    pipeCtx.fillRect(35, 20, 6, 380);  // Rightmost prong
    
    // Create background sprite
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 320;
    bgCanvas.height = 480;
    const bgCtx = bgCanvas.getContext('2d');
    
    // Draw sky
    bgCtx.fillStyle = '#87CEEB';  // Light blue sky
    bgCtx.fillRect(0, 0, 320, 480);
    
    // Draw some clouds
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    bgCtx.beginPath();
    bgCtx.arc(60, 80, 30, 0, Math.PI * 2);
    bgCtx.arc(90, 80, 40, 0, Math.PI * 2);
    bgCtx.arc(120, 80, 30, 0, Math.PI * 2);
    bgCtx.fill();
    
    bgCtx.beginPath();
    bgCtx.arc(220, 150, 30, 0, Math.PI * 2);
    bgCtx.arc(250, 150, 40, 0, Math.PI * 2);
    bgCtx.arc(280, 150, 30, 0, Math.PI * 2);
    bgCtx.fill();
    
    // Draw ground (maple syrup colored)
    bgCtx.fillStyle = '#8B4513';  // Brown color for syrup
    bgCtx.fillRect(0, 380, 320, 100);
    
    // Convert canvases to images
    sprites.bird.src = birdCanvas.toDataURL();
    sprites.pipe.src = pipeCanvas.toDataURL();
    sprites.background.src = bgCanvas.toDataURL();
    
    // Mark sprites as loaded once all images are ready
    let loadedCount = 0;
    const onLoad = () => {
        loadedCount++;
        if (loadedCount === 3) {
            sprites.loaded = true;
        }
    };
    
    sprites.bird.onload = onLoad;
    sprites.pipe.onload = onLoad;
    sprites.background.onload = onLoad;
}

// Call createSprites before starting the game
createSprites(); 