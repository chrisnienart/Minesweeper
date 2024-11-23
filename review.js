//let timerInterval;
let gameID;
let board = [];
let boardSize; // Define boardSize globally

const boardElement = document.getElementById('board');
const boardStates = {}; // Create an object to store all the board information associated with each move

function populateGameIDDropdown() {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById('gameIDDropdown');
            data.games.sort((a, b) => b.gameID - a.gameID).forEach(game => {
                const option = document.createElement('option');
                option.value = game.gameID;
                option.textContent = game.gameID;
                dropdown.appendChild(option);
            });
        });
}

function setLastGameID() {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const lastGame = data.games[data.games.length - 1];
            document.getElementById('gameIDDropdown').value = lastGame.gameID;
            updateMoveTable(lastGame.gameID);
            updateGridSize(lastGame.gameID); // Call updateGridSize with the last game ID

            // // Populate boardStates for every move associated with the gameID selected
            // const selectedGame = data.games.find(game => game.gameID === lastGame.gameID);
            // if (selectedGame) {
            //     const moveList = selectedGame.moveList;
            //     boardSize = selectedGame.boardSize;
            //     for (const moveNumber in moveList) {
            //         createBoardForMove(lastGame.gameID, moveNumber);
            //     }
            // }
        });
}

function updateMoveTable(gameID) {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const games = data.games;
            let selectedGame = games.find(game => game.gameID === gameID);
            if (!selectedGame) {
                selectedGame = games[games.length - 1];
                console.log('No game found with ID:', gameID);
                console.log('Using last game:', selectedGame.gameID);
            }
            console.log('Updating table with selected game:', selectedGame.gameID);
            const moveList = selectedGame.moveList;
            const tableBody = document.querySelector('#moveTable tbody');
            tableBody.innerHTML = ''; // Clear existing rows
            for (const moveNumber in moveList) {
                const move = moveList[moveNumber];
                const firstCellString = `{${move.cells[0].row},${move.cells[0].col}}`;
                const cellString = move.cells.map(cell => `{${cell.row},${cell.col}}`).join(',');
                const row = document.createElement('tr');
                const moveNumberCell = document.createElement('td');
                moveNumberCell.textContent = moveNumber;
                const moveTypeCell = document.createElement('td');
                moveTypeCell.textContent = `${move.moveType}${firstCellString}`;
                const moveCells = document.createElement('td');
                moveCells.textContent = `${cellString}`;
                row.appendChild(moveNumberCell);
                row.appendChild(moveTypeCell);
                row.appendChild(moveCells);
                tableBody.appendChild(row);
            }
        });
}

function renderBoard() {
    const gridSize = getComputedStyle(document.documentElement).getPropertyValue('--grid-size');
    const boardSize = parseInt(gridSize, 10);
    console.log('Rendering board with size:', boardSize);
    console.log('Board element:', boardElement);
    boardElement.innerHTML = '';
    let cellCount = 0;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            //cell.addEventListener('click', handleCellClick);
            //cell.addEventListener('contextmenu', handleRightClick);
            boardElement.appendChild(cell);
            cellCount++;
        }
    }
    console.log('Cells created:', cellCount);
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

function revealCell(row, col) {
    const cell = boardElement.children[row * boardSize + col];
    if (board[row][col].isMine) {
        cell.classList.add('mine');
        cell.textContent = '💣';
        //revealAllMines();
    } else {
        board[row][col].isRevealed = true;
        cell.classList.add('revealed');

        if (board[row][col].neighborMines > 0) {
            cell.textContent = board[row][col].neighborMines;
            cell.classList.add(`mine-${board[row][col].neighborMines}`);
        } else {
            // Reveal neighboring cells for empty cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; i <= 1; j++) {
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
}

function toggleFlag(row, col) {
    const cell = boardElement.children[row * boardSize + col];
    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        cell.textContent = '';
    } else {
        board[row][col].isFlagged = true;
        cell.textContent = '🚩';
    }
    updateFlagsCount();
}

function updateGridSize(gameID) {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const selectedGame = data.games.find(game => game.gameID === gameID);
            if (selectedGame) {
                const boardSize = selectedGame.boardSize;
                document.documentElement.style.setProperty('--grid-size', boardSize);
                renderBoard(); // Re-render the board with the new grid size
            }
        });
}

// Handle dropdown change event
document.getElementById('gameIDDropdown').addEventListener('change', (event) => {
    const selectedGameID = event.target.value;
    updateMoveTable(selectedGameID);
    updateGridSize(selectedGameID);
});

