const { app, BrowserWindow, ipcMain } = require('electron');
const WebSocket = require('ws');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;
let wss;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Lingo Sidecar",
    titleBarStyle: 'hiddenInset', // macOS style
    vibrancy: 'under-window', // macOS glass effect
    visualEffectState: 'active',
    backgroundColor: '#00000000', // Transparent for vibrancy
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile('index.html');

  // Uncomment for debugging
  // mainWindow.webContents.openDevTools();
}

// WebSocket Server for React App communication
function startServer() {
  // Check if port 8080 is already in use
  const net = require('net');
  const tester = net.createServer()
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('⚠️ Port 8080 already in use, skipping WebSocket server');
      }
    })
    .once('listening', () => {
      tester.close(() => {
        wss = new WebSocket.Server({ port: 8080 });
        console.log('✅ WebSocket server started on port 8080');

        wss.on('connection', (ws) => {
          console.log('✅ React App connected');

          ws.on('message', (message) => {
            try {
              const data = JSON.parse(message);

              if (data.type === 'OVERFLOW_REPORT') {
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('overflow-alert', data.data);
                }
              }
            } catch (e) {
              console.error('Failed to parse message', e);
            }
          });
        });
      });
    })
    .listen(8080);
}

// IPC Handler: Run lingo.dev translation
ipcMain.on('run-lingo-translate', async (event, { apiKey, projectPath }) => {
  console.log('🌐 Running lingo.dev translation...');

  // Project path must come from user settings - no hardcoded defaults
  if (!projectPath) {
    console.error('❌ No project path provided');
    event.reply('lingo-translate-result', {
      success: false,
      error: 'Please configure your Project Path in Settings (⚙️)'
    });
    return;
  }

  // API key must come from user settings (UI localStorage)
  if (!apiKey) {
    console.error('❌ No API key provided');
    event.reply('lingo-translate-result', {
      success: false,
      error: 'Please enter your API key in Settings (⚙️)'
    });
    return;
  }

  // Pass the user's API key
  const env = { ...process.env, LINGODOTDEV_API_KEY: apiKey };

  console.log('📁 Project path:', projectPath);
  console.log('🔑 Using API key:', apiKey.substring(0, 10) + '...');

  exec('npx lingo.dev@latest run', { cwd: projectPath, env }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Translation failed:', stderr);
      event.reply('lingo-translate-result', { success: false, error: stderr || error.message });
    } else {
      console.log('✅ Translation complete:', stdout);
      event.reply('lingo-translate-result', { success: true, output: stdout });
    }
  });
});

app.whenReady().then(() => {
  createWindow();
  startServer();
});

app.on('window-all-closed', () => {
  if (wss) {
    wss.close();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
