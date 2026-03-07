const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkTileDistribution() {
  const mbtilesPath = path.join(__dirname, '../satellite_gurgaon.mbtiles');
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(mbtilesPath);
  const db = new SQL.Database(buffer);

  console.log('=== Tile Count by Zoom Level ===\n');
  
  const countResult = db.exec(
    'SELECT zoom_level, COUNT(*) as count FROM tiles GROUP BY zoom_level ORDER BY zoom_level'
  );
  
  if (countResult.length > 0) {
    countResult[0].values.forEach(([zoom, count]) => {
      console.log(`Zoom ${zoom}: ${count} tiles`);
    });
  }

  console.log('\n=== Checking for gaps at zoom 18 ===\n');
  
  // Check if there are missing tiles in the zoom 18 grid
  const zoom18Result = db.exec(`
    SELECT 
      MIN(tile_column) as min_x, 
      MAX(tile_column) as max_x,
      MIN(tile_row) as min_y,
      MAX(tile_row) as max_y,
      COUNT(*) as actual_count
    FROM tiles WHERE zoom_level = 18
  `);

  if (zoom18Result.length > 0 && zoom18Result[0].values.length > 0) {
    const [minX, maxX, minY, maxY, actualCount] = zoom18Result[0].values[0];
    const expectedCount = (maxX - minX + 1) * (maxY - minY + 1);
    const coverage = ((actualCount / expectedCount) * 100).toFixed(1);
    
    console.log(`Zoom 18 tile range: X[${minX}-${maxX}] Y[${minY}-${maxY}]`);
    console.log(`Expected tiles (full grid): ${expectedCount}`);
    console.log(`Actual tiles: ${actualCount}`);
    console.log(`Coverage: ${coverage}%`);
    
    if (actualCount < expectedCount) {
      console.log(`\n⚠️  Missing ${expectedCount - actualCount} tiles at zoom 18`);
      console.log('This causes MapLibre to upscale zoom 17 tiles in those areas,');
      console.log('making them appear lower quality/blurry.');
    }
  }

  console.log('\n=== Checking for gaps at zoom 17 ===\n');
  
  const zoom17Result = db.exec(`
    SELECT 
      MIN(tile_column) as min_x, 
      MAX(tile_column) as max_x,
      MIN(tile_row) as min_y,
      MAX(tile_row) as max_y,
      COUNT(*) as actual_count
    FROM tiles WHERE zoom_level = 17
  `);

  if (zoom17Result.length > 0 && zoom17Result[0].values.length > 0) {
    const [minX, maxX, minY, maxY, actualCount] = zoom17Result[0].values[0];
    const expectedCount = (maxX - minX + 1) * (maxY - minY + 1);
    const coverage = ((actualCount / expectedCount) * 100).toFixed(1);
    
    console.log(`Zoom 17 tile range: X[${minX}-${maxX}] Y[${minY}-${maxY}]`);
    console.log(`Expected tiles (full grid): ${expectedCount}`);
    console.log(`Actual tiles: ${actualCount}`);
    console.log(`Coverage: ${coverage}%`);
  }

  db.close();
}

checkTileDistribution().catch(console.error);
