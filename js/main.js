/**
 * Main app controller
 */
(function () {
    GitBert.init = function (commits) {
        GitBert.statusView.showFetchingCommits(commits.length);
    };
}());