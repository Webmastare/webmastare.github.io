function resizeCanvas() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Limit canvas width something of window width
    const maxWidth = 0.75;
    const maxHeight = 0.55;
    const whRatio = player.rows/player.columns;
    const stdHeight = Math.min(windowWidth * maxWidth * whRatio, windowHeight * maxHeight);
    let canvasWidth = stdHeight/whRatio;
    let canvasHeight = stdHeight;
    // Resize to ppi and set canvas dimensions
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    blockSize = canvasWidth/player.columns;
    player.draw();

    // Resize the restart-popup
    restartPopup.style.width = `${canvasWidth}px`;
    restartPopup.style.height = `${canvasHeight}px`;
}

function resetGame() {
    player = new Player();
    player.foodAmount = foodSlider.value;
    player.placeFood();
    restartPopup.style.display = "none";
    mode = settings[difficulyDD.value];
    speedText.innerHTML = mode;
}

function darkModeToggle(theme) {
    if (['dark', 'kfkb'].includes(theme)) {
        document.documentElement.style.setProperty('--bg-color1', '#232323');
        document.documentElement.style.setProperty('--bg-color2', '#363636');
        document.documentElement.style.setProperty('--color1', '#b0b0b0');
        document.documentElement.style.setProperty('--color2', '#c7c7c7');
        darkMode = true;
    } else if (theme == 'light') {
        document.documentElement.style.setProperty('--bg-color1', '#ffffff');
        document.documentElement.style.setProperty('--bg-color2', '#abbaab');
        document.documentElement.style.setProperty('--color1', '#121212');
        document.documentElement.style.setProperty('--color2', '#121212');
        darkMode = false;
    }
    player.draw();
}

function hideShowID(targetID) {
    let target = document.getElementById(targetID);
    if (target.style.display == "none") {
        target.style.display = "flex";
    } else if (target.style.display != "none") {
        target.style.display = "none";
    }
}

function generateObstacles() {
    let obstacleCount = 20; // Number of obstacles to place
    let freeSpots = player.grid.flat();
    let obstacleList = [];

    while (obstacleList.length < obstacleCount) {

        let index = Math.floor(Math.random()*freeSpots.length);
        let newObstacle = freeSpots[index]
        obstacleList.push(newObstacle);
        freeSpots.splice(index, 1);
    }
    while (true) {
        let nc = obstacleList.slice();
        obstacleList = correctObstacles(obstacleList);
        let added = obstacleList.slice().filter(elem => !nc.some((element) => JSON.stringify(element) === JSON.stringify(elem)))
        console.log(added.length, added)
        if (added.length == 0) {
            break
        }
    }
    return obstacleList;
}

function correctObstacles(obstacles) {
    let obst = obstacles.slice();
    for (const row of player.grid) {
        for (const spot of row) {
            neighbors = [];
            for (let r = spot.y-1; r <= spot.y+1; r++) {
                for (let c = spot.x-1; c <= spot.x+1; c++) {
                    if (0 <= spot.x && spot.x < player.columns &&
                        0 <= spot.y && spot.y < player.rows &&
                        (spot.x !== c || spot.y !== r) &&
                        (0 <= r && r < player.rows) &&
                        (0 <= c && c < player.columns) &&
                        (Math.abs(spot.x - c) + Math.abs(spot.y - r) < 2) &&
                        !obst.some((element) => JSON.stringify(element) === JSON.stringify({x: c, y: r}) &&
                        !obst.includes(spot))
                        ) {
                            neighbors.push(spot);
                        }
                }
            }
            if (neighbors.length < 2) {
                obst.push(spot);
            }
        }
    }

    return obst;
}

function controllerPress(btn) {
    let e = {}
    switch (btn) {
        case "up": {
            e.code = "ArrowUp";
            break;
        }
        case "down": {
            e.code = "ArrowDown";
            break;
        }
        case "left": {
            e.code = "ArrowLeft";
            break;
        }
        case "right": {
            e.code = "ArrowRight";
            break;
        }
        default: {
            break;
        }
    }
    changeDirection(e)
}

