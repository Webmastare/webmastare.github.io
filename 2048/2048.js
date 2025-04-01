const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ratio = window.devicePixelRatio || 1;

let darkMode = false;
let useClassicColors = false;

let board = [];
let score = 0;
let rows = 4;
let columns = 4;
let tileSize = 100;
const gap = 5;
let canvasWidth, canvasHeight;

let touchStartX, touchStartY;

const classicColors = {
    0: ["#cdc1b5", "#5c5c5e"],
    2: ["#eee4da", "#bbada0"],
    4: ["#ece0ca", "#a39489"],
    8: ["#f4b17a", "#f5ac5f"],
    16: ["#f59575", "#f68d5b"],
    32: ["#f57c5f", "#e65d3b"],
    64: ["#f65d3b", "#c83410"],
    128: ["#edce71", "#edc850"],
    256: ["#edcc63", "#edc53f"],
    512: ["#edc651", "#eec744"],
    1024: ["#eec744", "#ecc230"],
    2048: ["#ecc230", "#e6b800"],
    4096: ["#3cb371", "#2e8b57"],
    8192: ["#2e8b57", "#228b22"],
    16384: ["#228b22", "#006400"],
    32768: ["#006400", "#004d00"],
    65536: ["#4682b4", "#4169e1"],
    131072: ["#4169e1", "#0000ff"],
    262144: ["#0000ff", "#00008b"],
    524288: ["#00008b", "#00004b"],
    default: ["#3c3a32", "#cdc1b5"],
};
const kfkbColors = {
    0: ["#eeeeee", "#dddddd"], // White and very light green
    2: ["#e8f5e9", "#c8e6c9"], // Light green shades
    4: ["#c8e6c9", "#a5d6a7"],
    8: ["#a5d6a7", "#81c784"],
    16: ["#81c784", "#66bb6a"],
    32: ["#66bb6a", "#4caf50"],
    64: ["#4caf50", "#43a047"],
    128: ["#43a047", "#388e3c"],
    256: ["#388e3c", "#2e7d32"],
    512: ["#2e7d32", "#1b5e20"],
    1024: ["#1b5e20", "#0d3b12"],
    2048: ["#0d3b12", "#09270c"],
    4096: ["#09270c", "#061b08"],
    8192: ["#061b08", "#041204"],
    16384: ["#041204", "#020a02"],
    32768: ["#020a02", "#000000"], // Black
    65536: ["#000000", "#000000"], // Black
    131072: ["#000000", "#000000"], // Black
    262144: ["#000000", "#000000"], // Black
    524288: ["#000000", "#000000"], // Black
    default: ["#ffffff", "#e8f5e9"], // Default to white and light green
};

class Tile {
    constructor(value = 0) {
        this.value = value;
    }

