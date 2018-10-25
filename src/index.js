// Imports
const config = require('./config.json');
const express = require('express');
const file = require('./file.js');

// Create the file handler using the filename from command line arguments and the lineByteDistance from the config file.
const fileHandler = new file.FileHandler(process.argv[2], config.lineBytesDistance);
fileHandler.preprocess().then(() => {
    // Create the Express app
    const app = express();
    // Define the app's routes
    app.get('/', (req, res) => {
        res.send(`Welcome to Sam's line server. Currently serving lines from ${fileHandlers.filename}.`);
    });
    app.get('/lines/', (req, res) => {
        res.send(`${fileHandler.filename} contains ${fileHandler.totalLines} lines.`);
    });
    app.get('/lines/:line/', (req, res) => {
        const line = parseInt(req.params.line);
        // Bad Request
        if (line == undefined) {
            res.sendStatus(400);
        }
        // Payload Too Large
        else if (line > fileHandler.totalLines) {
            res.sendStatus(413);
        }
        // Valid Request
        else {
            fileHandler.getLine(line).then((text) => {
                res.send(text);
            });
        }
    });
    // Listen on the port defined in the config file
    app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));
});