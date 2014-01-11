var koa = require('koa'),
    logger = require('koa-logger'),
    staticFiles = require('koa-static'),
    thunkify = require('thunkify'),
    nunjucks = require('nunjucks'),
    app = koa(),
    port = 3000,
    
    // Base URL used to include static files in the frontend.
    baseUrl = 'http://localhost:' + port + '/',
    
    // Minimum length of a URL (file on GitHub). At least one char for user,
    // repo, branch, file name as well as forward slashes.
    GH_URL_MIN_LENGTH = 7,
    
    GitHubApiClient = require('github'),
    gh = new GitHubApiClient({version: '3.0.0'}),
    getCommits = thunkify(gh.repos.getCommits),
    getCommit = thunkify(gh.repos.getCommit);
    //ghCredentials = require('./github-credentials.js');

// gh.authenticate({type: 'basic', username: ghCredentials.username, password: ghCredentials.pw});

function parseGitHubUrl (url) {
    var numMinSegments = 4,
        split = url.split('/');
    
    // Handle insufficient number of segments. Mind the '/gh/' prefix in the URL.
    if (split.length < numMinSegments + 2) {
        return null;
    }

    return {
        user: split[2],
        repo: split[3],
        sha: split[4], // branch
        
        // Concatenate the segments making up the file path
        path: split.slice(numMinSegments + 1).join('/')
    };
}

function getStaticFileUrl (relativeUrl) {
    return baseUrl + relativeUrl;
};

function *getCommitsMiddleWare (next) {
    if (this.request.method === 'GET' && this.request.url.indexOf('/gh/') === 0) {
        var file = parseGitHubUrl(this.request.url);
        if (file) {
            var commits, commitsJson;
            
            // Fetch array of commit objects, the most recent commit comes first.
            commits = yield getCommits(file);
            commitsJson = JSON.stringify(commits);

            this.body = nunjucksEnv.render('index.html', {
                pageTitle: 'gitbert',
                baseUrl: 'http://localhost:' + port + '/',
                heading: 'gitbert',
                fileName: 'filename here',
                commitsJson: commitsJson
            });
        } else {
            this.body = 'Unable to parse GitHub file from URL';
        }
    }
}

// Prepare template rendering
var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));
nunjucksEnv.addFilter('staticFileUrl', getStaticFileUrl);

// Attach middlewares
app.use(logger());
app.use(staticFiles('.'));
app.use(getCommitsMiddleWare);

// Launch server
app.listen(port);
console.log('Listening on port', port);