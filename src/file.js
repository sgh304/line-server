/* This file contains helper functions for handling the text file to be served. */

// Imports
const fs = require('fs');
const split = require('split');

function getSplitStream(filename, start, textCallback) {
    /* Returns a Promise that resolves at the end of a ReadStream of the file with the
    given filename, starting at the given byte. The stream calls the given textCallback
    on every line of the stream. If the file cannot be read, an error message is logged
    and the process is terminated. */
    return new Promise((resolve, reject) => {
        fs.createReadStream(filename, {start: start})
            .pipe(split())
            .on('data', (text) => {
                textCallback(text);
            })
            .on('end', () => {
                resolve();
            })
            .on('error', () => {
                console.log(`ERROR: Could not read file ${filename}!`);
                process.exit();
            })
    })
}

module.exports = {getSplitStream: getSplitStream};