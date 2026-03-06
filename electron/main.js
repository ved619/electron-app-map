const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const fs = require("fs");
const initSqlJs = require("sql.js");

const isDev = !app.isPackaged;
let tileServer = null;
let db = null;

// Start local tile server serving tiles from .mbtiles file
async function startTileServer() {
  const tileApp = express();
  const PORT = 8754;

  const mbtilesPath = isDev
    ? path.join(__dirname, "../newDelhi.mbtiles")
    : path.join(process.resourcesPath, "newDelhi.mbtiles");

  if (!fs.existsSync(mbtilesPath)) {
    console.warn("MBTiles file not found at:", mbtilesPath);
    return null;
  }

  try {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(mbtilesPath);
    db = new SQL.Database(buffer);

    // Enable CORS for all routes
    tileApp.use((req, res, next) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    tileApp.get("/tiles/:z/:x/:y.pbf", (req, res) => {
      const z = parseInt(req.params.z, 10);
      const x = parseInt(req.params.x, 10);
      const y = parseInt(req.params.y, 10);

      // Convert XYZ y to TMS y (flip vertically)
      const tmsY = Math.pow(2, z) - 1 - y;

      const result = db.exec(
        "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?",
        [z, x, tmsY]
      );

      if (result.length > 0 && result[0].values.length > 0) {
        const tileData = result[0].values[0][0];
        res.set("Content-Type", "application/vnd.mapbox-vector-tile");
        res.set("Content-Encoding", "gzip");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(tileData));
      } else {
        res.status(404).send("Tile not found");
      }
    });

    tileServer = tileApp.listen(PORT, "127.0.0.1", () => {
      console.log(`Tile server running on http://127.0.0.1:${PORT}`);
      console.log(`Serving tiles from: ${mbtilesPath}`);
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

app.whenReady().then(async () => {
  await startTileServer();
  createWindow();
});

app.on("before-quit", () => {
  if (tileServer) {
    tileServer.close();
  }
  if (db) {
    db.close();
  }
});
