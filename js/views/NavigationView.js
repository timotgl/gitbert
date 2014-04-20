/**
 * Navigation view singleton.
 *
 * Displays info about the currently viewed commit and provides controls to navigate between commits.
 */
(function () {
    GitBert.navigationView = {
        elem: $('section#navigation'),
        template: _.template('<h1>Viewing &quot;<%= msg %>&quot;</h1>')
    };
    var view = GitBert.navigationView;

    view.render = function (commitModel) {
        view.elem.html(view.template({msg: commitModel.message}));
    };
    
    GitBert.eventDispatcher.subscribeTo('SHOW_COMMIT', _.bind(view.render, view));
}());