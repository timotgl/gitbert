var gb = {};

gb.submitFile = function(event) {
    event.preventDefault();
    var username = $(gb.selectors.userInput).val();
    var repo = $(gb.selectors.repoInput).val();
    var file = $(gb.selectors.fileInput).val();
    $.ajax({
        url: '/filehistory',
        data: {
            user: username,
            repo: repo,
            file: file
        },
        error: gb.getFileHistoryError,
        success: gb.showFileHistory
    });
    return false;
};

gb.showFileHistory = function(data, textStatus, jqXHR) {
    console.log(data, textStatus, jqXHR);
    if (data.hasOwnProperty('error')) {
        $(gb.selectors.getFileHistoryError).show();
        $(gb.selectors.getFileHistoryError).html(data.error.code);
        $(gb.selectors.fileHistory).hide();
    } else {
        $(gb.selectors.fileHistory).show();
        $(gb.selectors.fileContent).html(data.content);
        $(gb.selectors.getFileHistoryError).hide();
    }
};

gb.getFileHistoryError = function (jqXHR, textStatus, errorThrown) {
    console.log(jqXHR, textStatus, errorThrown);
    $(gb.selectors.getFileHistoryError).html('Error retrieving file history');
};

gb.init = function(selectors) {
    console.log(selectors);
    gb.selectors = selectors;
    $(gb.selectors.fileSelectForm).submit(gb.submitFile);
};