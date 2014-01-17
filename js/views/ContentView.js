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
    
    var lineTemplate = _.template('<tr><td><%= lineNum %></td><td><span class="line <%= lineClass %>"><%= line %></span></td></tr>');
    var containerTemplate = _.template('<table><% _.each(rows, function (row) {%><%= row %><% }) %></table>');
    
    view.renderCommitBySha = function (sha) {
        console.log('Rendering', sha);
        var commit = GitBert.commits[sha];
        view.elem.html(view.renderCommit(commit));
    };
    
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

                line = lineTemplate({
                    lineNum: hunk.new.start + index,
                    lineClass: lineCssClass,
                    line: remainingChars
                });
                lines.push(line);
            });
        });
        return containerTemplate({rows: lines})
    };
    
    view.reconstruct = function () {
        console.log('All commits fetched, starting reconstruction.');
    };
}());