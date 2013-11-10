var express = require('express'),
    stylus = require('stylus'),
    nib = require('nib'),
    GitHubApi = require('github'),
    GitHubCredentials = require('./github-credentials.js'),
    Q = require('q');

var app = express();

var github = new GitHubApi({
    version: "3.0.0", // required
    timeout: 5000 // optional
});

github.authenticate({
    type: "basic",
    username: GitHubCredentials.username,
    password: GitHubCredentials.pw
});

function compile(str, path) {
    return stylus(str).set('filename', path).use(nib())
};

var callback = function (error, response) {
    if (error) {
        console.log(error);
    } else {
        console.log(response.commit.author.date);
        console.log(response.commit.author.name);
        console.log(response.commit.message);
    }
};

var getFirstCommit = function (response) {
    var firstCommit = response[0];
    var secondCommit = response[1];
    // compareCommits:user, repo, base, head
    github.repos.getCommit(
        {
            user: user,
            repo: repo,
            sha: firstCommit.sha
        },
        callback
    );
};

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.use(express.logger('dev'))

app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: compile
}))

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.render('index', {title: 'Home'})
});

var user, repo, branch, file;
app.get('/filehistory', function (req, res) {
    console.log(
        'File history requested: user=', req.query.user,
        '  repo=', req.query.repo,
        '  branch=', req.query.branch,
        '  file=', req.query.file
    );
    user = req.query.user;
    repo = req.query.repo;
    branch = req.query.branch;
    file = req.query.file;
    
    github.repos.getCommits(
        {
            user: user,
            repo: repo,
            sha: branch,
            path: file
        },
        function (error, response) {
            if (error) {
                console.log('Error getting commits:', error);
                res.send({error: error});
            } else {
                getFirstCommit(response);
            }
        }
    );
    /*
    github.repos.getContent(
        {
            user: req.query.user,
            repo: req.query.repo,
            path: req.query.file
        },
        function(error, response) {
            if (error) {
                console.log('Error getting content:', error);
                res.send({error: error});
            } else {
                var fileContent = new Buffer(response.content, 'base64').toString();
                res.send({content: fileContent});
            }
        }
    );
    */
});

app.listen(3000);
console.log('Listening on port 3000');