class Player{
    constructor() {
        this.gameOver = false;
        this.score = 0;

        this.rows = 20;
        this.columns = 20;
        this.grid = [];

        this.obstacles = [];

        //Snake
        this.snakeBody = [];
        this.snakeX = Math.floor(Math.random() * this.columns);
        this.snakeY = Math.floor(Math.random() * this.rows);

        this.velocityX = 0;
        this.velocityY = 0;

        this.effects = {speed: [2,20.000]};

        //Food
        this.foodList = [];
        this.foodAmount = 1;

        this.foodExplosion = null;

        this.setGrid();
    }

    setGrid() {
        for (let r = 0; r < this.rows; r++) {
            this.grid.push([]);
            for (let c = 0; c < this.columns; c++) {
                this.grid[r].push({x : c, y: r});
            }
        }
    }

    placeFood() {
        checkGameOver();
        if (this.gameOver) return;
        if (this.foodList.length < this.foodAmount) {
            // push a new food
            while (this.foodList.length < this.foodAmount) {
                let occupiedList = this.snakeBody.map(([x,y]) => {
                    return this.grid[y][x];
                });
                occupiedList.push(this.grid[this.snakeY][this.snakeX]);
                occupiedList.push(...this.obstacles.map((obj) => {
                    return this.grid[obj.y][obj.x]
                }));
                console.log(occupiedList)
                let flatGrid = this.grid.flat();
                let emptyNodes = flatGrid.filter(node => !occupiedList.includes(node));
                let foodNode = emptyNodes[Math.floor(Math.random()*emptyNodes.length)];
                let foodX = foodNode.x;
                let foodY = foodNode.y;
                let color = [100 + Math.random() * 150, 50 + Math.random() * 50, 50 + Math.random() * 50];
    
                this.foodList.push({x:foodX, y:foodY, color});
            }
        } else if (this.foodList.length > this.foodAmount) {
            while (this.foodList.length > this.foodAmount) {
                this.foodList.pop();
            } 
        }
    }

    update() {
        // Move snake check collision with food
        for (let i = this.snakeBody.length-1; i > 0; i--) {
            this.snakeBody[i] = this.snakeBody[i-1];
        }
        if (this.snakeBody.length) {
            this.snakeBody[0] = [this.snakeX, this.snakeY];
        }
        this.snakeX += this.velocityX;
        this.snakeY += this.velocityY;

        checkGameOver();


        for (let i = 0; i < this.foodList.length; i++) {
            const food = this.foodList[i];
            if (this.snakeX == food.x && this.snakeY == food.y) {
                this.foodExplosion = new Explosion(food.y, food.x, food.color)
                this.snakeBody.push([(((food.x-this.velocityX)%this.columns) + this.columns)%this.columns, (((food.y-this.velocityY)%this.rows) + this.rows)%this.rows]);
                this.foodList.splice(i,1);
                this.placeFood();
                this.score++;

                // Update dynamic speed
                console.log(Math.round(mode * 100 + 10*Math.log(mode*100))/100, Math.round(mode * 110)/100)
                mode = Math.round(mode * 100 + 10*Math.log(mode*100))/100;
            }
            
        }

        scoreText.innerText = this.score.toString();
    }

