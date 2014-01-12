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
        
        GitBert.statusView.showFetchingCommits(commits.length);
    };
}());