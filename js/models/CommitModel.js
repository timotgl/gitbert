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
        this.index = data.index; // So commit knows its own position in the chronological order
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

        var fetchSuccess = function (commitDetailsJson) {
            GitBert.statusView.commitFetched();
            this.saveDetails(commitDetailsJson);

            // Just for demo, immediately render the commit when it was fetched.
            // At this point, the rendering result should instead be stored somewhere.
            GitBert.contentView.renderCommitBySha(this.sha);
            deferred.resolve();
        }

        $.get(
            this.getFetchUrl(),
            _.bind(fetchSuccess, this)
        );
        return deferred;
    };

    Commit.prototype.saveDetails = function (commitDetailsJson) {
        var details = JSON.parse(commitDetailsJson);

        // Find the right file in the list of all files changed by this commit.
        var file = _.find(details.files, function (committedFile) {
            return committedFile.filename === GitBert.constants.github.file;
        });

        // Save the diff
        this.patch = file.patch;

        // Extract individual hunks from the diff and save them
        this.hunks = GitBert.diffParser.parse(this.patch);
    };

    GitBert.CommitModel = Commit;
}());