# gitbert - A GitHub file history browser #

Gitbert aims to visualize how a single file was changed over time by all commits it was included in.

## Planned features ##

* Allow to easily flip through the file's states, as if it was an image gallery
* Show how the file size has grown (or shrunk) over time.
* Indicate which portions of the file were changed in each commit (more interesting for large files). Possibly with a miniaturized view of the whole file, like a map.

## Used technology ##

* Node.js with [koa](https://github.com/koajs/koa) as a middleware between GitHub API and browser.
* [jQuery](https://github.com/jquery/jquery) and [lodash](https://github.com/lodash/lodash) in the frontend single page app, later possibly [React](https://github.com/facebook/react).


*Currently in pre-alpha stage.*