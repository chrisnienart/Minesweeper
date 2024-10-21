const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

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

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
