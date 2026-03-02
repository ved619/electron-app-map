# Offline Map Setup Instructions

This guide explains how to make PinPath work completely offline by downloading and bundling map tiles.

## Overview

The app now includes a local tile server that serves map tiles from an MBTiles file. This allows the .exe to work without internet connectivity.

## Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Download map tiles** for your desired region (see methods below)

3. **Place the tiles file** at: `my-electron-app/tiles/map.mbtiles`

4. **Build and distribute**: The tiles will be bundled with your .exe

## Method 1: Download Pre-made MBTiles (Easiest)

### Option A: OpenMapTiles
Visit [OpenMapTiles.com](https://openmaptiles.com/) and download a region:
- Free download for small regions
- Choose your area of interest
- Download the `.mbtiles` file
- Rename it to `map.mbtiles` and place in `tiles/` folder

### Option B: Extract from Existing Maps
Use tools like:
- **Mobile Atlas Creator (MOBAC)** - GUI tool for downloading tiles
- **TileMill** - Create custom map tiles

## Method 2: Download Tiles Using Scripts

### Using `mbutil` (Python)

1. **Install mbutil**:
   ```bash
   pip install mbutil
   ```

2. **Download tiles** (example for San Francisco area):
   ```bash
   # Install tile-downloader or similar tool
   npm install -g tl
   
   # Download tiles for a bounding box
   # Format: west,south,east,north
   tl download -bbox=-122.5,37.7,-122.3,37.9 -zoom=0-15 -output=./tiles/
   ```

3. **Convert to MBTiles**:
   ```bash
   mb-util --scheme=tms ./tiles/ ./tiles/map.mbtiles
   ```

## Method 3: Use TileLayer-MBTiles Tools

### download-osm-tiles script

Create a Node.js script to download tiles:

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Define your area bounds
const bounds = {
  north: 37.8,
  south: 37.7,
  east: -122.3,
  west: -122.5,
  minZoom: 0,
  maxZoom: 15
};

// Download tiles (simplified example)
// Use a proper tile downloader library for production
```

## Coverage Recommendations

### File Size Guidelines:
- **City (zoom 0-13)**: ~50-200 MB
- **City (zoom 0-15)**: ~500 MB - 2 GB
- **Country (zoom 0-10)**: ~100-500 MB
- **World (zoom 0-8)**: ~500 MB

### Zoom Levels:
- **0-5**: World/Continent view
- **6-10**: Country/State view
- **11-13**: City view (recommended minimum)
- **14-16**: Street level detail
- **17+**: Building level (very large files)

**Recommendation**: Download zoom levels 0-13 for a city region for the best balance.

## Testing Offline Mode

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Check the console** - You should see:
   ```
   Tile server running on http://127.0.0.1:8754
   ```

3. **Disconnect from internet** and test map loading

4. **Build the app**:
   ```bash
   npm run build:win
   ```

## Fallback Behavior

The app is designed with graceful fallback:
- If `map.mbtiles` is not found, it falls back to online OpenStreetMap tiles
- If offline and no local tiles, the map will show a gray background with markers still functional

## File Structure

```
my-electron-app/
├── tiles/
│   └── map.mbtiles          ← Place your tiles file here
├── electron/
│   ├── main.js              ← Local tile server code
│   └── preload.js
└── renderer/
    └── src/
        └── App.tsx          ← Auto-detects local/online mode
```

## Troubleshooting

### Tiles not loading?
1. Check console for error messages
2. Verify `map.mbtiles` exists in the correct location
3. Ensure file permissions allow reading
4. Check that port 8754 is not blocked

### Large file size?
1. Reduce zoom level range
2. Decrease geographic bounds
3. Use vector tiles (more complex setup)

## Legal Considerations

When downloading tiles:
- **Respect OpenStreetMap usage policies**
- **Include attribution** (already in the app)
- **Don't abuse tile servers** - use reasonable rate limits
- **Consider hosting your own tile server** for large-scale distribution

## Alternative: Vector Tiles

For even smaller file sizes, consider switching to vector tiles:
- Use Mapbox GL JS instead of Leaflet
- Download vector MBTiles from [OpenMapTiles](https://openmaptiles.org/)
- Typically 10x smaller than raster tiles
- Requires more setup but provides better performance

## Resources

- [MBTiles Specification](https://github.com/mapbox/mbtiles-spec)
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- [Mobile Atlas Creator](https://mobac.sourceforge.io/)
- [TileMill](https://tilemill-project.github.io/tilemill/)
