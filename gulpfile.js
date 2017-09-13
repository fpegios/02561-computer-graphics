var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: './'
        },
    })
});

// Gulp watch syntax
gulp.task('watch', ['browserSync'], function (){
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('exercises/**/*.html', browserSync.reload); 
    gulp.watch('exercises/**/*.js', browserSync.reload); 
    gulp.watch('index.html', browserSync.reload); 
});