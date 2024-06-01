import fs from 'fs';
import path from 'path';

const srcDir = './';
const ignoredDirs = ['.git', 'node_modules'];
const ignoredExtensions = ['.svg', '.png', '.md'];
const ignoredFiles = [
  'package-lock.json',
  '.DS_Store',
  'fileList.json',
  'vite.config.ts',
  'tsconfig.node.json',
  'tsconfig.json',
  'vite-env.d.ts',
  '.gitignore'
];

function listFiles(dir, fileList = [], ignoredList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // Skip ignored directories and add them to ignoredList
    if (ignoredDirs.includes(file) || stats.isDirectory() && ignoredDirs.some(d => file.includes(d))) {
      ignoredList.push({ path: path.relative(process.cwd(), filePath), type: 'directory' });
      continue;
    }

    // Skip ignored files and add them to ignoredList
    if (ignoredFiles.includes(file) || ignoredExtensions.includes(ext)) {
      ignoredList.push({ path: path.relative(process.cwd(), filePath), type: 'file' });
      continue;
    }

    if (stats.isDirectory()) {
      const result = listFiles(filePath, fileList, ignoredList);
      fileList = result.fileList;
      ignoredList = result.ignoredList;
    } else {
      const relativePath = path.relative(process.cwd(), filePath);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      fileList.push({ path: relativePath, content: fileContent });
    }
  }

  return { fileList, ignoredList };
}

const { fileList, ignoredList } = listFiles(srcDir);
const jsonOutput = {
  files: fileList,
  ignored: ignoredList
};
const jsonFileList = JSON.stringify(jsonOutput, null, 2);

fs.writeFileSync('src/fileList.json', jsonFileList);