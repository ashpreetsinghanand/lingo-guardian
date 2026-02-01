# 🛡️ Lingo-Guardian CLI

> **Detect i18n layout issues before they reach production**

Powered by [Lingo.dev](https://lingo.dev)

## Installation

```bash
npm install -g lingo-guardian
```

## Quick Start

```bash
# Initialize Lingo.dev in your project
npx lingo.dev@latest init

# Run the audit
lingo-guardian lint http://localhost:3000
```

## Features

- 🔍 CSS overflow detection (`scrollWidth > offsetWidth`)
- 🌍 Pseudo-locale text expansion testing
- ↔️ RTL layout validation
- 📊 Table, JSON, and HTML reports
- 🖥️ Cross-platform (Mac, Windows, Linux)

## Usage

```bash
lingo-guardian lint <url> [options]

Options:
  -l, --locale <locales...>   Locales to test (default: ["en", "pseudo"])
  -f, --format <format>       Output format: table, json, html
  --fail-on-error             Exit with error code if issues found
  -v, --verbose               Enable verbose logging
```

## License

MIT
