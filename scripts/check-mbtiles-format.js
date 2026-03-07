const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkMBTilesFormat(mbtilesPath) {
  try {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(mbtilesPath);
    const db = new SQL.Database(buffer);

    // Get metadata
    console.log('\n=== MBTiles Metadata ===');
    const metadataResult = db.exec('SELECT name, value FROM metadata');
    if (metadataResult.length > 0) {
      metadataResult[0].values.forEach(([name, value]) => {
        console.log(`${name}: ${value}`);
      });
    }

    // Get a sample tile to check format
    console.log('\n=== Sample Tile Info ===');
    const tileResult = db.exec('SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles LIMIT 1');
    if (tileResult.length > 0 && tileResult[0].values.length > 0) {
      const [z, x, y, tileData] = tileResult[0].values[0];
      console.log(`Sample tile: z=${z}, x=${x}, y=${y}`);
      console.log(`Tile data size: ${tileData.length} bytes`);
      
      // Check magic bytes to determine format
      const buffer = Buffer.from(tileData);
      const magicBytes = buffer.slice(0, 8);
      console.log(`First bytes (hex): ${magicBytes.toString('hex')}`);
      
      // PNG: 89 50 4E 47
      // JPEG: FF D8 FF
      // WebP: 52 49 46 46 ... 57 45 42 50
      // PBF/MVT: Usually starts with 1F 8B (gzip) or other protobuf bytes
      
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        console.log('Format: PNG (Raster)');
      } else if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        console.log('Format: JPEG (Raster)');
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        console.log('Format: WebP (Raster)');
      } else if (buffer[0] === 0x1F && buffer[1] === 0x8B) {
        console.log('Format: Gzipped (likely Vector/PBF)');
      } else {
        console.log('Format: Unknown or Vector (PBF)');
      }
    }

    db.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

const mbtilesPath = process.argv[2] || path.join(__dirname, '../satellite_gurgaon.mbtiles');
console.log(`Checking: ${mbtilesPath}`);
checkMBTilesFormat(mbtilesPath);
