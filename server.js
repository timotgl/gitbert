var express = require('express'),
    stylus = require('stylus'),
    nib = require('nib'),
    GitHubApi = require('github'),
    GitHubCredentials = require('./github-credentials.js');

var app = express()

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

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')

app.use(express.logger('dev'))

app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: compile
}))

app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
    res.render('index', {title: 'Home'})
})

app.get('/filehistory', function (req, res) {
    console.log('File history requested: user=', req.query.user, '  repo=', req.query.repo, ' file=', req.query.file);
    
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
})

app.listen(3000)
console.log('Listening on port 3000')