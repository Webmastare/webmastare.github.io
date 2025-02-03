function resizeCanvas() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Limit canvas width something of window width
    const maxWidth = 0.95;
    const maxHeight = 0.75;
    const whRatio = gameRows/gameCols;
    const stdHeight = Math.min(windowWidth * maxWidth * whRatio, windowHeight * maxHeight);
    let canvasWidth = stdHeight/whRatio;
    let canvasHeight = stdHeight;
    // Resize to ppi and set canvas dimensions
    canvas.width = canvasWidth * ratio;
    canvas.height = canvasHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    loggingContainer.style.width = `${canvasWidth}px`;
    //canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);

    // Set canvas dimensions
    cellSize = STDcellSize;
    ctx.imageSmoothingEnabled = false;
    draw();
    // Not added yet crosses
    fixCrosses();
}

function resetCanvasPos() {
    zoomLevel = 1;
    offsetX = 0;
    offsetY = 0;
    if (currentUserID !== 0) {
        // Reset to user
        const xAdj = (canvas.width / (cellSize*ratio)) / 2;
        const yAdj = (canvas.height / (cellSize*ratio)) / 2;
        offsetX = -Math.max(userPlayer.position.column-xAdj,0)*cellSize;
        offsetY = -Math.max(userPlayer.position.row-yAdj,0)*cellSize;
    }
    draw();
}

function fixCrosses() {
    const crossPar = document.querySelectorAll(".not-added-yet");
    crossPar.forEach(p => {
        // Clear old divs
        const oldDivs = p.querySelectorAll("div");

        const boundRect = p.getBoundingClientRect();
        const hyp = Math.sqrt(boundRect.width**2 + boundRect.height**2)
        const angle = Math.atan2(boundRect.height, boundRect.width) * 180 / Math.PI;
        let cross1, cross2;
        if (oldDivs.length < 2) {
            cross1 = document.createElement('div');
            cross2 = document.createElement('div');
        } else {
            cross1 = oldDivs[0];
            cross2 = oldDivs[1];
        }
        
        cross1.classList.add('left-cross')
        cross1.style.width = `${hyp}px`;
        cross2.style.width = `${hyp}px`;
        cross1.style.rotate = `${angle}deg`;
        cross1.style.webkittransform = `${angle}deg`;
        cross2.style.rotate = `${-angle}deg`;
        cross2.style.webkittransform = `${-angle}deg`;
        p.appendChild(cross1);
        p.appendChild(cross2);
    });
}

function showPassword(targetID) {
    const target = document.getElementById(targetID);
    if (target.type === "password") {
        target.type = "text";
    }else {
        target.type = "password";
    }
}

function showLoginCreate(target) {
    const forms = {
        "login-container": document.getElementById("login-container"),
        "create-account-container": document.getElementById("create-account-container"),
        "create-band-container": document.getElementById("create-band-container")
    };

    // Determine which form to toggle
    let formToToggle = null;
    if (typeof target === "string") {
        formToToggle = forms[target];
    } else if (target && target.id) {
        const buttonToFormMap = {
            "show-login-button": "login-container",
            "show-create-button": "create-account-container",
            "show-newband-button": "create-band-container"
        };
        formToToggle = forms[buttonToFormMap[target.id]];
    }
    if (formToToggle == forms["login-container"]) {getCookie()}

    if (formToToggle) {
        // Hide all forms except the one being toggled
        Object.values(forms).forEach(form => {
            if (form !== formToToggle) {
                form.classList.add("hidden-login-container");
            }
        });

        // Toggle the visibility of the selected form
        formToToggle.classList.toggle("hidden-login-container");
    }
}

