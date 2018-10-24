// Imports
const config = require('./config.json');
const express = require('express');
const fs = require('fs');

// Check for filename command line argument
const filename = process.argv[2];
if (filename == undefined) {
    console.log('ERROR: No filename provided as command line argument.'); 
}
else {
    // Create Express app
    const app = express();

    // Routes
    app.get('/', (req, res) => {
        res.send(`Welcome to the line server. Currently serving lines from ${filename}.`);
    });

    // Listen
    app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));
}