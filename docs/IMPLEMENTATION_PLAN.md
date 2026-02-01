# Lingo-Guardian: Implementation Plan

> **The Automated DevSecOps Firewall for Internationalization**  
> Hackathon Deadline: Feb 7, 2026 | Time Budget: 14-20 Hours

## Overview

We're building a **comprehensive DevTool suite** that detects UI overflows, RTL layout breaks, and missing i18n keys before they reach production. The architecture consists of three core components built in priority order.

---

## Proposed Changes

### Component 1: CLI Package (`@lingo-guardian/cli`)

This is the core engine - a terminal tool (`npx lingo-guardian lint`) that runs headless CSS overflow audits.

#### [NEW] [package.json](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/package.json)
Root workspace configuration for the monorepo.

```json
{
  "name": "lingo-guardian",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

---

#### [NEW] [packages/cli/package.json](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/cli/package.json)
CLI package with Puppeteer for headless browser automation.

**Key dependencies:**
- `puppeteer` - Headless Chrome for DOM inspection
- `commander` - CLI argument parsing
- `chalk` - Terminal colors
- `ora` - Loading spinners

---

#### [NEW] [packages/cli/bin/lingo-guardian.js](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/cli/bin/lingo-guardian.js)
Main CLI entry point with `lint` command.

**Key Detection Logic:**
```javascript
// The "Red Glow" Detection - core overflow check
function detectOverflows(elements) {
  return elements.filter(el => {
    return el.scrollWidth > el.offsetWidth || 
           el.scrollHeight > el.offsetHeight;
  });
}
```

**Commands:**
- `lingo-guardian lint <url>` - Audit a page for i18n issues
- `lingo-guardian lint --locale pseudo` - Test with pseudo-locale expansion
- `lingo-guardian lint --locale ar` - Test RTL layout
- `lingo-guardian lint --config ./i18n.json` - Use custom config

---

#### [NEW] [packages/cli/src/auditor.js](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/cli/src/auditor.js)
Core audit logic with Puppeteer.

**Features:**
1. Launch headless Chrome via Puppeteer
2. Navigate to target URL
3. Inject CSS overflow detection script
4. Apply text transformations (pseudo-locale, RTL)
5. Detect elements with `scrollWidth > offsetWidth`
6. Capture screenshots of problematic elements
7. Generate JSON/HTML report

---

#### [NEW] [packages/cli/src/transforms/pseudo-locale.js](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/cli/src/transforms/pseudo-locale.js)
Pseudo-locale text expander for testing text growth.

**Logic:** Transforms English text to simulate expansion (German ~30% longer):
- `"Hello"` → `"[Ħëľľö]"` (with brackets to show boundaries)
- Adds ~35% character expansion to simulate worst-case translations

---

#### [NEW] [packages/cli/src/transforms/rtl.js](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/cli/src/transforms/rtl.js)
RTL layout transformation for Arabic/Hebrew testing.

**Logic:**
- Sets `dir="rtl"` on document
- Injects RTL CSS overrides
- Detects layout breaks from improper flexbox/grid usage

---

### Component 2: GitHub Action

Visual PR Guard that posts before/after screenshots in every Pull Request.

#### [NEW] [.github/workflows/lingo-guardian.yml](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/.github/workflows/lingo-guardian.yml)
GitHub Action workflow triggered on PRs.

**Workflow:**
1. Checkout code
2. Install dependencies & build
3. Start dev server
4. Run `lingo-guardian lint` in screenshot mode
5. Post results as PR comment with comparison table

---

#### [NEW] [.github/actions/lingo-guardian/action.yml](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/.github/actions/lingo-guardian/action.yml)
Custom GitHub Action definition.

**Inputs:**
- `target-url` - URL to audit
- `locales` - Locales to test (default: `en,pseudo,ar,ja`)
- `fail-on-overflow` - Whether to fail the build on issues

**Outputs:**
- `issues-count` - Number of overflow issues found
- `report-path` - Path to generated report
- `screenshots-dir` - Directory with comparison screenshots

---

### Component 3: Reporter Hook (`@lingo-guardian/reporter`)

React hook for real-time overflow detection during development.

#### [NEW] [packages/reporter/package.json](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/reporter/package.json)
React hook package for dev-time integration.

---

#### [NEW] [packages/reporter/src/index.ts](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/reporter/src/index.ts)
Main export with `useLingoGuardian` hook.

**Features:**
- MutationObserver for DOM changes
- ResizeObserver for layout shifts
- Automatic overflow detection
- WebSocket bridge to Electron sidecar
- Visual overlay highlighting

---

### Component 4: Demo App (For Testing)

#### [NEW] [apps/demo-app/](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/apps/demo-app/)
Next.js "victim" app with intentional overflow issues for testing.

**Includes:**
- Buttons with fixed widths (will overflow)
- RTL layout edge cases
- Truncated text containers
- Grid layouts that break in RTL

---

## Directory Structure

```
/lingo-guardian
├── package.json                    # Workspaces config
├── packages/
│   ├── cli/                        # @lingo-guardian/cli
│   │   ├── bin/lingo-guardian.js
│   │   ├── package.json
│   │   └── src/
│   │       ├── auditor.js
│   │       ├── reporter.js
│   │       └── transforms/
│   │           ├── pseudo-locale.js
│   │           └── rtl.js
│   └── reporter/                   # @lingo-guardian/reporter
│       ├── package.json
│       └── src/index.ts
├── apps/
│   ├── demo-app/                   # Next.js test app
│   └── electron-sidecar/           # Phase 4 (later)
└── .github/
    ├── workflows/
    │   └── lingo-guardian.yml
    └── actions/
        └── lingo-guardian/action.yml
```

---

## Verification Plan

### Automated Tests

**CLI Unit Tests:**
```bash
cd packages/cli && npm test
```
- Test overflow detection logic
- Test pseudo-locale transformation
- Test RTL transformation
- Test CLI argument parsing

**Integration Test:**
```bash
# Start demo app, then run CLI against it
cd apps/demo-app && npm run dev &
npx lingo-guardian lint http://localhost:3000 --locale pseudo
```

### Manual Verification

1. **CLI Overflow Detection:**
   - Run `npx lingo-guardian lint http://localhost:3000`
   - Verify it detects the intentional overflow issues in demo app
   - Check JSON output contains element selectors and dimensions

2. **Pseudo-Locale Expansion:**
   - Run with `--locale pseudo` flag
   - Verify text is expanded ~35% with accent characters
   - Confirm new overflows are detected from expansion

3. **RTL Testing:**
   - Run with `--locale ar` flag  
   - Verify document direction changes
   - Check for layout breaks in flexbox/grid components

4. **GitHub Action (after PR):**
   - Create test PR with intentional overflow
   - Verify action runs and posts comment with screenshots

---

## Implementation Priority

| Priority | Component | Estimated Time | Status |
|----------|-----------|----------------|--------|
| 1 | CLI Core (`lint` command) | 4-5 hours | 🔜 Next |
| 2 | GitHub Action | 2-3 hours | Pending |
| 3 | Reporter Hook | 2-3 hours | Pending |
| 4 | Electron Sidecar | 4-5 hours | Pending |
| 5 | Demo Video & Docs | 2 hours | Pending |

---

## Questions for Review

> [!IMPORTANT]
> Before proceeding, please confirm:
> 1. Should we start with the CLI tool first, then move to GitHub Action?
> 2. For the demo app - should I use Next.js or plain Vite React?
> 3. Do you have a Lingo.dev API key for testing the integration?
