//let timerInterval;
let board = [];
let boardSize; // Define boardSize globally

const boardElement = document.getElementById('board');
const boardStates = {}; // Create an object to store all the board information associated with each move

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
            }
        });
}

function setLastGameID() {
    fetch('games.json')
        .then(response => response.json())
        .then(data => {
            const lastGame = data.games[data.games.length - 1];
            const dropdown = document.getElementById('gameIDDropdown');
            
            // Only set last game if no gameID is in URL
            const urlParams = new URLSearchParams(window.location.search);
            const urlGameID = urlParams.get('gameID');
            
            if (!urlGameID) {
                dropdown.value = lastGame.gameID;
                updateMoveTable(lastGame.gameID);
                updateGridSize(lastGame.gameID);
            } else {
                console.log('GameID in URL', urlGameID);
                updateMoveTable(urlGameID);
                updateGridSize(urlGameID);
            }
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
                const actionCell = document.createElement('td');
                actionCell.textContent = `${move.moveType}${firstCellString}`;
                const timeCell = document.createElement('td');
                timeCell.textContent = `${move.moveTime}`;
                const revealedCell = document.createElement('td');
                if (move.moveType === 'R') {
                    revealedCell.textContent = `${cellString}`;
                }
                row.appendChild(moveNumberCell);
                row.appendChild(actionCell);
                row.appendChild(timeCell);
                row.appendChild(revealedCell);
                tableBody.appendChild(row);

                // Populate boardStates for every move associated with the gameID selected
                console.log('Populating boardStates for move:', moveNumber);
                createBoardForMove(selectedGame, moveNumber);
            }
            console.log('Move table updated successfully');
            console.log('BoardStates:', boardStates);
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
            boardElement.appendChild(cell);
            cellCount++;
        }
    }
    console.log('Cells created:', cellCount);
}

// Create empty board
function createEmptyBoard(boardSize) {
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
    
    // Update URL without reloading the page
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('gameID', selectedGameID);
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
});


// Create board object for every move in the moveList
function createBoardForMove(game, moveNumber) {
    if (moveNumber === "1") {
        console.log('Creating boardState for move 1:', game);
    }
    
    const moveList = game.moveList;
    const mineLocations = game.mineLocations;
    const move = game.moveList[moveNumber];

    // Create empty board
    createEmptyBoard(boardSize);

    // Update isMine attribute based on mineLocations
    // if (mineLocations && Array.isArray(mineLocations)) {
    //     mineLocations.forEach(mine => {
    //         if (mine && typeof mine.row !== 'undefined' && typeof mine.col !== 'undefined') {
    //             board[mine.row][mine.col].isMine = true;
    //         } else {
    //             console.error('Invalid mine location:', mine);
    //         }
    //     });
    // } else {
    //     console.error('Invalid or missing mineLocations:', mineLocations);
    // }

    // Update board based on the move
    // move.cells.forEach(cell => {
    //     if (move.moveType === 'R') {
    //         revealCell(cell.row, cell.col);
    //     } else if (move.moveType === 'F') {
    //         toggleFlag(cell.row, cell.col);
    //     }
    // });

    // Store the board state in the boardStates object
    console.log('Storing board state for move:', moveNumber);
    boardStates[moveNumber] = JSON.parse(JSON.stringify(board));

    if (moveNumber === "1") {
        console.log('boardState for move 1:', boardStates[1]);
    }

    // Render the board
    //renderBoard();
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

// Initialize page on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    // Populate dropdown first
    populateGameIDDropdown();

    // Get gameID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameID = urlParams.get('gameID');

    // If gameID exists, use it; otherwise, set last game
    if (gameID) {
        createInitialBoardState(gameID);
    } else {
        setLastGameID();
    }

    //Update move Table
    updateMoveTable();
});

