/* This file contains the FileHandler class, a class that groups relevant data and vital methods for
reading the text file that the server is... serving. */

// Imports
const fs = require('fs');
const split = require('split');

class FileHandler {
    constructor(filename, lineBytesDistance) {
        /* Creates a FileHandler object that handles the file with the given filename and
        observes the given lineBytesDistance. */
        this.filename = filename;
        this.lineBytesDistance = lineBytesDistance;
        this.lineBytes = [{line: 0, byte: 0}]; // Objects that map line numbers to the lines' starting bytes
    }

    preprocess() {
        /* Returns a Promise that resolves after performing the initial processing of the handled
        text file. The lineBytes array is built, mapping some of the handled file's line numbers to the
        lines' starting bytes, with the distance between each record being roughly equal to the handler's
        lineBytesDistance. */
        return new Promise((resolve, reject) => {
            console.log(`Preprocessing file ${this.filename}...`);
            let currentLine = 0;
            let currentByte = 0;
            this.readLines(0, (text) => {
                /* When the difference between the current byte and the last recorded line's starting byte exceeds
                the handler's lineBytesDistance, a new record is added. */
                if (currentByte - this.lineBytes[this.lineBytes.length - 1].byte >= this.lineBytesDistance) {
                    this.lineBytes.push({line: currentLine, byte: currentByte});
                }
                // Increment line number and read bytes each line.
                currentLine += 1;
                currentByte += text.length + 2;
            }).then(() => {
                this.totalLines = currentLine - 2;
                console.log(`Preprocessing of ${this.filename} complete.`);
                resolve();
            });
        })
    }

    getLine(line) {
        /* Returns a Promise that resolves with the requested line from the handled text file. The
        line is retrieved by locating the record in lineBytes that is nearest and prior to the requested
        line, then reading the text file starting at that record's byte position until the requested line
        is reached. */
        return new Promise((resolve, reject) => {
            // Locate the nearest and prior lineByte.
            let lineByte = 0;
            for (let i = this.lineBytes.length - 1; i >= 0; i--) {
                if (this.lineBytes[i].line < line) {
                    lineByte = this.lineBytes[i];
                    break;
                }
            }
            // Read forward to requested line.
            let currentLine = lineByte.line;
            this.readLines(lineByte.byte, (text, stream) => {
                // When the requested line is reached, destroy the stream and resolve. 
                if (currentLine == line) {
                    stream.destroy();
                    resolve(text);
                }
                currentLine += 1;
            });
        });
    }

    readLines(start, textCallback) {
        /* Returns a Promise that resolves at the end of a ReadStream of the file with the
        given filename, starting at the given byte. The stream calls the given textCallback
        on every line of the stream, passing the line's text and the stream itself (for early
        destruction). If the file cannot be read, an error message is logged and the process
        is terminated. */
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(this.filename, {start: start})
                .on('error', (err) => {
                    this.terminate();
                })
                .pipe(split())
                .on('data', (text) => {
                    textCallback(text, stream);
                })
                .on('end', () => {
                    resolve();
                });
        });
    }

    terminate() {
        /* A helper function that logs an error message and immediately terminates the process,
        to be used when there is some sort of error reading the handled file. */
        console.log(`ERROR: Could not read file ${this.filename}!`);
        process.exit();
    }
}

module.exports = {FileHandler: FileHandler};