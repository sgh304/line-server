/* This file contains some simple experiments I ran to measure the feasibility and performance of preprocessing
a text file to create a map of some of its line numbers to the bytes that those lines start on. */

// Imports
const fs = require('fs');
const split = require('split');

function timeReadingBytes(filename, bytes) {
    /* This logs the time in seconds that it takes to read a number of bytes from a text file. I wanted to
    know this to help decide about how many bytes to allow in between the records in my map of line numbers
    to starting bytes, since, in theory, the worst-case line lookup woud have to read that many bytes from
    the file before serving a line to the user.
    With several trials, I determined that putting ~1,000,000 bytes between records would be a good choice,
    since reading ~1,000,000 bytes tended to take at the most 20ms, not a bad worst-case for a server response.
    Also, a map with ~1,000,000 bytes between records would only take up ~200KB for a 10GB file (assuming each
    Number, line number and byte, takes up about 10 bytes, 10GB / 1000000B * 10B * 2 = 200KB), and ~2MB for a
    100GB file (100GB / 1000000B * 10B * 2 = 2MB), meaning I could comfortably keep the map in memory even when
    serving quite large files.
    During these experiments, I also learned that reading more bytes through a stream piped into the split package
    doesn't necessarily increase read time linearly. For example, while reading 1,000,000B took ~20ms, reading
    10,000,000B usually only took ~65ms, and even 1GB only took ~4.5s. This suggests that my preprocessing
    could be relatively fast, even for large files.
    Also, an earlier implementation of this test performed mutliple reads at the same time, which I found to work,
    albeit with a little slower read speed overall. All reads performed at the same time slowed down, with all
    of them returning in about the same time. So serving lines to many users might slow the server down a bit,
    however it will be a consistent speed across all users. */
    let start = Date.now();
    let read = 0;
    let done = false;
    let stream = fs.createReadStream(filename)
                        .pipe(split())
                        .on('data', (text) => {
                            read += text.length;
                            if (read >= bytes && done == false) {
                                console.log((Date.now() - start) / 1000);
                                done = true;
                                stream.destroy();
                            }
                        });
}

//timeReadingBytes('testfile4.txt', 1000000);