function displayError(error) {
    const createError = document.getElementById('error-message-create');
    const loginError = document.getElementById('error-message-login');
    const createBandError = document.getElementById('error-message-first-band');
    
    loginError.style.display = 'none';
    createError.style.display = 'none';
    clearTimeout(errorTimer);
    console.log(error)
    console.log(error.code)
    switch (error.code) {
        case "email_exists" : {
            // On create
            createError.style.display = 'block';
            createError.innerHTML = 'E-posten används redan, logga in istället';
            errorTimer = setTimeout(() => {
                createError.style.display = 'none';
            }, 5000);
            break;
        }
        case "weak_password": {
            // On create
            createError.style.display = 'block';
            createError.innerHTML = 'Svagt lösenord, använd minst 6 tecken';
            errorTimer = setTimeout(() => {
                createError.style.display = 'none';
            }, 5000);
            break;
        }
        case "user_already_exists": {
            // On create
            createError.style.display = 'block';
            createError.innerHTML = 'E-posten används redan, logga in istället';
            errorTimer = setTimeout(() => {
                createError.style.display = 'none';
            }, 5000);
            break;
        }
        case "invalid_credentials": {
            // On login
            loginError.style.display = 'block';
            loginError.innerHTML = 'Fel e-post eller lösenord';
            errorTimer = setTimeout(() => {
                loginError.style.display = 'none';
            }, 5000);
            break;
        }
        case "no_player_found": {
            // On login
            loginError.style.display = 'block';
            loginError.innerHTML = 'Du har ingen vagn än';
            createBandError.style.display = 'block';
            createBandError.innerHTML = 'Du har ingen vagn än skapa en här';
            showLoginCreate("create-band-container");
            errorTimer = setTimeout(() => {
                loginError.style.display = 'none';
                createBandError.style.display = 'none';
            }, 5000);
            break;
        }
        case "multiple_players_found": {
            // On login
            loginError.style.display = 'block';
            loginError.innerHTML = 'Du har mer än en vagn, kontakta webmästeriet';
            errorTimer = setTimeout(() => {
                loginError.style.display = 'none';
            }, 5000);
            break;
        }
        default:{
            break;
        }
    }
}

function displayMessage(messageId = "") {
    const messageContainerElements = document.getElementById('messages-container').children;
    Array.from(messageContainerElements).forEach(e => {e.style.display = 'none'});

    switch (messageId) {
        case "player-dead": {
            document.getElementById('dead-message').style.display = 'block';
            break;
        }
        case "player_already_dead": {
            // After shot targeted player was dead
            console.error("Player already dead");
        }
        default: {
            break;
        }
    }
}

