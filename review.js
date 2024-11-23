const boardElement = document.getElementById('board');

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
            updateTable(lastGame.gameID);
            updateGridSize(lastGame.gameID); // Call updateGridSize with the last game ID
        });
}

function updateTable(gameID) {
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
        revealAllMines();
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
    updateTable(selectedGameID);
    updateGridSize(selectedGameID);
});

// Set last game ID on page load
populateGameIDDropdown();
setLastGameID();
renderBoard();
