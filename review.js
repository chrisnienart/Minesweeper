let timerInterval;
let board = [];
let boardSize; // Define boardSize globally
let mineLocations;
let moveList;
let selectedGame; // Define selectedGame as a global object
let currentMoveNumber = 0;
let maxMoveNumber = 0;

const boardElement = document.getElementById('board');
const boardStates = {}; // Create an object to store all the board information associated with each move
const moveElement = document.getElementById('move');
const timeElement = document.getElementById('time');

function populateGameIDDropdown() {
    return fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('gameIDDropdown');
            dropdown.innerHTML = ''; // Clear existing options
            data.games.sort((a, b) => b.gameID - a.gameID).forEach(game => {
                const option = document.createElement('option');
                option.value = game.gameID;
                option.textContent = game.gameID;
                dropdown.appendChild(option);
            });

            // Set the dropdown to the gameID
            const urlParams = new URLSearchParams(window.location.search);
            const urlGameID = urlParams.get('gameID');
            selectedGame = data.games.find(game => game.gameID === urlGameID);
            if (urlGameID && selectedGame) {
                dropdown.value = urlGameID;
            } else {
                //use most recent game
                selectedGame = data.games[0];
                dropdown.value = selectedGame.gameID;
            }
            updateGridSize();
            updatePageURL();
            
            return selectedGame; // Return selectedGame for chaining
        });
}

function setGameData(gameID) {
    return fetch('games.json')
        .then(response => response.json())
        .then(data => {
            selectedGame = data.games.find(game => game.gameID === gameID);
            if (!selectedGame) {
                selectedGame = data.games[data.games.length - 1];
                console.warn('Game not found:', gameID);
                console.warn('Fallback to most recent game');
                updateGridSize();
                updatePageURL();
            }

            console.log('Set game data:', selectedGame.gameID);

            // Explicitly set global variables
            boardSize = selectedGame.boardSize;
            mineLocations = selectedGame.mineLocations;
            moveList = selectedGame.moveList;
            maxMoveNumber = moveList ? Math.max(...Object.keys(moveList).map(Number)) : 0;

            // Initialize the board and move table
            currentMoveNumber = 0;
            createBoardStates();
            updateMoveListDisplay();
            updateBoardDisplay(currentMoveNumber, boardStates);
            updateMoveInfo(currentMoveNumber);

            return selectedGame;
        })
        .catch(error => {
            console.error('Error fetching or processing game data:', error);
        });
}

function createBoardStates() {
    if (!moveList) return;

    // Set value for initial board state
    createInitialBoardState();

    Object.entries(moveList).forEach(moveNumber => {
        // Create board state for this move
        createBoardForMove(parseInt(moveNumber));
    });
}

// Create board object for every move in the moveList
function createBoardForMove(moveNumber) {
    // Start with the initial board state
    let currentBoard = JSON.parse(JSON.stringify(boardStates[0]));
    
    // Apply all moves up to the current move number
    for (let i = 1; i <= moveNumber; i++) {
        const move = moveList[i];
        if (!move) continue;
        
        if (move.moveType === 'R') {
            move.cells.forEach(cell => {
                currentBoard[cell.row][cell.col].isRevealed = true;
            });
        } else if (move.moveType === 'F') {
            const cell = move.cells[0];
            currentBoard[cell.row][cell.col].isFlagged = !currentBoard[cell.row][cell.col].isFlagged;
        } else if (move.moveType === 'M') {
            mineLocations.forEach(cell =>{
                currentBoard[cell.row][cell.col].isRevealed = true
            });
        }
    }
    
    // Store the board state
    boardStates[moveNumber] = currentBoard;
}

// Define move 0 for boardStates
function createInitialBoardState() {
    // Set the grid size
    document.documentElement.style.setProperty('--grid-size', boardSize);
    createEmptyBoard();
    
    // Place mines on the initial board
    if (mineLocations) {
        mineLocations.forEach(loc => {
            board[loc.row][loc.col].isMine = true;
        });
    }
    
    // Calculate neighbor mines for each cell
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (!board[i][j].isMine) {
                board[i][j].neighborMines = countNeighborMines(i, j);
            }
        }
    }
    
    boardStates[0] = JSON.parse(JSON.stringify(board));
}

function countNeighborMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < boardSize && 
                newCol >= 0 && newCol < boardSize && 
                board[newRow][newCol].isMine) {
                count++;
            }
        }
    }
    return count;
}

// Create empty board
function createEmptyBoard() {
    board = []; // Reset board to an empty array
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
}

function updateGridSize() {
    if (selectedGame) {
        document.documentElement.style.setProperty('--grid-size', selectedGame.boardSize);
    }
}