function displayLogs() {
    
    for (const log of gameLogs) {
        const p = document.createElement('p')
        let string = getLogString(log);
        p.innerHTML = string;
        loggingContainer.appendChild(p);
    }
}
function getLogString(log) {
    let string = `${formatTimestamp(log.timestamp)} - <span>${log.playerID}</span>`;
    switch (log.action) {
        case "shot": {
            string += ` sköt ${log.details.targetUser} (${log.details.targetUserLives} hjärtan kvar)`
            break;
        }
        case "move": {
            string += ` flyttade från [${log.details.from.row}, ${log.details.from.column}] till [${log.details.to.row}, ${log.details.to.column}]`
            break;
        }
        case "range": {
            string += ` ökade sin räckvidd till ${log.details.range}`
            break;
        }
        case "life": {
            string += ` återhämtade ett hjärta till ${log.details.lives}`
            break;
        }
        default:{
            console.log("Unknown action", log)
            break;
        }
    }
    return string;
}
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    
    const year = date.getFullYear().toString().slice(-2); // Get only last two digits of the year
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function logIn() {
    const email = document.getElementById('email-input-login').value;
    const password = document.getElementById('password-input').value;
    
    const { user, error } = await signIn(email, password);
    if (error) {
        displayError(error)
        return;
    }
    currentUserID = user.id;
    const logInDetails = {user_id : user.id}
    try {
        const response = await fetch(`${APIendpoint}/loginKfKbandvagn`, {method: "POST", headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify(logInDetails)});

        const data = await response.json();
        console.log(data.user)
        if (!response.ok) {
            console.log(data.error)
            displayError(data.error)
            throw new Error(data.error);
        }
        signInStatusText.innerHTML = `Inloggad som \n ${data.user.playerID}`;
        userPlayer = players.find(player => player.uuid == data.user.uuid);
        document.getElementById('range-text').innerHTML = userPlayer.range;
        document.getElementById('lives-text').innerHTML = userPlayer.lives;
        document.getElementById('tokens-text').innerHTML = userPlayer.tokens;
        if (userPlayer.lives <= 0) {displayMessage("player-dead")}
        console.log(userPlayer);
        showLoginCreate("login-container");
        document.getElementById('signed-in-dropdown').style.display = 'grid';
        document.getElementById('not-signed-in-dropdown').style.display = 'none';
        document.getElementById('logout-button').style.display = 'inline-block';
        document.getElementById('show-login-button').style.display = 'none';
        resetCanvasPos();
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function logOut() {
    // Logga ut
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        displayError('error_signout')
        return;
    } else {
        console.log('User signed out successfully');
        currentUserID = 0;
        userPlayer = null;
        signInStatusText.innerHTML = "Du är utloggad!";
        document.getElementById('signed-in-dropdown').style.display = 'grid';
        document.getElementById('not-signed-in-dropdown').style.display = 'none';
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('show-login-button').style.display = 'inline-block';
        resetCanvasPos();
        return;
    }
}

async function createAccount() {
    const email = document.getElementById('email-input-create').value;
    const playerID = document.getElementById('username-input-create').value;
    const password = document.getElementById('password-input-create').value;
    const color = document.getElementById('color-input-create').value;
    
    const { user, error } = await signUp(email, password);
    if (error) {
        console.log("error");
        displayError(error)
        return;
    }
    currentUserID = user.id;
    
    try {
        const dataToCreate = {playerID, color};
        console.log(dataToCreate)
        await createBandvagn(dataToCreate)
        showLoginCreate("create-account-container");
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function createBandvagn(createAccountData = null) {
    let createDetails;
    if (createAccountData === null) {
        const playerID = document.getElementById('username-input-band').value;
        const color = document.getElementById('color-input-band').value;

        createDetails = {playerID : playerID, color : color, user_id : currentUserID};
    } else {
        createDetails = {playerID : createAccountData.playerID, color : createAccountData.color};
    }
    
    try {
        const response = await fetch(`${APIendpoint}/createKfKbandvagn`, {method: "PATCH", headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify(createDetails)});

        const data = await response.json();
        console.log(data.data)
        if (!response.ok) {
            console.log(data.error);
            //displayError();
            throw new Error('Network response was not ok');
        }
        signInStatusText.innerHTML = `Inloggad som \n ${data.data.playerID}`;
        
        userPlayer = players.find(player => player.uuid == data.data.uuid);
        userPlayer.color = data.data.color;
        userPlayer.playerID = data.data.playerID;
        document.getElementById('range-text').innerHTML = userPlayer.range;
        document.getElementById('lives-text').innerHTML = userPlayer.lives;
        document.getElementById('tokens-text').innerHTML = userPlayer.tokens;
        console.log(userPlayer);
        if (userPlayer.lives <= 0) {displayMessage("player-dead")}
        if (createAccountData === null) {showLoginCreate("create-band-container");}
        resetCanvasPos();
        reloadPlayerImage(userPlayer);
        
        document.getElementById('signed-in-dropdown').style.display = 'grid';
        document.getElementById('not-signed-in-dropdown').style.display = 'none';
        document.getElementById('logout-button').style.display = 'inline-block';
        document.getElementById('show-login-button').style.display = 'none';
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}
    
async function getPlayerData() {
    try {
        const response = await fetch(`${APIendpoint}/getKfKbandvagn`, {method: "GET"});

        if (!response.ok) {
        throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const playerData = data.playerData;
        const boardData = data.boardData;
        console.log('API res:',data);

        // console.log('Position', data[1], data[1]['position'], data[1]['position']['column'])
        players = playerData;
        document.querySelectorAll('#free-wagons').forEach(t => {
            t.innerHTML = players.filter(player => player.taken_tank === false).length;
        })

        gameCols = boardData.size.columns;
        gameRows = boardData.size.rows;
        gameShrink = boardData.shrink;
        gameLogs = boardData.logs;
        resizeCanvas();
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function movePlayer (button) {
    let possDirections = {
        "up" : userPlayer.position.row > 0,
        "left" : userPlayer.position.column > 0,
        "right" : userPlayer.position.column < gameCols,
        "down" : userPlayer.position.row < gameRows
    };
    console.log(possDirections);
    const dataAtt = button.getAttribute("data-move");
    switch (dataAtt) {
        case "up": {
            if (!possDirections[dataAtt]) {console.warn("Not possible"); return}
            console.log("Move up");
            moveDirection = {row : -1, col: 0};
            doAction("move", moveDirection);
            break;
        }
        case "left": {
            if (!possDirections[dataAtt]) {console.warn("Not possible"); return}
            console.log("Move left");
            moveDirection = {row : 0, col: -1};
            doAction("move", moveDirection);
            break;
        }
        case "right": {
            if (!possDirections[dataAtt]) {console.warn("Not possible"); return}
            console.log("Move right");
            moveDirection = {row : 0, col: 1};
            doAction("move", moveDirection);
            break;
        }
        case "down": {
            if (!possDirections[dataAtt]) {console.warn("Not possible"); return}
            console.log("Move down");
            moveDirection = {row : 1, col: 0};
            doAction("move", moveDirection);
            break;
        }
        default: {
            console.warn("Unknown move");
            break;
        }
    }
}

async function doAction(action, moveDirection = null) {
    if (userPlayer.lives <= 0) {
        console.warn("You are dead cant do actions :(");
    }

    const tokensNeededObj = {'move': 1, 'shot': 1, 'range': 3, 'life' : 3};
    let target_player = null;
    switch (action) {
        case 'move': {
            if (tokensNeededObj[action] > userPlayer.tokens) {console.warn("Too few tokens"); return}
            break;
        } 
        case 'shot': {
            if (tokensNeededObj[action] > userPlayer.tokens) {console.warn("Too few tokens"); return}
            target_player = selectedCell.selectedPlayer.uuid;
            if (target_player === userPlayer.uuid) {console.warn("Cant shoot yourself"); return}
            if (selectedCell.selectedPlayer.lives <= 0) {console.warn("Player is already dead"); displayMessage("player_already_dead"); return}
            // Get distance client-side
            const selPos = userPlayer.position;
            const targPos = selectedCell.selectedPlayer.position;
            const dist = Math.max(Math.abs(selPos.column-targPos.column), Math.abs(selPos.row-targPos.row));
            if (dist > userPlayer.range) {console.warn("Not in range", dist); return}
            break;
        }
        case 'range': { 
            if (tokensNeededObj[action] > userPlayer.tokens) {console.warn("Too few tokens"); return}
            break;
        } 
        case 'life': {
            if (tokensNeededObj[action] > userPlayer.tokens) {console.warn("Too few tokens"); return}
            break;
        }  
        default: {
            console.log("Unknown action");
            return;
        }  
    }
    console.log("Valid action moving on...");
    const dataToSend = {user_id : currentUserID, action : action, moveDirection : moveDirection, targetUUID: target_player};
    try {
        const jwt = await supabase.auth.getSession().then(({ data }) => data.session?.access_token);
        console.log(jwt)
        if (!jwt) {
            throw new Error('User not authenticated');
        }

        const response = await fetch(`${APIendpoint}/doActionKfKbandvagn`, {method: "POST", headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify(dataToSend)});

        const data = await response.json();

        if (!response.ok) {
            displayError(data.error);
            throw new Error(`Network response was not ok ${data.error}`);
        }
        console.log(data.updatedData, data.shotData);
        // Update user
        userPlayer.position = data.updatedData.position;
        userPlayer.lives = data.updatedData.lives;
        userPlayer.range = data.updatedData.range;
        userPlayer.tokens = data.updatedData.tokens;
        document.getElementById('range-text').innerHTML = userPlayer.range;
        document.getElementById('lives-text').innerHTML = userPlayer.lives;
        document.getElementById('tokens-text').innerHTML = userPlayer.tokens;
        console.log(userPlayer.range, userPlayer.lives)

        if (selectedCell != undefined && userPlayer.uuid === selectedCell.selectedPlayer.uuid) {handleCellClick(userPlayer.position.row, userPlayer.position.column)}
        
        if (data.shotData) {
            // Update targeted player
            const p = selectedCell.selectedPlayer.position;
            selectedCell.bullet = new bullet(userPlayer.position.column, userPlayer.position.row, p.column, p.row);
            selectedCell.selectedPlayer.lives = data.shotData.lives;
            showPopup(p.column, p.row, selectedCell.selectedPlayer);
            reloadPlayerImage(selectedCell.selectedPlayer);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }

}

// Sign up a new user
const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        console.error('Error signing up:', error);
        return { data, error }
    } else {
        user = data.user;
        console.log('User signed up:', user);
        return { user, error }
    }
};
// Sign in an existing user
const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('Error signing in:', error);
        return { data, error };
    } else {
        user = data.user;
        console.log('User signed in:', user);
        setCookie("email", email, 7); // Valid for 7 days
        // setCookie("password", password, 7);
        console.log("Kaka sparad");
        return { user, error };
    }
};

// Cookies & local storage
function getCookie() {
    const email = getCookieValue("email");
    // const password = getCookieValue("password");

    if (email) {
      document.getElementById("email-input-login").value = email;
      console.log("Cookies found!");
    } else {
        console.log("No cookie data found! :(");
    }
}
// Helper to get a cookie
function getCookieValue(name) {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
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

async function preloadImages() {
    loadObjectToPixels();
    const orgPixels = preloadedPixels;
    const lightnessVals = [];
    for (let i = 0; i < orgPixels.length; i += 4) {
        const lightness = orgPixels[i] / 255;
        // Update pixel values
        lightnessVals.push(Math.min(lightness*100,80));
    }

    const worker = new Worker('worker.js');
    worker.onmessage = function (e) {
        const { pixels } = e.data;
        createImageFromPixels(pixels);
    };

    for (const player of players) {
        worker.postMessage({ preloadedPixels: orgPixels, player, lightnessVals });
    }
}

function createImageFromPixels(pixels, player = null) {
    const imageWidth = 16;
    const imageHeight = 24;

    const imageData = new ImageData(new Uint8ClampedArray(pixels), imageWidth, imageHeight);
    const transformedCanvas = document.createElement('canvas');
    transformedCanvas.width = imageWidth;
    transformedCanvas.height = imageHeight;
    const transformedContext = transformedCanvas.getContext('2d');
    transformedContext.imageSmoothingEnabled = false;
    transformedContext.putImageData(imageData, 0, 0);

    if (player === null) {
        preloadedImages.push(transformedCanvas);
    }
    else {
        const playerIndex = players.findIndex(p => p.uuid === player.uuid);
        console.log("Updating player at index:", playerIndex)
        preloadedImages[playerIndex] = transformedCanvas;
    }
}

function reloadPlayerImage(player) {
    console.log("Tries to reaload player: ", player)
    const worker = new Worker('worker.js');
    const orgPixels = preloadedPixels;

    worker.onmessage = function (e) {
        const { pixels } = e.data;
        createImageFromPixels(pixels, player);
    };

    const lightnessVals = [];
    for (let i = 0; i < orgPixels.length; i += 4) {
        const lightness = orgPixels[i] / 255;
        lightnessVals.push(Math.min(lightness * 100, 80));
    }

    worker.postMessage({ preloadedPixels: orgPixels, player, lightnessVals });
}

// Initialize Supabase
const supabaseUrl = 'https://swndedfdvpclvugxjetp.supabase.co';  // Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bmRlZGZkdnBjbHZ1Z3hqZXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNTg0NTgsImV4cCI6MjA0MjkzNDQ1OH0.1F0xS8NIl0VVICuXIxJ0j7ib8RomjBdycAVg5_jvAZw';  // Public anon key
supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Ändra till https://webmasteriet.vercel.app
const APIendpoint = "https://webmasteriet.vercel.app";
const ratio = Math.ceil(window.devicePixelRatio);
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const popup = document.getElementById('popup');
//const gameModeRadios = document.querySelectorAll('input[name="mode"]')
const signInStatusText = document.getElementById('signed-in-status');
const loggingContainer = document.getElementById('logging-container');

// Canvas settings
let gameRows = 100;
let gameCols = 100;
let gameShrink = 1;
let gameLogs;
const nodeColor = "#007bff";
const selectedNodeColor = "#e03b4b";
const gridColor = "#cccccc";

const STDcellSize = 20;
let cellSize = 20; // Default size of each cell
let zoomLevel = 1;
let offsetX = 0; // Pan offset
let offsetY = 0;

// Players
let players = [];
let userPlayer = null;
let selectedCell = null;
let currentUserID = 0;


// Timers and other
let timeoutPopup, timeoutSelectedCell, errorTimer;

// Best converter png-svg https://www.freeconvert.com/png-to-svg/
const customColor = "#FFFFFF"; // Custom color
const imageRatio = 16/24;
let preloadedPixels;
let preloadedCanvas, preloadedContext;
let preloadedImages = [];

window.onload = async function () {
    // init Event listeners
    initEventListeners();
    displayMessage();
    // Set canvas size to match the window
    resizeCanvas(); // Initial call
    window.addEventListener('resize', resizeCanvas);
    
    //await new Promise(resolve => {update(); resolve()});
    // Get old data meanwhile
    //await preloadSVG();
    await getPlayerData();
    displayLogs();

    const startTime = performance.now();
    await preloadImages();
    console.log("Images gotten in", performance.now()-startTime, "ms")
    //setLocalStorage("playerData", players);

    intervalID = setInterval(update, 1000/60);
}

let lastTime = performance.now();
let calls;
async function update() {
    /*const currentTime = performance.now();
    if (currentTime-lastTime >= 1000) {
        console.log(currentTime-lastTime, "ms", "Calls: ", calls);
        calls = 0;
        lastTime = currentTime;
    }
    calls++;*/
    draw();
    
}

// Draw the grid and nodes
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoomLevel, zoomLevel);

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    // Draw grid
    for (let i = 0; i <= gameRows; i++) {
        const y = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gameCols * cellSize, y);
        ctx.stroke();
    }
    for (let j = 0; j <= gameCols; j++) {
        const x = j * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameRows * cellSize);
        ctx.stroke();
    }
    // Draw shrink
    ctx.fillStyle = "rgba(240,60,80,0.3)";
    for (let i = 0; i <= gameRows-1; i++) {
        for (let j = 0; j <= gameCols-1; j++) {
            if (i < gameShrink || (gameRows-i) <= gameShrink || j < gameShrink || (gameCols-j) <= gameShrink) {
                const y = i * cellSize;
                const x = j * cellSize;
                ctx.fillRect(x,y, cellSize, cellSize);
            }
        }
    }
    
    
    // Draw players
    for (const player of players) {
        //let playerHex = `${player.color}`;
        const x = player.position.column * cellSize;
        const y = player.position.row * cellSize;
        
        if (preloadedImages[players.indexOf(player)] !== undefined) {
            ctx.drawImage(preloadedImages[players.indexOf(player)], x+(cellSize*imageRatio/4), y+1, cellSize*imageRatio, cellSize-2);
        }

        /*ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 5, 0, Math.PI * 2);
        ctx.fill();*/
    }
    
    // Draw the logged-in user
    if (userPlayer !== null) {
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(userPlayer.position.column*cellSize + cellSize / 2, userPlayer.position.row*cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
        ctx.stroke();
        /*ctx.fillStyle = "rgba(40,40,40,0.3)";
        ctx.fillRect(userPlayer.position.column*cellSize, userPlayer.position.row*cellSize, cellSize, cellSize);
        */
        // draw range
        ctx.strokeStyle = '#111111';
        
        ctx.lineWidth = 2;
        const cell = {x:userPlayer.position.column, y:userPlayer.position.row}
        const range = userPlayer.range;
        const xRange = {x0:Math.abs(Math.min(0, (cell.x - range))), x1: Math.abs(Math.min(0, gameCols-(cell.x + range+1)))}
        const yRange = {y0:Math.abs(Math.min(0, (cell.y - range))), y1: Math.abs(Math.min(0, gameRows-(cell.y + range+1)))}
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.rect(((cell.x - range + xRange.x0) * cellSize), (cell.y - range + yRange.y0) * cellSize, 
        ((range*2) + 1 -xRange.x0-xRange.x1) * cellSize, ((range*2) + 1 -yRange.y0-yRange.y1) * cellSize);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    if (selectedCell !== null) {
        // Show range
        ctx.fillStyle = "rgba(180,20,30, 0.1)";
        if (selectedCell.cellsInRange !== undefined) {
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(selectedCell.x*cellSize + cellSize / 2, selectedCell.y*cellSize + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2);
            ctx.stroke();

            selectedCell.cellsInRange.forEach(cell => {
                ctx.fillRect(cell.x*cellSize, cell.y*cellSize,cellSize,cellSize);
            });
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 2;
            const range = selectedCell.selectedPlayer.range;
            const xRange = {x0:Math.abs(Math.min(0, (selectedCell.x - range))), x1: Math.abs(Math.min(0, gameCols-(selectedCell.x + range+1)))}
            const yRange = {y0:Math.abs(Math.min(0, (selectedCell.y - range))), y1: Math.abs(Math.min(0, gameRows-(selectedCell.y + range+1)))}
            ctx.beginPath();
            ctx.rect(((selectedCell.x - range + xRange.x0) * cellSize), (selectedCell.y - range + yRange.y0) * cellSize, 
            ((range*2) + 1 -xRange.x0-xRange.x1) * cellSize, ((range*2) + 1 -yRange.y0-yRange.y1) * cellSize);
            ctx.stroke();
        }else {
            // Highlight node, no player
            ctx.fillStyle = selectedNodeColor;
            ctx.beginPath();
            ctx.arc(selectedCell.x*cellSize + cellSize / 2, selectedCell.y*cellSize + cellSize / 2, cellSize / 5, 0, Math.PI * 2);
            ctx.fill();
        }

        selectedCell.clickAnimation.updateParticles();
        if (selectedCell.explosion !== undefined) {
            selectedCell.explosion.updateParticles();
        }
        if (selectedCell.bullet !== undefined) {
            selectedCell.bullet.updateBullet();
        }
    }


    // Show grid numbers
    ctx.textAlign = "center";
    ctx.font = `${10}px serif`;
    if (zoomLevel > 10) {
        ctx.font = `${100/zoomLevel}px serif`;
    }
    ctx.fillStyle = "#000";
    for (let i = 0; i <= gameRows-1; i++) {
        ctx.fillText(i, -(Math.min(offsetX/zoomLevel,cellSize))+5, (i+0.5) * cellSize);
    }
    for (let j = 0; j <= gameCols-1; j++) {
        ctx.fillText(j, (j+0.5) * cellSize, -(Math.min(offsetY/zoomLevel,cellSize))+10); 
    }

    // If a popup is active, update it!! popup.style.display === 'flex' && 
    if (selectedCell) {
        const rect = canvas.getBoundingClientRect();
        const { x: col, y: row } = selectedCell;
        const canvasX = rect.left + (col+0.5) * cellSize * zoomLevel + offsetX - 2;
        const canvasY = row * cellSize * zoomLevel + offsetY;
        popup.style.left = `${canvasX}px`;
        popup.style.top = `${canvasY}px`;
        if (canvasX<rect.left || canvasY<0 || canvasY>rect.height || canvasX>(rect.left+rect.width)) {
            popup.style.display = 'none'
        } else {
            popup.style.display = 'flex'
        }
        
    }
    ctx.restore();
}

function handleCellClick(clickedRow, clickedColumn) {
    console.log(`Clicked cell: (${clickedRow}, ${clickedColumn})`);
    
    if (selectedCell !== null && selectedCell.x === clickedColumn && selectedCell.y === clickedRow) {
        selectedCell = null;
        popup.style.display = 'none';
        return;
    }
    selectedCell = {x : clickedColumn, y : clickedRow}
    
    selectedCell.clickAnimation = new explosion(clickedRow, clickedColumn, 'click');
    // See if there is any player at the pressed cell
    let selectedPlayer = players.find(player => {
        return player.position.row === selectedCell.y && player.position.column === selectedCell.x;
    });

    if (selectedPlayer !== undefined) {
        //console.log("player selected", selectedPlayer);
        // Get range limits 
        const minRow = Math.max(clickedRow - selectedPlayer.range, 0);
        const maxRow = Math.min(clickedRow + selectedPlayer.range, gameRows);
        const minColumn = Math.max(clickedColumn - selectedPlayer.range, 0);
        const maxColumn = Math.min(clickedColumn + selectedPlayer.range, gameCols);

        let cellsInRange = [];
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minColumn; col <= maxColumn; col++) {
                // Add cell object to the array
                cellsInRange.push({ x : col, y : row});
            }
        }
        selectedCell.cellsInRange = cellsInRange;
        selectedCell.selectedPlayer = selectedPlayer;
        console.log(selectedCell.selectedPlayer.tokens);
    }
    /*clearTimeout(timeoutSelectedCell);
    timeoutSelectedCell = setTimeout(() => {
        selectedCell = null;
    }, 5000);*/
    // Show popup
    showPopup(clickedColumn, clickedRow, selectedPlayer);
}

function initEventListeners() {
    const zoomSpeed = 0.05;
    let isPanning = false;
    let moved = false;
    let startPos, startX, startY;
    // Handle mouse and touch on canvas
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();

        const zoom = e.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const canvasX = (mouseX - offsetX) / zoomLevel;
        const canvasY = (mouseY - offsetY) / zoomLevel;

        zoomLevel *= zoom;

        offsetX = mouseX - canvasX * zoomLevel;
        offsetY = mouseY - canvasY * zoomLevel;

        draw();
    });
    
    canvas.addEventListener('mousedown', (e) => {
        //console.log("Start panning...");
        isPanning = true;
        moved = false;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        startPos = {x:e.clientX, y:e.clientY};
    });
    canvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                // console.log("Panning...");
                moved = true; // Movement threshold to distinguish panning

                offsetX = e.clientX - startX;
                offsetY = e.clientY - startY;
            }
            draw();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        isPanning = false;
        if (!moved) {
            handleCellClickAt(e.clientX, e.clientY);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        //console.log("Stopped panning...");
        isPanning = false;
    });

    let lastTouchDistance = null; // For pinch-zoom
    let zoomed = false;
    // Handle touch events
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            console.log("Start moving 1 finger");
            // Single touch - start panning
            const touch = e.touches[0];
            startX = touch.clientX - offsetX;
            startY = touch.clientY - offsetY;
            startPos = { x: touch.clientX, y: touch.clientY }
            moved = false;
            zoomed = false;
        } else if (e.touches.length === 2) {
            console.log("Start zooming 2 fingers");
            // Two fingers - start pinch zoom
            lastTouchDistance = getTouchDistance(e.touches);
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();

        if (e.touches.length === 1 && !zoomed) {
            console.log("Panning 1 finger");
            // Single touch - panning
            const touch = e.touches[0];
            dx = touch.clientX - startPos.x;
            dy = touch.clientY - startPos.y;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                offsetX = touch.clientX - startX;
                offsetY = touch.clientY - startY;
                moved = true;
            }
            draw();
        } else if (e.touches.length === 2 && lastTouchDistance !== null) {
            console.log("Zooming 2 fingers");
            zoomed = true;
            // Two fingers - pinch zoom
            const currentDistance = getTouchDistance(e.touches);
            const zoom = currentDistance / lastTouchDistance;

            const rect = canvas.getBoundingClientRect();
            const touchX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const touchY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

            const canvasX = (touchX - offsetX) / zoomLevel;
            const canvasY = (touchY - offsetY) / zoomLevel;

            zoomLevel *= zoom;

            offsetX = touchX - canvasX * zoomLevel;
            offsetY = touchY - canvasY * zoomLevel;

            lastTouchDistance = currentDistance;
            draw();
        }
    });

    canvas.addEventListener('touchend', (e) => {
        
        if (e.touches.length === 0) {
            console.log("Stop touch 0 fingers");
            // Check if it was a tap
            // Click handled in mouseup event
        } else if (e.touches.length === 1) {
            console.log("Transition to 1 finger");
            if (zoomed) {
                // Update panning state for the remaining touch
                const touch = e.touches[0];
                startX = touch.clientX - offsetX;
                startY = touch.clientY - offsetY;
                zoomed = false; // Reset zoom flag
            }
            lastTouchDistance = null;
        } else if (e.touches.length === 2) {
            console.log("Stop touch 2 fingers");
            lastTouchDistance = null;
        }
    });

    // Utility functions
    const getTouchDistance = (touches) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx**2 + dy**2);
    };

    const handleCellClickAt = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const canvasX = (clientX - rect.left - offsetX) / zoomLevel;
        const canvasY = (clientY - rect.top - offsetY) / zoomLevel;

        const col = Math.floor(canvasX / cellSize);
        const row = Math.floor(canvasY / cellSize);

        if (col >= 0 && col < gameCols && row >= 0 && row < gameRows) {
            handleCellClick(row, col);
        } else {
            selectedCell = null;
            popup.style.display = 'none';
        }
    };


    // Other
    document.querySelectorAll("#showPasswordBtn").forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-targetID');
            showPassword(target);
        })
    });
}

