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
        var lines = [],
            line,
            firstChar,
            lineCssClass,
            remainingChars;

        _.each(commitModel.hunks, function (hunk) {
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
        });
        return _containerTemplate({rows: lines});
    };

    view.renderHunk = function (hunk, lines) {
        
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
            hunkIndex,
            hunk,
            sanitizedLine,
            renderedLine;
        
        // TODO: hunk.old: {start: 144, size: 7} line 144 in the old file is the first line of the hunk's lines!
        var hunkStartLines = commitModel.getHunkStartLines();
        // {144: 0, 179: 1}
        var prevSha = GitBert.commitsOrder[commitModel.index - 1];
        var prevCommit = GitBert.commits[prevSha];
        
        _.each(prevCommit.content, function (line, index) {
            lineNum = index + 1;
            if (hunkStartLines.hasOwnProperty(lineNum)) {
                // The current line is the start line of a hunk.
                // Append all rendered lines from that hunk to the current array of lines.
                hunkIndex = hunkStartLines[lineNum];
                hunk = commitModel.hunks[hunkIndex];
                view.renderHunk(hunk, lines);
                
                // TODO: next iteration has to skip each line that has been appended to lines already.
            } else {
                sanitizedLine = GitBert.sourceSanitizer.sanitize(line);
                renderedLine = _lineTemplate({
                    lineNum: lineNum,
                    lineClass: '',
                    line: sanitizedLine
                });
                lines.push(renderedLine);
            }
        });

        return _containerTemplate({rows: lines})
    }
}());