function updatePageURL() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('gameID', selectedGame.gameID);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
}

// Function to update the board and move info based on the selected move
function updateBoardAndMoveInfo(moveNumber) {
    currentMoveNumber = moveNumber;
    updateBoardDisplay(currentMoveNumber, boardStates);
    updateMoveInfo(currentMoveNumber);
    updateMoveListDisplay();
}

function updateBoardDisplay(moveNumber, boardStates) {
    const boardState = boardStates[moveNumber];
    if (!boardState) {
        console.error('No board state found for move number:', moveNumber);
        return;
    }

    boardElement.innerHTML = '';

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const cellState = boardState[row][col];
            if (cellState.isRevealed) {
                cell.classList.add('revealed');
                if (cellState.isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (cellState.neighborMines > 0) {
                    cell.textContent = cellState.neighborMines;
                    cell.classList.add(`mine-${cellState.neighborMines}`);
                }
            } else if (cellState.isFlagged) {
                cell.textContent = '🚩';
            }

            boardElement.appendChild(cell);
        }
    }
}

function updateMoveInfo(moveNumber) {
    moveElement.textContent = `Move: ${moveNumber}`;
    if (moveNumber === 0) {
        timeElement.textContent = `Time: 0`;
    } else{
        timeElement.textContent = `Time: ${moveList[moveNumber].moveTime || 0}`;
    }
}

function updateMoveListDisplay() {
    if (!moveList) return;
    
    const moveListContainer = document.getElementById('moveList');
    moveListContainer.innerHTML = ''; // Clear existing moves
    
    Object.entries(moveList).forEach(([moveNumber, move]) => {
        const moveDiv = document.createElement('div');
        moveDiv.classList.add('move-item');
        if (moveNumber == currentMoveNumber) {
            moveDiv.classList.add('current-move');
        }
        
        const moveText = document.createElement('span');
        const firstCell = move.cells && move.cells[0] ? `(${move.cells[0].row},${move.cells[0].col})` : '';
        moveText.textContent = `${moveNumber}. ${move.moveType}${firstCell}`;
        
        moveDiv.appendChild(moveText);
        moveListContainer.appendChild(moveDiv);
        
        // Add click handler to jump to this move
        moveDiv.addEventListener('click', () => {
            updateBoardAndMoveInfo(parseInt(moveNumber));
        });
    });
}

// Handle dropdown change event
document.getElementById('gameIDDropdown').addEventListener('change', (event) => {
    const selectedGameID = event.target.value;
    setGameData(selectedGameID)
        .then(() => {
            updateGridSize();
            updatePageURL();
        });
});

//Return to home page
const homeButton = document.getElementById('home');
homeButton.addEventListener('click', () => window.location.href = 'index.html');

// Close window
const closeButton = document.getElementById('close');
closeButton.addEventListener('click', () => window.close());

// Load previous game
const previousGameButton = document.getElementById('previous-game');
previousGameButton.addEventListener('click', () => {
    const dropdown = document.getElementById('gameIDDropdown');
    const currentIndex = Array.from(dropdown.options).findIndex(option => option.value === dropdown.value);
    if (currentIndex < dropdown.options.length - 1) {
        dropdown.value = dropdown.options[currentIndex + 1].value;  // +1 due to descending order
        setGameData(dropdown.value);
    }
});

// Load next game
const nextGameButton = document.getElementById('next-game');
nextGameButton.addEventListener('click', () => {
    const dropdown = document.getElementById('gameIDDropdown');
    const currentIndex = Array.from(dropdown.options).findIndex(option => option.value === dropdown.value);
    if (currentIndex > 0) {
        dropdown.value = dropdown.options[currentIndex - 1].value; // +1 due to descending order
        setGameData(dropdown.value);
    }
});

// Add event listeners to the buttons
document.getElementById('start').addEventListener('click', () => {
    updateBoardAndMoveInfo(0);
});

document.getElementById('prev').addEventListener('click', () => {
    updateBoardAndMoveInfo(Math.max(currentMoveNumber - 1, 0));
});

document.getElementById('next').addEventListener('click', () => {
    updateBoardAndMoveInfo(Math.min(currentMoveNumber + 1, maxMoveNumber));
});

document.getElementById('end').addEventListener('click', () => {
    updateBoardAndMoveInfo(maxMoveNumber);
});

// Initialize page on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Populate dropdown first, then set game data
    populateGameIDDropdown()
        .then(game => {
            if (game) {
                return setGameData(game.gameID);
            } else {
                console.error('No game data available');
            }
        })
        .catch(error => {
            console.error('Error initializing game:', error);
        });
});
