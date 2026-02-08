# 🛡️ Lingo Guardian

> **Catch i18n layout issues before your users do**

Detects CSS overflow, RTL layout breaks, and text clipping when your app is translated.

[![npm](https://img.shields.io/npm/v/lingo-guardian)](https://www.npmjs.com/package/lingo-guardian)
[![GitHub](https://img.shields.io/github/stars/ashpreetsinghanand/lingo-guardian)](https://github.com/ashpreetsinghanand/lingo-guardian)

## ⚡ Quick Start

```bash
# Install CLI
npm install -g lingo-guardian

# Scan your app
npx lingo-guardian lint http://localhost:3000
```

---

## 🧰 4 Tools. One Mission.

| Tool | Purpose | Install |
|------|---------|---------|
| **CLI** | Static analysis + screenshots | `npm i -g lingo-guardian` |
| **GitHub Action** | PR visual checks | Uses workflow |
| **Reporter Hook** | Runtime detection | `npm i lingo-guardian-reporter` |
| **Sidecar App** | Live 4-pane preview | [Download](#-download-sidecar) |

---

## 📥 Download Sidecar

Desktop app for visual i18n testing with 4-language side-by-side view.

| Platform | Download |
|----------|----------|
| **macOS (Apple Silicon)** | [Lingo Sidecar-1.0.0-arm64.dmg](https://github.com/ashpreetsinghanand/lingo-guardian/releases/download/v1.0.0/Lingo.Sidecar-1.0.0-arm64.dmg) |
| **macOS (Intel)** | [Lingo Sidecar-1.0.0.dmg](https://github.com/ashpreetsinghanand/lingo-guardian/releases/download/v1.0.0/Lingo.Sidecar-1.0.0.dmg) |
| **Windows** | [Lingo Sidecar Setup 1.0.0.exe](https://github.com/ashpreetsinghanand/lingo-guardian/releases/download/v1.0.0/Lingo.Sidecar.Setup.1.0.0.exe) |

---

## 🚀 CLI Commands

```bash
# Basic lint
npx lingo-guardian lint http://localhost:3000

# Multiple languages
npx lingo-guardian lint http://localhost:3000 --locale de ja ar

# Generate screenshot grid
npx lingo-guardian scan --url http://localhost:3000 --langs en,de,ja,ar --grid

# HTML report
npx lingo-guardian report --format html --output ./report.html
```

---

## ⚛️ React Reporter Hook

```bash
npm install lingo-guardian-reporter
```

```tsx
import { useLingoGuardian } from 'lingo-guardian-reporter';

function App() {
  // Adds red glow to overflow elements
  useLingoGuardian({ 
    enable: true,
    showGlow: true 
  });
  
  return <YourApp />;
}
```

---

## 🔄 GitHub Action

```yaml
# .github/workflows/i18n-check.yml
name: i18n Layout Check
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ashpreetsinghanand/lingo-guardian/packages/action@main
        with:
          url: 'http://localhost:3000'
          lingo-api-key: ${{ secrets.LINGODOTDEV_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🔑 Lingo.dev Setup

```bash
# Get API key from https://lingo.dev
export LINGODOTDEV_API_KEY="your-api-key"

# Initialize in your project
npx lingo.dev@latest init
```

---

## 📦 Packages

| Package | npm | Description |
|---------|-----|-------------|
| `lingo-guardian` | [![npm](https://img.shields.io/npm/v/lingo-guardian)](https://www.npmjs.com/package/lingo-guardian) | CLI tool |
| `lingo-guardian-reporter` | [![npm](https://img.shields.io/npm/v/lingo-guardian-reporter)](https://www.npmjs.com/package/lingo-guardian-reporter) | React hook |

---

## 🖥️ Demo Apps

```bash
# CLI demo (port 3000)
cd demo/demo-app && npm run dev

# Reporter demo (port 3001)
cd demo/demo1-app && npm run dev

# Sidecar demo (port 3002)
cd demo/demo2-app && npm run dev

# Sidecar app
cd apps/lingo-sidecar && npm start
```

---

## 🏆 Built for Lingo.dev Hackathon

Feb 2026 • Powered by [Lingo.dev](https://lingo.dev)

---

## 📄 License

MIT © Lingo Guardian Team