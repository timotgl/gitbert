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

    view.renderCommitBySha = function (sha) {
        var commit = GitBert.commits[sha];
        console.log(_logTemplate({
            index: commit.index + 1,
            total: GitBert.commitsOrder.length,
            sha: sha,
            msg: GitBert.utils.truncateString(commit.message, 40)
        }));
        view.elem.html(view.renderCommit(commit));
    };
    
    view.renderContentBySha = function (sha) {
        var commit = GitBert.commits[sha];
        console.log(_logTemplate({
            index: commit.index + 1,
            total: GitBert.commitsOrder.length,
            sha: sha,
            msg: GitBert.utils.truncateString(commit.message, 40)
        }));
        view.elem.html(view.renderContent(commit));
    };

    /**
     * Render hunk after hunk and indicate additions and deletions.
     */
    view.renderCommit = function (commitModel) {
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
        return _containerTemplate({rows: lines})
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
}());