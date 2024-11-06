const port = 3000;

function fetchScores() {
    console.log('Fetching scores...');
    fetch(`http://localhost:${port}/scores.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const scores = data.scores;
            console.log('Scores fetched:', scores);
            
            // Sort scores by performance in descending order
            scores.sort((a, b) => calculatePerformance(b.time, b['boardSize'], b['numMines'], b['revealedCells']) - calculatePerformance(a.time, a['boardSize'], a['numMines'], a['revealedCells']));

            // Set top scores 
            const topScoreTableBody = document.querySelector('#top-scores');
            topScoreTableBody.innerHTML = ''; // Clear previous entries
            let topScoreCount = 0;
            scores.forEach(score => {
                if (topScoreCount < 10) {
                    const performance = calculatePerformance(score.time, score['boardSize'], score['numMines'], score['revealedCells']);
                    if(performance > 2.5) {
                        const percentMines = score['numMines'] / (score['boardSize'] ** 2);
                        const percentCleared = score['revealedCells'] / (score['boardSize'] ** 2 - score['numMines']);
                        const scoreRow = document.createElement('tr');
                        scoreRow.innerHTML = `
                            <td>${score.date}</td>
                            <td>${score.result}</td>
                            <td>${score.time}</td>
                            <td>${score.mode}</td>
                            <td>${score['boardSize']}</td>
                            <td class="percent-field">${Math.round(percentMines * 100)}</td>
                            <td class="percent-field">${Math.round(percentCleared * 100)}</td>
                            <td>${performance.toFixed(2)}</td>
                        `;
                        topScoreTableBody.appendChild(scoreRow);
                        topScoreCount++;
                    }
                }
            });

            // Sort all scores by date in descending order
            scores.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Set all score records
            const allScoreTableBody = document.querySelector('#all-scores');
            allScoreTableBody.innerHTML = ''; // Clear previous entries
            scores.forEach(score => {
                const percentMines = score['numMines'] / (score['boardSize'] ** 2);
                const percentCleared = score['revealedCells'] / (score['boardSize'] ** 2 - score['numMines']);
                const performance = calculatePerformance(score.time, score['boardSize'], score['numMines'],score['revealedCells']);
                const scoreRow = document.createElement('tr');
                scoreRow.innerHTML = `
                    <td>${score.date}</td>
                    <td>${score.result}</td>
                    <td>${score.time}</td>
                    <td>${score.mode}</td>
                    <td>${score['boardSize']}</td>
                    <td class="percent-field">${Math.round(percentMines * 100)}</td>
                    <td class="percent-field">${Math.round(percentCleared * 100)}</td>
                    <td>${performance.toFixed(2)}</td>
                `;
                allScoreTableBody.appendChild(scoreRow);
            });
        })
        .catch(error => console.error('Error fetching scores:', error));
}

function clearScores() {
    if (confirm('Are you sure you want to clear all scores? This action cannot be undone.')) {
        fetch(`http://localhost:${port}/clear-scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                console.log('Scores cleared successfully');
                fetchScores(); // Refresh the scores display
            } else {
                console.error('Error clearing scores. Status:', response.status);
            }
        })
        .catch(error => console.error('Error clearing scores:', error));
    } else {
        console.log('Clear scores action was cancelled.');
    }
}

function calculatePerformance(time, boardSize, numMines, revealedCells) {
    const percentMines = numMines / (boardSize ** 2);
    const percentCleared = revealedCells / (boardSize ** 2 - numMines);
    const difficultyRatio = percentMines / (1 - percentMines);
    const adjustedNumMines = Math.round(boardSize ** 2 * difficultyRatio);
    const adjustedTime = Math.sqrt(time / difficultyRatio);
    if (time > 0) {
        performance = percentCleared * adjustedNumMines / adjustedTime;
    } else {
        performance = 0;
    }
    return performance;
}

// Close window
const closeButton = document.getElementById('close');
closeButton.addEventListener('click', () => window.close());

// Clear scores
const clearScoresButton = document.getElementById('clear-scores');
clearScoresButton.addEventListener('click', clearScores);

// Fetch scores when the page loads
window.onload = fetchScores;
