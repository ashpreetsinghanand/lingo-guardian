Lingo-Guardian: Implementation Plan
The Automated DevSecOps Firewall for Internationalization
Hackathon Deadline: Feb 7, 2026 | Time Budget: 14-20 Hours

Overview
We're building a comprehensive DevTool suite that detects UI overflows, RTL layout breaks, and missing i18n keys before they reach production. The architecture consists of three core components built in priority order.

Proposed Changes
### Component 1: CLI Package (`@lingo-guardian/cli`) [DONE]

- [x] Core Auditor (Playwright)
- [x] Overflow Detection
- [x] Lingo.dev Integration
- [x] Transformers (Pseudo/RTL)
- [x] Reporters (Table, JSON, HTML)
- [ ] **[NEW] Markdown Reporter** (Required for PR comments)

---

### Component 2: Visual PR Guardian (GitHub Action) [IN PROGRESS]

**Goal:** Automate visual verification by generating a 4-locale comparison grid (en, pseudo, ar, ja) stitched into a single image.

#### 1. [NEW] CLI Command: `visual <url>`
New command in `@lingo-guardian/cli` that handles the heavy lifting.
- **Dependencies:** `sharp` (for image processing).
- **Logic:**
  1. Launch Playwright.
  2. Visit URL with `?lang=en`, `?lang=pseudo`, `?lang=ar`, `?lang=ja`.
  3. Capture screenshots for each.
  4. Use `sharp` to composite them into a 2x2 grid.
  5. Save as `visual-report.png`.

#### 2. [NEW] GitHub Workflow: `.github/workflows/visual-pr.yml`
- Triggers on Pull Request.
- Installs CLI.
- Runs `lingo-guardian visual http://localhost:3000`.
- Uploads `visual-report.png` as artifact.
- Comments on PR with download link.

#### 3. [NEW] `apps/demo-app`
- We need this "Victim App" to actually run the workflow against for the demo.
- Setup Next.js app with `lingo.dev` pre-configured.

---Component 3: Reporter Hook (@lingo-guardian/reporter)
React hook for real-time overflow detection during development.

[NEW] [packages/reporter/package.json](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/reporter/package.json)
React hook package for dev-time integration.

[NEW] [packages/reporter/src/index.ts](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/packages/reporter/src/index.ts)
Main export with useLingoGuardian hook.

Features:

MutationObserver for DOM changes
ResizeObserver for layout shifts
Automatic overflow detection
WebSocket bridge to Electron sidecar
Visual overlay highlighting
Component 4: Demo App (For Testing)
[NEW] [apps/demo-app/](file:///Users/ashpreetsinghanand/Desktop/lingo-guardin/apps/demo-app/)
Next.js "victim" app with intentional overflow issues for testing.

Includes:

Buttons with fixed widths (will overflow)
RTL layout edge cases
Truncated text containers
Grid layouts that break in RTL
Directory Structure
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
Verification Plan
Automated Tests
CLI Unit Tests:

cd packages/cli && npm test
Test overflow detection logic
Test pseudo-locale transformation
Test RTL transformation
Test CLI argument parsing
Integration Test:

# Start demo app, then run CLI against it
cd apps/demo-app && npm run dev &
npx lingo-guardian lint http://localhost:3000 --locale pseudo
Manual Verification
CLI Overflow Detection:

Run npx lingo-guardian lint http://localhost:3000
Verify it detects the intentional overflow issues in demo app
Check JSON output contains element selectors and dimensions
Pseudo-Locale Expansion:

Run with --locale pseudo flag
Verify text is expanded ~35% with accent characters
Confirm new overflows are detected from expansion
RTL Testing:

Run with --locale ar flag
Verify document direction changes
Check for layout breaks in flexbox/grid components
GitHub Action (after PR):

Create test PR with intentional overflow
Verify action runs and posts comment with screenshots
Implementation Priority
Priority	Component	Estimated Time	Status
1	CLI Core (lint command)	4-5 hours	🔜 Next
2	GitHub Action	2-3 hours	Pending
3	Reporter Hook	2-3 hours	Pending
4	Electron Sidecar	4-5 hours	Pending
5	Demo Video & Docs	2 hours	Pending
Questions for Review
[!IMPORTANT] Before proceeding, please confirm:

Should we start with the CLI tool first, then move to GitHub Action?
For the demo app - should I use Next.js or plain Vite React?
Do you have a Lingo.dev API key for testing the integration?