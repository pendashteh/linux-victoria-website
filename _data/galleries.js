// _data/galleries.js
const fs = require('fs');
const path = require('path');

module.exports = function() {
  const galleries = {};
  
  // Function to get all image files from a directory
  function getImagesFromDirectory(dirPath) {
    try {
      // Check if directory exists
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      
      const files = fs.readdirSync(dirPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      
      return files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        })
        .sort((a, b) => {
          // Try to sort numerically if possible, otherwise alphabetically
          const numA = parseInt(a.match(/\d+/)?.[0]);
          const numB = parseInt(b.match(/\d+/)?.[0]);
          
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          
          return a.localeCompare(b);
        });
    } catch (error) {
      console.warn(`Could not read gallery directory: ${dirPath}`, error);
      return [];
    }
  }
  
  // Function to recursively scan directories for galleries
  function scanForGalleries(basePath, currentPath = '') {
    const fullPath = path.join(basePath, currentPath);
    
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    try {
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      // Check if current directory has images
      const images = getImagesFromDirectory(fullPath);
      if (images.length > 0) {
        const galleryKey = currentPath ? `/assets/images/${currentPath}` : '/assets/images';
        galleries[galleryKey] = images;
      }
      
      // Recursively scan subdirectories
      for (const item of items) {
        if (item.isDirectory()) {
          const subPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          scanForGalleries(basePath, subPath);
        }
      }
    } catch (error) {
      // Continue if directory can't be read
    }
  }
  
  // Scan common asset directories
  const possibleBasePaths = [
    './assets/images',
    './src/assets/images', 
    './_site/assets/images'
  ];
  
  for (const basePath of possibleBasePaths) {
    if (fs.existsSync(basePath)) {
      scanForGalleries(basePath);
      break; // Use the first one that exists
    }
  }
  
  return galleries;
};