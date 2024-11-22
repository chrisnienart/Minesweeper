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
                moveList[moveNumber].forEach(move => {
                    const row = document.createElement('tr');
                    const moveNumberCell = document.createElement('td');
                    moveNumberCell.textContent = moveNumber;
                    const moveValueCell = document.createElement('td');
                    moveValueCell.textContent = `${move.moveType}, row: ${move.row}, col: ${move.col}`;
                    row.appendChild(moveNumberCell);
                    row.appendChild(moveValueCell);
                    tableBody.appendChild(row);
                });
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
