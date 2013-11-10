window.gb = {
    elems: $('pre'),
    current: 0,
    indicator: $('span#currentCommitIndex')
};

gb.showCurrentCommit = function () {
    var selElem;
    _.each(gb.elems, function (el, index) {
        selElem = $(el);
        if (index === gb.current) {
            selElem.show();
        } else {
            selElem.hide();
        }
    });
    $(gb.indicator).html(gb.current + 1);
};

gb.nextCommit = function () {
    if (gb.current < gb.elems.length - 1) {
        gb.current += 1;
    } else {
        gb.current = 0;
    }
    gb.showCurrentCommit();
};

gb.previousCommit = function () {
    if (gb.current >= 1) {
        gb.current -= 1;
    } else {
        gb.current = gb.elems.length - 1;
    }
    gb.showCurrentCommit();
};

gb.checkKey = function (e) {
    e = e || window.event;
    
    // Left arrow
    if (e.keyCode === 37) {
        gb.previousCommit();
    }
    
    // Right arrow
    if (e.keyCode === 39) {
        gb.nextCommit();
    }
}

gb.showCurrentCommit();
document.onkeydown = gb.checkKey;