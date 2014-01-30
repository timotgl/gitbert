/**
 * Content controller singleton.
 * 
 * Wires up UI input with the ContentView.
 */
(function () {
    GitBert.contentController = {};
    var controller = GitBert.contentController;
    
    var currentIndex,
        numCommits;

    /**
     * Show the next younger commit.
     */
    var next = function () {
        if (currentIndex < numCommits - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        show();
    };
    
    /**
     * Show the next older commit.
     */
    var previous = function () {
        if (currentIndex >= 1) {
            currentIndex--;
        } else {
            currentIndex = numCommits - 1;
        }
        show();
    };
    
    var show = function () {
        var sha = GitBert.commitsOrder[currentIndex];
        GitBert.contentView.renderCommitBySha(sha);
    };
    
    var checkKey = function (keyDownEvent) {
        keyDownEvent = keyDownEvent || window.event;
    
        // Left arrow
        if (keyDownEvent.keyCode === 37) {
            previous();
        }
    
        // Right arrow
        if (keyDownEvent.keyCode === 39) {
            next();
        }
    };
    
    
    controller.reconstruct = function () {
        console.log('All commits fetched, starting reconstruction.');
    };
    
    /**
     * Enable switching between commits with left and right arrow keys.
     */
    controller.init = function () {
        $(document).keydown(checkKey);
        currentIndex = 0;
        numCommits = GitBert.commitsOrder.length;
    };
}());