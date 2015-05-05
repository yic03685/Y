var gulp = require("gulp");
var plumber = require('gulp-plumber');
var yargs = require('yargs');
var util = require('gulp-util');

//-----------------------------------------------------------------------
//
//                              DEVELOP
//
//-----------------------------------------------------------------------

var BUILD_FOLDER = "./build";

gulp.task('6to5', function () {
    var to5 = require('gulp-6to5');
    var sourcemaps = require("gulp-sourcemaps");

    return gulp.src(['src/**/*.js'])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(to5({
            experimental: true
        }))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(BUILD_FOLDER));
});

gulp.task('watch', function() {
    var watcher = gulp.watch(['src/**/*.js'], ['6to5']);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

//-----------------------------------------------------------------------
//
//                               TEST
//
//-----------------------------------------------------------------------

gulp.task('test', function () {
    var mocha = require('gulp-mocha');

    return gulp.src('test/**/*.spec.js', {read: false})
        .pipe(mocha({reporter: 'spec', grep: yargs.argv.grep}))
        .on('error', function(err){
            err.showStack = true;

        });
});

//-----------------------------------------------------------------------
//
//                               BUILD
//
//-----------------------------------------------------------------------

gulp.task('build', function() {
    var browserify = require('gulp-browserify');

    gulp.src(BUILD_FOLDER + '/y.js')
        .pipe(browserify({
          insertGlobals : true,
          standalone: 'Y',
          debug : false
        }))
        .pipe(gulp.dest('.'));
});