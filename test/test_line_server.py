# This is a simple Python script that I used to make sure the line server works as specified.
# It's not very robust. It depends heavily on the fact that every line of the text file(s) I used
# to test ended with the line number, as well as one of those text file's specific length. Such files
# can be generated using /test/file_generator.py.

import random
import requests

def make_line_url(line):
    return f'http://localhost:3000/lines/{line}/'

# Test some random valid lines (incuding first and last)
for line in [0, 1, 2, 3000, 30505, 621312, 9999999]:
    assert(requests.get(make_line_url(line)).text[-len(str(line)):] == str(line))

# Test a request for a line that is not a number
assert(requests.get(make_line_url('abcdef')).status_code == 400)

# Test a request for a line that doesn't exist in the file
assert(requests.get(make_line_url(23380916)).status_code == 413)

# Test the other pages
assert(requests.get('http://localhost:3000/').text == 'Welcome to Sam\'s line server. Currently serving lines from testfile.txt.')
assert(requests.get('http://localhost:3000/lines/').text == 'testfile.txt contains 10000000 lines.')