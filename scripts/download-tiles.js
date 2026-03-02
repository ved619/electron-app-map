#!/usr/bin/env node

/**
 * Tiles Setup Checker
 * 
 * This script checks if tiles are properly set up for offline use.
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  PinPath - Tiles Setup Checker\n');

// Check if tiles directory exists
const tilesDir = path.join(__dirname, '..', 'tiles');
if (!fs.existsSync(tilesDir)) {
  fs.mkdirSync(tilesDir, { recursive: true });
  console.log('✅ Created tiles directory\n');
}

// Count tile files
let tileCount = 0;
let zoomLevels = [];

if (fs.existsSync(tilesDir)) {
  const entries = fs.readdirSync(tilesDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isDirectory() && /^\d+$/.test(entry.name)) {
      const zoomLevel = parseInt(entry.name);
      zoomLevels.push(zoomLevel);
      
      const zDir = path.join(tilesDir, entry.name);
      const xDirs = fs.readdirSync(zDir);
      
      for (const xDir of xDirs) {
        const xPath = path.join(zDir, xDir);
        if (fs.statSync(xPath).isDirectory()) {
          const tiles = fs.readdirSync(xPath).filter(f => f.endsWith('.png'));
          tileCount += tiles.length;
        }
      }
    }
  }
}

console.log('═══════════════════════════════════════════════════════════\n');

if (tileCount > 0) {
  zoomLevels.sort((a, b) => a - b);
  console.log(`✅ Found ${tileCount.toLocaleString()} tile(s)`);
  console.log(`📊 Zoom levels: ${zoomLevels.join(', ')}`);
  console.log('');
  console.log('🎉 You\'re all set! The app will use these offline tiles.');
  console.log('');
  console.log('Run the app with:');
  console.log('  npm start');
} else {
  console.log('❌ No tiles found in the tiles directory\n');
  console.log('To use offline maps, you need to add tiles in this format:');
  console.log('  tiles/{z}/{x}/{y}.png\n');
  console.log('Two ways to get tiles:\n');
  console.log('1️⃣  Convert an MBTiles file:');
  console.log('   • Download an .mbtiles file from https://openmaptiles.com/');
  console.log('   • Install mb-util: pip install mbutil');
  console.log('   • Run: node scripts/convert-mbtiles.js path/to/map.mbtiles\n');
  console.log('2️⃣  Download tiles directly:');
  console.log('   • Use Mobile Atlas Creator (MOBAC) - https://mobac.sourceforge.io/');
  console.log('   • Choose "OSM folder format" as output');
  console.log('   • Download to the tiles/ directory\n');
  console.log('Without offline tiles, the app will use online maps (requires internet).');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('📖 For detailed instructions, see: tiles/README.md');
console.log('═══════════════════════════════════════════════════════════\n');
