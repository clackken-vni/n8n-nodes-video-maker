const gulp = require('gulp');
const zip = require('gulp-zip');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const buildPath = path.join(__dirname, 'build');
const nodesPath = path.join(__dirname, 'nodes');

function copyNodes() {
  // Copy compiled node from build/ to dist/
  return gulp.src(buildPath + '/nodes/VideoMaker/**/*').pipe(gulp.dest(distPath + '/nodes/VideoMaker'));
}

function copyIcons() {
  // Copy SVG icons and JSON from nodes/ to dist/ (tsc doesn't copy non-.ts files)
  return gulp.src([nodesPath + '/**/*.svg', nodesPath + '/**/*.json']).pipe(gulp.dest(distPath + '/nodes'));
}

function copyPackage() {
  // Copy package files to dist/
  return gulp.src(['package.json', 'README.md', 'LICENSE', 'index.js']).pipe(gulp.dest(distPath));
}

function createZip() {
  return gulp.src(distPath + '/**/*').pipe(zip('n8n-nodes-video-maker.zip')).pipe(gulp.dest(__dirname));
}

const build = gulp.series(
  gulp.parallel(copyNodes, copyIcons, copyPackage),
  createZip
);

exports.default = build;
exports.build = build;
