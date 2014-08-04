// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

// Directories used:
//    css:          <%= cssDirectory %>
//    sass:         <%= cssPreprocessorDirectory %>
//    javascript:   <%= javascriptDirectory %>
//    images:       <%= imageDirectory %>
//    fonts:        <%= fontsDirectory %>

var gulp = require('gulp');
// Loads the plugins without having to list all of them, but you need 
// to call them as $.pluginname
var $ = require('gulp-load-plugins')();
// 'del' is used to clean out directories and such
var del = require('del');
// 'fs' is used to read files from the system (used for AWS uploading)
var fs = require('fs');
// BrowserSync isn't a gulp package, and needs to be loaded manually
var browserSync = require('browser-sync');
// merge is used to merge the output from two different streams into the same stream
var merge = require('merge-stream');
// Need a command for reloading webpages using BrowserSync
var reload = browserSync.reload;
// And define a variable that BrowserSync uses in it's function
var bs;

// Cleans out the './serve' directory used for serving the site locally
gulp.task('clean:serve', del.bind(null, ['serve']));

// Cleans out the './site' directory used when generating the site
gulp.task('clean:dist', del.bind(null, ['site']));

// Runs the build command for Jekyll to compile the site locally
// This will build the site with the production settings
gulp.task('jekyll:dev', $.shell.task('jekyll build -w'));

// Almost identical to the above task, but instead we load in the build configuration
// that overwrites some of the settings in the regular configuration so that you
// don't end up publishing your drafts or future posts
gulp.task('jekyll:build', $.shell.task('jekyll build --config _config.yml,_config.build.yml'));

// Compiles the SASS files and moves them into the '<%= cssDirectory %>' directory
gulp.task('styles', function() {
    // Looks at the style.scss file for what to include and creates a style.css file
    return gulp.src('src/<%= cssPreprocessorDirectory %>/style.scss')
        .pipe($.sass())
        // AutoPrefix your CSS so it works between browsers
        .pipe($.autoprefixer('last 1 version'))
        // Directory your CSS file goes to
        .pipe(gulp.dest('src/assets/stylesheets/'))
        .pipe(gulp.dest('serve/assets/stylesheets/'))
        // Outputs the size of the CSS file
        .pipe($.size({title: 'SCSS'}))
        // Injects the CSS changes to your browser since Jekyll doesn't rebuild the CSS
        .pipe(reload({stream: true}));
});

// Optimizes the images that exists
gulp.task('images', function() {
    return gulp.src('src/<%= imageDirectory %>/**/*')
        .pipe($.cache($.imagemin({
            // Runs 16 trials on the PNGs to better the optimization
            // Can by anything from 1 to 7, for more see 
            // https://github.com/sindresorhus/gulp-imagemin#optimizationlevel-png
            optimizationLevel: 3,
            // Lossless conversion to progressive JPGs
            progressive: true,
            // Interlace GIFs for progressive rendering
            interlaced: true
        })))
        .pipe($.size({title: 'Images'}));
});

// Optimizes all the CSS, HTML and concats the JS etc
gulp.task('html', ['styles'], function() {
    return gulp.src('serve/**/*.html')
        .pipe($.useref.assets({searchPath: 'serve'}))
        // Concatenate JavaScript files and preserve important comments
        .pipe($.if('*.js', $.uglify({preserveComments: 'some'})))
        // Remove unused CSS from your CSS files
        .pipe($.if('*.css', $.uncss({
            // Add files that contain the styles you use here
            html: [
                'serve/index.html'
                // 'serve/styleguide.html'
            ],
            // CSS selectors that shouldn't be removed
            ignore: [
                ''
            ]
        })))
        // Minify CSS
        .pipe($.if('*.css', $.minifyCss()))
        .pipe($.useref.restore())
        .pipe($.useref())
        // Minify HTML
        .pipe($.if('*.html', $.htmlmin()))
        // .pipe($.if(['*.txt', '*.xml']), gulp.dest('serve'))
        // Send the output to the correct folder
        .pipe(gulp.dest('site'))
        .pipe($.size({title: 'Optimizations'}));
});

// Move the '.txt' and '.xml' files from './serve' to './site'
gulp.task('move', function() {
  return gulp.src(['./serve/**/*.xml', './serve/**/*.txt'])
    .pipe(gulp.dest('./site'))
});

// Run CSS Lint against your CSS
gulp.task('csslint', function() {
  gulp.src('./serve/assets/stylesheets/main.css')
  	// Check your CSS quality against your .csslintrc file
    .pipe($.csslint('.csslintrc'))
    .pipe($.csslint.reporter())
});

// Run JS Lint against your JS
gulp.task('jslint', function() {
  gulp.src('./serve/assets/javascript/*.js')
    // Checks your JS code quality against your .jshintrc file
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter());
});

// Runs 'jekyll doctor' on your site to check for errors with your configuration
// and will check for URL errors a well
gulp.task('doctor', $.shell.task('jekyll doctor'));

// BrowserSync will serve our site on a local server for us and other devices to use
// It will also autoreload across all devices as well as keep the viewport synchronized
// between them.
gulp.task('serve', function() {
    bs = browserSync({
        notify: false,
        // tunnel: '',
        server: {
            baseDir: 'serve'
        }
    });

    // These tasks will look for files that change while serving and will auto-regenerate or
    // reload the website accordingly. Update or add other files you need to be watched.
    gulp.watch(['src/**/*.md', 'src/**/*.html'], ['jekyll:dev']);
    gulp.watch(['serve/**/*.html', 'serve/**/*.css', 'serve/**/*.js'], reload);
    gulp.watch(['src/assets/_scss/**/*.scss'], ['styles']);
    // gulp.watch(['src/assets/stylesheets/**/*.css'], reload);
});

// Serve the site after optimizations to see that everything looks fine
gulp.task('serve:dist', function() {
    bs = browserSync({
        notify: false,
        server: {
            baseDir: 'site'
        }
    });
});

// Default task, run when just writing 'gulp' in the terminal
gulp.task('default', ['build'], function() {
    gulp.start('serve');
});

// Checks your CSS, JS and Jekyll for errors
gulp.task('check', ['csslint', 'jslint', 'doctor'], function() {
  // Better hope nothing is wrong.
});

// Builds the site but doesn't serve it to you
gulp.task('build', ['jekyll:build',
                    'styles', 'images'], function() {
});

// Builds your site with the 'build' command and then runs all the optimizations on
// it and outputs it to './site'
gulp.task('publish', ['build', 'clean:dist'], function() {
  gulp.start('html');
});
