/**
 * File content view singleton.
 *
 * Shows the state of the GitHub file after a given commit, allows to navigate between commits.
 */
(function () {
    GitBert.contentView = {
        elem: $('code#fileContent')
    };
    var view = GitBert.contentView;

    var _lineTemplate = _.template('<tr><td><%= lineNum %></td><td><span class="line <%= lineClass %>"><%= line %></span></td></tr>');
    var _containerTemplate = _.template('<table><% _.each(rows, function (row) {%><%= row %><% }) %></table>');
    var _logTemplate = _.template('Rendering commit <%= index %>/<%= total %> with sha <%= sha %> "<%= msg %>"');

    /**
     * Retrieve the commit with the specified sha and render it.
     */
    view.renderBySha = function (sha) {
        var commit = GitBert.commits[sha];
        var html = view.renderFullDiff(commit);

        view.elem.html(html);

        console.log(_logTemplate({
            index: commit.index + 1,
            total: GitBert.commitsOrder.length,
            sha: sha,
            msg: GitBert.utils.truncateString(commit.message, 40)
        }));
    };

    /**
     * Render hunk after hunk and indicate additions and deletions.
     */
    view.renderHunks = function (commitModel) {
        var lines = [];
        _.each(commitModel.hunks, function (hunk) {
            view.renderHunk(hunk, lines);
        });
        return _containerTemplate({rows: lines});
    };

    view.renderHunk = function (hunk, lines) {
        var line,
            firstChar,
            lineCssClass,
            remainingChars;
        
        _.each(hunk.lines, function (currLine, index) {
            firstChar = currLine[0];
            remainingChars = GitBert.sourceSanitizer.sanitize(currLine.substr(1));

            if (firstChar === '+') {
                lineCssClass = 'lineAdded';
            } else if (firstChar === '-') {
                lineCssClass = 'lineDeleted';
            } else {
                lineCssClass = '';
            }

            line = _lineTemplate({
                // TODO: this line number is wrong, it can't just increment. Needs to consider additions and deletions.
                lineNum: hunk.new.start + index,
                lineClass: lineCssClass,
                line: remainingChars
            });
            lines.push(line);
        });
    };

    /**
     * Render the file content after the commit was applied.
     */
    view.renderContent = function (commitModel) {
        var lines = [],
            sanitizedLine,
            renderedLine;

        _.each(commitModel.content, function (line, index) {
            sanitizedLine = GitBert.sourceSanitizer.sanitize(line);
            renderedLine = _lineTemplate({
                lineNum: index + 1,
                lineClass: '',
                line: sanitizedLine
            });
            lines.push(renderedLine);
        });
        return _containerTemplate({rows: lines})
    };

    /**
     * Render the file content before this commit was applied, and include the diffs of each hunk.
     */
    view.renderFullDiff = function (commitModel) {
        if (commitModel.isFirst()) {
            // The first commit has no predecessor, and therefore no previous file content.
            // Fall back to rendering the hunks.
            return this.renderHunks(commitModel);
        }

        var lines = [],
            lineNum,
            hunk;

        // Grab the commit before the one passed to this method.
        var prevSha = GitBert.commitsOrder[commitModel.index - 1],
            prevCommit = GitBert.commits[prevSha];

        // To check at which line we have to render which hunk,
        // and when to continue render the old file content line by line.
        var hunkStartLines = commitModel.getHunkStartLines(),
            continueAtLine = 0;

        _.each(prevCommit.content, function (line, index) {
            lineNum = index + 1;
            if (hunkStartLines.hasOwnProperty(lineNum)) {
                // The current line is the start line of a hunk.
                // Append all rendered lines from that hunk to the current array of lines.
                hunk = commitModel.hunks[hunkStartLines[lineNum]];
                view.renderHunk(hunk, lines);

                // Remember at which line we have to continue rendering in this loop.
                // The lines rendered by view.renderHunk() have to be skipped.
                continueAtLine = hunk.old.start + hunk.old.size;
            } else if (lineNum < continueAtLine) {
                return; // Current line is part of a hunk, skip it.
            } else {
                lines.push(
                    _lineTemplate({
                        lineNum: lineNum,
                        lineClass: '',
                        line: GitBert.sourceSanitizer.sanitize(line)
                    })
                );
            }
        });

        return _containerTemplate({rows: lines})
    }
}());