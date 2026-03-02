# Map Tiles Directory

Place your extracted map tiles here to enable offline map functionality.

## Quick Setup

The app expects tiles in this folder structure:
```
tiles/
  {z}/          ← Zoom level (0-18)
    {x}/        ← X coordinate
      {y}.png   ← Y coordinate tile image
```

Example:
```
tiles/
  10/
    163/
      395.png
      396.png
    164/
      395.png
```

## Option 1: Download Pre-Extracted Tiles (Easiest)

Some tile providers offer pre-extracted tiles in folder format:
- Download a ZIP of tiles for your region
- Extract to this `tiles/` directory
- Ensure the structure matches `{z}/{x}/{y}.png`

## Option 2: Convert MBTiles File

If you have an `.mbtiles` file:

### Using mb-util (Python)

1. **Install mb-util**:
   ```bash
   pip install mbutil
   ```

2. **Convert your MBTiles**:
   ```bash
   node scripts/convert-mbtiles.js path/to/your/map.mbtiles
   ```
   
   Or manually:
   ```bash
   mb-util --image_format=png map.mbtiles tiles/
   ```

### Using GDAL

```bash
gdal_translate -of PNG map.mbtiles tiles/{z}/{x}/{y}.png
```

## Option 3: Download Tiles Directly

Use a tile downloader to save tiles directly in folder format:
- **Mobile Atlas Creator (MOBAC)** - Choose "OSM folder format" as output
- **AllMapSoft Offline Map Maker**
- **JTileDownloader**

## Expected Size

- **City (zoom 0-13)**: ~50-200 MB (thousands of tiles)
- **City (zoom 0-15)**: ~500 MB - 2 GB (tens of thousands of tiles)
- **Country (zoom 0-10)**: ~100-500 MB

## File Not Found?

If tiles are not present, the app will automatically fall back to online OpenStreetMap tiles:
- ✅ App will still work with internet connection
- ❌ Won't work offline without tiles

## Testing

1. Place some tiles in the folder structure
2. Run `npm start`
3. Check console for: "Tile server running on http://127.0.0.1:8754"
4. Check: "Serving tiles from: [path]"

## Troubleshooting

### No tiles loading?
- Verify folder structure exactly matches `{z}/{x}/{y}.png`
- Ensure PNG files are valid images
- Check that zoom levels match your map view

### Directory structure wrong?
The app expects numeric folders only:
- ✅ `tiles/10/163/395.png`
- ❌ `tiles/z10/x163/y395.png`
- ❌ `tiles/10-163-395.png`
