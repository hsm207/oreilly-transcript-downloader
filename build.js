// build.js: Script to copy extension files to dist/ for packaging
const fs = require('fs');
const path = require('path');

const filesToCopy = [
  'manifest.json',
  'README.md',
  'LICENSE'
];

const foldersToCopy = [
  'src',
  'icons'
];

const distDir = path.join(__dirname, 'dist');

function copyFileSync(source, target) {
  let targetFile = target;
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }
  fs.copyFileSync(source, targetFile);
}

function copyFolderRecursiveSync(source, target) {
  let files = [];
  const targetFolder = path.join(target, path.basename(source));
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function(file) {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy files
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    copyFileSync(file, distDir);
  }
});

// Copy folders
foldersToCopy.forEach(folder => {
  if (fs.existsSync(folder)) {
    copyFolderRecursiveSync(folder, distDir);
  }
});

console.log('Build complete. Files copied to dist/.');
