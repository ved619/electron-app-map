#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const mbtilesPath = process.argv[2];
const outputDir = process.argv[3] || path.join(__dirname, '..', 'tiles');

if (!mbtilesPath) {
  console.log('Usage: node extract-tiles-node.js <path-to-mbtiles-file> [output-dir]');
  process.exit(1);
}

if (!fs.existsSync(mbtilesPath)) {
  console.error('Error: File not found:', mbtilesPath);
  process.exit(1);
}

console.log('🗺️  MBTiles Extractor (Node.js)\n');
console.log('📥 Input file:', mbtilesPath);
console.log('📤 Output directory:', outputDir);
console.log('');

try {
  const db = new Database(mbtilesPath);
  
  // Get tile count
  const result = db.prepare('SELECT COUNT(*) as count FROM tiles').get();
  const totalTiles = result.count;
  console.log(`Found ${totalTiles.toLocaleString()} tiles`);
  console.log('');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Extract tiles
  const tiles = db.prepare('SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles').all();
  
  let count = 0;
  for (const tile of tiles) {
    const { zoom_level, tile_column, tile_row, tile_data } = tile;
    
    // Convert TMS y to XYZ y
    const y = (1 << zoom_level) - 1 - tile_row;
    
    // Create directory
    const tileDir = path.join(outputDir, String(zoom_level), String(tile_column));
    fs.mkdirSync(tileDir, { recursive: true });
    
    // Write tile
    const tilePath = path.join(tileDir, `${y}.png`);
    fs.writeFileSync(tilePath, tile_data);
    
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`\r✓ Extracted ${count.toLocaleString()} tiles...`);
    }
  }
  
  console.log(`\r✅ Extracted ${count.toLocaleString()} tiles successfully!`);
  console.log('');
  
  db.close();
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
