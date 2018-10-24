// Imports
const config = require('./config.json');
const express = require('express');
const fs = require('fs');
const split = require('split');

// Check for filename command line argument
const filename = process.argv[2];
if (filename == undefined) {
    console.log('ERROR: No filename provided as command line argument.'); 
}
else {
    // Perform preprocessing. 
    /* The basic idea is to build a map of line numbers to the bytes that they start on in the file.
    To avoid using too much memory, we don't record the starting byte of every line in the file,
    however even with just a few records we can speed up serving lines a lot, since, when a line is
    requested, we can simply find the closest prior line number on record, navigate to its starting byte,
    and read forward until we reach the requested line. This makes the maximum number of bytes read for
    any given request roughly equal to the number of bytes we wait between recording line-starting bytes
    in this step, which is defined as "lineBytesDistance" in the config file (default 1,000,000 bytes).
    You can read more about my decisions regarding this default value in the readme and
    src/test/timing.js. */
    const lineBytes = [{line: 0, byte: 0}];
    let line = 0;
    let bytesSinceLastRecord = 0;
    let stream = fs.createReadStream(filename)
                        .pipe(split())
                        .on('data', (text) => {
                            if (bytesSinceLastRecord >= config.lineBytesDistance) {
                                lineBytes.push({line: line, byte: lineBytes[lineBytes.length - 1].byte + bytesSinceLastRecord});
                                bytesSinceLastRecord = 0;
                            }
                            line += 1;
                            bytesSinceLastRecord += text.length;
                        })
                        .on('close', () => {
                            // Create Express app
                            const app = express();

                            // Routes
                            app.get('/', (req, res) => {
                                res.send(`Welcome to the line server. Currently serving lines from ${filename}.`);
                            });

                            // Listen
                            app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));
                        });
}