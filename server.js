var koa = require('koa'),
    logger = require('koa-logger'),
    serveStaticFiles = require('koa-static'),
    router = require('koa-router'),
    thunkify = require('thunkify'),
    nunjucks = require('nunjucks'),
    app = koa(),
    port = process.env.PORT || 3000,

    // Base URL used to include static files in the frontend.
    baseUrl = process.env.BASE_URL || 'http://localhost:' + port + '/',

    COMMITS_BY_FILE_ROUTE_REGEX = /^\/gh\/(.+?)\/(.+?)\/(.+?)\/(.+)/,

    GitHubApiClient = require('github'),
    gh = new GitHubApiClient({version: '3.0.0'}),
    getCommits = thunkify(gh.repos.getCommits),
    getCommit = thunkify(gh.repos.getCommit),
    
    // Restrict the fetching of commits to the following users and repos.
    // Any combination of user/repo from these two objects is allowed.
    ALLOWED_USERS = {'timotgl': true},
    ALLOWED_REPOS = {'dummy': true},
    
    UNAUTHORIZED_USER_REPO_MSG = 'Sorry, you\'re not allowed to fetch commits for the given GitHub user or repository';

// Take credentials from env vars and authenticate with GitHub API.
gh.authenticate({
    type: 'basic',
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_PW
});

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

/**
 * Determine if the requested GitHub user and repo are among the whitelisted ones.
 *
 * @param {string} user GitHub user account
 * @param {string} repo Repository name
 * @return {bool} true if both user and repo are whitelisted, false otherwise.
 */
function isRepoWhitelisted (user, repo) {
    return ALLOWED_USERS.hasOwnProperty(user) && ALLOWED_REPOS.hasOwnProperty(repo)
}

function *fetchCommit (next) {
    if (!isRepoWhitelisted(this.params.user, this.params.repo)) {
        this.body = UNAUTHORIZED_USER_REPO_MSG;
        return;
    }
    
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
    
    if (!isRepoWhitelisted(file.user, file.repo)) {
        this.body = UNAUTHORIZED_USER_REPO_MSG;
        return;
    }
    
    // TODO: proper pagination handling
    file.per_page = 100;

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
app.use(serveStaticFiles('css'));
app.use(serveStaticFiles('bower_components'));
app.use(serveStaticFiles('js'));
app.use(router(app));

// Define routes
app.get('/gh/:user/:repo/:sha', fetchCommit);
app.get(COMMITS_BY_FILE_ROUTE_REGEX, fetchCommitsByFile);

// Launch server
app.listen(port);
console.log('Listening on port', port);