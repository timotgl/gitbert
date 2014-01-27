var koa = require('koa'),
    logger = require('koa-logger'),
    staticFiles = require('koa-static'),
    router = require('koa-router'),
    thunkify = require('thunkify'),
    nunjucks = require('nunjucks'),
    app = koa(),
    port = 3000,
    
    // Base URL used to include static files in the frontend.
    baseUrl = 'http://localhost:' + port + '/',

    COMMITS_BY_FILE_ROUTE_REGEX = /^\/gh\/(.+?)\/(.+?)\/(.+?)\/(.+)/,
    
    GitHubApiClient = require('github'),
    gh = new GitHubApiClient({version: '3.0.0'}),
    getCommits = thunkify(gh.repos.getCommits),
    getCommit = thunkify(gh.repos.getCommit);
    ghCredentials = require('./github-credentials.js');

gh.authenticate({type: 'basic', username: ghCredentials.username, password: ghCredentials.pw});

/**
 * Extract GitHub user, repo, branch, and file path from url.
 *
 * @param {string} url gitbert specific URL pointing to a file on GitHub
 * @return {Object} Object containing user, repo, branch, and path.
 */
function parseGitHubUrl (url) {
    var matches = url.match(COMMITS_BY_FILE_ROUTE_REGEX);
    return {
        user : matches[1],
        repo : matches[2],
        sha  : matches[3], // GitHub API expects this, but can also be used as branch.
        path : matches[4]
    };
}

function formatGitHubUrl (file) {
    return 'https://github.com/' + file.user + '/' + file.repo + '/blob/' + file.sha + '/' + file.path;
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

function *fetchCommit (next) {
    var commit = yield getCommit({
        user : this.params.user,
        repo : this.params.repo,
        sha  : this.params.sha
    });
    // TODO: Trim irrelevant data from the JSON to reduce the payload size.
    this.body = JSON.stringify(commit);
};

/**
 * Serve single page app with list of commits bootstrapped into markup
 */
function *fetchCommitsByFile (next) {
    var file = parseGitHubUrl(this.request.url);

    // Fetch array of commit objects from GitHub, the most recent commit comes first.
    commits = yield getCommits(file);
    // TODO: Trim irrelevant data from the JSON to reduce the payload size.
    commitsJson = JSON.stringify(commits);

    this.body = nunjucksEnv.render('index.html', {
        baseUrl: baseUrl,
        githubUser: file.user,
        githubRepo: file.repo,
        githubFile: file.path,
        pageTitle: 'gitbert',
        heading: 'gitbert',
        fileText: 'Commit history of',
        fileUrl: formatGitHubUrl(file),
        file: this.request.url.substr(4),
        navHint: 'Use left and right arrow keys to flip through commits',
        commitsJson: commitsJson
    });
}

// Prepare template rendering
var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));
nunjucksEnv.addFilter('staticFileUrl', getStaticFileUrl);

// Attach middlewares
app.use(logger());
app.use(staticFiles('.'));
app.use(router(app));

// Define routes
app.get('/gh/:user/:repo/:sha', fetchCommit);
app.get(COMMITS_BY_FILE_ROUTE_REGEX, fetchCommitsByFile);

// Launch server
app.listen(port);
console.log('Listening on port', port);