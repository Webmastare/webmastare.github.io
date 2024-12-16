function resizeCanvas() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Limit canvas width something of window width
    const maxWidth = 0.6;
    const maxHeight = 0.5;
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
    //canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);

    // Set canvas dimensions
    cellSize = STDcellSize;
    draw();
}

function resetCanvasPos() {
    zoomLevel = 1;
    offsetX = 0;
    offsetY = 0;
    draw();
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
        console.log(userPlayer);
        showLoginCreate("login-container");
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
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

    const createDetails = {playerID : playerID, color : color, user_id : user.id};
    console.log(createDetails);
    
    try {
        const response = await fetch(`${APIendpoint}/createKfKbandvagn`, {method: "PATCH", headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify(createDetails)});

        if (!response.ok) {
            console.log(data.error);
            //displayError();
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data.data)

        signInStatusText.innerHTML = `Inloggad som \n ${data.data.playerID}`;
        
        userPlayer = players.find(player => player.uuid == data.data.uuid);
        userPlayer = data.data;
        document.getElementById('range-text').innerHTML = userPlayer.range;
        document.getElementById('lives-text').innerHTML = userPlayer.lives;
        console.log(userPlayer);
        showLoginCreate("create-account-container");
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function createBandvagn() {
    const playerID = document.getElementById('username-input-band').value;
    const color = document.getElementById('color-input-band').value;

    const createDetails = {playerID : playerID, color : color, user_id : currentUserID};
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
        console.log(userPlayer);
        showLoginCreate("create-band-container");
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
        
        console.log('API res:',data);
        // console.log('Position', data[1], data[1]['position'], data[1]['position']['column'])
        players = data;
        document.getElementById('free-wagons').innerHTML = players.filter(player => player.playerID == "No-player").length;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function getPlayerTestData() {
    const data = [
        {
            "playerID": "No-player",
            "uuid": "b326dfd9-550a-41ff-ad57-037751c09238",
            "tokens": 0,
            "position": {
                "row": 3,
                "column": 1
            },
            "lives": 3,
            "range": 2,
            "color": "4281f9"
        },
        {
            "playerID": "No-player",
            "uuid": "afcd5cd2-7e0b-4b44-a0ba-9bbd39289437",
            "tokens": 0,
            "position": {
                "row": 3,
                "column": 8
            },
            "lives": 3,
            "range": 2,
            "color": "f13ed2"
        },
        {
            "playerID": "No-player",
            "uuid": "91be22ab-28a1-46e6-8db7-57ac4cf9e36b",
            "tokens": 0,
            "position": {
                "row": 7,
                "column": 4
            },
            "lives": 3,
            "range": 2,
            "color": "e44c1d"
        },
        {
            "playerID": "No-player",
            "uuid": "b06351af-b0c4-4d0f-8e7b-8eba6ee12c66",
            "tokens": 0,
            "position": {
                "row": 8,
                "column": 2
            },
            "lives": 3,
            "range": 2,
            "color": "b42b69"
        },
        {
            "playerID": "No-player",
            "uuid": "07f62461-4615-46b0-ae3e-0b1d35269798",
            "tokens": 0,
            "position": {
                "row": 10,
                "column": 1
            },
            "lives": 3,
            "range": 2,
            "color": "8756d4"
        },
        {
            "playerID": "Laban",
            "uuid": "868d0249-f196-4095-9425-6664c1a53f2b",
            "tokens": 0,
            "position": {
                "row": 2,
                "column": 9
            },
            "lives": 3,
            "range": 2,
            "color": "#330aff"
        },
        {
            "playerID": "Laban",
            "uuid": "1a4485d4-acba-4cbe-ad40-4d4130dad51e",
            "tokens": 0,
            "position": {
                "row": 4,
                "column": 3
            },
            "lives": 3,
            "range": 2,
            "color": "#12ce36"
        },
        {
            "playerID": "Laban",
            "uuid": "f3d0b901-feea-45b6-a51a-214169f18718",
            "tokens": 0,
            "position": {
                "row": 1,
                "column": 4
            },
            "lives": 3,
            "range": 2,
            "color": "#12ce36"
        },
        {
            "playerID": "Laban12",
            "uuid": "8c22d2cc-4c80-4a0a-8fa4-0c6a5a3bc0ab",
            "tokens": 0,
            "position": {
                "row": 8,
                "column": 9
            },
            "lives": 3,
            "range": 2,
            "color": "#12ce36"
        },
        {
            "playerID": "ee",
            "uuid": "0b7691ad-6550-43f0-8e5b-897b342c8a78",
            "tokens": 0,
            "position": {
                "row": 0,
                "column": 3
            },
            "lives": 3,
            "range": 2,
            "color": "#12ce36"
        }
    ];
    console.log('API res:',data);
    // console.log('Position', data[1], data[1]['position'], data[1]['position']['column'])
    players = data;
    document.getElementById('free-wagons').innerHTML = players.filter(player => player.playerID == "No-player").length;
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

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data.updatedData, data.shotData);
        // Update user
        userPlayer.position = data.updatedData.position;
        userPlayer.lives = data.updatedData.lives;
        userPlayer.range = data.updatedData.range;
        if (userPlayer.uuid === selectedCell.selectedPlayer.uuid) {handleCellClick(userPlayer.position.row, userPlayer.position.column)}

        document.getElementById('range-text').innerHTML = userPlayer.range;
        document.getElementById('lives-text').innerHTML = userPlayer.lives;
        if (data.shotData) {
            // Update targeted player
            const p = selectedCell.selectedPlayer.position;
            selectedCell.explosion = new explosion(p.row, p.column, 'explosion')
            selectedCell.selectedPlayer.lives = data.shotData.lives;
            showPopup(p.column, p.row, selectedCell.selectedPlayer);
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
        return { user, error };
    }
};

// Initialize Supabase
const supabaseUrl = 'https://swndedfdvpclvugxjetp.supabase.co';  // Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bmRlZGZkdnBjbHZ1Z3hqZXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNTg0NTgsImV4cCI6MjA0MjkzNDQ1OH0.1F0xS8NIl0VVICuXIxJ0j7ib8RomjBdycAVg5_jvAZw';  // Public anon key
supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Ändra till https://webmasteriet.vercel.app
const APIendpoint = "http://localhost:3333";
const ratio = Math.ceil(window.devicePixelRatio);
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const popup = document.getElementById('popup');
//const gameModeRadios = document.querySelectorAll('input[name="mode"]')
const signInStatusText = document.getElementById('signed-in-status');

// Canvas settings
const gameRows = 100;
const gameCols = 100;
const nodeColor = "#007bff";
const selectedNodeColor = "#e03b4b";
const gridColor = "#cccccc";

const STDcellSize = 20;
let cellSize = 20; // Default size of each cell
let zoomLevel = 1;
let offsetX = 0; // Pan offset
let offsetY = 0;

let isPanning = false;
let moved = false;
let startX, startY;

// Players
let players = [];
let userPlayer = null;
let selectedCell = null;
let currentUserID = 0;

let gameMode = 'i'; // 'i' investigate, 'a' action

// Timers and other
let timeoutPopup, timeoutSelectedCell, errorTimer;


const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 1024 1024">
    <path d="M512 301.2m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z" fill="#E73B37" />
    <path d="M400.3 744.5c2.1-0.7 4.1-1.4 6.2-2-2 0.6-4.1 1.3-6.2 2z m0 0c2.1-0.7 4.1-1.4 6.2-2-2 0.6-4.1 1.3-6.2 2z" fill="#39393A" />
    <path d="M511.8 256.6c24.4 0 44.2 19.8 44.2 44.2S536.2 345 511.8 345s-44.2-19.8-44.2-44.2 19.9-44.2 44.2-44.2m0-20c-35.5 0-64.2 28.7-64.2 64.2s28.7 64.2 64.2 64.2 64.2-28.7 64.2-64.2-28.7-64.2-64.2-64.2z" fill="#E73B37" />
    <path d="M730.7 529.5c0.4-8.7 0.6-17.4 0.6-26.2 0-179.6-86.1-339.1-219.3-439.5-133.1 100.4-219.2 259.9-219.2 439.5 0 8.8 0.2 17.5 0.6 26.1-56 56-90.6 133.3-90.6 218.7 0 61.7 18 119.1 49.1 167.3 30.3-49.8 74.7-90.1 127.7-115.3 
    39-18.6 82.7-29 128.8-29 48.3 0 93.9 11.4 134.3 31.7 52.5 26.3 96.3 67.7 125.6 118.4 33.4-49.4 52.9-108.9 52.9-173.1 0-85.4-34.6-162.6-90.5-218.6zM351.1 383.4c9.2-37.9 22.9-74.7 40.6-109.5a502.1 502.1 0 0 1 63.6-95.9c17.4-20.6 36.4-39.9 56.8-57.5 20.4 17.6 39.4 36.9 56.8 57.5 24.8 29.5 46.2 61.8 63.6 95.9 17.7 34.8 31.4 71.6 40.6 109.5 8.7 35.8 13.5 72.7 14.2 109.9C637.4 459 577 438.9 512 438.9c-65 0-125.3 20.1-175.1 54.4 0.7-37.2 5.5-74.1 14.2-109.9z m-90.6 449.2c-9.1-27-13.7-55.5-13.7-84.4 0-35.8 7-70.6 20.8-103.2 8.4-19.8 19-38.4 31.9-55.5 9.7 61.5 29.5 119.7 57.8 172.6-36.4 17.8-69 41.6-96.8 70.5z m364.2-85.3c-0.7-0.3-1.5-0.5-2.2-0.8-0.4-0.2-0.9-0.3-1.3-0.5-0.6-0.2-1.3-0.5-1.9-0.7-0.8-0.3-1.5-0.5-2.3-0.8-0.8-0.3-1.5-0.5-2.3-0.7l-0.9-0.3c-1-0.3-2.1-0.7-3.1-1-1.2-0.4-2.4-0.7-3.5-1.1l-3-0.9c-0.2-0.1-0.4-0.1-0.7-0.2-1.1-0.3-2.3-0.7-3.4-1-1.2-0.3-2.4-0.6-3.5-0.9l-3.6-0.9-3.6-0.9c-1-0.3-2.1-0.5-3.1-0.7-1.2-0.3-2.4-0.5-3.6-0.8-1.3-0.3-2.5-0.6-3.8-0.8h-0.3c-0.9-0.2-1.9-0.4-2.8-0.6-0.4-0.1-0.7-0.1-1.1-0.2-1.1-0.2-2.2-0.4-3.4-0.6-1.2-0.2-2.4-0.4-3.6-0.7l-5.4-0.9c-0.9-0.1-1.9-0.3-2.8-0.4-0.8-0.1-1.6-0.3-2.5-0.4-2.6-0.4-5.1-0.7-7.7-1-1.2-0.1-2.3-0.3-3.5-0.4h-0.4c-0.9-0.1-1.8-0.2-2.8-0.3-1.1-0.1-2.1-0.2-3.2-0.3-1.7-0.2-3.4-0.3-5.1-0.4-0.8-0.1-1.5-0.1-2.3-0.2-0.9-0.1-1.9-0.1-2.8-0.2-0.4 0-0.8 0-1.2-0.1-1.1-0.1-2.1-0.1-3.2-0.2-0.5 0-1-0.1-1.5-0.1-1.3-0.1-2.6-0.1-3.9-0.1-0.8 0-1.5-0.1-2.3-0.1-1.2 0-2.4 0-3.5-0.1h-13.9c-2.3 0-4.6 0.1-6.9 0.2-0.9 0-1.9 0.1-2.8 0.1-0.8 0-1.5 0.1-2.3 0.1-1.4 0.1-2.8 0.2-4.1 0.3-1.4 0.1-2.7 0.2-4.1 0.3-1.4 0.1-2.7 0.2-4.1 0.4-0.6 0-1.2 
    0.1-1.8 0.2l-7.8 0.9c-1.1 0.1-2.1 0.3-3.2 0.4-1 0.1-2.1 0.3-3.1 0.4-3.2 0.5-6.4 0.9-9.5 1.5-0.7 0.1-1.4 0.2-2.1 0.4-0.9 0.1-1.7 0.3-2.6 0.5-1.1 0.2-2.3 0.4-3.4 0.6-0.9 0.2-1.7 0.3-2.6 0.5-0.4 0.1-0.8 0.1-1.1 0.2-0.7 0.1-1.4 0.3-2.1 0.4-1.2 0.3-2.4 0.5-3.6 0.8-1.2 0.3-2.4 0.5-3.6 0.8-0.2 0-0.4 0.1-0.6 0.1-0.5 0.1-1 0.2-1.5 0.4-1.1 0.3-2.3 0.6-3.5 0.9-1.3 0.3-2.5 0.6-3.8 1-0.4 0.1-0.9 0.2-1.4 0.4-1.3 0.4-2.7 0.7-4 1.1-1.5 0.4-3 0.9-4.6 1.3-1 0.3-2.1 0.6-3.1 1-2.1 0.6-4.1 1.3-6.2 2-0.7 0.2-1.4 0.5-2.1 0.7-15-27.5-27.4-56.4-37-86.2-11.7-36.1-19.2-73.6-22.5-111.6-0.6-6.7-1-13.3-1.3-20-0.1-1.2-0.1-2.4-0.1-3.6-0.1-1.2-0.1-2.4-0.1-3.6 0-1.2-0.1-2.4-0.1-3.6 0-1.2-0.1-2.4-0.1-3.7 18.8-14 39.2-25.8 61-35 36.1-15.3 74.5-23 114.1-23 39.6 0 78 7.8 114.1 23 21.8 9.2 42.2 20.9 61 35v0.1c0 1 0 1.9-0.1 2.9 0 1.4-0.1 2.8-0.1 4.3 0 0.7 0 1.3-0.1 2-0.1 1.8-0.1 3.5-0.2 5.3-0.3 6.7-0.8 13.3-1.3 20-3.3 38.5-11 76.5-23 113-9.7 30.3-22.3 59.4-37.6 87.1z m136.8 90.9a342.27 342.27 0 0 0-96.3-73.2c29.1-53.7 49.5-112.8 59.4-175.5 12.8 17.1 23.4 35.6 31.8 55.5 13.8 32.7 20.8 67.4 20.8 103.2 0 31-5.3 61.3-15.7 90z" fill="#39393A"/>
    <path d="M512 819.3c8.7 0 24.7 22.9 24.7 60.4s-16 60.4-24.7 60.4-24.7-22.9-24.7-60.4 16-60.4 24.7-60.4m0-20c-24.7 0-44.7 36-44.7 80.4 0 44.4 20 80.4 44.7 80.4s44.7-36 44.7-80.4c0-44.4-20-80.4-44.7-80.4z" fill="#E73B37" />
    </svg>`;
const customColor = "#FFFFFF"; // Custom color

let preloadedImage;
const preloadSVG = () => {
    const img = new Image();
    const svgBlob = new Blob([svgData.replace('currentColor', customColor)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
        preloadedImage = img; // Store the loaded image
        URL.revokeObjectURL(url); // Free memory
    };
    img.src = url;
};
preloadSVG();


window.onload = async function () {
    // init Event listeners
    initEventListeners();
    // Set canvas size to match the window
    resizeCanvas(); // Initial call
    window.addEventListener('resize', resizeCanvas);
    
    await getPlayerData();
    intervalID = setInterval(update, 1000/60);
}

function update() {
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
    
    // Draw players
    //console.log('Position', data[1], data[1]['position'], data[1]['position']['column'])

    ctx.fillStyle = nodeColor;
    for (const player of players) {
        let playerHex = `${player.color}`;
        const x = player.position.column * cellSize;
        const y = player.position.row * cellSize;
        
        if (preloadedImage) {
            const red = parseInt(playerHex.substring(1, 3), 16);
            const green = parseInt(playerHex.substring(3, 5), 16);
            const blue = parseInt(playerHex.substring(5, 7), 16);
            
            // Concatenate these codes into proper RGBA format
            const opacity = 1;
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${opacity})`
            ctx.drawImage(preloadedImage, x, y, cellSize, cellSize); // Use the preloaded image
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillRect(x+1, y+1, cellSize-2, cellSize-2);
            ctx.globalCompositeOperation = 'source-over'; // Reset blending mode
        }
        /*
        ctx.beginPath();
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
    }


    // Show grid numbers
    ctx.textAlign = "center";
    ctx.font = `${10}px serif`;
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
        const canvasX = rect.left + col * cellSize * zoomLevel + offsetX;
        const canvasY = row * cellSize * zoomLevel + offsetY;
        console.log();
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
    
    switch (gameMode) {
        case 'i': {
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
            }
            /*clearTimeout(timeoutSelectedCell);
            timeoutSelectedCell = setTimeout(() => {
                selectedCell = null;
            }, 5000);*/
            // Show popup
            showPopup(clickedColumn, clickedRow, selectedPlayer);
            break;
        }
        case 'a': {
            // Find all players within the range
            const playersInRange = players.filter(player => {
                const { row, column } = player.position;
                return row >= minRow && row <= maxRow && column >= minColumn && column <= maxColumn;
            });

            // Log players in range
            if (playersInRange.length > 0) {
                console.log("Players within range:");
                playersInRange.forEach(player => {
                    console.log(`PlayerID: ${player.playerID}, Position: (${player.position.row}, ${player.position.column})`);
                });
            } else {
                console.log("No players within range.");
            }
            break;
        }
        default: {
            console.log("Unkown gameMode...");
            break;
        }
    }
}

