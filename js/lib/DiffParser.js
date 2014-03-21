/**
 * Diff parser singleton.
 *
 * Returns an object representing the structure of a unified diff for a committed file.
 */
(function () {
    GitBert.diffParser = {};
    var parser = GitBert.diffParser;

    var re = {
        // To identify the header line of a hunk in the diff
        // Source: http://www.artima.com/weblogs/viewpost.jsp?thread=164293
        hunkHeader: /@@ -(\d+)(,\d+)? \+(\d+)(,\d+)? @@/,

        // To extract the values from the old and new parts better
        // The optional comma and second decimal results in messy logic when checking the matched groups.
        hunkHeaderDetail: /(-[^ ]+) (\+[^ ]+)/
    };
    
    var missingNewLineToken = '\\ No newline at end of file';
    
    parser.isMissingNewLineToken = function (line) {
        return line === missingNewLineToken;
    };

    parser.getHunkHeader = function (line) {
        var matches = line.match(re.hunkHeader),
            oldChunk,
            newChunk;
        if (matches === null) {
            return null;
        }
        matches = line.match(re.hunkHeaderDetail);
        oldChunk = matches[1].replace('-', '').split(',');
        newChunk = matches[2].replace('+', '').split(',');
        return {
            old: {
                start: parseInt(oldChunk[0]),
                size: (oldChunk.length === 2) ? parseInt(oldChunk[1]) : null
            },
            new: {
                start: parseInt(newChunk[0]),
                size: (newChunk.length === 2) ? parseInt(newChunk[1]) : null
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