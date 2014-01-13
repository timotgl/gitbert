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
    }
    
    Commit.prototype.printSha = function () {
        console.log(this.sha);
    };
    
    Commit.prototype.willBeFetched = function () {
        var deferred = $.Deferred();
        $.get(
            'http://localhost:3000/gh/' + this.sha,
            function (data) {
                console.log(data);
                deferred.resolve(data);
            }
        );
        return deferred;
    };

    GitBert.CommitModel = Commit;
}());