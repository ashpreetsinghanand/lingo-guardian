# 🛡️ Lingo-Guardian

> **The Automated DevSecOps Firewall for Internationalization**

Detect UI overflows, RTL layout breaks, and missing i18n keys before they reach production.
Powered by [Lingo.dev](https://lingo.dev).

---

## 🤖 For AI Agents & LLMs

If you are an agent trying to use this tool, here is the context you need:

1.  **Purpose**: Audits a URL for visual regressions caused by text expansion (German) or layout shifts (Arabic/RTL).
2.  **Core Mechanic**: It uses Lingo.dev to ANY-to-ANY translate your app's source content, then uses a headless browser to detect `scrollWidth > offsetWidth` (Red Glow).
3.  **Auto-Detection**: If `i18n.json` exists, it automatically detects and tests ALL configured locales.

---

## 📦 Installation

```bash
# Install globally (Optional)
npm install -g lingo-guardian

# OR Run directly (Recommended)
npx lingo-guardian lint <url>
```

---

## 🚀 Quick Start

### 1. Prerequisite: Lingo.dev Config (Recommended)
If you have an `i18n.json` file, the tool becomes "Zero-Config".

**Initialize Lingo.dev (if not done):**
```bash
npx lingo.dev@latest init
```
*This creates `i18n.json` determining your source and target languages.*

### 2. Run the Audit
```bash
# 1. Start your app server
npm run dev

# 2. Run the audit (Auto-detects locales from i18n.json)
npx lingo-guardian lint http://localhost:3000
```

---

## 🧠 Behavior & Edge Cases

### 1. "Zero-Config" Auto-Detection (Standard)
If `i18n.json` is present in your project root:
- The tool **READS** `config.locale.targets` (e.g., `['de', 'ar', 'ja']`).
- It **GENERATES** missing translations using `npx lingo.dev run`.
- It **AUDITS** `en`, `de`, `ar`, and `ja` automatically.

### 2. Standard Fallback (No Config)
If `i18n.json` is **MISSING**:
- The tool logs a warning: `⚠ No Lingo.dev config (i18n.json) found`.
- It falls back to **Algorithmic Mode**: Tests `en` and `pseudo` (algorithmic text expansion).
- It will **SKIP** the `lingo.dev run` generation step.

### 3. Manual Overrides
You can force specific locales regardless of config:
```bash
# Ignore config and only test German and Arabic
npx lingo-guardian lint http://localhost:3000 --locale de ar
```

---


## 🖥️ Live Dashboard (The "Wow" View)

Simulate user testing across multiple locales simultaneously with the **Lingo-Guardian Dashboard**.

```bash
npx lingo-guardian dashboard http://localhost:3000
```
*(Default port: 3005)*

This launches a local server displaying your app in **4 parallel iframes**:
1.  🇺🇸 **English** (Source)
2.  🇩🇪 **Pseudo** (Expansion Testing)
3.  🇦🇪 **Arabic** (RTL Layout Testing)
4.  🇯🇵 **Japanese** (Vertical/Font Testing)

**Real-Time Sync**: If you use the `@lingo-guardian/reporter` hook in your app, any overflow detected in these panes will trigger a visual "Red Alert" on the dashboard.

## 🪝 Developer Experience: The Reporter Hook

Install the companion hook to see issues **as you code**:

```bash
npm install @lingo-guardian/reporter
```

Add it to your app (see [Reporter Docs](https://www.npmjs.com/package/@lingo-guardian/reporter)):

```tsx
useLingoGuardian({ enable: process.env.NODE_ENV === 'development' });
```

features:
- **Red Glow**: Overflows get outlined in red instantly.
- **VS Code Links**: Clickable links in console to jump to source.
- **Zero Config**: Works out of the box.

---

## 🤖 Visual PR Guardian (GitHub Action)

Turn every Pull Request into an automated visual audit. This action runs the audit and posts a **Visual Report** directly to the PR comments.

### Usage

Create `.github/workflows/lingo-guardian.yml`:

```yaml
name: 🛡️ Lingo-Guardian

on: [pull_request]

jobs:
  visual-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 1. Start your app
      - name: Install & Start App
        run: |
          npm ci
          npm run build
          npm run start &
          npx wait-on http://localhost:3000

      # 2. Run Lingo-Guardian Action
      - name: 📸 Run Visual Audit
        uses: ashpreetsinghanand/lingo-guardian/packages/action@main
        with:
          url: 'http://localhost:3000'
          lingo-api-key: ${{ secrets.LINGODOTDEV_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Optional:
          # fail-on-error: 'true' 
          # locales: 'en,pseudo,ar,de' (Auto-detects if omitted)
```

**Inputs:**
- `url` (Required): The local URL where your app is running (e.g., `http://localhost:3000`).
- `lingo-api-key` (Required): Your Lingo.dev API key for generating translations.
- `github-token` (Required): `secrets.GITHUB_TOKEN` to post comments on the PR.
- `fail-on-error` (Optional): Set to `'true'` to fail the build if issues are found.

---

## 🔧 CLI Reference

```bash
lingo-guardian lint <url> [options]

Options:
  -p, --project <path>       Path to project root containing i18n.json (default: cwd)
  --no-use-lingo             Disable Lingo.dev auto-generation (use existing files only)
  -l, --locale <locales...>  Explicit locales to test (Overwrites auto-detection)
  -f, --format <format>      Output: table, json, html, markdown (default: table)
  -s, --screenshot           Save screenshots of errors to ./screenshots
  --fail-on-error            Exit with code 1 if issues found (CI/CD mode)
```

---

## 🛠️ Troubleshooting

### "No buckets found"
**Cause:** Your `i18n.json` has `buckets: {}` or invalid types.
**Fix:** Ensure your bucket key is a valid parser (e.g., `json`, `react`).
```json
// CORRECT
"buckets": {
  "json": { "include": ["locales/[locale].json"] }
}
```

### "Chrome failed to launch"
**Cause:** CI/CD environment missing browser binaries.
**Fix:** Run `npx playwright install chromium` before the audit.

### "Authentication Failed"
**Cause:** Missing API Key.
**Fix:**
```bash
export LINGODOTDEV_API_KEY=your_key_here
```

---

## 📄 License

MIT © Lingo-Guardian Team
