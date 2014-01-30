/**
 * App status view singleton.
 *
 * Displays loading progress and notifications.
 */
(function () {
    GitBert.statusView = {
        fetchingCommitsTemplate: _.template('Fetching commit <%= curr %>/<%= total %>')
    };
    var view = GitBert.statusView;

    view.initFetchingCommits = function (numTotal) {
        view.fetchCommitsTotal = numTotal;
        view.fetchCommitsCurrent = 0;
        view.showFetchingCommits();
    };

    view.commitFetched = function () {
        view.fetchCommitsCurrent++;
        view.showFetchingCommits();
    }

    view.showFetchingCommits = function () {
        console.log(view.fetchingCommitsTemplate({
            curr: view.fetchCommitsCurrent,
            total: view.fetchCommitsTotal
        }));
    };
}());