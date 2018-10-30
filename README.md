# Line Server
## Summary
This is a system I built to solve [Salsify's Line Server Problem](https://salsify.github.io/line-server.html).

It is a server that delivers individual lines of a text file to users utilizing a simple REST API.

My approach first maps some of the text file's line numbers to the bytes that those lines begin on, enabling the server to quickly navigate the file upon requests and serve lines efficiently, even when faced with a large text file and/or many users.

## Instructions
My server requires [Node](https://nodejs.org/en/) to run.

With Node installed, you can run the command `build.sh`, or just `npm install`, in the project root directory.

Then, run `run.sh [FILENAME]` in the same directory, the single argument being the path to the file you wish to serve.

Some tests can be run using the `file_generator.py` and `test_line_server.py` scripts in `/test/`.

## Questions

### How does your system work? (if not addressed in comments in source)

When launched, my system first preprocesses the text file. As it reads through the file line by line, it builds a mapping of certain line numbers to the bytes that those lines start on in memory, recording a line number:byte pair every ~1,000,000 bytes of the text file (this value, which I call the lineByteDistance, can be changed in config.json, and you can read about why I picked this approach and default value below and in `/test/experiments.js`).

After preprocessing is complete, the server opens for connections. When the server receives a request for a line, it finds the nearest prior line number in the mappings, opens the text file at the byte specified by the mapping, and reads forward until the requested line is encountered, finally rendering that line to the user.

The server handles erroneous input (a 400 response is sent if no valid line number is requested; a 413 response is sent if the line number doesn't exist in the file), and I also added an extra endpoint, GET /lines/, that can be queried to determine the text file's name and number of lines for convenience.

### How will your system perform with a 1 GB file? a 10 GB file? a 100 GB file?

My system handles large files well. I chose my approach of in-memory line number:starting byte mappings with a default lineByteDistance of ~1,000,000 for two reasons:

1. Running on my computer, my system can read 1,000,000 bytes (the rough maximum that would need to be read for any given request under this configuration, since that's the rough maximum space there can be between mappings) in about 20ms, which I'm guessing would be even faster on a production machine.

2. The mappings for even a 100GB file only amount to, at the most, 2MB in memory (100GB / 1000000B * 10B * 2 = 2MB).

That said, while the preprocessing step for a 10GB file only takes around 30s, a 100GB file takes several minutes, meaning, if I wanted to serve a very large file, I might opt to store the mappings in some sort of a database instead of memory. This would probably slow down requests a bit (though I could also likely speed them back up by reducing the lineByteDistance, since space becomes less of an issue), but if the server were to crash or something, I wouldn't have to take the time to preprocess again when I got it back up and running.

### How will your system perform with 100 users? 10000 users? 1000000 users?

My system seems to handle many users well, too, though I couldn't test it as easily as I could with large files (I could simulate many users, but only from my own machine, not really a production environment, etc.).

During my experimentation, I found that many concurrent reads of the file work fine, although they are consistently slightly slower-moving than reads done alone. I picked my default lineByteDistance with this in mind, measuring an at-worst ~50ms response time (on my machine) when handling 100 requests at the same time.

That said, if I wanted to deploy the server in a situation where snappy performance with many, many users was crucial, I would probably just reduce the lineBytesDistance (easily done in the config file), taking some more memory for the mappings, but ensuring that the slower concurrent reads would be covering a smaller maximum distance and thus making the server more responsive to users.

### What documentation, websites, papers, etc did you consult in doing this assignment?

Most of my time was spent reading the official Node documentation on [readStreams](https://nodejs.org/api/stream.html) and the Mozilla documentation on [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), since I haven't been working in Node much lately. I also looked at the documentation on the third-party library I used, [split](https://www.npmjs.com/package/split), along with a few other alternatives ([readline](https://nodejs.org/api/readline.html), [split2](https://github.com/mcollina/split2)).

### What third-party libraries or other tools does the system use? How did you choose each library or framework you used?

I used [Express](https://expressjs.com/) as my server framework, because it's easy to set up, produces clear code, and what I have the most experience using in Node.

I also used a package called [split](https://www.npmjs.com/package/split) to help me read text files line-by-line. Since I hadn't used that package before, my selection process there consisted of reading the package's documentation, looking on the web to see if other projects had used it with success, and comparing it against a few other similar packages. Specifically, I ran some tests to the performance of another package called [split2](https://github.com/mcollina/split2). Despite the fact that split2 is the "sequel", I disappointingly got better performance with split. It's like the Jaws 2 of npm packages.

### How long did you spend on this exercise? If you had unlimited more time to spend on this, how would you spend it and how would you prioritize each item?

I spent about 4-5 hours on the exercise.

With more time, my first priority would be reacting to a more specific environment specification to make sure the server is performing optimally in production (potentially making the tweaks I talked about above, like adjusting lineBytesDistance for more users or a larger/smaller filer).

Then, I would probably do some more performance research (I'm wondering if performance might be better if I just read the file normally during preprocessing/requests and manually handled line splitting instead of using the split package, especially for files with lots of short lines) and also make the server a little more versatile (the problem specfied ASCII, but it would be cool if code-point/encoding could be detected on a file-by-file basis, maybe to support other languages).

### If you were to critique your code, what would you have to say about it?

- I'm not 100% confident in my use of Promises (they feel over-used, but I'm not really sure).

- I wonder if I over-commented, not because commenting's a bad thing, but because maybe it suggests I could've made things clearer in the code itself.

- My logging is lacking, both in information and consistency.

- I don't really like the use of process.exit() in file.js:97, but I'm not quite sure what the best practice for that kind of thing is.