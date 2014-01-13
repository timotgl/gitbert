/**
 * Commit model.
 *
 * Initially contains commit data from the GitHub API, will later be enriched with app-specific data used for
 * visually presenting file changes.
 */
(function () {
    function Commit (data) {
        this.author = data.commit.author;
        this.committer = data.commit.committer;
        this.message = data.commit.message;
        this.sha = data.sha;
        this.fetchUrlTemplate = _.template('<%= baseUrl %>gh/<%= user %>/<%= repo %>/<%= sha %>');
    }
    
    Commit.prototype.getFetchUrl = function () {
        return this.fetchUrlTemplate({
            baseUrl: GitBert.constants.baseUrl,
            user: GitBert.constants.github.user,
            repo: GitBert.constants.github.repo,
            sha: this.sha
        });
    };
    
    Commit.prototype.willBeFetched = function () {
        var deferred = $.Deferred();
        $.get(
            this.getFetchUrl(),
            function (data) {
                GitBert.statusView.commitFetched();
                deferred.resolve(data);
            }
        );
        return deferred;
    };

    GitBert.CommitModel = Commit;
}());