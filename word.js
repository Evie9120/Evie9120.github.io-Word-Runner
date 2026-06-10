// script.js
(function(){
    // ---------- DOM elements ----------
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const wordBox = document.getElementById("wordBox");
    const heartsSpan = document.getElementById("hearts");
    const scoreSpan = document.getElementById("score");
    const wordsCompletedSpan = document.getElementById("wordsCompleted");
    const highScoreSpan = document.getElementById("highScore");
    const finalScoreMsg = document.getElementById("finalScoreMsg");
    const gameOverDiv = document.getElementById("gameOver");
    const mainMenuDiv = document.getElementById("mainMenu");
    const pauseOverlay = document.getElementById("pauseOverlay");
    const pauseBtn = document.getElementById("pauseBtn");
    const startBtn = document.getElementById("startBtn");
    const restartBtn = document.getElementById("restartBtn");
    const resumeBtn = document.getElementById("resumeBtn");
    const pauseMainMenuBtn = document.getElementById("pauseMainMenuBtn");
    const gameOverMainMenuBtn = document.getElementById("gameOverMainMenuBtn");
    const speedDisplaySpan = document.getElementById("speedDisplay");
    
    // ---------- GAME STATE ----------
    let gameActive = false;
    let paused = false;
    let score = 0;
    let hearts = 3;
    let wordsCompleted = 0;
    
    let currentFallSpeed = 4.2;
    const INITIAL_SPEED = 4.2;
    const MAX_SPEED = 8.5;
    const SPEED_INCREMENT = 1.0;
    
    let currentWord = "";
    let currentIndex = 0;
    
    const fiveLetterWords = [
        "APPLE", "BRAIN", "CLOUD", "FLAME", "GHOST", "HONEY", "IGLOO", "JOKER",
        "KOALA", "LEMON", "MAGIC", "NINJA", "OLIVE", "PIXEL", "QUEST", "STORM",
        "TIGER", "UMBRA", "WHALE", "XENON", "YACHT", "ZEBRA", "VALUE", "WORLD",
        "LIGHT", "GRAPE", "MIGHT", "PEARL", "SNAKE", "EAGLE", "OCEAN", "PLANE"
    ];
    
    let lanes = [0, 0, 0];
    let playerLane = 1;
    let fallingLetters = [];
    let lastWrongSpawn = 0;
    const MIN_VERTICAL_SPACING = 150;
    
    let highScore = 0;
    function loadHighScore() {
        let saved = localStorage.getItem("wordRunnerHighScore");
        if (saved && !isNaN(parseInt(saved))) highScore = parseInt(saved);
        else highScore = 0;
        highScoreSpan.textContent = highScore;
    }
    function updateHighScore() {
        if (score > highScore) {
            highScore = score;
            highScoreSpan.textContent = highScore;
            localStorage.setItem("wordRunnerHighScore", highScore);
        }
    }
    
    function updateLanes() {
        const roadLeft = canvas.width * 0.18;
        const roadRight = canvas.width * 0.82;
        const step = (roadRight - roadLeft) / 2;
        lanes[0] = roadLeft;
        lanes[1] = roadLeft + step;
        lanes[2] = roadRight;
    }
    
    function wouldOverlap(laneIndex, newY, radius) {
        for (let l of fallingLetters) {
            if (l.laneIndex === laneIndex && Math.abs(l.y - newY) < MIN_VERTICAL_SPACING) return true;
        }
        return false;
    }
    
    function removeAllCorrectLetters() {
        fallingLetters = fallingLetters.filter(l => !l.isCorrect);
    }
    
    function spawnCorrectLetter() {
        if (!gameActive || paused) return;
        if (currentIndex >= currentWord.length) return;
        removeAllCorrectLetters();
        const targetChar = currentWord[currentIndex];
        const randomLane = Math.floor(Math.random() * 3);
        let startY = -45 - Math.random() * 55;
        let attempts = 0;
        while (wouldOverlap(randomLane, startY, 34) && attempts < 25) {
            startY = -55 - Math.random() * 80;
            attempts++;
        }
        if (wouldOverlap(randomLane, startY, 34)) {
            let highestY = -100;
            for (let l of fallingLetters) if (l.laneIndex === randomLane && l.y < highestY) highestY = l.y;
            startY = highestY - MIN_VERTICAL_SPACING - 10;
            if (startY > -30) startY = -80;
        }
        fallingLetters.push({
            x: lanes[randomLane], y: startY, char: targetChar, isCorrect: true,
            speed: currentFallSpeed, radius: 34, laneIndex: randomLane
        });
    }
    
    function generateNewWord() {
        let newWord;
        do { newWord = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)]; } 
        while (newWord === currentWord);
        currentWord = newWord;
        currentIndex = 0;
        updateWordDisplay();
        removeAllCorrectLetters();
        spawnCorrectLetter();
    }
    
    function onWordComplete() {
        wordsCompleted++;
        wordsCompletedSpan.textContent = wordsCompleted;
        if (wordsCompleted % 5 === 0 && currentFallSpeed < MAX_SPEED) {
            currentFallSpeed = Math.min(MAX_SPEED, currentFallSpeed + SPEED_INCREMENT);
            speedDisplaySpan.textContent = `⚡ SPEED: ${currentFallSpeed.toFixed(1)}`;
            for (let l of fallingLetters) l.speed = currentFallSpeed;
        }
        score += 50;
        updateScoreUI();
        updateHighScore();
        generateNewWord();
    }
    
    function updateWordDisplay() {
        let display = "";
        for (let i = 0; i < currentWord.length; i++) {
            if (i < currentIndex) display += currentWord[i] + " ";
            else if (i === currentIndex) display += "▢ ";
            else display += "_ ";
        }
        wordBox.textContent = display.trim();
    }
    
    function updateHeartsUI() { heartsSpan.textContent = hearts; }
    function updateScoreUI() { scoreSpan.textContent = score; }
    
    function loseHeart() {
        if (!gameActive || paused) return;
        hearts--;
        updateHeartsUI();
        if (hearts <= 0) {
            hearts = 0;
            updateHeartsUI();
            gameActive = false;
            finalScoreMsg.textContent = `Score: ${score}`;
            updateHighScore();
            gameOverDiv.style.display = "flex";
        }
    }
    
    function catchLetter(letter, idx) {
        if (!gameActive || paused) return false;
        if (letter.isCorrect) {
            if (letter.char === currentWord[currentIndex]) {
                score += 12;
                updateScoreUI();
                updateHighScore();
                currentIndex++;
                updateWordDisplay();
                fallingLetters.splice(idx, 1);
                if (currentIndex >= currentWord.length) onWordComplete();
                else spawnCorrectLetter();
                return true;
            } else {
                loseHeart();
                fallingLetters.splice(idx, 1);
                spawnCorrectLetter();
                return false;
            }
        } else {
            loseHeart();
            fallingLetters.splice(idx, 1);
            return false;
        }
    }
    
    function trySpawnWrongLetter(now) {
        if (!gameActive || paused) return;
        let dynamicInterval = Math.max(480, 1050 - Math.floor(score / 90) * 16);
        if (dynamicInterval < 440) dynamicInterval = 440;
        if (now - lastWrongSpawn >= dynamicInterval) {
            lastWrongSpawn = now;
            const randomLane = Math.floor(Math.random() * 3);
            let wrongChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            if (currentIndex < currentWord.length && wrongChar === currentWord[currentIndex]) {
                wrongChar = String.fromCharCode(65 + (wrongChar.charCodeAt(0) - 65 + 3) % 26);
            }
            let startY = -40 - Math.random() * 65;
            let attempts = 0;
            while (wouldOverlap(randomLane, startY, 34) && attempts < 25) {
                startY = -45 - Math.random() * 80;
                attempts++;
            }
            if (wouldOverlap(randomLane, startY, 34)) {
                let highestY = -100;
                for (let l of fallingLetters) if (l.laneIndex === randomLane && l.y < highestY) highestY = l.y;
                startY = highestY - MIN_VERTICAL_SPACING - 8;
                if (startY > -30) startY = -75;
            }
            fallingLetters.push({
                x: lanes[randomLane], y: startY, char: wrongChar, isCorrect: false,
                speed: currentFallSpeed, radius: 34, laneIndex: randomLane
            });
        }
    }
    
    function updateLettersMovement() {
        for (let l of fallingLetters) l.y += l.speed;
        for (let i = 0; i < fallingLetters.length; i++) {
            const l = fallingLetters[i];
            if (l.y + l.radius > canvas.height) {
                if (l.isCorrect) {
                    fallingLetters.splice(i,1);
                    if (gameActive && !paused && currentIndex < currentWord.length) spawnCorrectLetter();
                    i--;
                } else {
                    fallingLetters.splice(i,1);
                    i--;
                }
            }
        }
    }
    
    function handleCollisions() {
        const playerTop = canvas.height - 138, playerBottom = canvas.height - 48;
        const playerLeft = lanes[playerLane] - 38, playerRight = lanes[playerLane] + 38;
        for (let i = 0; i < fallingLetters.length; i++) {
            const l = fallingLetters[i];
            const closestX = Math.max(playerLeft, Math.min(l.x, playerRight));
            const closestY = Math.max(playerTop, Math.min(l.y, playerBottom));
            const dx = closestX - l.x, dy = closestY - l.y;
            if (Math.sqrt(dx*dx + dy*dy) < l.radius) {
                catchLetter(l, i);
                i--;
            }
        }
    }
    
    // Drawing functions
    function drawRoad() {
        ctx.fillStyle = "#2a2420";
        ctx.fillRect(canvas.width*0.18, 0, canvas.width*0.64, canvas.height);
        ctx.fillStyle = "#463e38";
        for(let i=0;i<22;i++) ctx.fillRect(canvas.width*0.19 + i*30, 0, 7, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = "#FFE484";
        ctx.lineWidth = 5;
        ctx.setLineDash([28, 42]);
        for(let i=1; i<=2; i++){
            const laneX = canvas.width * (0.18 + i*0.32);
            ctx.beginPath();
            ctx.moveTo(laneX, 0);
            ctx.lineTo(laneX, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.lineWidth = 7;
        ctx.strokeStyle = "#edb15d";
        ctx.beginPath();
        ctx.moveTo(canvas.width*0.18, 0);
        ctx.lineTo(canvas.width*0.18, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width*0.82, 0);
        ctx.lineTo(canvas.width*0.82, canvas.height);
        ctx.stroke();
    }
    
    function drawPlayer() {
        const x = lanes[playerLane] - 36, y = canvas.height - 138;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00000070";
        ctx.fillStyle = "#FFBB44";
        ctx.beginPath();
        ctx.roundRect(x, y, 72, 86, 18);
        ctx.fill();
        ctx.fillStyle = "#FFE0A3";
        ctx.beginPath();
        ctx.roundRect(x+12, y+12, 48, 42, 14);
        ctx.fill();
        ctx.fillStyle = "#2c2c2c";
        ctx.beginPath();
        ctx.ellipse(x+14, y+78, 14, 9, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x+58, y+78, 14, 9, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "#FFF6CF";
        ctx.font = "bold 24px monospace";
        ctx.fillText("🏎️", x+24, y+48);
        ctx.shadowBlur = 0;
    }
    
    function drawLetters() {
        for (let l of fallingLetters) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = l.isCorrect ? "#00FFAA" : "#FF3A5E";
            const grad = ctx.createRadialGradient(l.x-6, l.y-6, 6, l.x, l.y, l.radius);
            if(l.isCorrect) grad.addColorStop(0, "#2EFFB0"), grad.addColorStop(1, "#00997A");
            else grad.addColorStop(0, "#FF7A6E"), grad.addColorStop(1, "#B12A2A");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.radius, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#FFFFD0";
            ctx.beginPath();
            ctx.arc(l.x, l.y, l.radius-8, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#1F2F2E";
            ctx.font = `bold ${Math.floor(l.radius * 0.8)}px "Courier New", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(l.char, l.x, l.y+2);
            ctx.fillStyle = "white";
            ctx.fillText(l.char, l.x-1, l.y+1);
        }
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
    }
    
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (w < 2*r) r = w/2;
            if (h < 2*r) r = h/2;
            this.moveTo(x+r, y);
            this.lineTo(x+w-r, y);
            this.quadraticCurveTo(x+w, y, x+w, y+r);
            this.lineTo(x+w, y+h-r);
            this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
            this.lineTo(x+r, y+h);
            this.quadraticCurveTo(x, y+h, x, y+h-r);
            this.lineTo(x, y+r);
            this.quadraticCurveTo(x, y, x+r, y);
            return this;
        };
    }
    
    function drawEffects() {
        const t = Date.now() / 100;
        for(let i=0;i<8;i++) {
            ctx.fillStyle = `rgba(255,200,80,0.25)`;
            ctx.fillRect(canvas.width*(0.2+ i*0.07), (t*30 + i*70) % canvas.height, 6, 24);
        }
    }
    
    // Game control functions
    function startNewGame() {
        gameActive = true;
        paused = false;
        pauseOverlay.style.display = "none";
        score = 0;
        hearts = 3;
        wordsCompleted = 0;
        currentFallSpeed = INITIAL_SPEED;
        speedDisplaySpan.textContent = `⚡ SPEED: ${currentFallSpeed.toFixed(1)}`;
        playerLane = 1;
        fallingLetters = [];
        updateScoreUI();
        updateHeartsUI();
        wordsCompletedSpan.textContent = "0";
        currentWord = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)];
        currentIndex = 0;
        updateWordDisplay();
        spawnCorrectLetter();
        lastWrongSpawn = performance.now();
        mainMenuDiv.style.display = "none";
        gameOverDiv.style.display = "none";
    }
    
    function returnToMainMenu() {
        if (gameActive && score > highScore) updateHighScore();
        gameActive = false;
        paused = false;
        mainMenuDiv.style.display = "flex";
        gameOverDiv.style.display = "none";
        pauseOverlay.style.display = "none";
    }
    
    function togglePause() {
        if (!gameActive) return;
        if (paused) {
            paused = false;
            pauseOverlay.style.display = "none";
            lastWrongSpawn = performance.now();
        } else {
            paused = true;
            pauseOverlay.style.display = "flex";
        }
    }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        updateLanes();
        for (let l of fallingLetters) {
            if (l.laneIndex !== undefined && lanes[l.laneIndex] !== undefined) l.x = lanes[l.laneIndex];
            else {
                let closest = 0, minDist = Infinity;
                for (let i=0;i<lanes.length;i++) {
                    let d = Math.abs(l.x - lanes[i]);
                    if(d < minDist) { minDist = d; closest = i; }
                }
                l.laneIndex = closest;
                l.x = lanes[closest];
            }
        }
    }
    
    // Touch & keyboard
    function handleTouchMove(e) {
        if (!gameActive || paused) return;
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        let bestLane = 0, minDist = Infinity;
        for (let i = 0; i < lanes.length; i++) {
            const dist = Math.abs(touchX - lanes[i]);
            if (dist < minDist) { minDist = dist; bestLane = i; }
        }
        if (minDist < 100) playerLane = bestLane;
    }
    
    function onTouchStart(e) {
        if (!gameActive || paused) return;
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        let best = 0, minD = Infinity;
        for (let i=0;i<lanes.length;i++) {
            const d = Math.abs(touchX - lanes[i]);
            if(d < minD) { minD = d; best = i; }
        }
        if(minD < 80) playerLane = best;
    }
    
    function handleKeyDown(e) {
        if (!gameActive || paused) return;
        if (e.key === "ArrowLeft") {
            playerLane = Math.max(0, playerLane - 1);
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            playerLane = Math.min(2, playerLane + 1);
            e.preventDefault();
        }
    }
    
    function gameLoop() {
        requestAnimationFrame(gameLoop);
        if (!canvas.isConnected) return;
        if (gameActive && !paused) {
            const now = performance.now();
            trySpawnWrongLetter(now);
            updateLettersMovement();
            handleCollisions();
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        drawEffects();
        drawLetters();
        drawPlayer();
    }
    
    function init() {
        loadHighScore();
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        document.addEventListener("keydown", handleKeyDown);
        canvas.addEventListener("touchstart", onTouchStart, { passive: false });
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
        canvas.addEventListener("touchend", (e) => e.preventDefault());
        pauseBtn.addEventListener("click", togglePause);
        resumeBtn.addEventListener("click", togglePause);
        pauseMainMenuBtn.addEventListener("click", returnToMainMenu);
        gameOverMainMenuBtn.addEventListener("click", returnToMainMenu);
        startBtn.addEventListener("click", startNewGame);
        restartBtn.addEventListener("click", startNewGame);
        
        gameActive = false;
        mainMenuDiv.style.display = "flex";
        gameOverDiv.style.display = "none";
        pauseOverlay.style.display = "none";
        requestAnimationFrame(gameLoop);
    }
    
    init();
})();
