const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function debugTiles() {
  const mbtilesPath = path.join(__dirname, '../satellite_gurgaon.mbtiles');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(mbtilesPath);
  const db = new SQL.Database(buffer);

  console.log('=== Sample Tiles at Different Zoom Levels ===\n');
  
  [17, 18, 19, 20, 21].forEach(z => {
    const result = db.exec(
      'SELECT zoom_level, tile_column, tile_row FROM tiles WHERE zoom_level = ? LIMIT 5',
      [z]
    );
    
    if (result.length > 0 && result[0].values.length > 0) {
      console.log(`Zoom ${z}:`);
      result[0].values.forEach(([zoom, x, y]) => {
        // Convert TMS Y to XYZ Y for comparison
        const xyzY = Math.pow(2, zoom) - 1 - y;
        console.log(`  TMS: ${zoom}/${x}/${y} -> XYZ: ${zoom}/${x}/${xyzY}`);
      });
      console.log();
    }
  });

  // Check what's around the requested coordinates
  console.log('=== Checking for requested tiles (zoom 19) ===');
  const requestedTiles = [
    [19, 374372, 305407],
    [18, 187184, 152704]
  ];
  
  requestedTiles.forEach(([z, x, yXYZ]) => {
    const yTMS = Math.pow(2, z) - 1 - yXYZ;
    const result = db.exec(
      'SELECT zoom_level, tile_column, tile_row FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?',
      [z, x, yTMS]
    );
    console.log(`XYZ ${z}/${x}/${yXYZ} (TMS ${z}/${x}/${yTMS}): ${result.length > 0 && result[0].values.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
  });

  db.close();
}

debugTiles().catch(console.error);
