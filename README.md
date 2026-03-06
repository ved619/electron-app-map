# 🗺️ PinPath - Offline-Capable Location Tracker

An Electron desktop application for pinning locations and exploring nearby markers with **full offline map support**.

## ✨ Features

- 📍 **Pin and track locations** with a draggable marker
- 🔒 **Lock marker** to prevent accidental movement
- 🌐 **Get your current location** using GPS
- 🎯 **Random markers** generated within a 10km radius
- ⚡ **Fully offline** - works without internet when tiles are bundled
- 🖥️ **Cross-platform** - Windows, macOS, Linux

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd my-electron-app
npm install
cd renderer
npm install
cd ..
```

### 2. Set Up Offline Maps (Optional but Recommended)

For offline functionality, you need to download map tiles:

```bash
npm run check-tiles
```

Follow the instructions in [OFFLINE_SETUP.md](OFFLINE_SETUP.md) to download tiles.

**Without tiles:** The app will use online OpenStreetMap tiles (requires internet).

**With tiles:** The app works completely offline!

### 3. Run in Development

```bash
npm start
```

This will:
- Start the Vite development server for React
- Start the local tile server (if tiles are present)
- Launch the Electron app

### 4. Build for Distribution

```bash
npm run build:win
```

The built `.exe` will be in the `dist/` folder and will include bundled tiles if present.

## 📦 How It Works

### Offline Map Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌───────────────────────────────────┐  │
│  │   Local Tile Server (Port 8754)  │  │
│  │   Serves tiles from map.mbtiles  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        React Renderer Process           │
│  ┌───────────────────────────────────┐  │
│  │   Leaflet Map Component           │  │
│  │   - Auto-detects local tiles      │  │
│  │   - Falls back to online tiles    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Key Components:**
- **Express server** in Electron main process serves local tiles
- **better-sqlite3** reads tiles from MBTiles database
- **React/Leaflet** frontend auto-detects and uses local tiles
- **Graceful fallback** to online tiles if local tiles unavailable

### Map Data Source

- **Online mode:** OpenStreetMap tiles (https://tile.openstreetmap.org)
- **Offline mode:** Bundled MBTiles file served locally
- **Location data:** Browser Geolocation API
- **Markers:** Generated locally using Haversince distance calculations

## 📁 Project Structure

```
my-electron-app/
├── electron/
│   ├── main.js           # Electron main process + tile server
│   └── preload.js        # Context bridge for renderer
├── renderer/             # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx       # Main app component with map
│   │   └── main.tsx      # React entry point
│   └── package.json
├── tiles/
│   └── new_delhi_map.mbtiles  # Offline map tiles - New Delhi region
├── scripts/
│   └── download-tiles.js # Tile setup helper
├── package.json          # Main package file
└── OFFLINE_SETUP.md      # Detailed offline setup guide
```

## 🎮 Usage

1. **Get Your Location**: Click "📍 Get Your Location" to center on your current position
2. **Drag Marker**: Click and drag the red marker to any location
3. **Lock Marker**: Click 🔓 to lock/unlock the marker
4. **Adjust Marker Interval**: Change how often random markers appear (in seconds)
5. **Pause Markers**: Stop new markers from being generated

## 🔧 Configuration

### Port Configuration
The local tile server runs on port `8754`. To change this, edit:
- [electron/main.js](electron/main.js) - Line with `const PORT = 8754`

### Tile Coverage
The default map covers the New Delhi region from `new_delhi_map.mbtiles`. See [OFFLINE_SETUP.md](OFFLINE_SETUP.md) for:
- Recommended zoom levels
- Geographic coverage options
- File size guidelines

## 📤 Distribution

When you build with `npm run build:win`, the output includes:
- ✅ Complete Electron app
- ✅ React frontend (bundled)
- ✅ Map tiles (if present in `tiles/`)
- ✅ Local tile server
- ✅ All dependencies

**Result:** A single `.exe` that works completely offline!

## 🐛 Troubleshooting

### Map shows gray tiles
- **Problem:** Tiles not loading
- **Solution:** 
  - Run `npm run check-tiles` to verify tiles are present
  - Check console for tile server errors
  - Ensure `new_delhi_map.mbtiles` is in the correct location

### "Tile not found" errors
- **Problem:** Tiles missing for current zoom/location
- **Solution:** 
  - Your tiles may not cover the current area
  - Download tiles with wider geographic coverage
  - Or use lower zoom levels

### App builds but tiles missing
- **Problem:** Tiles not included in build
- **Solution:**
  - Verify `tiles/*.mbtiles` is present before building
  - Check `package.json` build config includes `"tiles/**/*"`

## 📋 Requirements

- Node.js 16+ 
- npm or yarn
- Windows 10+ (for Windows builds)

## 🙏 Acknowledgments

- **OpenStreetMap** for map data
- **Leaflet** for map rendering
- **React-Leaflet** for React integration
- **Electron** for desktop app framework

## 📄 License

Map data © OpenStreetMap contributors

## 🆘 Need Help?

- See [OFFLINE_SETUP.md](OFFLINE_SETUP.md) for detailed tile setup
- Check the `tiles/README.md` for quick tile placement guide
- Run `npm run check-tiles` to diagnose tile issues
