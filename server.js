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

/**
 * Extract GitHub user, repo, branch, and file path from url.
 *
 * @param {string} url gitbert specific URL pointing to a file on GitHub
 * @return {Object|null} Object or null on error
 */
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
        sha: split[4], // GitHub API expects this, but can also be used as branch.
        
        // Concatenate the segments making up the file path
        path: split.slice(numMinSegments + 1).join('/')
    };
}

/**
 * Prefix the relative URL to a static file with the base URL.
 *
 * @param {string} relativeUrl The URL relative to the web server root
 * @return {string} Absolute URL
 */
function getStaticFileUrl (relativeUrl) {
    return baseUrl + relativeUrl;
};

/**
 * Serve single page app with list of commits bootstrapped into markup
 */
function *getCommitsMiddleWare (next) {
    var commits, commitsJson;
    
    // Only use this middleware if the URL starts with '/gh/'
    if (this.request.url.substr(0, 4) !== '/gh/') {
        return;
    }
    
    var file = parseGitHubUrl(this.request.url);
    
    // Handle invalid URL
    if (file === null) {
        this.body = 'Unable to parse GitHub file from URL';
        return;
    }

    // Fetch array of commit objects from GitHub, the most recent commit comes first.
    console.log('Fetching commits for ' + file.path + ' from GitHub..');
    commits = yield getCommits(file);
    commitsJson = JSON.stringify(commits);

    this.body = nunjucksEnv.render('index.html', {
        pageTitle: 'gitbert',
        heading: 'gitbert',
        file: this.request.url.substr(4),
        commitsJson: commitsJson
    });
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