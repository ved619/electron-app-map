const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function findTileBounds() {
  const mbtilesPath = path.join(__dirname, '../satellite_gurgaon.mbtiles');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(mbtilesPath);
  const db = new SQL.Database(buffer);

  // Get bounds from metadata
  const metadataResult = db.exec("SELECT value FROM metadata WHERE name = 'bounds'");
  if (metadataResult.length > 0 && metadataResult[0].values.length > 0) {
    const bounds = metadataResult[0].values[0][0];
    console.log('Metadata bounds (lng1,lat1,lng2,lat2):', bounds);
    const [lng1, lat1, lng2, lat2] = bounds.split(',').map(parseFloat);
    const centerLng = (lng1 + lng2) / 2;
    const centerLat = (lat1 + lat2) / 2;
    console.log(`Center from bounds: ${centerLng}, ${centerLat}\n`);
  }

  // Helper function to convert tile coordinates to lat/lng
  function tile2lng(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
  }

  function tile2lat(y, z) {
    const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }

  // Get actual tile range from zoom 18 (good middle ground)
  console.log('=== Tile ranges by zoom level ===');
  [17, 18, 19].forEach(z => {
    const minMaxResult = db.exec(
      `SELECT 
        MIN(tile_column) as min_x, 
        MAX(tile_column) as max_x,
        MIN(tile_row) as min_y_tms,
        MAX(tile_row) as max_y_tms
      FROM tiles WHERE zoom_level = ?`,
      [z]
    );

    if (minMaxResult.length > 0 && minMaxResult[0].values.length > 0) {
      const [minX, maxX, minYTMS, maxYTMS] = minMaxResult[0].values[0];
      
      // Convert TMS to XYZ coordinates  
      const maxYXYZ = Math.pow(2, z) - 1 - minYTMS;
      const minYXYZ = Math.pow(2, z) - 1 - maxYTMS;
      
      console.log(`\nZoom ${z}:`);
      console.log(`  X range: ${minX} to ${maxX}`);
      console.log(`  Y range (TMS): ${minYTMS} to ${maxYTMS}`);
      console.log(`  Y range (XYZ): ${minYXYZ} to ${maxYXYZ}`);
      
      // Calculate center tile
      const centerX = (minX + maxX) / 2;
      const centerYXYZ = (minYXYZ + maxYXYZ) / 2;
      
      // Convert to lat/lng
      const lng = tile2lng(centerX, z);
      const lat = tile2lat(centerYXYZ, z);
      
      console.log(`  Center tile (XYZ): ${centerX}, ${centerYXYZ}`);
      console.log(`  Center coords: ${lng}, ${lat}`);
    }
  });

  db.close();
}

findTileBounds().catch(console.error);
