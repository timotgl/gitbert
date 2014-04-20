/**
 * Event dispatcher singleton.
 */
(function () {
    GitBert.eventDispatcher = {
        events: {
            SHOW_COMMIT: []
        }
    };
    var dispatcher = GitBert.eventDispatcher;

    dispatcher.subscribeTo = function (eventName, callback) {
        var subscriberList = dispatcher.events[eventName];
        subscriberList.push(callback);
    };
    
    dispatcher.dispatch = function (eventName, data) {
        var subscriberList = dispatcher.events[eventName];
        _.each(subscriberList, function (callback) {
            callback(data);
        });
    };
}());