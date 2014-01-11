module.exports = function(grunt) {
    grunt.initConfig({
        stylus: {
            compile: {
                files: {
                    'css/main.css': 'css/main.styl'
                }
            }
        },
        watch: {
            files: "css/*.styl",
            tasks: ["stylus"]
        }
    });
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['stylus']);
};