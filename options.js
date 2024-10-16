const saveButton = document.getElementById('save');

function fetchInitialSettings() {
    console.log('Fetching initial settings...');
    fetch('settings.json')
        .then(response => response.json())
        .then(settings => {
            console.log('Initial settings fetched:', settings);
            const difficultyForm = document.getElementById('difficultyForm');
            const scoringForm = document.getElementById('scoringForm');

            // Set the initial difficulty
            const difficultyRadios = difficultyForm.querySelectorAll('input[name="difficulty"]');
            difficultyRadios.forEach(radio => {
                if (radio.value === settings.difficulty) {
                    radio.checked = true;
                    console.log('Difficulty radio set:', radio.value);
                }
            });

            // Set the initial scoring
            const scoringRadios = scoringForm.querySelectorAll('input[name="scoring"]');
            scoringRadios.forEach(radio => {
                if (radio.value === settings.scoring) {
                    radio.checked = true;
                    console.log('Scoring radio set:', radio.value);
                }
            });
        })
        .catch(error => console.error('Error fetching initial settings:', error));
}

function populateForm(content) {
    const data = JSON.parse(content);
    document.getElementById('difficulty').value = data.difficulty;
    document.getElementById('scoring').value = data.scoring;
}

function saveOptions() {
    const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'easy';
    const scoring = document.querySelector('input[name="scoring"]:checked')?.value || 'rated';

    // Create a settings object
    const settings = {
        difficulty: difficulty,
        scoring: scoring
    };

    // Convert the settings object to a JSON string
    const settingsJson = JSON.stringify(settings);

    // Specify the file path
    const file_path = "settings.json";

    // Write JSON data to the file NOT WORKING
    const fs = require('fs');
    fs.writeFile(file_path, JSON.stringify(data, null, 4), (err) => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            console.log("Data written to file successfully.");
        }
    });
}

// Save options
saveButton.addEventListener('click', saveOptions);

// Fetch initial settings when the page loads
window.onload = fetchInitialSettings;
