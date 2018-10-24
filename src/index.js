// Imports
const config = require('./config.json');
const express = require('express');
const fs = require('fs');

// Create app
const app = express();

// Routes
app.get('/', (req, res) => {
    res.send(`Welcome to the line server.`);
});

// Listen
app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));