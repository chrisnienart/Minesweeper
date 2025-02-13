const port = 3000;

import { calculateMetrics, calculatePerformance } from './metrics.js';

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
            
            const topPerformanceCutoff = 2.5;
            const topRankCutoff = 10;

            // Set best winning scores
            const filteredWinningScores = scores.filter(score => {
                const {performance} = calculatePerformance(score.time, score['boardSize'], score['numMines'], score['revealedCells']);
                return performance > topPerformanceCutoff && score.result === 'won';
            });
            const sortedWinningScores = filteredWinningScores.sort((a, b) => {
                const {performance: aPerf} = calculatePerformance(a.time, a['boardSize'], a['numMines'], a['revealedCells']);
                const {performance: bPerf} = calculatePerformance(b.time, b['boardSize'], b['numMines'], b['revealedCells']);
                return bPerf - aPerf;
            });
            const winningScores = sortedWinningScores.slice(0, topRankCutoff); // Only keep the top scores
            const winningScoreTableBody = document.querySelector('#best-winning-scores');
            winningScoreTableBody.innerHTML = ''; // Clear previous entries
            winningScores.forEach(score => createTableRow(score,winningScoreTableBody));
            
            // Set top scores
            const filteredScores = scores.filter(score => {
                const {performance} = calculatePerformance(score.time, score['boardSize'], score['numMines'], score['revealedCells']);
                return performance > topPerformanceCutoff;
            });
            const sortedScores = filteredScores.sort((a, b) => {
                const {performance: aPerf} = calculatePerformance(a.time, a['boardSize'], a['numMines'], a['revealedCells']);
                const {performance: bPerf} = calculatePerformance(b.time, b['boardSize'], b['numMines'], b['revealedCells']);
                return bPerf - aPerf;
            });
            const topScores = sortedScores.slice(0, topRankCutoff); // Only keep the top scores
            const topScoreTableBody = document.querySelector('#top-scores');
            topScoreTableBody.innerHTML = ''; // Clear previous entries
            topScores.forEach(score => createTableRow(score,topScoreTableBody));

            // Set all score records
            scores.sort((a, b) => {
                // If gameID is present, use it for sorting
                if (a.gameID && b.gameID) {
                    return b.gameID - a.gameID;
                }
                // If gameID is missing, fall back to date sorting
                return new Date(b.date) - new Date(a.date);
            });
            const allScoreTableBody = document.querySelector('#all-scores');
            allScoreTableBody.innerHTML = ''; // Clear previous entries
            scores.forEach(score => createTableRow(score,allScoreTableBody));
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

function createTableRow(score,tableBody) {
    const metrics = calculateMetrics(score);
    const scoreRow = document.createElement('tr');
    scoreRow.innerHTML = `
        <td class="game-id-link">${score.gameID}</td>
        <td>${score.date}</td>
        <td>${score.result}</td>
        <td>${score.time}</td>
        <td>${score.mode}</td>
        <td>${score['boardSize']}</td>
        <td class="percent-field">${Math.round(metrics.percentMines * 100)}</td>
        <td class="percent-field">${Math.round(metrics.percentCleared * 100)}</td>
        <td>${metrics.pace.toFixed(2)}</td>
        <td>${metrics.performance.toFixed(2)}</td>
    `;
    scoreRow.querySelector('.game-id-link').addEventListener('click', () => {
        window.location.href = `review.html?gameID=${score.gameID}`;
    });
    tableBody.appendChild(scoreRow);
}


// Close window
const closeButton = document.getElementById('close');
closeButton.addEventListener('click', () => window.close());

// Clear scores
const clearScoresButton = document.getElementById('clear-scores');
clearScoresButton.addEventListener('click', clearScores);

// Fetch scores when the page loads
window.onload = fetchScores;
