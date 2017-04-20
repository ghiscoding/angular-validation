var argv = require('yargs').argv,
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    protractor = require("gulp-angular-protractor"),
    bump = require('gulp-bump'),
    del = require('del'),
    concat = require('gulp-concat'),
    order = require('gulp-order'),
    header = require('gulp-header'),
    replace = require('gulp-replace-task'),
    semver = require('semver'),
    stripdebug = require('gulp-strip-debug'),
    uglify = require('gulp-uglify');

var d = new Date()
    src = 'src/',
    dest = 'dist';

var jsHeaderComment = [
  '/**',
  ' * <%= pkg.description %>',
  ' * <%= pkg.homepage %>',
  ' * @author: <%= pkg.author %>',
  ' * @version: <%= version %>',
  ' * @license: <%= pkg.license %>',
  ' * @build: ' + d,
  ' */',
  ''].join('\n');

var readmeHeader = [
  '#Angular Validation (Directive / Service)',
  '`Version: <%= version %>`',
  ''].join('\n');

var getPackageJson = function () {
  var fs = require('fs');
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
};

//-- Register tasks
//------------------

// default gulp
gulp.task('default', ['compress'], function() {

});

// bump the version of Bower and NPM packages
gulp.task('bump', function () {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

// clean the dist folder
gulp.task('clean', function() {
  del([
    dest + '*'
  ])
});

// compress our src folder
gulp.task('compress', ['clean'], function() {
  var pkg = getPackageJson();
  var oldVersion = pkg.version;
  var newVersion = pkg.version;

  // if user wants to bump revision at same time
  if(argv.bump == 1) {
    // bump version for js file header
    newVersion = semver.inc(oldVersion, 'patch');

    // bump version for both: package & bower
    gulp.src(['./package.json', './bower.json'])
      .pipe(bump())
      .pipe(gulp.dest('./'));

    // bump the README version as well
    gulp.src('README.md')
    .pipe(replace({
      patterns: [
        {
          match: /Version: [.0-9]+/g,
          replacement: 'Version: ' + newVersion
        }
      ]
    }))
    .pipe(gulp.dest('./'));
  }

  // compress (src/*.js) into 1 single minified file
  gulp.src(src + '*.js')
    .pipe(order([
      'validation-directive.js',
      'validation-common.js',
      'validation-rules.js',
      'validation-service.js'
      ]))
    .pipe(concat('angular-validation.js'))
    .pipe(header(jsHeaderComment, { pkg : pkg, version: newVersion } ))
    .pipe(gulp.dest('dist'));

  // compress (src/*.js) into 1 single minified file
  gulp.src(src + '*.js')
    .pipe(order([
      'validation-directive.js',
      'validation-common.js',
      'validation-rules.js',
      'validation-service.js'
      ]))
    .pipe(uglify())
    .pipe(concat('angular-validation.min.js'))
    .pipe(header(jsHeaderComment, { pkg : pkg, version: newVersion } ))
    .pipe(gulp.dest('dist'));
});

gulp.task('e2e', function() {
  gulp.src(["./protractor/*_spec.js"])
      .pipe(protractor({
          configFile: "protractor/conf.js",
          args: ['--baseUrl', 'http://127.0.0.1'],
          'debug': false,
          'autoStartStopServer': true
      }))
      .on('error', function(e) {
          console.log(e);
      });
});