    draw() {
        ctx.shadowBlur = 0;
        // Draw background and grid
        ctx.fillStyle = theme[0];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = theme[1];
        for (let r = 0; r <= this.rows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r*blockSize);
            ctx.lineTo(this.columns*blockSize, r*blockSize);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        for (let c = 0; c <= this.columns; c++) {
            ctx.beginPath();
            ctx.moveTo(c*blockSize, 0);
            ctx.lineTo(c*blockSize, this.rows*blockSize);
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.fillStyle = "rgb(39, 39, 39)";
        this.obstacles.forEach(elem => {
            ctx.fillRect(elem.x*blockSize, elem.y*blockSize, blockSize, blockSize)
        });

        // Draw snake
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(40,200,60, 1)";
        ctx.fillStyle = "rgba(40,200,60, 1)";

        // Draw body
        let body = [[this.snakeX, this.snakeY], ...this.snakeBody];
        ctx.beginPath();
        ctx.lineCap = "round"; // Rounded ends for the snake
        ctx.lineJoin = "round"; // Rounded corners for turns

        // Start at the first segment
        ctx.moveTo(body[0][0] * blockSize + blockSize / 2, body[0][1] * blockSize + blockSize / 2);

        // Draw lines between segments
        for (let i = 1; i < body.length; i++) {
            let dist = Math.sqrt((body[i][0]-body[i-1][0])**2 + (body[i][1]-body[i-1][1])**2);
            if (dist <= 1) {
                ctx.lineTo(body[i][0] * blockSize + blockSize / 2, body[i][1] * blockSize + blockSize / 2);
            } else {
                ctx.moveTo(body[i][0] * blockSize + blockSize / 2, body[i][1] * blockSize + blockSize / 2);
            }
            
        }
        ctx.lineWidth = blockSize * 0.7; // Slightly thicker for the outline
        ctx.strokeStyle = "rgb(14, 19, 13)"; // Black outline
        ctx.stroke();
        ctx.lineWidth = blockSize * 0.55; // Thickness of the snake
        ctx.strokeStyle = "rgba(40, 200, 60, 1)"; // Snake color
        ctx.stroke();

        // Draw the head as a circle
        ctx.beginPath();
        ctx.arc(this.snakeX * blockSize + blockSize / 2, this.snakeY * blockSize + blockSize / 2, blockSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20, 150, 40, 1)"; // Different color for the head
        ctx.fill();
        

        // Draw eyes
        // Eye size
        const eyeSize = 0.16;

        // Base position of the snake's head
        const baseX = this.snakeX * blockSize;
        const baseY = this.snakeY * blockSize;

        // Default eye positions
        let eyeOffsets;

        // Determine eye positions based on movement direction
        if (this.velocityX === 1) { // Right
            eyeOffsets = [[0.7-eyeSize, 0.3], [0.7-eyeSize, 0.7-eyeSize]];
        } else if (this.velocityX === -1) { // Left
            eyeOffsets = [[0.3, 0.3], [0.3, 0.7-eyeSize]];
        } else if (this.velocityY === 1) { // Down
            eyeOffsets = [[0.3, 0.7-eyeSize], [0.7-eyeSize, 0.7-eyeSize]];
        } else { // Up
            eyeOffsets = [[0.3, 0.3], [0.7-eyeSize, 0.3]];
        }

        // Draw the eyes
        ctx.fillStyle = "rgb(14, 19, 13)"; // Eye color
        eyeOffsets.forEach(([offsetX, offsetY]) => {
            ctx.fillRect(baseX + blockSize * offsetX, baseY + blockSize * offsetY, eyeSize*blockSize, eyeSize*blockSize);
        });


        if (this.foodExplosion) {
            this.foodExplosion.updateParticles()
        }

        // Draw food
        this.foodList.forEach(food => {
            let color = `rgb(${food.color[0]}, ${food.color[1]}, ${food.color[2]})`;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.beginPath();
            for (var i = 0; i < 6; i++) {
                ctx.lineTo((food.x + 0.5)*blockSize + blockSize/2.5 * Math.cos(Math.PI/3 * i), (food.y+0.5)*blockSize + blockSize/2.5 * Math.sin(Math.PI/3 * i));
            }
            ctx.closePath();
            ctx.fill();
            //ctx.fillRect(food[0]*blockSize, food[1]*blockSize, blockSize, blockSize);
        });
    }  
}

class Explosion {
    constructor(row, col, color) {
        this.y = (row+0.5)*blockSize;
        this.x = (col+0.5)*blockSize;
        this.color = rgbToHsl(...color);
        
        this.particles = [];
        this.createExplosion()
    }

