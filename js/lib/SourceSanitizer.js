/**
 * Source sanitizer singleton.
 * 
 * Converts certain special characters into HTML entities, so source code can be rendered as HTML without accidentally
 * producing HTML inside.
 */
(function () {
    GitBert.sourceSanitizer = {};
    var sanitizer = GitBert.sourceSanitizer;

    var re = /[<>]/g,
        htmlEntities = {
            '<': '&lt;',
            '>': '&gt;'
        };

    var replace = function (match) {
        return htmlEntities[match];
    }
    
    sanitizer.sanitize = function (line) {
        return line.replace(re, replace);
    };
}());