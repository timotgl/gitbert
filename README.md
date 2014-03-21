# gitbert - A GitHub file history browser #

Gitbert aims to visualize how a single file was changed over time by all commits it was included in.

## Installation ##
Prerequisites: node and npm, a GitHub account.

1. Install node dependencies and bower libs for the frontend app: ```npm install```
2. Your GitHub credentials are expected to be set as environment variables:
   * ```export GITHUB_USERNAME=yourusernamehere```
   * ```export GITHUB_PW=yourpasswordhere```

## Usage ##
1. Run server: ```node --harmony-generators server.js```
2. Open ```http://localhost:3000/gh/user/repo/branch/path/to/file``` in your browser.
   * ```user``` can be any GitHub user account name
   * ```repo``` can be any of ```user```'s repositories
   * ```branch``` can be any of ```repo```'s branches
   * ```path/to/file``` must be the exact path to a committed file
   
   URL example: To see [https://github.com/timotgl/dummy/blob/master/dummy.txt](https://github.com/timotgl/dummy/blob/master/dummy.txt) in gitbert, use [http://localhost:3000/gh/timotgl/dummy/master/dummy.txt](http://localhost:3000/gh/timotgl/dummy/master/dummy.txt)

## Planned features ##

* Allow to easily flip through the file's states, as if it was an image gallery
* Show how the file size has grown (or shrunk) over time.
* Indicate which portions of the file were changed in each commit (more interesting for large files). Possibly with a miniaturized view of the whole file, like a map.

## Used technology ##

* Node.js with [koa](https://github.com/koajs/koa) as a middleware between GitHub API and browser.
* [jQuery](https://github.com/jquery/jquery) and [lodash](https://github.com/lodash/lodash) in the frontend (single page app), later possibly [React](https://github.com/facebook/react).


*Currently in pre-alpha stage.*