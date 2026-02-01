# 🛡️ Lingo-Guardian

> **The Automated DevSecOps Firewall for Internationalization**

Detects UI overflows, RTL layout breaks, and missing i18n keys before they reach production.

## ⚡ Powered by [Lingo.dev](https://lingo.dev)

**This tool uses Lingo.dev as its core translation engine:**

1. **Detects** your project's `i18n.json` configuration
2. **Runs** `npx lingo.dev run` to generate translations (including pseudo-locale)
3. **Audits** your app using the Lingo.dev SDK's `?lang=` URL parameter
4. **Reports** overflow issues in beautiful table/JSON/HTML formats

---

## ✨ Features

- **🌍 Lingo.dev Integration** - Uses the official CLI and SDK for translations
- **🔍 CSS Overflow Detection** - Finds buttons that break when text expands
- **📈 Pseudo-Locale Testing** - 35% text expansion simulation
- **↔️ RTL Layout Validation** - Tests Arabic, Hebrew, and RTL languages
- **📊 Beautiful Reports** - Terminal tables, JSON, and HTML output

---

## 🚀 Quick Start

### Prerequisites

1. Install Lingo.dev in your project:
   ```bash
   npx lingo.dev@latest init
   ```

2. Install Lingo-Guardian:
   ```bash
   npm install @lingo-guardian/cli
   ```

### Run the Audit

```bash
# From your project directory (with i18n.json)
npx lingo-guardian lint http://localhost:3000
```

---

## 📖 Usage

### Basic Audit (Uses Lingo.dev)
```bash
# This will:
# 1. Detect i18n.json in current directory
# 2. Run `npx lingo.dev run` to generate translations
# 3. Audit with ?lang=pseudo URL param

lingo-guardian lint http://localhost:3000
```

### Specify Project Path
```bash
lingo-guardian lint http://localhost:3000 --project ./my-react-app
```

### Test Multiple Locales
```bash
lingo-guardian lint http://localhost:3000 --locale en pseudo ar de
```

### Skip Lingo.dev Integration
```bash
lingo-guardian lint http://localhost:3000 --no-use-lingo
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
  -v, --verbose               Enable verbose logging
```

---

## 🏗️ Architecture

```
lingo-guardian/
├── packages/
│   └── cli/
│       ├── src/
│       │   ├── core/
│       │   │   ├── auditor.ts          # Puppeteer overflow detection
│       │   │   └── lingo-integration.ts # 🔥 Lingo.dev CLI wrapper
│       │   ├── transforms/
│       │   │   ├── pseudo-locale.ts    # Text expansion (fallback)
│       │   │   └── rtl.ts              # RTL layout testing
│       │   ├── reporters/              # Table/JSON/HTML output
│       │   └── commands/linq.ts        # Main CLI command
```

---

## 🔧 The "Lingo-Native" Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. DETECT: Find i18n.json / lingo.config.js                │
├─────────────────────────────────────────────────────────────┤
│  2. RUN: Execute `npx lingo.dev run` to generate locales    │
│     → Creates locales/pseudo.json, locales/ar.json, etc.    │
├─────────────────────────────────────────────────────────────┤
│  3. AUDIT: Load app with ?lang=pseudo via Puppeteer         │
│     → Lingo SDK reads URL param and switches locale         │
├─────────────────────────────────────────────────────────────┤
│  4. DETECT: Check scrollWidth > offsetWidth (Red Glow)      │
├─────────────────────────────────────────────────────────────┤
│  5. REPORT: Output issues in table, JSON, or HTML           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 How It Works

### Core Integration with Lingo.dev

```typescript
import { LingoIntegration } from '@lingo-guardian/cli';

// 1. Detect config
const lingo = new LingoIntegration('/path/to/project');
await lingo.detectConfig();

// 2. Run Lingo CLI
await lingo.runTranslation({ locale: 'pseudo' });

// 3. Audit with locale URL
await auditor.audit('http://localhost:3000?lang=pseudo');
```

### The "Red Glow" Detection

```javascript
// If content is wider than container = OVERFLOW
element.scrollWidth > element.offsetWidth
```

---

## 🔧 The "Trinity" Architecture

1. **Lingo-Lint (CLI)** - This package! Headless audit tool.
2. **Visual PR Guard** - GitHub Action for PR screenshots (coming soon)
3. **Sidecar** - Electron app with 4-pane preview (coming soon)

---

## 📦 Scripts

```bash
# Install all dependencies
npm install

# Build CLI
npm run build --workspace=@lingo-guardian/cli

# Run lint
npx lingo-guardian lint http://localhost:3000
```

---

## 🏆 Hackathon

Built for the [Lingo.dev Hackathon](https://lingo.dev) - Feb 2026

**Goal:** Win 1st Place by deeply integrating with Lingo.dev! 🎮

---

## 📄 License

MIT © Lingo-Guardian Team