function showPopup(col, row, player) {
    const rect = canvas.getBoundingClientRect();
    // TBD: Different popup depending on gameMode
    const canvasX = rect.left + (col+0.5) * cellSize * zoomLevel + offsetX;
    const canvasY = row * cellSize * zoomLevel + offsetY;

    popup.style.display = 'flex';
    popup.style.left = `${canvasX}px`;
    popup.style.top = `${canvasY}px`;

    const popupText = document.getElementById('popup-position-text');
    const playerIdTxt = document.getElementById('popup-playerID-text');
    popupText.textContent = `(${col}, ${row})`;
    if (player !== undefined) {
        playerIdTxt.textContent = `${player.playerID}`;
        playerIdTxt.style.display = "block"
    } else {playerIdTxt.style.display = "none"}
    

    if (player !== undefined && player !== userPlayer) {
        // Create elements in popup
        const health = document.getElementById('popup-health-text');
        health.textContent = `Liv: ${player.lives}`;

        if (currentUserID !== 0) {document.getElementById('popup-takeshot-button').style.display = 'block'}
        else {document.getElementById('popup-takeshot-button').style.display = 'none'}
        
        document.getElementById('popup-other-player-container').style.display = 'block';
        document.getElementById('move-user-container').style.display = 'none';
    } else if (player == userPlayer && currentUserID !== 0) {
        console.log("Hey! Thats me");
        const moveCont = document.getElementById('move-user-container');
        moveCont.style.display = 'flex';
        document.getElementById('popup-other-player-container').style.display = 'none';
    } else {
        document.getElementById('popup-other-player-container').style.display = 'none';
        document.getElementById('move-user-container').style.display = 'none';
    }
    

    /*clearTimeout(timeoutPopup);
    const startTime = Date.now();
    timeoutPopup = setTimeout(() => {
        const duration = Date.now() - startTime;
        console.log("Timeout duration:", duration, "ms");
        // Hide the popup
        popup.style.display = 'none';
    }, 5000);*/
}
