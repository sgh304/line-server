// Imports
const config = require('../config.json'); // Contains the server's configuration.
const express = require('express'); // The server framework.
const file = require('./file.js'); // Contains the API for reading the text file.

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
        // If something that is not line number is requested, Bad Request
        if (line == undefined) {
            res.sendStatus(400);
        }
        // If the file doesn't have the requested line, Payload Too Large
        else if (line >= fileHandler.totalLines) {
            res.sendStatus(413);
        }
        // Otherwise, OK
        else {
            fileHandler.getLine(line).then((text) => {
                res.send(text);
            });
        }
    });
    // Listen on the port defined in the config file
    app.listen(config.port, () => console.log(`Sam's line server is listening on port ${config.port}!`));
});