function initEventListeners() {
    // Handle zoom
    canvas.addEventListener('wheel', (e) => {
        //console.log("Zooming...");
        e.preventDefault();

        const zoomSpeed = 0.05;
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
    // Handle panning
    let startPos;
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
                console.log("Panning...");
                moved = true; // Movement threshold to distinguish panning

                offsetX = e.clientX - startX;
                offsetY = e.clientY - startY;
            }
            draw();
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        //console.log("Stopped panning...");
        isPanning = false;
        if (!moved) {
            const rect = canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left - offsetX)/zoomLevel;
            const canvasY = (e.clientY - rect.top - offsetY)/zoomLevel;

            const col = Math.floor(canvasX / cellSize);
            const row = Math.floor(canvasY / cellSize);

            if (col >= 0 && col < gameCols && row >= 0 && row < gameRows) {
                handleCellClick(row, col);
            } else {
                selectedCell = null;
                popup.style.display = 'none';
            }
        }
    });
    canvas.addEventListener('mouseleave', () => {
        //console.log("Stopped panning...");
        isPanning = false;
    });

    // Others
    /*gameModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const selected = document.querySelector('input[name="mode"]:checked');
            gameMode = selected.getAttribute("data-mode");
        });
    });*/
}

function showPopup(col, row, player) {
    const rect = canvas.getBoundingClientRect();
    // TBD: Different popup depending on gameMode
    const canvasX = rect.left + col * cellSize * zoomLevel + offsetX;
    const canvasY = row * cellSize * zoomLevel + offsetY;

    popup.style.display = 'flex';
    popup.style.left = `${canvasX}px`;
    popup.style.top = `${canvasY}px`;

    const popupText = document.getElementById('popup-position-text');
    popupText.textContent = `(${col}, ${row})`;

    if (player !== undefined && player !== userPlayer) {
        // Create elements in popup
        const health = document.getElementById('popup-health-text');
        health.textContent = `Liv: ${player.lives}`;

        const btn = document.getElementById('popup-takeshot-button');

        // Example interaction for the button
        btn.addEventListener("click", () => {
            console.log("Skjut!!");
        });
        document.getElementById('popup-other-player-container').style.display = 'block';
        document.getElementById('move-user-container').style.display = 'none';
    } else if (player == userPlayer) {
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
