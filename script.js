// Minesweeper Game

import { calculatePerformance } from './metrics.js';

let timerInterval;
let board = [];
let boardSize; // Define boardSize globally
let numMines; // Define numMines globally
let settings; // Define settings globally
let timeElapsed = 0; // Initialize timeElapsed globally
let pace = 0; // Initialize pace globally
let revealedCount = 0; // Define revealedCount globally
let clicks = 0;
let gameID; // Unique ID based on current timestamp
var gameResult = "in progress";
let startingPosition = "";
let moveNumber = 0;
let moveList = {}; // Pcab0
let lastClickedRow = -1;
let lastClickedCol = -1;
let mineLocations = []; // Array to store mine positions
let gameOver = false; // Track game over state
let flagsPlaced = 0; // Track number of flags placed

const port = 3000;
const boardElement = document.getElementById('board');
const newGameButton = document.getElementById('new-game');
const optionsButton = document.getElementById('options');
const scoresButton = document.getElementById('scores');
const exitButton = document.getElementById('exit');
const flagsElement = document.getElementById('flags');
const timeElement = document.getElementById('time');
const paceElement = document.getElementById('pace');

function fetchSettings() {
    return fetch('settings.json')
        .then(response => response.json())
        .then(settingsData => {
            settings = settingsData; // Store settings globally
            return settings;
        })
        .catch(error => console.error('Error fetching settings:', error));
}

function setBoardSize() {
    return fetchSettings().then(settings => {
        if (settings.mode === 'simple') {
            if(settings.modeOptions.simple === 'easy') { 
                boardSize = settings.modeOptions.simpleOptions.easy.boardSize;
            } else if (settings.modeOptions.simple === 'medium') {
                boardSize = settings.modeOptions.simpleOptions.medium.boardSize;
            } else if (settings.modeOptions.simple === 'hard') {
                boardSize = settings.modeOptions.simpleOptions.hard.boardSize;
            }
        } else if (settings.mode === 'random') {
            boardSize = settings.modeOptions.random.minBoardSize + Math.floor(Math.random() * (settings.modeOptions.random.maxBoardSize - settings.modeOptions.random.minBoardSize));
        } else if (settings.mode === 'custom') {
            boardSize = settings.modeOptions.custom.boardSize;
        } else {
            boardSize = 9;
        }
        console.log('Game mode set to: ', settings.mode);
        console.log('Board size set to: ', boardSize);
        var root = document.querySelector(':root');
        var rootStyles = getComputedStyle(root);
        root.style.setProperty('--grid-size', boardSize);
        return boardSize;
    });
}

function setPercentMines() {
    return fetchSettings().then(settings => {
        let percentMines;
        if (settings.mode === 'simple') {
            if (settings.modeOptions.simple === 'easy') { 
                percentMines = settings.modeOptions.simpleOptions.easy.percentMines;
            } else if (settings.modeOptions.simple === 'medium') {
                percentMines = settings.modeOptions.simpleOptions.medium.percentMines;
            } else if (settings.modeOptions.simple === 'hard') {
                percentMines = settings.modeOptions.simpleOptions.hard.percentMines;
            }
        } else if (settings.mode === 'random') {
            percentMines = settings.modeOptions.random.minPercentMines + Math.random() * (settings.modeOptions.random.maxPercentMines - settings.modeOptions.random.minPercentMines);
        } else if (settings.mode === 'custom') {
            percentMines = settings.modeOptions.custom.percentMines;
        } else {
            percentMines = 0.09;
        }
        console.log('Percent mines set to: ', percentMines);
        return percentMines;
    });
}

async function initializeBoard() {
    console.log('Initializing board...');
    // Check metrics setting and update pace visibility
    fetch('settings.json')
        .then(response => response.json())
        .then(settings => {
            const paceElement = document.getElementById('pace');
            const performanceElement = document.getElementById('performance');
            paceElement.style.display = settings.displayMetrics ? 'inline' : 'none';
            performanceElement.style.display = settings.displayMetrics ? 'inline' : 'none';
        })
        .catch(error => console.error('Error fetching settings:', error));
    gameID = Date.now().toString();
    boardSize = await setBoardSize(); // Use global boardSize
    const percentMines = await setPercentMines();
    numMines = Math.floor(percentMines * boardSize ** 2); // Use global numMines

    board = [];
    mineLocations = [];
    gameOver = false;
    flagsPlaced = 0;
    timeElapsed = 0;
    pace = 0;
    revealedCount = 0; // Reset revealedCount
    clicks = 0; // Reset clicks
    gameResult = "in progress"; // Reset gameResult
    moveNumber = 0; // Reset moveNumber
    moveList = {}; // Reset moveList
    clearInterval(timerInterval);
    updateFlagsCount();
    updateTimer();
    updatePace();
    // Create empty board
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < numMines) {
        const row = Math.floor(Math.random() * boardSize);
        const col = Math.floor(Math.random() * boardSize);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            mineLocations.push({ row, col });
            minesPlaced++;
        }
    }
    // Encode starting position
    startingPosition = encodeStartingPosition(mineLocations, boardSize);

    // Calculate neighbor mines
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (!board[i][j].isMine) {
                board[i][j].neighborMines = countNeighborMines(i, j);
            }
        }
    }
    renderBoard(boardSize);
}

function countNeighborMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                if (board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
    }
    return count;
}

function renderBoard(boardSize) {
    boardElement.innerHTML = '';
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleRightClick);
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(event) {
    if (gameOver) return;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const revealed = board[row][col].isRevealed;
    const flagged = board[row][col].isFlagged;
    if (revealed === false && flagged === false) {
        clicks++;
        moveNumber++;
        if (clicks === 1) {
            startTimer();
        }
        updatePace();
        revealCell(row, col);    
    }
}

function handleRightClick(event) {
    event.preventDefault();
    if (gameOver) return;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    const revealed = board[row][col].isRevealed;
    if (revealed === false) {
        moveNumber++;
        updatePace();
        toggleFlag(row, col);
    }
}

function revealCell(row, col) {

    const cell = boardElement.children[row * boardSize + col];
    const minClicks = 5;

    // Initialize moveList entry for this move
    if (!moveList[moveNumber]) {
        moveList[moveNumber] = {
            moveType: 'R',
            moveTime: timeElapsed,
            cells: []
        };
    }

    lastClickedRow = row;
    lastClickedCol = col;

    if (board[row][col].isMine) {
        cell.classList.add('mine', 'last');
        cell.textContent = '💣';
        moveList[moveNumber].moveType = 'M';
        moveList[moveNumber].cells.push({ row, col });
        revealAllMines();
        checkFlags();
        gameResult = "lost";
        gameOver = true;
        clearInterval(timerInterval);
        
        // Delay the confirmation dialog to allow mines to be fully revealed
        setTimeout(() => {
            let message = 'Game Over! You hit a mine.';
            if (settings.displayMetrics) {
                const { performance } = calculatePerformance(timeElapsed, boardSize, numMines, revealedCount);
                message += `\nPerformance: ${performance.toFixed(2)}`;
            }
            const playAgain = confirm(message + '\n\nWould you like to start a new game?');
            if (playAgain) initializeBoard();
        }, 100);  // Short delay to ensure visual reveal of mines

        if (settings.scoring === 'rated' && clicks > minClicks) {
            writeScores();
            writeGamePlay();
        }  
    } else {
        board[row][col].isRevealed = true;
        cell.classList.add('revealed');
        revealedCount++; // Increment revealedCount
        
        moveList[moveNumber].cells.push({ row,  col });
        
        if (board[row][col].neighborMines > 0) {
            cell.textContent = board[row][col].neighborMines;
            cell.classList.add(`mine-${board[row][col].neighborMines}`);
        } else {
            // Reveal neighboring cells for empty cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                        if (!board[newRow][newCol].isRevealed && !board[newRow][newCol].isFlagged) {
                            revealCell(newRow, newCol);
                        }
                    }
                }
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(row, col) {

    const cell = boardElement.children[row * boardSize + col];
    
    // Initialize moveList entry for this move
    if (!moveList[moveNumber]) {
        moveList[moveNumber] = {
            moveType: 'F',
            moveTime: timeElapsed,
            cells: []
        };
    }

    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        cell.textContent = '';
        flagsPlaced--;
    } else {
        board[row][col].isFlagged = true;
        cell.textContent = '🚩';
        flagsPlaced++;
    }
    
    moveList[moveNumber].cells.push({ row, col });
    updateFlagsCount();
}

function revealAllMines() {
    for (const { row, col } of mineLocations) {
        const cell = boardElement.children[row * boardSize + col];
        if (!board[row][col].isFlagged && !cell.classList.contains('last')) {
            cell.classList.add('mine');
            cell.textContent = '💣';
        }
    }
}

function checkFlags() {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = boardElement.children[row * boardSize + col];
            if (!board[row][col].isMine && board[row][col].isFlagged) {
                cell.classList.remove('revealed');
                cell.classList.remove('flagged');
                cell.textContent = '❌';
            }
        }
    }
}

