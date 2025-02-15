import { calculatePerformance } from './metrics.js';

const port = 3000; // Match server.js port
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
            updateMoveNotes(currentMoveNumber);

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
    
    const isLastMove = moveNumber === maxMoveNumber;
    const isWin = moveList[moveNumber].moveType === 'R'

    // Apply all moves up to the current move number
    for (let i = 1; i <= moveNumber; i++) {
        const move = moveList[i];
        if (!move) continue;
        
        if (move.moveType === 'R') {
            // For reveal moves
            move.cells.forEach(cell => {
                currentBoard[cell.row][cell.col].isRevealed = true;
            });

            if (isLastMove && isWin) {
                // First mark all revealed cells as win cells
                for (let row = 0; row < boardSize; row++) {
                    for (let col = 0; col < boardSize; col++) {
                        if (currentBoard[row][col].isRevealed) {
                            currentBoard[row][col].isWin = true;
                        }
                    }
                }

            }
        } else if (move.moveType === 'F') {
            const cell = move.cells[0];
            currentBoard[cell.row][cell.col].isFlagged = !currentBoard[cell.row][cell.col].isFlagged;
        } else if (move.moveType === 'M') {
            // For mine hits (losing moves)
            const clickedCell = move.cells[0];
            
            // Check for incorrectly placed flags
            for (let row = 0; row < boardSize; row++) {
                for (let col = 0; col < boardSize; col++) {
                    if (currentBoard[row][col].isFlagged) {
                        // Check if this flagged cell is actually a mine
                        const isMineLocation = mineLocations.some(mine => 
                            mine.row === row && mine.col === col
                        );
                        if (!isMineLocation) {
                            currentBoard[row][col].isIncorrectFlag = true;
                        }
                    }
                }
            }
            
            // Reveal unflagged mines
            mineLocations.forEach(cell => {
                if (!currentBoard[cell.row][cell.col].isFlagged) {
                    currentBoard[cell.row][cell.col].isRevealed = true;
                    currentBoard[cell.row][cell.col].isMine = true;
                    // Mark the clicked mine as the last one
                    if (cell.row === clickedCell.row && cell.col === clickedCell.col) {
                        currentBoard[cell.row][cell.col].isLastMine = true;
                    }
                }
            });
        }
    }

    // Assign last win cell
    if (isLastMove && isWin) {
        const winCell = moveList[moveNumber].cells[0];
        currentBoard[winCell.row][winCell.col].isLastWinCell = true;
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
                isWin: false,
                isIncorrectFlag: false,
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
    updateMoveNotes(currentMoveNumber);
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
                    cell.classList.remove('revealed');
                    cell.classList.add('mine');
                    if (cellState.isLastMine) {
                        cell.classList.add('last');
                    }
                    cell.textContent = '💣';
                } else if (cellState.isWin) {
                    cell.classList.add('win');
                    if (cellState.isLastWinCell) {
                        cell.classList.add('last');
                    }
                    if (cellState.neighborMines > 0) {
                        cell.textContent = cellState.neighborMines;
                        cell.classList.add(`mine-${cellState.neighborMines}`);
                    }
                } else if (cellState.neighborMines > 0) {
                    cell.textContent = cellState.neighborMines;
                    cell.classList.add(`mine-${cellState.neighborMines}`);
                }
            } else if (cellState.isIncorrectFlag) {
                cell.textContent = '❌';
            } else if (cellState.isFlagged) {
                cell.textContent = '🚩';
            }

            boardElement.appendChild(cell);
        }
    }
}

function updateMoveNotes(moveNumber) {
    const notesElement = document.getElementById('gameNotes');
    if (moveList[moveNumber]?.notes) {
        notesElement.value = moveList[moveNumber].notes;
    } else {
        notesElement.value = '';
    }
}

function updateMoveInfo(moveNumber) {
    const moveElement = document.getElementById('move');
    const timeElement = document.getElementById('time');
    const paceElement = document.getElementById('pace');
    
    moveElement.textContent = `Move: ${moveNumber}`;
    const time = moveNumber === 0 ? 0 : (moveList[moveNumber]?.moveTime || 0);
    timeElement.textContent = `Time: ${time}`;

    // Calculate revealed cells for pace metric
    let revealedCells = 0;
    const boardState = boardStates[moveNumber];
    if (boardState) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                if (boardState[row][col].isRevealed && !boardState[row][col].isMine) {
                    revealedCells++;
                }
            }
        }
    }

    // Calculate and display pace
    const numMines = selectedGame.mineLocations.length;
    const {pace, performance} = calculatePerformance(
        time,
        selectedGame.boardSize,
        numMines,
        revealedCells
    );
    paceElement.textContent = `Pace: ${pace.toFixed(2)}`;
    document.getElementById('performance').textContent = `Performance: ${performance.toFixed(2)}`;
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
        let moveTextContent;
        if (moveNumber == 0) {
            moveTextContent = `${moveNumber}. Game notes`;
        } else {
            const firstCell = move.cells && move.cells[0] ? `(${move.cells[0].row},${move.cells[0].col})` : '';
            moveTextContent = `${moveNumber}. ${move.moveType}${firstCell}`;
        }
        moveText.textContent = moveTextContent;
        
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

// Function to save notes to the current move
function saveNotes() {
    const notes = document.getElementById('gameNotes').value;
    if (!notes) return;

    // Add notes to current move
    if (!moveList[currentMoveNumber]) {
        moveList[currentMoveNumber] = {
        };
    }
    moveList[currentMoveNumber].notes = notes;

    // Save to server
    fetch(`http://localhost:${port}/games.json`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ games: [selectedGame] })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save notes');
        }
        console.log(`Note saved for move ${currentMoveNumber}: "${notes}"`);
        
        // Show success message
        const successMessage = document.getElementById('saveNotesMessage');
        successMessage.textContent = 'Notes updated';
        successMessage.style.display = 'inline';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 1000);
    })
    .catch(error => {
        console.error('Error saving notes:', error);
    });
}

// Initialize page on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add save button handler
    document.getElementById('saveNotes').addEventListener('click', saveNotes);
    // Fetch settings to determine metrics visibility
    fetch('settings.json')
        .then(response => response.json())
        .then(settings => {
            const paceElement = document.getElementById('pace');
            const performanceElement = document.getElementById('performance');
            paceElement.style.display = settings.displayMetrics ? 'inline' : 'none';
            performanceElement.style.display = settings.displayMetrics ? 'inline' : 'none';
        })
        .catch(error => console.error('Error fetching settings:', error));

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
