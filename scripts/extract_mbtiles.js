#!/usr/bin/env node

/**
 * Extract tiles from MBTiles file to folder structure
 * Uses better-sqlite3 for efficient streaming
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function extractMBTiles(mbtilesPath, outputDir) {
  if (!fs.existsSync(mbtilesPath)) {
    console.error(`Error: File not found: ${mbtilesPath}`);
    return false;
  }

  console.log(`Opening MBTiles file: ${mbtilesPath}`);
  console.log('This may take a while for large files...\n');

  try {
    // Open database in readonly mode
    const db = new Database(mbtilesPath, { readonly: true, fileMustExist: true });

    // Get tile count
    const countStmt = db.prepare("SELECT COUNT(*) as count FROM tiles");
    const totalTiles = countStmt.get().count;
    console.log(`Found ${totalTiles.toLocaleString()} tiles to extract`);
    console.log(`Output directory: ${outputDir}\n`);

    // Prepare statement for iterating tiles
    const stmt = db.prepare("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles");
    
    let extracted = 0;
    let lastPercent = -1;

    // Stream tiles one at a time
    for (const row of stmt.iterate()) {
      const zoom = row.zoom_level;
      const x = row.tile_column;
      const yTms = row.tile_row;
      const tileData = row.tile_data;

      // Convert TMS y to XYZ y (flip vertically)
      const y = Math.pow(2, zoom) - 1 - yTms;

      // Create directory structure
      const tileDir = path.join(outputDir, String(zoom), String(x));
      if (!fs.existsSync(tileDir)) {
        fs.mkdirSync(tileDir, { recursive: true });
      }

      // Write tile
      const tilePath = path.join(tileDir, `${y}.png`);
      fs.writeFileSync(tilePath, tileData);

      extracted++;
      const percent = Math.floor((extracted / totalTiles) * 100);
      if (percent !== lastPercent && (extracted % 1000 === 0 || percent % 5 === 0)) {
        process.stdout.write(`\rProgress: ${extracted.toLocaleString()}/${totalTiles.toLocaleString()} (${percent}%)`);
        lastPercent = percent;
      }
    }

    console.log(`\n\n✅ Successfully extracted ${extracted.toLocaleString()} tiles!`);
    db.close();
    return true;

  } catch (error) {
    console.error('Error during extraction:', error.message);
    if (error.message.includes('Could not find any Visual Studio')) {
      console.error('\nThis module requires compilation but Visual Studio Build Tools are not installed.');
      console.error('Please use the pre-extracted tiles approach instead.');
    }
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('MBTiles Extractor');
  console.log('='.repeat(60));
  console.log();

  if (process.argv.length < 3) {
    console.log('Usage: node extract_mbtiles.js <path-to-mbtiles-file>');
    console.log('');
    console.log('Example:');
    console.log('  node extract_mbtiles.js C:\\Downloads\\map.mbtiles');
    console.log('');
    process.exit(1);
  }

  const mbtilesPath = process.argv[2];

  // Output to tiles directory
  const outputDir = path.join(__dirname, '..', 'tiles');

  const success = extractMBTiles(mbtilesPath, outputDir);

  console.log();
  console.log('='.repeat(60));
  if (success) {
    console.log("Done! Run 'npm run check-tiles' to verify.");
  } else {
    console.log('Extraction failed. Please check the error messages above.');
  }
  console.log('='.repeat(60));

  process.exit(success ? 0 : 1);
}

main();