    draw(x, y) {
        const colors = useClassicColors ? classicColors : kfkbColors;
        ctx.fillStyle = darkMode ? colors[this.value][1] : colors[this.value][0] || colors.default;
        ctx.fillRect(x+gap, y+gap, tileSize-gap, tileSize-gap);

        if (this.value > 0) {
            ctx.fillStyle = this.value <= 4 ? "#776e65" : "#f9f6f2";
            ctx.font = `${tileSize / 2}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.value, (x+gap/2) + tileSize / 2, (y+gap/2) + tileSize / 2);
        }
    }
}

function initGame() {
    board = Array.from({ length: rows }, () => Array(columns).fill(null).map(() => new Tile()));

    addRandomTile();
    addRandomTile();
    drawBoard();
}

// Function to set up the slider for adjusting board dimensions
function setupSlider() {
    const slider = document.getElementById("board-size-slider");
    sliderUpdater(rows);
    slider.addEventListener("input", (e) => {
        const size = parseInt(e.target.value);
        sliderUpdater(size);
        resetGame();
    });
    function sliderUpdater(size) {
        rows = size;
        columns = size;
        document.getElementById("board-size-text").innerText = `${size} x ${size}`;
        const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
        slider.style.setProperty("--progress", `${value}%`);
    }

    document.getElementById("dark-mode").addEventListener('change', function() {
        const element = document.body;
        element.classList.toggle("dark-mode");
        darkMode = !darkMode;
        drawBoard();
    });
    document.getElementById("classic-colors").addEventListener('change', function() {
        useClassicColors = !useClassicColors;
        drawBoard();
    });
}

// Function to handle touch events for swiping on the canvas
function setupTouch() {
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Prevent default touch behavior
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    canvas.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        const threshold = 20; // Minimum distance to consider a swipe
        if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) return;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) slideRight();
            else slideLeft();
        } else {
            // Vertical swipe
            if (diffY > 0) slideDown();
            else slideUp();
        }
    });
}

// Function to resize the canvas and redraw the board
function resizeBoard() {
    const containerWidth = window.innerWidth * 0.9; // Leave some space on the screen
    const containerHeight = window.innerHeight * 0.8; // Leave some space on the screen
    tileSize = Math.min(containerWidth / columns, containerHeight / rows) - (gap*2)/rows;

    canvasWidth = tileSize * columns + gap;
    canvasHeight = tileSize * rows + gap;
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    drawBoard();
}

// Function to reset the game when the board size changes
function resetGame() {
    score = 0;
    document.getElementById("score").innerText = score;
    initGame();
    resizeBoard();
}

function checkGameOver() {
    // Check if there are any empty tiles
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (board[r][c].value === 0) {
                return [false, "Empty tiles"]; // Game is not over if there are empty tiles
            }
        }
    }

    // Check for possible merges horizontally and vertically
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const currentTile = board[r][c].value;

            // Check right neighbor
            if (c < columns - 1 && currentTile === board[r][c + 1].value) {
                return [false, "Merge horisontally is possible"]; // Game is not over if a horizontal merge is possible
            }

            // Check bottom neighbor
            if (r < rows - 1 && currentTile === board[r + 1][c].value) {
                return [false, "Merge vertically is possible"]; // Game is not over if a vertical merge is possible
            }
        }
    }

    return [true, "Game Over"]; // No empty tiles and no possible merges, game is over
}

// Save the current game state to localStorage
function saveGame() {
    const gameState = {
        board: board.map(row => row.map(tile => tile.value)), // Save only the tile values
        score: score,
        rows: rows,
        columns: columns
    };
    localStorage.setItem("2048GameState", JSON.stringify(gameState));
    console.log("Game saved!");
}

// Load the game state from localStorage
function loadGame() {
    const savedState = localStorage.getItem("2048GameState");
    if (savedState) {
        const gameState = JSON.parse(savedState);
        rows = gameState.rows;
        columns = gameState.columns;
        score = gameState.score;
        board = gameState.board.map(row => row.map(value => new Tile(value)));
        document.getElementById("score").innerText = score;
        resizeBoard();
        drawBoard();
        console.log("Game loaded!");
    } else {
        console.log("No saved game found.");
    }
}

// Check if there is a saved game and show a "Load Game" button
function checkForSavedGame() {
    const savedState = localStorage.getItem("2048GameState");
    if (savedState) {
        const score = JSON.parse(savedState).score;
        if (score <= 0) {
            return; // Don't show the button if the score is 0
        }
        const loadButton = document.getElementById("load-game-button");
        document.getElementById("load-game-div").style.display = "inline-block"; // Show the button
        document.getElementById("saved-game-score").innerText = score;
        loadButton.addEventListener("click", () => {
            loadGame();
            document.getElementById("load-game-div").style.display = "none"; // Hide the button after loading
        });
    }
}

function drawBoard() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = darkMode ? "#3c3a32" : "#cdc1b5";
    ctx.fillRect(0, 0, 0, canvasHeight);
    
    ctx.strokeStyle = "#bbada0";
    ctx.lineWidth = (gap) * ratio;
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const x = c * (tileSize);
            const y = r * (tileSize);
            board[r][c].draw(x, y);
        }
    }

    document.getElementById("score").innerText = score;
}

function addRandomTile() {
    const emptyTiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (board[r][c].value === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }
    
    if (emptyTiles.length === 0) {
        const [gameOver, message] = checkGameOver();
        if (gameOver) {
            console.error("Game Over! Your score: " + score);
            localStorage.removeItem("2048GameState");
            return;
        }
        console.warn(message);
    }

    if (emptyTiles.length > 0) {
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[r][c].value = Math.random() < 0.9 ? 2 : 4;
    }
}

function slide(row) {
    const filteredRow = row.filter(tile => tile.value !== 0);
    for (let i = 0; i < filteredRow.length - 1; i++) {
        if (filteredRow[i].value === filteredRow[i + 1].value) {
            filteredRow[i].value *= 2;
            score += filteredRow[i].value;
            filteredRow[i + 1].value = 0;
        }
    }
    const newRow = filteredRow.filter(tile => tile.value !== 0);
    while (newRow.length < columns) {
        newRow.push(new Tile());
    }
    return newRow;
}

function slideLeft() {
    for (let r = 0; r < rows; r++) {
        board[r] = slide(board[r]);
    }
    addRandomTile();
    drawBoard();
}

function slideRight() {
    for (let r = 0; r < rows; r++) {
        board[r].reverse();
        board[r] = slide(board[r]);
        board[r].reverse();
    }
    addRandomTile();
    drawBoard();
}

function slideUp() {
    for (let c = 0; c < columns; c++) {
        const column = board.map(row => row[c]);
        const newColumn = slide(column);
        for (let r = 0; r < rows; r++) {
            board[r][c] = newColumn[r];
        }
    }
    addRandomTile();
    drawBoard();
}

function slideDown() {
    for (let c = 0; c < columns; c++) {
        const column = board.map(row => row[c]);
        column.reverse();
        const newColumn = slide(column);
        newColumn.reverse();
        for (let r = 0; r < rows; r++) {
            board[r][c] = newColumn[r];
        }
    }
    addRandomTile();
    drawBoard();
}

document.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "ArrowLeft":
            e.preventDefault();
            slideLeft();
            break;
        case "ArrowRight":
            e.preventDefault();
            slideRight();
            break;
        case "ArrowUp":
            e.preventDefault();
            slideUp();
            break;
        case "ArrowDown":
            e.preventDefault();
            slideDown();
            break;
    }
    saveGame();
});

initGame();
setupSlider()
setupTouch();
resizeBoard();
checkForSavedGame();
// Resize the board when the window is resized
window.addEventListener("resize", resizeBoard);