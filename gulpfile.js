var gulp = require('gulp'),
  del = require('del'),
  concat = require('gulp-concat'),
  deporder = require('gulp-deporder'),
  header = require('gulp-header'),
  stripdebug = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  pkg = require('./package.json');

var
  src = 'src/',
  dest = 'dist',

  d = new Date(),
  jsHeaderComment = [
  '/**',
  ' * ' + pkg.description,
  ' * ' + pkg.homepage,
  ' * @author: ' + pkg.author,
  ' * @version: ' + pkg.version,
  ' * @license: ' + pkg.license,
  ' * @build: ' + d,
  ' */',
  ''].join('\n');

//-- Register tasks
//------------------

// default gulp
gulp.task('default', ['compress'], function() {

});

// clean the dist folder
gulp.task('clean', function() {
  del([
    dest + '*'
  ])
});

// compress our src folder
gulp.task('compress', ['clean'], function() {
  // src/*.js into 1 single minified file
  gulp.src(src + '*.js')
    .pipe(deporder())
    .pipe(uglify())
    .pipe(concat('angular-validation.min.js'))
    .pipe(header(jsHeaderComment))
    .pipe(gulp.dest('dist'));
});