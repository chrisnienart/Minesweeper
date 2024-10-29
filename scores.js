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
            
            // Sort scores by time in ascending order
            scores.sort((a, b) => a.time - b.time);

            // Set top scores 
            const topScoreTableBody = document.querySelector('#top-scores');
            topScoreTableBody.innerHTML = ''; // Clear previous entries
            let topScoreCount = 0;
            scores.forEach(score => {
                if (score.time < 100 && topScoreCount < 10) {
                    const scoreRow = document.createElement('tr');
                    scoreRow.innerHTML = `
                        <td>${score.date}</td>
                        <td>${score.time}</td>
                        <td>${score.mode}</td>
                        <td>${score['boardSize']}</td>
                        <td class="percent-field">${Math.round(score['percentMines'] * 100)}</td>
                    `;
                    topScoreTableBody.appendChild(scoreRow);
                    topScoreCount++;
                }
            });

            // Sort all scores by date in descending order
            scores.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Set all score records
            const allScoreTableBody = document.querySelector('#all-scores');
            allScoreTableBody.innerHTML = ''; // Clear previous entries
            scores.forEach(score => {
                const scoreRow = document.createElement('tr');
                scoreRow.innerHTML = `
                    <td>${score.date}</td>
                    <td>${score.time}</td>
                    <td>${score.mode}</td>
                    <td>${score['boardSize']}</td>
                    <td class="percent-field">${Math.round(score['percentMines'] * 100)}</td>
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

// Close window
const closeButton = document.getElementById('close');
closeButton.addEventListener('click', () => window.close());

// Clear scores
const clearScoresButton = document.getElementById('clear-scores');
clearScoresButton.addEventListener('click', clearScores);

// Fetch scores when the page loads
window.onload = fetchScores;
