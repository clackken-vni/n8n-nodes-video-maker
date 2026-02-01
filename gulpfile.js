const gulp = require('gulp');
const zip = require('gulp-zip');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const nodesPath = path.join(distPath, 'nodes');
const libPath = path.join(distPath, 'lib');

function copyNodes() {
  return gulp
    .src(`${nodesPath}/**/*`)
    .pipe(gulp.dest(path.join(__dirname, 'build', 'nodes')));
}

function copyLib() {
  return gulp
    .src(`${libPath}/**/*`)
    .pipe(gulp.dest(path.join(__dirname, 'build', 'lib')));
}

function copyPackage() {
  return gulp
    .src(['package.json', 'README.md', 'LICENSE'])
    .pipe(gulp.dest(path.join(__dirname, 'build')));
}

function createZip() {
  return gulp
    .src(path.join(__dirname, 'build', '**/*'))
    .pipe(zip('n8n-nodes-video-maker.zip'))
    .pipe(gulp.dest(path.join(__dirname, '.')));
}

const build = gulp.series(
  gulp.parallel(copyNodes, copyLib, copyPackage),
  createZip
);

exports.default = build;
exports.build = build;
