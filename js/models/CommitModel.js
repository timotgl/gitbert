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

        // Position of this commit in the chronological order of all commits. Starts with 0 (the very first commit).
        this.index = data.index;

        // The full content of the file after this commit was applied will be reconstructed here as an array of lines.
        this.content = null;
    }

    var _fetchUrlTemplate = _.template('<%= baseUrl %>gh/<%= user %>/<%= repo %>/<%= sha %>');
    var _missingNewLineToken = '\\ No newline at end of file';

    // Helper function used to sort line numbers.
    var _compareNum = function (a, b) {
        return a - b;
    };

    var _arrayToInt = function (intStr) {
        return parseInt(intStr);
    };

    /**
     * Determine if this commit was the very first in the chronological order.
     */
    Commit.prototype.isFirst = function () {
        return this.index === 0;
    };

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
            GitBert.contentView.renderBySha(this.sha);
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

    /**
     * Collect all line numbers (not indices) where a hunk started in the file's old content.
     * This aides the rendering of the file content with a full diff (all old unchanged lines plus all hunks).
     * Returns an object that maps line numbers to array indicies of hunks located in CommitModel.hunks.
     */
    Commit.prototype.getHunkStartLines = function () {
        var startLines = {};
        _.each(this.hunks, function (hunk, hunkIndex) {
            startLines[hunk.old.start] = hunkIndex;
        });
        return startLines;
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
        var changes;
        _.each(this.hunks, function (hunk) {
            changes = this.getChangesFromHunk(hunk);
            this.applyChangesFromHunk(changes);
        }, this);

        // Flatten this.content to be an array of lines again.
        // At this point it can contain null for deleted lines and sub-arrays of newly added lines.
        // This is due to maintaining the line numbers of the original file which are referenced in each hunk.
        this.flattenContent();
    };

    Commit.prototype.getChangesFromHunk = function (hunk) {
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
        return {
            additions: additions,
            deletions: deletions
        };
    };

    /**
     * Go line by line through this.content and apply the changes from one hunk.
     * Lines we have to delete are set to null.
     * Lines before which we have to insert other lines are turned into arrays of lines,
     * where the original line is put at the end.
     */
    Commit.prototype.applyChangesFromHunk = function (changes) {
        var adds = changes.additions,
            dels = changes.deletions,
            // Get the line numbers as sorted arrays of integers.
            addLines = _.map(_.keys(adds), _arrayToInt).sort(_compareNum),
            delLines = _.map(_.keys(dels), _arrayToInt).sort(_compareNum);

        if (this.content.length === 0) {
            // The old file was empty, so the changes can only be additions.
            _.each(addLines, function (lineNum) {
                if (this.content.length === lineNum) {
                    // line has to be appended at the end of this.content
                    this.content.push(adds[lineNum]);
                }
            }, this);
            return;
        }

        var currLine,
            lineToInsert,
            oldLine;
        for (currLine = 0; currLine < this.content.length; currLine++) {
            if (dels[currLine]) {
                this.content[currLine] = null;
            }
            lineToInsert = adds[currLine];
            if (lineToInsert) {
                oldLine = this.content[currLine];
                if (_.isString(oldLine)) {
                    this.content[currLine] = [lineToInsert, oldLine];
                } else if (_.isArray(oldLine)) {
                    oldLine.unshift(lineToInsert);
                } else {
                    this.content[currLine] = [lineToInsert];
                }
            }
        }

        // Append all remaining lines
        lineToInsert = adds[currLine];
        while (lineToInsert) {
            this.content.push(lineToInsert);
            currLine++;
            lineToInsert = adds[currLine];
        }
    };

    Commit.prototype.flattenContent = function () {
        this.content = _.flatten(_.without(this.content, null));
    };

    GitBert.CommitModel = Commit;
}());
