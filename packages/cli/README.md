# 🛡️ Lingo-Guardian CLI

> **Detect i18n layout issues before they reach production**

Powered by [Lingo.dev](https://lingo.dev)

---

## 📦 Installation

```bash
npm install -g lingo-guardian
```

---

## 🔑 API Key Setup

Lingo-Guardian uses **Lingo.dev** for AI-powered translations.

### Step 1: Get Your API Key
1. Go to [lingo.dev](https://lingo.dev)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Create a new API key

### Step 2: Set Your API Key

```bash
# Option A: Environment variable (recommended)
export LINGODOTDEV_API_KEY="your-api-key-here"

# Option B: .env file in your project
echo "LINGODOTDEV_API_KEY=your-api-key" > .env
```

### Step 3: Initialize Lingo.dev

```bash
cd your-project
npx lingo.dev@latest init
```

---

## 🚀 Quick Start

```bash
# Initialize Lingo.dev in your project
npx lingo.dev@latest init

# Start your dev server
npm run dev

# Run the audit
lingo-guardian lint http://localhost:3000
```

---

## ✨ Features

- 🔍 CSS overflow detection (`scrollWidth > offsetWidth`)
- 🌍 Pseudo-locale text expansion testing
- ↔️ RTL layout validation
- 📊 Table, JSON, and HTML reports
- 🖥️ Cross-platform (Mac, Windows, Linux)

---

## 📖 Usage

```bash
lingo-guardian lint <url> [options]

Options:
  -p, --project <path>        Project with i18n.json (default: cwd)
  -l, --locale <locales...>   Locales to test (default: ["en", "pseudo"])
  -f, --format <format>       Output format: table, json, html
  --fail-on-error             Exit with error code if issues found
  -v, --verbose               Enable verbose logging
```

### Examples

```bash
# Basic audit
lingo-guardian lint http://localhost:3000

# Test multiple locales
lingo-guardian lint http://localhost:3000 --locale en pseudo ar de

# CI mode with exit code
lingo-guardian lint http://localhost:3000 --fail-on-error

# HTML report
lingo-guardian lint http://localhost:3000 --format html -o ./reports
```

---

## 📄 License

MIT
