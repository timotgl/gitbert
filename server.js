var koa = require('koa'),
    logger = require('koa-logger'),
    staticFiles = require('koa-static'),
    thunkify = require('thunkify'),
    app = koa(),
    port = 3000,
    
    // Minimum length of a URL (file on GitHub). At least one char for user,
    // repo, branch, file name as well as forward slashes.
    GH_URL_MIN_LENGTH = 7,
    
    GitHubApiClient = require('github'),
    gh = new GitHubApiClient({version: '3.0.0'}),
    getCommits = thunkify(gh.repos.getCommits),
    getCommit = thunkify(gh.repos.getCommit);
    //ghCredentials = require('./github-credentials.js');

// gh.authenticate({type: 'basic', username: ghCredentials.username, password: ghCredentials.pw});

app.use(logger());
app.use(staticFiles('.'));

function parseGitHubUrl (url) {
    var numMinSegments = 4,
        split = url.split('/');
    
    // Handle insufficient number of segments. Mind the forward slash at the beginning of the URL.
    if (split.length < numMinSegments + 1) {
        return null;
    }

    return {
        user: split[1],
        repo: split[2],
        sha: split[3], // branch
        
        // Concatenate the segments making up the file path
        path: split.slice(numMinSegments).join('/')
    };
}

app.use(function *(){
    if (this.request.method === 'GET' && this.request.url.length >= GH_URL_MIN_LENGTH) {
        var file = parseGitHubUrl(this.request.url);
        if (file) {
            var commits, commitsJson;
            
            // Fetch array of commit objects, the most recent commit comes first.
            commits = yield getCommits(file);
            commitsJson = JSON.stringify(commits);
            this.body = '<h1>HTML here with commitsJson bootstrapped into it</h1>' + 
                '<script>window.commits = ' + commitsJson + '</script>';
        } else {
            this.body = 'Unable to parse GitHub file from URL';
        }
    } else {
        this.body = 'The URL does not seem to be a file on GitHub.';
    }
});

app.listen(port);
console.log('Listening on port', port);