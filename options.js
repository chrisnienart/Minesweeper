const port = 3000;

function fetchSettings() {
    return fetch(`http://localhost:${port}/settings.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => console.error('Error fetching settings:', error));
}

function fetchInitialSettings() {
    console.log('Fetching initial settings...');
    fetchSettings()
        .then(settings => {
            console.log('Initial settings fetched:', settings);
            const difficultyMode = document.getElementById('difficultyForm');
            const scoringForm = document.getElementById('scoringForm');

            // Set the mode
            const modeRadios = difficultyMode.querySelectorAll('input[name="mode"]');
            modeRadios.forEach(radio => {
                if (radio.value === settings.mode) {
                    radio.checked = true;
                    console.log('Mode radio set:', radio.value);
                    //this is brittle as the mode and options are implicitly tied
                    const modeOptions = document.getElementById(settings.mode + 'Options');
                    modeOptions.style.display = 'block';
                }
            });
            
            // Set the simple options
            const simpleOptions = document.getElementById('simpleOptions');
            const simpleRadios = simpleOptions.querySelectorAll('input[name="difficulty"]');
            simpleRadios.forEach(radio => {
                if (radio.value === settings.modeOptions.simple) {
                    radio.checked = true;
                    console.log('Simple difficulty radio set:', radio.value);
                }
            });

            // Set the random options
            const randomMinBoardElement = document.getElementById('randomMinBoardSizeInput');
            const randomMaxBoardElement = document.getElementById('randomMaxBoardSizeInput');
            const randomMinPercentElement = document.getElementById('randomMinPercentMinesInput');
            const randomMaxPercentElement = document.getElementById('randomMaxPercentMinesInput');
            randomMinBoardElement.value = settings.modeOptions.random.minBoardSize;
            randomMaxBoardElement.value = settings.modeOptions.random.maxBoardSize;
            randomMinPercentElement.value = settings.modeOptions.random.minPercentMines;
            randomMaxPercentElement.value = settings.modeOptions.random.maxPercentMines;
            console.log('Random difficulty set: ', settings.modeOptions.random);

            // Set the custom options
            const customBoardElement = document.getElementById('customBoardSizeInput');
            const customPercentElement = document.getElementById('customPercentMinesInput');
            customBoardElement.value = settings.modeOptions.custom.boardSize;
            customPercentElement.value = settings.modeOptions.custom.percentMines;
            console.log('Custom difficulty set: ', settings.modeOptions.custom);

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

function saveOptions() {
    fetchSettings()
        .then(settings => {
            console.log('Current settings fetched:', settings);
            //retrieve simple mode settings
            const simpleOptions = settings.modeOptions.simpleOptions;
            
            const mode = document.querySelector('input[name="mode"]:checked')?.value || 'simple';
            const simpleDifficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'medium';
            const randomMinBoardSize = parseFloat(document.getElementById('randomMinBoardSizeInput').value);
            const randomMaxBoardSize = parseFloat(document.getElementById('randomMaxBoardSizeInput').value);
            const randomMinPercentMines = parseFloat(document.getElementById('randomMinPercentMinesInput').value);
            const randomMaxPercentMines = parseFloat(document.getElementById('randomMaxPercentMinesInput').value);
            const customBoardSize = parseFloat(document.getElementById('customBoardSizeInput').value);
            const customPercentMines = parseFloat(document.getElementById('customPercentMinesInput').value);
            const scoring = document.querySelector('input[name="scoring"]:checked')?.value || 'rated';

            // Create a settings object
            const settingsToSave = {
                mode: mode,
                modeOptions: {
                    simple: simpleDifficulty,
                    simpleOptions: simpleOptions,
                    random: {
                        minBoardSize: randomMinBoardSize,
                        maxBoardSize: randomMaxBoardSize,
                        minPercentMines: randomMinPercentMines,
                        maxPercentMines: randomMaxPercentMines
                    },
                    custom: {
                        boardSize: customBoardSize,
                        percentMines: customPercentMines
                    }
                },
                scoring: scoring
            };

            // Send a POST request to save the settings
            fetch(`http://localhost:${port}/save-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsToSave)
            })
            .then(response => {
                if (response.ok) {
                    console.log('Settings saved successfully:', settingsToSave);
                } else {
                    console.error('Error saving settings. Status:', response.status);
                    response.text().then(text => console.error('Response text:', text));
                }
            })
            .catch(error => console.error('Error saving settings:', error));
        })
        .catch(error => console.error('Error fetching current settings:', error));
}

document.getElementById('difficultyForm').addEventListener('change', function(event) {
    const simpleOptions = document.getElementById('simpleOptions');
    const randomOptions = document.getElementById('randomOptions');
    const customOptions = document.getElementById('customOptions');
    const target = event.target;

    if (target.closest('#simpleOptions')) {
        // If the clicked element is within the menu, keep it open
        simpleOptions.style.display = 'block';
    } else {
        if (event.target.value === 'simple') {
            simpleOptions.style.display = 'block';
        } else {
            simpleOptions.style.display = 'none';
        }
    }
    if (target.closest('#randomOptions')) {
        // If the clicked element is within the menu, keep it open
        randomOptions.style.display = 'block';
    } else {
        if (event.target.value === 'random') {
            document.getElementById('randomOptions').style.display = 'block';
        } else {
            document.getElementById('randomOptions').style.display = 'none';
        }
    }
    if (target.closest('#customOptions')) {
        // If the clicked element is within the menu, keep it open
        customOptions.style.display = 'block';
    } else {
        if (event.target.value === 'custom') {
            document.getElementById('customOptions').style.display = 'block';
        } else {
            document.getElementById('customOptions').style.display = 'none';
        }
    }
});

// Save options
const saveButton = document.getElementById('save');
saveButton.addEventListener('click', saveOptions);

// Close window
const closeButton = document.getElementById('close');
closeButton.addEventListener('click', () => window.close());

// Fetch initial settings when the page loads
window.onload = fetchInitialSettings;
