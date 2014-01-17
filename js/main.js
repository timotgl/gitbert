/**
 * Main app controller
 */
(function () {
    // Store commits here by mapping the SHA to model instances.
    GitBert.commits = {};

    // Preserve order by saving the SHAs in an array, where the first element will be the first commit.
    GitBert.commitsOrder = [];
    
    GitBert.init = function (commits) {
        // Loop over commits and create model instances.
        _.each(commits, function (commitData) {
            GitBert.commits[commitData.sha] = new GitBert.CommitModel(commitData);
            GitBert.commitsOrder.push(commitData.sha);
        });
        GitBert.commitsOrder.reverse();

        GitBert.statusView.initFetchingCommits(GitBert.commitsOrder.length);

        // Get list of deferreds for each commit to be fetched
        var deferred;
        var allCommitsFetched = _.map(GitBert.commits, function (model, index) {
            deferred = model.willBeFetched();
            if (model.sha === GitBert.commitsOrder[0]) {
                // This is the first (oldest) commit. When it was fetched, we can render its diff.
                deferred.then(function () {
                    GitBert.contentView.init();
                });
            }
            return deferred;
        });

        // Initialize content view when all commits have been fetched
        $.when.apply($, allCommitsFetched).then(function () {
            GitBert.contentView.reconstruct();
        });
    };
}());