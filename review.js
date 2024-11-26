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
    fetch('games.json')
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

            // Set the dropdown to the gameID from URL if available
            const urlParams = new URLSearchParams(window.location.search);
            const urlGameID = urlParams.get('gameID');
            if (urlGameID) {
                dropdown.value = urlGameID;
            } else {
                dropdown.value = data.games[data.games.length - 1].gameID;
            }

            // If no gameID in URL, load the latest game
            if (!urlGameID) {
                setGameData(dropdown.value);
            }
        });
}

function setGameData(gameID) {
    return fetch('games.json')
        .then(response => response.json())
        .then(data => {
            selectedGame = data.games.find(game => game.gameID === gameID);
            if (!selectedGame) {
                selectedGame = data.games[data.games.length - 1];
            }

            // Explicitly set global variables
            boardSize = selectedGame.boardSize;
            mineLocations = selectedGame.mineLocations;
            moveList = selectedGame.moveList;
            maxMoveNumber = moveList ? Object.keys(moveList).length : 0;

            // Initialize the board and move table
            currentMoveNumber = 0;
            createInitialBoardState();
            updateMoveTable();
            updateBoardDisplay(currentMoveNumber, boardStates);
            updateMoveInfo(currentMoveNumber);

            return selectedGame;
        })
        .catch(error => {
            console.error('Error fetching or processing game data:', error);
        });
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

function updateMoveTable() {
    if (!moveList) return;
    
    const tableBody = document.querySelector('#moveTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    Object.entries(moveList).forEach(([moveNumber, move]) => {
        const firstCellString = move.cells && move.cells[0] ? `{${move.cells[0].row},${move.cells[0].col}}` : '';
        const cellString = move.cells ? move.cells.map(cell => `{${cell.row},${cell.col}}`).join(',') : '';
        
        const row = document.createElement('tr');
        const moveNumberCell = document.createElement('td');
        moveNumberCell.textContent = moveNumber;
        const actionCell = document.createElement('td');
        actionCell.textContent = `${move.moveType}${firstCellString}`;
        const timeCell = document.createElement('td');
        timeCell.textContent = `${move.moveTime}`;
        const revealedCell = document.createElement('td');
        if (move.moveType === 'R') {
            revealedCell.textContent = cellString;
        }
        
        row.appendChild(moveNumberCell);
        row.appendChild(actionCell);
        row.appendChild(timeCell);
        row.appendChild(revealedCell);
        tableBody.appendChild(row);

        // Create board state for this move
        createBoardForMove(parseInt(moveNumber));
    });
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

function updateGridSize(gameID) {
    if (selectedGame) {
        document.documentElement.style.setProperty('--grid-size', selectedGame.boardSize);
    }
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
        }
    }
    
    // Store the board state
    boardStates[moveNumber] = currentBoard;
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

// Handle dropdown change event
document.getElementById('gameIDDropdown').addEventListener('change', (event) => {
    const selectedGameID = event.target.value;
    setGameData(selectedGameID)
        .then(() => {
            updateGridSize(selectedGameID);
            
            // Update URL without reloading the page
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('gameID', selectedGameID);
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
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
//ADD CODE
//Change dropdown value to previous item on the list
//Call setGameData

// Load next game
const nextGameButton = document.getElementById('next-game');
//ADD CODE
//Change dropdown value to next item on the list
//Call setGameData

// Add event listeners to the buttons
document.getElementById('start').addEventListener('click', () => {
    currentMoveNumber = 0;
    updateBoardDisplay(currentMoveNumber, boardStates);
    updateMoveInfo(currentMoveNumber);
});

document.getElementById('prev').addEventListener('click', () => {
    currentMoveNumber = Math.max(currentMoveNumber - 1, 0);
    updateBoardDisplay(currentMoveNumber, boardStates);
    updateMoveInfo(currentMoveNumber);
});

document.getElementById('next').addEventListener('click', () => {
    currentMoveNumber = Math.min(currentMoveNumber + 1, maxMoveNumber);
    updateBoardDisplay(currentMoveNumber, boardStates);
    updateMoveInfo(currentMoveNumber);
});

document.getElementById('end').addEventListener('click', () => {
    currentMoveNumber = maxMoveNumber;
    updateBoardDisplay(currentMoveNumber, boardStates);
    updateMoveInfo(currentMoveNumber);
});

// Initialize page on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Populate dropdown first
    populateGameIDDropdown();

    // Get gameID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlGameID = urlParams.get('gameID');

    // Use setGameData to fetch and set the selected game
    if (urlGameID) {
        setGameData(urlGameID)
            .catch(error => {
                console.error('Error setting game data:', error);
            });
    }
});
