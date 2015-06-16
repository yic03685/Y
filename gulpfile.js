var gulp = require("gulp");
var plumber = require('gulp-plumber');
var yargs = require('yargs');

//-----------------------------------------------------------------------
//
//                              DEVELOP
//
//-----------------------------------------------------------------------

var BUILD_FOLDER = "./build";
var EXAMPLE_FOLDER = "./example";

gulp.task('6to5', function () {
    var to5 = require('gulp-6to5');
    var sourcemaps = require("gulp-sourcemaps");
    var concat = require("gulp-concat");
    var uglify = require("gulp-uglify");

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

gulp.task('example', function() {
    var browserify = require('gulp-browserify');
    var rename = require('gulp-rename');

    gulp.src(EXAMPLE_FOLDER + '/main.js')
        .pipe(browserify({
          insertGlobals : true,
          standalone: 'Y',
          debug : false
        }))
        .pipe(rename({
              dirname: EXAMPLE_FOLDER,
              basename: "bundle",
              extname: ".js"
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('build', function() {
    var browserify = require('gulp-browserify');
    var rename = require('gulp-rename');
    var uglify = require('gulp-uglify');

    gulp.src('./build/y.js')
        .pipe(browserify({
          insertGlobals : true,
          standalone: 'Y',
          debug : false
        }))
        .pipe(rename({
              dirname: ".",
              basename: "y",
              extname: ".js"
        }))
        .pipe(uglify())
        .pipe(gulp.dest('.'));
});