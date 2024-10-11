const MIN_BOARD_SIZE = 10;
const MAX_BOARD_SIZE = 20;
const BOARD_SIZE = MIN_BOARD_SIZE + Math.floor(Math.random()*(MAX_BOARD_SIZE-MIN_BOARD_SIZE))

const MIN_PERCENT_MINES = 0.10;
const MAX_PERCENT_MINES = 0.25;
const PERCENT_MINES = MIN_PERCENT_MINES + Math.random()*(MAX_PERCENT_MINES-MIN_PERCENT_MINES);
const NUM_MINES = Math.floor(PERCENT_MINES * BOARD_SIZE ** 2);

var root = document.querySelector(':root');
var rootStyles = getComputedStyle(root);
root.style.setProperty('--grid-size', BOARD_SIZE)

let board = [];
let mineLocations = [];
let gameOver = false;
let flagsPlaced = 0;
let timeElapsed = 0;
let timerInterval;

const boardElement = document.getElementById('board');
const newGameButton = document.getElementById('new-game');
const flagsElement = document.getElementById('flags');
const timeElement = document.getElementById('time');

function initializeBoard() {
    board = [];
    mineLocations = [];
    gameOver = false;
    flagsPlaced = 0;
    timeElapsed = 0;
    clearInterval(timerInterval);
    updateFlagsCount();
    updateTimer();

    // Create empty board
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
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
    while (minesPlaced < NUM_MINES) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        if (!board[row][col].isMine) {
            board[row][col].isMine = true;
            mineLocations.push({ row, col });
            minesPlaced++;
        }
    }

    // Calculate neighbor mines
    //neighborMines = convolve(board.isMine,I3,same_padding)
    //Probably need a list comprehension to assign board[i][j].neighborMines
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board[i][j].isMine) {
                board[i][j].neighborMines = countNeighborMines(i, j);
            }
        }
    }

    renderBoard();
    startTimer();
}

function countNeighborMines(row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                if (board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
    }
    return count;
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
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
    revealCell(row, col);
}

function handleRightClick(event) {
    event.preventDefault();
    if (gameOver) return;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    toggleFlag(row, col);
}

function revealCell(row, col) {
    if (board[row][col].isRevealed || board[row][col].isFlagged) return;

    board[row][col].isRevealed = true;
    const cell = boardElement.children[row * BOARD_SIZE + col];
    cell.classList.add('revealed');

    if (board[row][col].isMine) {
        gameOver = true;
        cell.classList.add('mine');
        cell.textContent = '💣';
        revealAllMines();
        alert('Game Over! You hit a mine.');
        clearInterval(timerInterval);
    } else {
        if (board[row][col].neighborMines > 0) {
            cell.textContent = board[row][col].neighborMines;
        } else {
            // Reveal neighboring cells for empty cells
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                        revealCell(newRow, newCol);
                    }
                }
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(row, col) {
    if (board[row][col].isRevealed) return;

    const cell = boardElement.children[row * BOARD_SIZE + col];
    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        cell.textContent = '';
        flagsPlaced--;
    } else {
        board[row][col].isFlagged = true;
        cell.textContent = '🚩';
        flagsPlaced++;
    }
    updateFlagsCount();
}

function revealAllMines() {
    for (const { row, col } of mineLocations) {
        const cell = boardElement.children[row * BOARD_SIZE + col];
        cell.classList.add('revealed', 'mine');
        cell.textContent = '💣';
    }
}

function checkWinCondition() {
    let revealedCount = 0;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j].isRevealed) {
                revealedCount++;
            }
        }
    }
    if (revealedCount === BOARD_SIZE * BOARD_SIZE - NUM_MINES && gameOver === false) {
        gameOver = true;
        alert('Congratulations! You won!');
        clearInterval(timerInterval);
    }
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

newGameButton.addEventListener('click', initializeBoard);

initializeBoard();