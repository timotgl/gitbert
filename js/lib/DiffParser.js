/**
 * Diff parser singleton.
 *
 * Returns an object representing the structure of a unified diff for a committed file.
 */
(function () {
    GitBert.diffParser = {};
    var parser = GitBert.diffParser;

    var re = {
        hunkHeader: /@@ -(\d+)(,\d+)? \+(\d+)(,\d+) @@/,
    };

    parser.getHunkHeader = function (line) {
        var matches = line.match(re.hunkHeader);
        if (matches === null) {
            return null;
        }
        return {
            old: {
                start: parseInt(matches[1]),
                size: parseInt(matches[2].replace(',', ''))
            },
            new: {
                start: parseInt(matches[3]),
                size: parseInt(matches[4].replace(',', ''))
            }
        };
    };

    parser.parse = function (diff) {
        var lines = diff.split('\n'),
            hunkLines = [],
            hunks = [],
            prevHunk,
            currHunk,
            hunk;

        _.each(lines, function (line, index) {
            hunk = parser.getHunkHeader(line);

            // Check if we encountered the beginning of a hunk or the last line in the diff.
            if (hunk || index === lines.length - 1) {
                if (hunkLines.length >= 1) {
                    // Save buffered lines, they belong to the previous hunk.
                    currHunk.lines = hunkLines;
                    hunkLines = []; // Reset line buffer.
                    hunks.push(currHunk); // Save previous hunk with all its lines.
                }
                currHunk = hunk;
            } else {
                hunkLines.push(line); // Buffer current line.
            }
        });
        return hunks;
    };
}());