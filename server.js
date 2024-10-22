const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000; // Define the port as a global variable

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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

const server = http.createServer((req, res) => {
  fs.readFile('index.html', (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});

server.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}/`);
});
