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

// Update button
// document.getElementById('updateButton').addEventListener('click', () => {
//     const gameIDDropdown = document.getElementById('gameIDDropdown').value;
//     updateTable(gameIDDropdown);
// });

// Handle dropdown change event
document.getElementById('gameIDDropdown').addEventListener('change', (event) => {
    const selectedGameID = event.target.value;
    updateTable(selectedGameID);
});

// Set last game ID on page load
populateGameIDDropdown();
setLastGameID();