function checkWinCondition() {
    if (revealedCount === boardSize ** 2 - numMines && gameOver === false) {
        gameResult = "won";
        gameOver = true;

        // Add win classes to all revealed cells
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = boardElement.children[row * boardSize + col];
                if (board[row][col].isRevealed) {
                    cell.classList.add('win');
                    // Add last class to the last clicked cell
                    if (row === lastClickedRow && col === lastClickedCol) {
                        cell.classList.add('last');
                    }
                }
            }
        }

        // Delay the confirmation dialog to allow revealed cells to be highlighted
        setTimeout(() => {
            let message = 'Congratulations! You won!';
            if (settings.displayMetrics) {
                const { performance } = calculatePerformance(timeElapsed, boardSize, numMines, revealedCount);
                message += `\nPerformance: ${performance.toFixed(2)}`;
            }
            const playAgain = confirm(message + '\n\nWould you like to start a new game?');
            if (playAgain) initializeBoard();
            clearInterval(timerInterval);
        }, 100);  // Short delay to ensure visual revealed cells

        // Call the writeScores function
        if (settings.scoring === 'rated' || settings.score === 'win') {
            writeScores();
            writeGamePlay();
        }
    }
}

function writeScores() {
    // Get values when the game is over
    const date = new Date().toISOString().split('T')[0]; // Format date as "yyyy-mm-dd"
    const newEntry = {
        date: date,
        time: timeElapsed,
        mode: settings.mode,
        boardSize: boardSize,
        numMines: numMines,
        result: gameResult,
        revealedCells: revealedCount,
        gameID: gameID
    };

    // Append the new entry to scores.json
    fetch(`http://localhost:${port}/scores.json`)
        .then(response => response.json())
        .then(data => {
            console.log('Adding new score to file:', data); 
            data.scores.push(newEntry);
            return fetch(`http://localhost:${port}/scores.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .catch(error => console.error('Error updating scores:', error));
}

function writeGamePlay() {
    const newEntry = {
        gameID: gameID,
        boardSize: boardSize,
        mineLocations: mineLocations,
        moveList: moveList
    };

    fetch(`http://localhost:${port}/games.json`)
        .then(response => response.json())
        .then(data => {
            console.log('Adding new game record to file:', gameID); 
            data.games.push(newEntry);
            return fetch(`http://localhost:${port}/games.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .catch(error => console.error('Error updating games:', error));
}

function updateFlagsCount() {
    flagsElement.textContent = `Flags: ${flagsPlaced}`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        updateTimer();
    }, 1000);
}

function updateTimer() {
    timeElement.textContent = `Time: ${timeElapsed}`;
}

function updatePace() {
    // const percentMines = numMines / (boardSize ** 2);
    // const difficultyRatio = percentMines / (1 - percentMines);
    // const adjustedNumMines = Math.round(boardSize ** 2 * difficultyRatio);
    // const adjustedTime = Math.sqrt(timeElapsed / difficultyRatio);
    // const pace = adjustedNumMines / adjustedTime;
    // document.getElementById('pace').textContent = `Pace: ${pace.toFixed(2)}`;
    const {pace, performance} = calculatePerformance(timeElapsed, boardSize, numMines, revealedCount);
    paceElement.textContent = `Pace: ${pace.toFixed(2)}`;
    document.getElementById('performance').textContent = `Performance: ${performance.toFixed(2)}`;
}

function encodeStartingPosition(mineLocations, boardSize) {
    // Create an array of '0's representing the board
    const mineArray = new Array(boardSize ** 2).fill('0');
    
    // Mark mine locations with '1'
    mineLocations.forEach(mine => {
        const index = mine.row * boardSize + mine.col;
        mineArray[index] = '1';
    });
    
    let encodedString = `${boardSize},`;
    let currentChar = mineArray[0];
    let count = 1;

    // Perform Run-Length Encoding, modified for binary strings
    if(mineArray[0] === '1') {
        encodedString += '0,';
    }
    for (let i = 1; i < mineArray.length; i++) {
        if (mineArray[i] === currentChar) {
            count++;
        } else {
            encodedString += `${count},`;
            currentChar = mineArray[i];
            count = 1;
        }
    }
    
    // Add the last run
    encodedString += `${count}`;
    
    return encodedString;
}

function exitGame() {
    const confirmExit = confirm('Are you sure you want to exit?');
    if (confirmExit) {
        // Instead of window.close(), use a more reliable method
        window.location.href = 'about:blank';  // Redirects to a blank page
        console.log('Exiting game...');
    } else {
        console.log('Exit cancelled.');
    }
}

// Button actions
// Start a new game
newGameButton.addEventListener('click', initializeBoard);

// Set game play options
optionsButton.addEventListener('click', () => {
    window.open('options.html', '_blank', 'width=600,height=400');
});

// View top scores
scoresButton.addEventListener('click', () => {
    window.open('scores.html', '_blank', 'width=600,height=400');
});

// Exit game
exitButton.addEventListener('click', exitGame);

// Begin game
initializeBoard();