// Set last game ID on page load
    populateGameIDDropdown();
    setLastGameID();
    renderBoard();

// Create board object for every move in the moveList
function createBoardForMove(gameID, moveNumber) {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const selectedGame = data.games.find(game => game.gameID === gameID);
            if (selectedGame) {
                const moveList = selectedGame.moveList;
                const mineLocations = selectedGame.mineLocations;
                const move = moveList[moveNumber];

                // Create empty board
                createEmptyBoard();

                // Update isMine attribute based on mineLocations
                if (mineLocations && Array.isArray(mineLocations)) {
                    mineLocations.forEach(mine => {
                        if (mine && typeof mine.row !== 'undefined' && typeof mine.col !== 'undefined') {
                            board[mine.row][mine.col].isMine = true;
                        } else {
                            console.error('Invalid mine location:', mine);
                        }
                    });
                } else {
                    console.error('Invalid or missing mineLocations:', mineLocations);
                }

                // Update board based on the move
                move.cells.forEach(cell => {
                    if (move.moveType === 'R') {
                        revealCell(cell.row, cell.col);
                    } else if (move.moveType === 'F') {
                        toggleFlag(cell.row, cell.col);
                    }
                });

                // Store the board state in the boardStates object
                console.log('Storing board state for move:', moveNumber);
                boardStates[moveNumber] = JSON.parse(JSON.stringify(board));

                // Render the board
                renderBoard();
            }
        });
}

// New function to update the board display based on the move number and boardStates object
function updateBoardDisplay(moveNumber, boardStates) {
    const boardState = boardStates[moveNumber];
    if (!boardState) {
        console.error('No board state found for move number:', moveNumber);
        return;
    }

    boardElement.innerHTML = '';
    const gridSize = getComputedStyle(document.documentElement).getPropertyValue('--grid-size');
    const boardSize = parseInt(gridSize, 10);

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

// Add event listeners to the buttons
let currentMoveNumber = 0;
const moveNumbers = Object.keys(boardStates).map(Number);
const maxMoveNumber = Math.max(...moveNumbers, 0);

document.getElementById('start').addEventListener('click', () => {
    currentMoveNumber = 0;
    updateBoardDisplay(currentMoveNumber, boardStates);
});

document.getElementById('prev').addEventListener('click', () => {
    currentMoveNumber = Math.max(currentMoveNumber - 1, 0);
    updateBoardDisplay(currentMoveNumber, boardStates);
});

document.getElementById('next').addEventListener('click', () => {
    currentMoveNumber = Math.min(currentMoveNumber + 1, maxMoveNumber);
    updateBoardDisplay(currentMoveNumber, boardStates);
});

document.getElementById('end').addEventListener('click', () => {
    currentMoveNumber = maxMoveNumber;
    updateBoardDisplay(currentMoveNumber, boardStates);
});

// Define move 0 for boardStates as an empty board with updated isMine properties
function createInitialBoardState(gameID) {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const selectedGame = data.games.find(game => game.gameID === gameID);
            
            if (selectedGame) {
                const mineLocations = selectedGame.mineLocations;
                const boardSize = selectedGame.boardSize;

                // Set the grid size
                document.documentElement.style.setProperty('--grid-size', boardSize);

                // Create empty board
                board = [];
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

                // Update isMine attribute based on mineLocations
                if (mineLocations && Array.isArray(mineLocations)) {
                    mineLocations.forEach(mine => {
                        if (mine && typeof mine.row !== 'undefined' && typeof mine.col !== 'undefined') {
                            board[mine.row][mine.col].isMine = true;
                        } else {
                            console.error('Invalid mine location:', mine);
                        }
                    });
                } else {
                    console.error('Invalid or missing mineLocations:', mineLocations);
                }

                // Store the initial board state in the boardStates object
                boardStates[0] = JSON.parse(JSON.stringify(board));

                // Render the initial board
                renderBoard();
            } else {
                console.error('No game found with ID:', gameID);
            }
        })
        .catch(error => {
            console.error('Error fetching or processing game data:', error);
        });
}

// Call createInitialBoardState with the last game ID on page load
document.addEventListener('DOMContentLoaded', () => {
    const gameIDDropdown = document.getElementById('gameIDDropdown');
    if (gameIDDropdown && gameIDDropdown.value) {
        createInitialBoardState(gameIDDropdown.value);
    } else {
        console.error('Game ID dropdown not found or no value selected');
    }
});
