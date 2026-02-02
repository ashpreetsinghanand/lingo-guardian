const { app, BrowserWindow, ipcMain } = require('electron');
const WebSocket = require('ws');
const path = require('path');

let mainWindow;
let wss;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Lingo-Guardian Sidecar",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Keeping it simple for the hackathon
      webviewTag: true // Required to show the 4 panes
    }
  });

  mainWindow.loadFile('index.html');

  // Open DevTools (optional, good for debugging)
  // mainWindow.webContents.openDevTools();
}

// 1. Start WebSocket Server to listen to the React App
function startServer() {
  wss = new WebSocket.Server({ port: 8080 });

  wss.on('connection', (ws) => {
    console.log('✅ React App connected to Sidecar');

    ws.on('message', (message) => {
      // 2. Receive "Overflow Alert" from React
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'OVERFLOW_REPORT') {
          // Forward this alert to our Electron UI to show the "Red Glow"
          if (mainWindow && !mainWindow.isDestroyed()) {
             mainWindow.webContents.send('overflow-alert', data.data);
          }
        }
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  startServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
