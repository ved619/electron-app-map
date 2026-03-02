#!/usr/bin/env node

/**
 * MBTiles to Folder Converter
 * 
 * This script extracts tiles from an MBTiles file to a folder structure
 * that the app can serve directly without needing native dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗺️  MBTiles to Folder Converter\n');

const mbtilesPath = process.argv[2];
const outputDir = path.join(__dirname, '..', 'tiles');

if (!mbtilesPath) {
  console.log('Usage: node scripts/convert-mbtiles.js <path-to-mbtiles-file>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/convert-mbtiles.js ~/Downloads/map.mbtiles');
  console.log('');
  console.log('This will extract tiles to the tiles/ folder in the format:');
  console.log('  tiles/{z}/{x}/{y}.png');
  console.log('');
  process.exit(1);
}

if (!fs.existsSync(mbtilesPath)) {
  console.error('❌ Error: File not found:', mbtilesPath);
  process.exit(1);
}

console.log('📥 Input file:', mbtilesPath);
console.log('📤 Output directory:', outputDir);
console.log('');

// Check if mb-util is installed
try {
  execSync('mb-util --version', { stdio: 'ignore' });
} catch (err) {
  console.error('❌ Error: mb-util is not installed');
  console.log('');
  console.log('Please install mb-util first:');
  console.log('  pip install mbutil');
  console.log('');
  console.log('Or download from: https://github.com/mapbox/mbutil');
  process.exit(1);
}

console.log('🔄 Converting MBTiles to folder structure...');
console.log('This may take several minutes depending on the tile count...');
console.log('');

try {
  // Create output directory if it doesn't exist  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Run mb-util to extract tiles
  const command = `mb-util --image_format=png "${mbtilesPath}" "${outputDir}"`;
  execSync(command, { stdio: 'inherit' });

  console.log('');
  console.log('✅ Conversion complete!');
  console.log('');
  console.log('Tiles have been extracted to:', outputDir);
  console.log('');
  console.log('You can now run the app with:');
  console.log('  npm start');
  console.log('');
} catch (err) {
  console.error('❌ Error during conversion:', err.message);
  console.log('');
  console.log('Alternative: Extract tiles manually or download pre-extracted tiles');
  process.exit(1);
}