    createExplosion(){
        const numParticles = Math.floor(20+Math.random()*5);

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI*2;
            const radius = Math.random()*blockSize/6 + blockSize/3;

            let color, speed;
            const l = Math.min(Math.max(this.color.l + (Math.random() * this.color.l - this.color.l/2)/2, 0), 100);
            const s = Math.min(Math.max(this.color.s + (Math.random() * this.color.s - this.color.l/2)/2, 0), 100);
            color = `hsl(${this.color.h}, ${s}, ${l})`;
            speed = 2 + Math.random() * ((l / 10)*2); // Faster for brighter particles
            

            this.particles.push({
                x: this.x,
                y: this.y,
                dx: Math.cos(angle)*speed,
                dy: Math.sin(angle)*speed/4,
                radius: radius,
                color: color,
                alpha: 1
            })
        }
    }

    updateParticles() {
        if (this.particles.length == 0) {return}

        this.particles = this.particles.filter(particle => {
            particle.x += particle.dx;
            particle.y += particle.dy;
            particle.dx *= 0.8;
            particle.dy += 0.5;
            particle.alpha -= 0.05;
            particle.radius *= 0.95;

            return particle.alpha > 0;
        });

        this.particles.forEach(particle => {
            const partColors = particle.color.match(/[\d.]+/g);
            ctx.fillStyle = `hsla(${partColors[0]},${partColors[1]}%,${partColors[2]}%,${particle.alpha})`;
            ctx.fillRect(particle.x, particle.y, particle.radius, particle.radius);
        });
    }
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return { h: 0, s: 0, l }; // Achromatic

    const delta = max - min;
    const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    let h;
    switch (max) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        case b: h = (r - g) / delta + 4; break;
    }

    h /= 6;
    return { h: h * 360, s: s * 100, l: l * 100 };
}

function setLocalStorage(key, value) {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
}

function getLocalStorage(key) {
    const storedValue = localStorage.getItem(key);
    try {
        // parse as JSON
        return JSON.parse(storedValue);
    } catch (e) {
        // If not JSON, return as string
        return storedValue;
    }
}

//Buttons and slider
const buttons = Array.from(document.querySelectorAll("button"));
const scoreText = document.getElementById("score");
const bestScoreText = document.getElementById("best-score");
const foodText = document.querySelectorAll("#food-count-txt");
const foodSlider = document.getElementById("food-range");

const restartPopup = document.getElementById("restart-popup");
const difficulyDD = document.getElementById('difficulty');
const themeDD = document.getElementById('theme');
const snakeWrapCB = document.getElementById('wrap-snake');
const leftrightCB = document.getElementById('leftright-only');
const speedText = document.getElementById('speed-text');

// Settings
let settings = {
    'dynamic' : 8,
    'easy' : 8,
    'medium' : 14,
    'hard' : 22,
    'extreme' : 30,
}
const themeColors = {
    'light' : ["#dedede", "#999999"],
    'dark' : ["#222222", "#333333"],
    'kfkb' : ["#222222", "#138e3e"]
}
const gameModes = {
    'default' : 1,
    'obstacles' : 1,
    'survival' : 1,
    'explosion' : 1
}

let gameMode = "default";
let darkMode = false;

let mode = settings[difficulyDD.value];
speedText.innerHTML = mode;

let theme = themeColors[themeDD.value];

let snakeWrap = snakeWrapCB.checked;
let leftRightOnly = leftrightCB.checked;

let lastUpdate = performance.now();

let player = new Player();
let blockSize = 25;
let fps = 60;
let lastDirection = { x: 0, y: 0};
// Variables to store the starting touch coordinates
let touchStartX = null;
let touchStartY = null;
// A minimum distance (in pixels) the touch must move to be considered a swipe.
const threshold = 30;

let topScore = getLocalStorage('topscore');
bestScoreText.innerHTML = topScore != null ? topScore : "-"


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ratio = Math.ceil(window.devicePixelRatio);
let intervalID;

canvas.height = player.rows * blockSize;
canvas.width = player.columns * blockSize;

//Top rule width adjustment
const rule = document.getElementById("toprule");
width = player.columns*blockSize + "px";
rule.style.width = width;


window.onload = function() {
    //Init game and add eventlisteners
    player.placeFood();
    initElements();

    resizeCanvas(); // Initial call
    window.addEventListener('resize', resizeCanvas);

    intervalID = setInterval(update, 1000/fps);
}


