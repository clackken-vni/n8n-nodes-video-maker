const gulp = require('gulp');
const zip = require('gulp-zip');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const nodesPath = path.join(distPath, 'nodes', 'VideoMaker');
const buildPath = path.join(__dirname, 'build');

function copyNodes() {
  return gulp.src(nodesPath + '/**/*').pipe(gulp.dest(buildPath + '/nodes/VideoMaker'));
}

function copyPackage() {
  return gulp.src(['package.json', 'README.md', 'LICENSE', 'index.js']).pipe(gulp.dest(buildPath));
}

function createZip() {
  return gulp.src(buildPath + '/**/*').pipe(zip('n8n-nodes-video-maker.zip')).pipe(gulp.dest(__dirname));
}

const build = gulp.series(
  gulp.parallel(copyNodes, copyPackage),
  createZip
);

exports.default = build;
exports.build = build;
