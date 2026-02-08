# 🛡️ Lingo-Guardian

> **The Automated DevSecOps Firewall for Internationalization**

Detects UI overflows, RTL layout breaks, and missing i18n keys before they reach production.

## ⚡ Powered by [Lingo.dev](https://lingo.dev)

---

## 📦 Installation

### Option 1: Use as npx (Recommended)
```bash
# Run directly without installing
npx @lingo-guardian/cli lint http://localhost:3000
```

## 🚀 Demo Apps

This repository includes two demo applications to showcase Lingo-Guardian's capabilities:

### 1. CloudFlow Landing Page (`apps/demo1-app`)
A realistic SaaS landing page with 80+ translation keys, used to demonstrate the **CLI Audit** workflow.
- **Port:** 3001
- **Features:** Overflow detection, CLI integration, 7 languages.
- **Run:** `cd apps/demo1-app && npm run dev`

### 2. Live Reporter Demo (`apps/demo2-app`)
A copy of the landing page integrated with the **Lingo-Guardian Reporter** hook for live development testing.
- **Port:** 3002
- **Features:** 
  - 🔴 Live "Red Glow" overflow detection
  - 🛡️ Interactive Control Panel to toggle CSS fixes
  - 🖥️ Integration with Electron Sidecar
- **Run:** `cd apps/demo2-app && npm run dev`

---

## 💻 Electron Sidecar

The **Lingo-Guardian Sidecar** (`apps/electron-sidecar`) is a powerful desktop companion app that pairs with `demo2-app`.

**Features:**
- 🖼️ **Multi-View Modes:** Toggle between 4-pane "Grid" and single-pane "Focus"
- 🔍 **Zoom Control:** Slider to simulate different screen densities
- 🌐 **Language Switcher:** Quickly change the focus language
- ⚡ **Live Alerts:** Real-time red glow notifications via WebSocket

**Usage:**
1. Open a new terminal
2. `cd apps/electron-sidecar`
3. `npm start`
4. Use `demo2-app` - overflows will trigger alerts in the Sidecar!

**Building for Production:**
To create a standalone app for Mac/Windows:
```bash
cd apps/electron-sidecar
npm run dist
```
Build artifacts will be in the `dist/` folder.

---

### Option 2: Install Globally
```bash
npm install -g @lingo-guardian/cli
lingo-guardian lint http://localhost:3000
```

### Option 3: Add to Your Project
```bash
npm install --save-dev @lingo-guardian/cli
npx lingo-guardian lint http://localhost:3000
```

---

## 🔑 Setting Up Lingo.dev API Key

Lingo-Guardian uses **Lingo.dev** for AI-powered translations. You need to set up an API key:

### Step 1: Get Your API Key

