const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Specific OPTIONS handler for /save-settings
app.options('/save-settings', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
});

// General CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.post('/save-settings', (req, res) => {
    const settings = req.body;
    const settingsPath = path.join(__dirname, 'settings.json');

    fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), (err) => {
        if (err) {
            console.error('Error saving settings:', err);
            res.status(500).send('Error saving settings');
        } else {
            console.log('Settings saved successfully');
            res.status(200).send('Settings saved successfully');
        }
    });
});

// Route to serve settings.json
app.get('/settings.json', (req, res) => {
    const settingsPath = path.join(__dirname, 'settings.json');
    fs.readFile(settingsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading settings:', err);
            res.status(500).send('Error reading settings');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).send(data);
        }
    });
});

// Route to serve scores.json
app.get('/scores.json', (req, res) => {
    const scoresPath = path.join(__dirname, 'scores.json');
    fs.readFile(scoresPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading scores:', err);
            res.status(500).send('Error reading scores');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(200).send(data);
        }
    });
});

// Route to update scores.json
app.put('/scores.json', (req, res) => {
    const scores = req.body;
    const scoresPath = path.join(__dirname, 'scores.json');

    fs.writeFile(scoresPath, JSON.stringify(scores, null, 2), (err) => {
        if (err) {
            console.error('Error updating scores:', err);
            res.status(500).send('Error updating scores');
        } else {
            console.log('Scores updated successfully');
            res.status(200).send('Scores updated successfully');
        }
    });
});

// Route to clear scores.json
app.post('/clear-scores', (req, res) => {
    const scoresPath = path.join(__dirname, 'scores.json');
    const emptyScores = { scores: [] };

    fs.writeFile(scoresPath, JSON.stringify(emptyScores, null, 2), (err) => {
        if (err) {
            console.error('Error clearing scores:', err);
            res.status(500).send('Error clearing scores');
        } else {
            console.log('Scores cleared successfully');
            res.status(200).send('Scores cleared successfully');
        }
    });
});

// Route to update games.json
app.put('/games.json', (req, res) => {
    const games = req.body;
    const gamesPath = path.join(__dirname, 'games.json');

    fs.writeFile(gamesPath, JSON.stringify(games, null, 2), (err) => {
        if (err) {
            console.error('Error updating games:', err);
            res.status(500).send('Error updating games');
        } else {
            console.log('Games updated successfully');
            res.status(200).send('Games updated successfully');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
