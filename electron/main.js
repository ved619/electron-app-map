const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const fs = require("fs");
const initSqlJs = require("sql.js");

const isDev = !app.isPackaged;
const TILE_SERVER_PORT = 8754;
const MBTILES_FILE_NAME = "satellite_gurgaon.mbtiles";
const TILE_QUERY =
  "SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?";

let tileServer = null;
let db = null;

function resolveMbtilesPath() {
  return isDev
    ? path.join(__dirname, `../${MBTILES_FILE_NAME}`)
    : path.join(process.resourcesPath, MBTILES_FILE_NAME);
}

function xyzToTmsY(z, y) {
  return Math.pow(2, z) - 1 - y;
}

function fetchTileData(z, x, y) {
  const tmsY = xyzToTmsY(z, y);
  const result = db.exec(TILE_QUERY, [z, x, tmsY]);
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  return result[0].values[0][0];
}

// Start local tile server serving tiles from .mbtiles file
async function startTileServer() {
  const tileApp = express();
  const mbtilesPath = resolveMbtilesPath();

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

    tileApp.get("/tiles/:z/:x/:y.jpg", (req, res) => {
      const z = parseInt(req.params.z, 10);
      const x = parseInt(req.params.x, 10);
      const y = parseInt(req.params.y, 10);

      if (!Number.isInteger(z) || !Number.isInteger(x) || !Number.isInteger(y)) {
        res.status(400).send("Invalid tile coordinates");
        return;
      }

      const tileData = fetchTileData(z, x, y);

      if (tileData) {
        res.set("Content-Type", "image/jpeg");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(tileData));
      } else {
        res.status(404).send("Tile not found");
      }
    });

    tileServer = tileApp.listen(TILE_SERVER_PORT, "127.0.0.1", () => {
      console.log(`Tile server running on http://127.0.0.1:${TILE_SERVER_PORT}`);
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