1. Go to [https://lingo.dev](https://lingo.dev)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Create a new API key

### Step 2: Configure Your API Key

**Option A: Environment Variable (Recommended)**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export LINGODOTDEV_API_KEY="your-api-key-here"
```

**Option B: .env File**
```bash
# Create a .env file in your project root
echo "LINGODOTDEV_API_KEY=your-api-key-here" > .env
```

**Option C: Pass Directly (CI/CD)**
```bash
LINGODOTDEV_API_KEY=your-key npx lingo-guardian lint http://localhost:3000
```

### Step 3: Initialize Lingo.dev in Your Project

```bash
cd your-project
npx lingo.dev@latest init
```

This creates an `i18n.json` configuration file that Lingo-Guardian will use.

---

## 🚀 Quick Start

### 1. Initialize Lingo.dev in Your Project
```bash
cd your-react-app
npx lingo.dev@latest init
```

### 2. Start Your Dev Server
```bash
npm run dev
# App running at http://localhost:3000
```

### 3. Run Lingo-Guardian Audit
```bash
npx @lingo-guardian/cli lint http://localhost:3000
```

### 4. Create a Visual Audit Report
```bash
npx @lingo-guardian/cli visual http://localhost:3000 --output report.png
# Generates a stitched image of English, Pseudo, Arabic, and Japanese
```

---

## 👁️ Visual PR Guardian (GitHub Action)

Turn every Pull Request into an automated visual audit. Lingo-Guardian will:
1. Spin up your app
2. Take screenshots in **English**, **Pseudo**, **Arabic**, and **Japanese**
3. Stitch them into a **2x2 Grid**
4. **Post a comment** on your PR with the report

### The "Zero-Config" Setup

Create `.github/workflows/lingo-audit.yml` in your repo:

```yaml
name: 🛡️ Visual PR Guardian

on: [pull_request]

permissions:
  contents: read
  pull-requests: write # Required for posting comments

jobs:
  visual-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Start Your App (Adjust for your framework)
      - name: 🏗️ Start App
        run: |
          npm ci && npm run build
          npm run start & 
          npx wait-on http://localhost:3000

      # 2. Run Lingo Guardian
      - name: 📸 Run Visual Audit
        uses: ashpreetsinghanand/lingo-guardian/packages/action@main
        with:
          url: 'http://localhost:3000'
          lingo-api-key: ${{ secrets.LINGODOTDEV_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Don't forget to add `LINGODOTDEV_API_KEY` to your Repo Secrets!**

---

## 👁️ Visual PR Guardian (GitHub Action)

Turn every Pull Request into an automated visual audit. Lingo-Guardian will:
1. Spin up your app
2. Take screenshots in **English**, **Pseudo**, **Arabic**, and **Japanese**
3. Stitch them into a **2x2 Grid**
4. **Post a comment** on your PR with the report

### The "Zero-Config" Setup

Create `.github/workflows/lingo-audit.yml` in your repo:

```yaml
name: 🛡️ Visual PR Guardian

on: [pull_request]

permissions:
  contents: read
  pull-requests: write # Required for posting comments

jobs:
  visual-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Start Your App (Adjust for your framework)
      - name: 🏗️ Start App
        run: |
          npm ci && npm run build
          npm run start & 
          npx wait-on http://localhost:3000

      # 2. Run Lingo Guardian
      - name: 📸 Run Visual Audit
        uses: ashpreetsinghanand/lingo-guardian/packages/action@main
        with:
          url: 'http://localhost:3000'
          lingo-api-key: ${{ secrets.LINGODOTDEV_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Don't forget to add `LINGODOTDEV_API_KEY` to your Repo Secrets!**

---

## 📖 Usage

### Basic Audit
```bash
# Audits with default locales (en, pseudo)
lingo-guardian lint http://localhost:3000
```

### Test Multiple Locales (Real Word Strategy)
By default, the CLI uses algorithmic `pseudo` locale for stress testing. To test with **real AI-generated translations** (e.g., German for length, Arabic for RTL), ensure you have initialized Lingo.dev (`npx lingo.dev init`) and run:

```bash
# Uses the actual translations from your locales/ directory
lingo-guardian lint http://localhost:3000 --locale de ar ja
```

### Generate HTML Report
```bash
lingo-guardian lint http://localhost:3000 --format html --output ./reports
```

### CI/CD Mode (Exit with Error)
```bash
lingo-guardian lint http://localhost:3000 --fail-on-error
```

### Full Options
```bash
lingo-guardian lint <url> [options]

Options:
  -p, --project <path>        Project directory with i18n.json (default: cwd)
  --use-lingo                 Run Lingo.dev CLI before audit (default: true)
  -l, --locale <locales...>   Locales to test (default: ["en", "pseudo"])
  -f, --format <format>       Output format: table, json, html
  -s, --screenshot            Capture screenshots of issues
  -o, --output <dir>          Output directory for reports
  --fail-on-error             Exit with error code if issues found (for CI)
  -w, --width <pixels>        Viewport width (default: 1280)
  --height <pixels>           Viewport height (default: 720)
  -t, --timeout <ms>          Page load timeout (default: 30000)
  -v, --verbose               Enable verbose logging
```

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. DETECT: Find i18n.json in your project                  │
├─────────────────────────────────────────────────────────────┤
│  2. RUN: Execute `npx lingo.dev run` (uses your API key)    │
│     → Generates locales/pseudo.json, locales/ar.json, etc.  │
├─────────────────────────────────────────────────────────────┤
│  3. AUDIT: Load app with ?lang=pseudo via Playwright        │
│     → Lingo SDK reads URL param and switches locale         │
├─────────────────────────────────────────────────────────────┤
│  4. DETECT: Check scrollWidth > offsetWidth (Red Glow)      │
├─────────────────────────────────────────────────────────────┤
│  5. REPORT: Output issues in table, JSON, or HTML           │
└─────────────────────────────────────────────────────────────┘
```

---

## � Cross-Platform Support

Works on **Mac, Windows, and Linux** using Playwright:

| Platform | Status |
|----------|--------|
| macOS | ✅ Verified |
| Windows | ✅ Supported |
| Linux | ✅ Supported |

---

## 📋 Example Output

```
╔═══════════════════════════════════════════════════════════╗
║   🛡️  LINGO-GUARDIAN                                      ║
║   Powered by Lingo.dev                                    ║
╚═══════════════════════════════════════════════════════════╝

📊 Summary
   URL: http://localhost:3000/?lang=pseudo
   Locales tested: en, pseudo, ar
   Total issues: 3
   Errors: 1
   Warnings: 2

┌─────────┬────────────────────┬───────────┬──────────┐
│ Locale  │ Selector           │ Overflow  │ Severity │
├─────────┼────────────────────┼───────────┼──────────┤
│ pseudo  │ .nav-button        │ horizontal│ error    │
│ pseudo  │ #submit-btn        │ horizontal│ warning  │
│ ar      │ .sidebar-title     │ horizontal│ warning  │
└─────────┴────────────────────┴───────────┴──────────┘
```

---

## 🔧 Configuration

### i18n.json (Lingo.dev Config)

```json
{
  "$schema": "https://lingo.dev/schema/i18n.json",
  "version": "1.10",
  "locale": {
    "source": "en",
    "targets": ["es", "de", "ar", "pseudo"]
  },
  "buckets": {
    "json": {
      "include": ["locales/[locale].json"]
    }
  }
}
```

---

## 🔧 The "Trinity" Architecture

1. **Lingo-Lint (CLI)** - This package! Headless audit tool.
2. **Visual PR Guard** - GitHub Action for PR screenshots (coming soon)
3. **Sidecar** - Electron app with 4-pane preview (coming soon)

---

## 🚀 How to Demo (The "Wow" Factor)

1.  **Start your App**:
    ```bash
    cd apps/demo-app
    npm run dev
    ```

2.  **Launch the Dashboard**:
    ```bash
    npx lingo-guardian dashboard http://localhost:3000
    ```

3.  **Open the Dashboard**: Go to `http://localhost:3005`. You will see 4 synced views of your app.

4.  **Trigger a Bug**:
    - Go to `apps/demo-app/app/page.tsx`.
    - Make a text string really long (e.g., change "Submit" to "Submit and Pay Immediately").
    - **Save**.

5.  **Watch the Magic**:
    - The Pseudo/German pane will break.
    - The Dashboard will flash **RED**.
    - Your console will log the exact file/line number of the component.

## 📦 Packages

- **[`@lingo-guardian/cli`](./packages/cli)**: The core audit tool and dashboard server.
- **[`@lingo-guardian/reporter`](./packages/reporter)**: The React hook for real-time detection.

---

## 📦 Development

```bash
# Clone the repo
git clone https://github.com/your-org/lingo-guardian.git
cd lingo-guardian

# Install dependencies
npm install

# Build CLI
npm run build --workspace=@lingo-guardian/cli

# Run locally
node packages/cli/dist/bin/cli.js lint http://localhost:3000
```

---

## 🏆 Hackathon

Built for the [Lingo.dev Hackathon](https://lingo.dev) - Feb 2026

**Goal:** Win 1st Place by deeply integrating with Lingo.dev! 🎮

---

## 📄 License

MIT © Lingo-Guardian Team