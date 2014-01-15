/**
 * File content view singleton.
 * 
 * Shows the state of the GitHub file after a given commit, allows to navigate between commits.
 */
(function () {
    GitBert.contentView = {};
    var view = GitBert.contentView;
    
    view.showInitialState = function (diff) {
        console.log(GitBert.diffParser.parse(diff));
        var noTags = diff.replace('<', '&lt;', 'g').replace('>', '&gt;', 'g');
        $('code#fileContent').html(noTags);
    };
}());