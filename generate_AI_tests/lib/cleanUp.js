const fs = require('fs');
const path = require('path');

// Helper function to delete all files in a directory
function deleteFilesInDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

// Directories to clean
const directoriesToClean = [
  './tests/data/eval',
  './tests/data/migration',
];

// Delete files in each directory
directoriesToClean.forEach((directory) => {
  deleteFilesInDirectory(directory);
  console.log(`Cleaned directory: ${directory}`);
});
