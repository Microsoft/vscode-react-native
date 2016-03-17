// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

var child_process = require('child_process');
var gulp = require('gulp');
var log = require('gulp-util').log;
var sourcemaps = require('gulp-sourcemaps');
var os = require('os');
var path = require('path');
var runSequence = require("run-sequence");
var ts = require('gulp-typescript');
var mocha = require('gulp-mocha');

var srcPath = 'src';
var outPath = 'out';

var sources = [
    srcPath,
].map(function (tsFolder) { return tsFolder + '/**/*.ts'; })
    .concat(['test/*.ts']);

// TODO: The file property should point to the generated source (this implementation adds an extra folder to the path)
// We should also make sure that we always generate urls in all the path properties (We shouldn't have \\s. This seems to
// be an issue on Windows platforms)
gulp.task('build', ['checkImports', 'checkCopyright'], function () {
    var tsProject = ts.createProject('tsconfig.json');
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: function (file) {
                return path.relative(path.dirname(file.path), __dirname + '/src');
            }
        }))
        .pipe(gulp.dest(outPath));
});

gulp.task('watch', ['build'], function (cb) {
    log('Watching build sources...');
    return gulp.watch(sources, ['build']);
});

gulp.task('default', function (callback) {
    runSequence("clean", "build", "tslint", callback);
});

var lintSources = [
    srcPath,
].map(function (tsFolder) { return tsFolder + '/**/*.ts'; });
lintSources = lintSources.concat([
    '!src/typings/**',
    '!src/test/resources/myReactNative022Project/**'
]);

var tslint = require('gulp-tslint');
gulp.task('tslint', function () {
    return gulp.src(lintSources, { base: '.' })
        .pipe(tslint())
        .pipe(tslint.report('verbose'));
});

function test() {
    // Defaults
    var pattern = "extensionContext";
    var invert = true;

    // Check if arguments were passed
    var patternIndex = process.argv.indexOf("--pattern");
    if (patternIndex > -1 && (patternIndex + 1) < process.argv.length) {
        pattern = process.argv[patternIndex + 1];
        invert = false;
        console.log("\nTesting cases that match pattern: " + pattern);
    }

    return gulp.src(['out/test/**/*.test.js', '!out/test/extension/**'])
        .pipe(mocha({
            ui: 'tdd',
            useColors: true,
            invert: invert,
            grep: pattern
        }));
}

gulp.task('build-test', ['build'], test);
gulp.task('test', test);

function runCustomVerification(pathInTools, errorMessage, cb) {
    var checkProcess = child_process.fork(path.join(__dirname, "tools", pathInTools),
        {
            cwd: path.resolve(__dirname, "src"),
            stdio: "inherit"
        });
    checkProcess.on("error", cb);
    checkProcess.on("exit", function (code, signal) {
        if (code || signal) {
            cb(new Error(errorMessage));
        } else {
            cb();
        }
    });
}

gulp.task('checkImports', function (cb) {
    runCustomVerification("checkCasing.js", "Mismatches found in import casing", cb);
});

gulp.task('checkCopyright', function (cb) {
    // runCustomVerification("checkCopyright.js", "Some source code files don't have the expected copyright notice", cb);
    cb();
});

gulp.task('watch-build-test', ['build', 'build-test'], function () {
    return gulp.watch(sources, ['build', 'build-test']);
});

gulp.task("clean", function () {
    var del = require("del");
    var pathsToDelete = [
        outPath,
        ".vscode-test"
    ].map(function (folder) {
        return folder + "/**";
    });
    return del(pathsToDelete, { force: true });
});
