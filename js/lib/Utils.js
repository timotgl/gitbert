/**
 * Utility functions singleton.
 */
(function () {
    GitBert.utils = {};
    var utils = GitBert.utils;

    /**
     * Truncate longStr to have a maximum of threshold characters.
     * Append an indicator string at the end of the result if longStr exceeded the threshold.
     */
    utils.truncateString = function (longStr, threshold, indicator) {
        var thresh = threshold || 60,
            indic = indicator || '...';

        // Threshold is met, abort.
        if (longStr.length  <= thresh) {
            return longStr;
        }

        return longStr.substr(0, thresh) + indic;
    };
}());