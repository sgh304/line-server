# This is the script I used to generate some large files to test the server.
# It generates a specified number of lines, with each line consisting of a random number of 'x' characters
# (between 0 and 1000) concatenated with the line number.

from random import randint

LINES = 10000000

with open('testfile.txt', 'w') as file:
    for i in range(LINES):
        file.write(f'{"x" * randint(0, 1000)} {i}\n')