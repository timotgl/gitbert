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

        // The full content of the file after this commit was applied will be reconstructed here as an array of lines.
        this.content = null;
    }
    
    _fetchUrlTemplate = _.template('<%= baseUrl %>gh/<%= user %>/<%= repo %>/<%= sha %>');
    _missingNewLineToken = '\\ No newline at end of file';

    Commit.prototype.getFetchUrl = function () {
        return _fetchUrlTemplate({
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

    Commit.prototype.reconstructContent = function () {
        var prevSha,
            prevCommit;

        if (this.index === 0) {
            // First commit, start out with empty content.
            this.content = [];
        } else {
            prevSha = GitBert.commitsOrder[this.index - 1];
            prevCommit = GitBert.commits[prevSha];

            // Clone all lines from the previous state of the file.
            this.content = prevCommit.content.slice();
        }
        
        // Apply all hunks of this commit to the previous content of the file.
        _.each(this.hunks, function (hunk) {
            this.applyHunk(hunk);
        }, this);
    };
    
    Commit.prototype.applyHunk = function (hunk) {
        // Index of the line in the old file to which the changes in the hunk are related.
        // Can be 0, which means the file didn't exist until this commit added it to the
        // repo.
        var position = (hunk.old.start === 0) ? 0 : hunk.old.start - 1,
            firstChar,
            remainingChars,
            buffer = [], // Keep track of line indices where a deletion is followed by an addition (=replacement).
            deletions = {}, // Contains indices of lines to be deleted.
            additions = {}; // Contains indices of lines which mark the insertion of an array of added lines.

        _.each(hunk.lines, function (line) {
            firstChar = line[0];
            remainingChars = line.substr(1);

            if (firstChar === '-') {
                buffer.push(position);
                deletions[position] = true;
                position++;
            } else if (firstChar === '+') {
                if (_.isEmpty(buffer)) {
                    additions[position] = remainingChars;
                    position++;
                } else {
                    additions[buffer.shift()] = remainingChars;
                }
            } else if (line === _missingNewLineToken) {

            } else {
                // Line common in old and new file
                buffer = []; // Clear buffer, since any following additions can't be related to previous deletions.
                position++;
            }
        }, this);
        console.log('deletions:', deletions);
        console.log('additions:', additions);
    };

    GitBert.CommitModel = Commit;
}());