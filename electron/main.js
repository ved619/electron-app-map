const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const fs = require("fs");

const isDev = !app.isPackaged;
let tileServer = null;

// Start local tile server
function startTileServer() {
  const tileApp = express();
  const PORT = 8754; // Local port for tile server

  // Path to tiles directory (folder structure: tiles/z/x/y.png)
  const tilesDir = isDev
    ? path.join(__dirname, "../tiles")
    : path.join(process.resourcesPath, "tiles");

  // Check if tiles directory exists
  if (!fs.existsSync(tilesDir)) {
    console.warn("Tiles directory not found at:", tilesDir);
    console.warn("App will fall back to online tiles.");
    return null;
  }

  try {
    // Serve static tiles from filesystem
    // Expected structure: tiles/{z}/{x}/{y}.png (actually gzipped vector tiles)
    tileApp.get("/tiles/:z/:x/:y.png", (req, res) => {
      const { z, x, y } = req.params;
      const tilePath = path.join(tilesDir, z, x, `${y}.png`);
      
      if (fs.existsSync(tilePath)) {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Content-Type", "application/vnd.mapbox-vector-tile");
        res.set("Content-Encoding", "gzip");
        res.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day
        res.sendFile(tilePath);
      } else {
        res.status(404).send("Tile not found");
      }
    });

    tileServer = tileApp.listen(PORT, "127.0.0.1", () => {
      console.log(`Tile server running on http://127.0.0.1:${PORT}`);
      console.log(`Serving tiles from: ${tilesDir}`);
    });

    return tileServer;
  } catch (err) {
    console.error("Error starting tile server:", err);
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(
      path.join(__dirname, "../renderer/dist/index.html")
    );
  }
}

app.whenReady().then(() => {
  startTileServer();
  createWindow();
});

app.on("before-quit", () => {
  if (tileServer) {
    tileServer.close();
  }
});
