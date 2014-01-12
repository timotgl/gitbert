/**
 * App status view. Displays loading progress and notifications.
 */
(function () {
    GitBert.statusView = {};
    var view = GitBert.statusView;

    view.showFetchingCommits = function (numCommits) {
        console.log('Now fetching ' + numCommits + ' commits');
    };
}());