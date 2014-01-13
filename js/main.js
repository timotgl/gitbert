/**
 * Main app controller
 */
(function () {
    GitBert.init = function (commits) {
        // Store commits here by mapping the SHA to model instances.
        GitBert.commits = {};

        // Preserve order by saving the SHAs in an array, where the first element will be the first commit.
        GitBert.commitsOrder = [];

        // Loop over commits and create model instances.
        _.each(commits, function (commitData) {
            GitBert.commits[commitData.sha] = new GitBert.CommitModel(commitData);
            GitBert.commitsOrder.push(commitData.sha);
        });
        GitBert.commitsOrder.reverse();

        GitBert.statusView.initFetchingCommits(GitBert.commitsOrder.length);

        // Get list of deferreds for each commit to be fetched
        var allCommitsFetched = _.map(GitBert.commits, function (model, index) {
            return model.willBeFetched();
        });

        // Initialize content view when all commits have been fetched
        $.when.apply($, allCommitsFetched).then(function () {
            console.log('All commits have been fetched!');
        });
    };
}());