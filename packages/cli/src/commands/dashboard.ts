
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

export const dashboardCommand = new Command('dashboard')
  .description('Launch the Lingo-Guardian 4-Pane Dashboard')
  .argument('<url>', 'Base URL of your running app (e.g., http://localhost:3000)')
  .option('-p, --port <number>', 'Port to run dashboard on', '3005')
  .action((url: string, options: { port: string }) => {
    runDashboard(url, parseInt(options.port, 10));
  });

function runDashboard(targetUrl: string, port: number) {
  const app = express();

  // Serve the HTML
  app.get('/', (req, res) => {
    const html = getDashboardHtml(targetUrl);
    res.send(html);
  });

  const server = app.listen(port, () => {
    console.log(chalk.green(`\n🚀 Lingo-Guardian Dashboard running at: http://localhost:${port}`));
    console.log(chalk.gray(`   Monitoring: ${targetUrl}`));
    console.log(chalk.gray(`   (Press Ctrl+C to stop)`));
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`⚠️  Port ${port} is busy, trying ${port + 1}...`));
      runDashboard(targetUrl, port + 1);
    } else {
      console.error(chalk.red('❌ Server error:'), e);
    }
  });
}

function getDashboardHtml(baseUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Lingo-Guardian Live Preview</title>
  <style>
    body { margin: 0; background: #1e1e1e; color: white; font-family: sans-serif; overflow: hidden; }
    
    /* The Toolbar */
    #toolbar {
      height: 50px; background: #252526; display: flex; align-items: center; padding: 0 20px;
      border-bottom: 1px solid #333;
    }
    input { background: #3c3c3c; border: none; color: white; padding: 8px; width: 300px; border-radius: 4px; }
    button { background: #007acc; border: none; color: white; padding: 8px 16px; margin-left: 10px; border-radius: 4px; cursor: pointer; }
    
    /* The 4-Pane Grid */
    #grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      height: calc(100vh - 50px);
      gap: 2px;
      background: #000;
    }
    
    .pane { position: relative; background: white; }
    .pane-label {
      position: absolute; top: 0; left: 0; background: rgba(0,0,0,0.7); color: white;
      padding: 4px 8px; font-size: 12px; z-index: 10; pointer-events: none;
    }
    iframe { width: 100%; height: 100%; border: none; }

    /* The Red Glow Alert */
    .critical-error { border: 4px solid #ff4d4d; box-sizing: border-box; }
    
    /* Flash Animation */
    @keyframes flash {
      0% { border-color: #ff4d4d; }
      50% { border-color: transparent; }
      100% { border-color: #ff4d4d; }
    }
    .critical-error { animation: flash 0.5s linear infinite; }
  </style>
</head>
<body>

  <div id="toolbar">
    <span style="margin-right: 10px; font-weight: bold;">🛡️ Lingo-Guardian</span>
    <input type="text" id="urlInput" value="${baseUrl}" placeholder="Enter localhost URL...">
    <button onclick="reloadAll()">Reload</button>
  </div>

  <div id="grid">
    <div class="pane" id="pane-en">
      <div class="pane-label">🇺🇸 English (Source)</div>
      <iframe id="view-en" src="about:blank"></iframe>
    </div>

    <div class="pane" id="pane-pseudo">
      <div class="pane-label">🇩🇪 Pseudo (Expansion Test)</div>
      <iframe id="view-pseudo" src="about:blank"></iframe>
    </div>

    <div class="pane" id="pane-ar">
      <div class="pane-label">🇦🇪 Arabic (RTL Layout)</div>
      <iframe id="view-ar" src="about:blank"></iframe>
    </div>

    <div class="pane" id="pane-ja">
      <div class="pane-label">🇯🇵 Japanese (Vertical/Font)</div>
      <iframe id="view-ja" src="about:blank"></iframe>
    </div>
  </div>

  <script>
    function reloadAll() {
      const baseUrl = document.getElementById('urlInput').value;
      
      // Assumes ?lang=xx param for demo. Could be robustified safely.
      document.getElementById('view-en').src = \`\${baseUrl}\`;
      document.getElementById('view-pseudo').src = \`\${baseUrl}?lang=pseudo\`;
      document.getElementById('view-ar').src = \`\${baseUrl}?lang=ar\`;
      document.getElementById('view-ja').src = \`\${baseUrl}?lang=ja\`;
    }

    // Load by default
    reloadAll();

    // Listen for Red Alerts from Iframes
    window.addEventListener('message', (event) => {
      const data = event.data;
      if (data && data.type === 'LINGO_OVERFLOW') {
          // Identify which iframe sent it? 
          // Harder with cross-origin or different ports, but here we can just flash ALL or try to match logic.
          // For the "Wow" demo, let's just flash the pane that likely corresponds or just flash the Pseudo pane as a "Detector".
          // Better: Flash the pane that triggered it?
          // Since we can't easily identifying source iframe window object mapping in cross-origin scenarios without handshake,
          // We will find which iframe has the same origin/source?
          
          // Hack for demo: Flash the Pseudo and Arabic panes regardless, or flash active pane if we could track.
          // Let's flash ALL just to be safe "SOMETHING BROKE".
          
          document.querySelectorAll('.pane').forEach(el => {
             el.classList.add('critical-error');
             setTimeout(() => el.classList.remove('critical-error'), 1000);
          });
          
          console.log("⚠️ Layout Issues Detected:", data.payload);
      }
    });
  </script>
</body>
</html>
    `;
}
