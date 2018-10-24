// Imports
const config = require('./config.json');
const express = require('express');
const file = require('./file.js');

// Check for filename command line argument
const filename = process.argv[2];
if (filename == undefined) {
    console.log('ERROR: No filename provided as command line argument.'); 
}
else {
    // Perform preprocessing. 
    /* The basic idea is to build a map of line numbers to the bytes that they start on in the file.
    To avoid using too much memory, we don't record the starting byte of every line in the file,
    however, even with just a few records we can speed up serving lines a lot, since, when a line is
    requested, we can simply find the closest prior line number on record, navigate to its starting byte,
    and read forward until we reach the requested line. This makes the maximum number of bytes read for
    any given request roughly equal to the number of bytes we wait between recording line-starting bytes
    in this step, which is defined as "lineBytesDistance" in the config file (default 1,000,000 bytes).
    You can read more about my decisions regarding this default value in the readme and src/test/timing.js. */
    const lineBytes = [{line: 0, byte: 0}]; // Objects that map line numbers to the first byte of the lines
    let line = 0; // The current line number
    let byte = 0; // The current number of bytes read
    file.getSplitStream(filename, 0, (text) => {
        /* When the difference between the current byte and the last recorded line's starting byte exceeds
        the difference specified in the config file, a new record is added. */
        if (byte - lineBytes[lineBytes.length - 1].byte >= config.lineBytesDistance) {
            lineBytes.push({line: line, byte: byte});
        }
        line += 1;
        byte += text.length + 2;
    }).then(() => {
        // Create Express app
        const app = express();

        // Routes
        app.get('/', (req, res) => {
            res.send(`Welcome to the line server. Currently serving lines from ${filename}.`);
        });

        app.get('/lines/:line/', (req, res) => {
            // Get the closest prior lineByte record
            let lineByte = 0;
            for (let i = lineBytes.length - 1; i >= 0; i--) {
                if (lineBytes[i].line < req.params.line) {
                    lineByte = lineBytes[i];
                    break;
                }
            }
            // Read forward to requested line
            let line = lineByte.line;
            let byte = lineByte.byte;
            file.getSplitStream(filename, byte, (text) => {
                if (line == req.params.line) {
                    res.send(text);
                }
                line += 1;
            })
        })

        // Listen
        app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));
    });
}