function initElements() {
    document.addEventListener("keydown", function(e){
        changeDirection(e);
    });

    foodSlider.addEventListener("input", function() {
        const value = foodSlider.value;
        foodText.forEach(tex => {
            tex.innerText = value.toString();
        });
        player.foodAmount = value;
        player.placeFood();
    });

    // Listen for when the touch starts
    canvas.addEventListener("touchstart", function(e) {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    // Listen for when the touch ends
    canvas.addEventListener("touchend", function(e) {
        e.preventDefault();
        touchHandler(e);
    });

    // Difficulty change
    difficulyDD.addEventListener('change', function() {
        const selectedValue = this.value;
        mode = settings[selectedValue];
        speedText.innerHTML = mode;
        console.log('Selected difficulty:', selectedValue);
    });
    themeDD.addEventListener('change', function() {
        const selectedValue = this.value;
        theme = themeColors[selectedValue];
        console.log('Selected theme:', selectedValue);
        darkModeToggle(selectedValue);
    });
    snakeWrapCB.addEventListener('change', function() {
        const checked = this.checked;
        snakeWrap = checked;
        console.log('Wrapping:', checked);
    });
    leftrightCB.addEventListener(('change'), function() {
        const checked = this.checked;
        leftRightOnly = checked;
        console.log('LeftRight:', checked);

        const upBtn = document.getElementsByClassName('verticalController')[0].children[0]
        const downBtn = document.getElementsByClassName('verticalController')[0].children[2]

        if (!upBtn.classList.contains('hide-up-down-controller')) {
            upBtn.classList.add('hide-up-down-controller');
            downBtn.classList.add('hide-up-down-controller');
        }else if (upBtn.classList.contains('hide-up-down-controller')) {
            upBtn.classList.remove('hide-up-down-controller');
            downBtn.classList.remove('hide-up-down-controller');
        }
    });

    // Dropdown info
    document.querySelectorAll(".dropdown-container").forEach((container) => {
        const description_header = container.querySelector(
          ".description-header"
        );
        const dropdown = container.querySelector(".dropdown");

        // Toggle dropdown on click (for touch screens)
        description_header.addEventListener("click", () => {
          container.classList.toggle("dropdown-active");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (event) => {
          if (!container.contains(event.target)) {
            container.classList.remove("dropdown-active");
          }
        });

        // Show dropdown on hover (for desktops)
        container.addEventListener("mouseenter", () => {
          container.classList.add("dropdown-active");
        });

        container.addEventListener("mouseleave", () => {
          container.classList.remove("dropdown-active");
        });
    });

}

function update() {
    // Update
    let bps = mode;
    for (const key in player.effects) {
        if (Object.prototype.hasOwnProperty.call(player.effects, key)) {
            const element = player.effects[key];
            element[1] = Math.max(element[1]-(performance.now()-lastUpdate)/1000, 0)
        }
    }
    if (player.effects.speed[1] > 0) {
        bps *= player.effects.speed[0];
    }
    if (performance.now()-lastUpdate >= 1000/mode && !player.gameOver){
        speedText.innerHTML = bps
        player.update();
        lastDirection = { x: player.velocityX, y: player.velocityY };
        lastUpdate = performance.now();
    }
    // Draw
    player.draw();
}

function checkGameOver() {
    //Gameover Condition
    //console.log(snakeX.toString()+ " : " + snakeY.toString());
    if (!snakeWrap){    
        if (player.snakeX < 0 || player.snakeX >= player.columns || player.snakeY < 0 || player.snakeY >= player.rows) {
            player.gameOver = true;
        }
    } else {
        // Wrap around the canvas
        if (player.snakeX < 0) {
            player.snakeX = player.columns - 1;
        } else if (player.snakeX >= player.columns) {
            player.snakeX = 0;
        }

        if (player.snakeY < 0) {
            player.snakeY = player.rows - 1;
        } else if (player.snakeY >= player.rows) {
            player.snakeY = 0;
        }
    }

    for (let i = 0; i < player.snakeBody.length; i++) {
        if (player.snakeX == player.snakeBody[i][0] && player.snakeY == player.snakeBody[i][1]) {
            player.gameOver = true;
        }
    }

    // Obstacle collision
    for (const obs of player.obstacles) {
        if (player.snakeX === obs.x && player.snakeY === obs.y) {
            player.gameOver = true;
            console.log("Game Over! You hit an obstacle.");
        }
    }

    if (player.snakeBody.length == ((player.grid.length*player.grid[0].length)-1)){
        player.gameOver = true;
        console.log("YOU WIN!!");
    }

    if (player.gameOver) {
        console.error("Game Over");
        restartPopup.style.display = "flex";
        let currentScore = player.score;
        if (currentScore > topScore) {
            topScore = currentScore;
            setLocalStorage("topscore", currentScore)
            bestScoreText.innerHTML = topScore != null ? topScore : "-"
        }
    }
}

function changeDirection(e) {
    if (!leftRightOnly) {
        if (e.code == "ArrowUp" && lastDirection.y != 1) {
            e.preventDefault();
            player.velocityX = 0;
            player.velocityY = -1;
        } else if (e.code == "ArrowDown" && lastDirection.y != -1) {
            e.preventDefault();
            player.velocityX = 0;
            player.velocityY = 1;
        } else if (e.code == "ArrowLeft" && lastDirection.x != 1) {
            e.preventDefault();
            player.velocityX = -1;
            player.velocityY = 0;
        } else if (e.code == "ArrowRight" && lastDirection.x != -1) {
            e.preventDefault();
            player.velocityX = 1;
            player.velocityY = 0;
        }
    } else {
        if (e.code == "ArrowLeft") {
            e.preventDefault();
            if (player.velocityX+player.velocityY == 0) {
                player.velocityX = -1;
                return;
            }
            // Rotate 90 degrees clockwise
            const newVelocityX = player.velocityY;
            const newVelocityY = -player.velocityX;
            player.velocityX = newVelocityX;
            player.velocityY = newVelocityY;
        } else if (e.code == "ArrowRight") {
            e.preventDefault();
            if (player.velocityX+player.velocityY == 0) {
                player.velocityX = 1;
                return;
            }
            // Rotate 90 degrees counterclockwise
            const newVelocityX = -player.velocityY;
            const newVelocityY = player.velocityX;
            player.velocityX = newVelocityX;
            player.velocityY = newVelocityY;
        }
    }    
}

function touchHandler(e) {
    // Ensure that we have valid starting coordinates
    if (touchStartX === null || touchStartY === null) return;

    // Get the ending touch coordinates
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    // Calculate the difference between the start and end positions
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;

    // If the swipe is too short in both directions, ignore it
    if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) {
        // Reset for the next touch event
        touchStartX = null;
        touchStartY = null;
        return;
    }

    // Determine whether the swipe is horizontal or vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe detected
        if (diffX > 0 && lastDirection.x !== -1) { 
        // Swipe right
        player.velocityX = 1;
        player.velocityY = 0;
        } else if (diffX < 0 && lastDirection.x !== 1) { 
        // Swipe left
        player.velocityX = -1;
        player.velocityY = 0;
        }
    } else {
        // Vertical swipe detected
        if (diffY > 0 && lastDirection.y !== -1) { 
        // Swipe down
        player.velocityX = 0;
        player.velocityY = 1;
        } else if (diffY < 0 && lastDirection.y !== 1) { 
        // Swipe up
        player.velocityX = 0;
        player.velocityY = -1;
        }
    }

    // Reset the starting touch coordinates for the next swipe
    touchStartX = null;
    touchStartY = null;
}

function placeFood() {
    if (foodList.length < foodAmount) {
        // push a new food
        while (foodList.length < foodAmount) {
            foodX = Math.floor(Math.random() * columns) * blockSize;
            foodY = Math.floor(Math.random() * rows) * blockSize;
            foodList.push([foodX, foodY]);
        }
    } else if (foodList.length > foodAmount) {
        while (foodList.length > foodAmount) {
            foodList.pop();
        } 
    }
}