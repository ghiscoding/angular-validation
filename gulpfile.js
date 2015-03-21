var gulp = require('gulp'),
  concat = require('gulp-concat'),
  header = require('gulp-header'),
  uglify = require('gulp-uglify');

var jsFiles = [
  '!src/*Spec.js', // Exclude test files
  'src/validation-directive.js',
  'src/validation-common.js',
  'src/validation-rules.js',
  'src/validation-service.js',
];
var d = new Date();
var headerComment = [
  '/**',
  ' * Angular-Validation Directive and Service (ghiscoding)',
  ' * https://github.com/ghiscoding/angular-validation',	
  ' * @author: Ghislain B.',
  ' * @version: 1.3.9',
  ' * @license: MIT',	
  ' * @date: ' + d,
  ' */',
  ''].join('\n');

//-- Register tasks
//------------------

// min-concat all src/*.js into 1 single minified file
gulp.task('min-concat', function() {
  return gulp.src(jsFiles)
    .pipe(uglify())
    .pipe(concat('angular-validation-allin1.min.js'))
    .pipe(gulp.dest('dist'));
});

// minify/uglify then concat all source files
gulp.task('min-concat-all', function() {
  // src/*.js into 1 single minified file
  gulp.src(jsFiles)		
    .pipe(uglify())
    .pipe(concat('angular-validation-allin1.min.js'))
    .pipe(header(headerComment))
    .pipe(gulp.dest('dist'));

  // minify the validation-common
  gulp.src('src/validation-common.js')
    .pipe(uglify())
    .pipe(concat('validation-common.min.js'))
    .pipe(header(headerComment))
    .pipe(gulp.dest('dist'));

  // minify the validation-directive
  gulp.src('src/validation-directive.js')
    .pipe(uglify())
    .pipe(concat('validation-directive.min.js'))
    .pipe(gulp.dest('dist'));

  // minify the validation-rules
  gulp.src('src/validation-rules.js')
    .pipe(uglify())
    .pipe(concat('validation-rules.min.js'))
    .pipe(gulp.dest('dist'));

  // minify the validation-service	
  gulp.src('src/validation-service.js')
    .pipe(uglify())
    .pipe(concat('validation-service.min.js'))
    .pipe(gulp.dest('dist'));

  return;
});