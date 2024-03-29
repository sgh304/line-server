/* This file contains the FileHandler class, a class that groups relevant data and vital methods for
reading the text file that the server is... serving. */

// Imports
const fs = require('fs'); // For managing the file system.
const split = require('split'); // A package that turns readableStreams into streams of split lines.

class FileHandler {
    constructor(filename) {
        /* Creates a FileHandler object that handles the file with the given filename and
        observes the given lineBytesDistance. */
        this.filename = filename;
        this.lineBytes = [{line: 0, byte: 0}]; // Objects that map line numbers to the lines' starting bytes
    }

    preprocess(lineBytesDistance) {
        /* Returns a Promise that resolves after performing the initial processing of the handled
        text file. The lineBytes array is built, mapping some of the handled file's line numbers to the
        lines' starting bytes, with the distance between each record being roughly equal to lineBytesDistance. */
        return new Promise((resolve, reject) => {
            console.log(`Preprocessing file ${this.filename}...`);
            const startTime = Date.now();
            let currentLine = 0;
            let currentByte = 0;
            this.readLines(0, (text) => {
                /* When the difference between the current byte and the last recorded line's starting byte exceeds
                lineBytesDistance, a new record is added. */
                if (currentByte - this.lineBytes[this.lineBytes.length - 1].byte >= lineBytesDistance) {
                    this.lineBytes.push({line: currentLine, byte: currentByte});
                }
                // Increment line number and read bytes each line.
                currentLine += 1;
                currentByte += text.length + 2; // Each character in ASCII is one byte, so the line's bytes is the length of the line's text + 2 (for the '\n', which is not counted as text)
            }).then(() => {
                this.totalLines = currentLine - 1;
                console.log(`Preprocessing of ${this.filename} complete with ${this.totalLines} lines and ` +
                    `${this.lineBytes.length} line:byte records in ${(Date.now() - startTime) / 1000} seconds.`);
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
            console.log(`Retreving line ${line}...`);
            // Locate the nearest and prior lineByte.
            let lineByte = 0;
            for (let i = this.lineBytes.length - 1; i >= 0; i--) {
                if (this.lineBytes[i].line <= line) {
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
                    console.log(`Line ${line} retrieved!`);
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