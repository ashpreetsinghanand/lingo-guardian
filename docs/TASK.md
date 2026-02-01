# Lingo-Guardian - Hackathon Build Plan

## Phase 1: CLI Tool (`@lingo-guardian/cli`)
- [x] Set up monorepo structure with workspaces
- [x] Create CLI package with `bin/lingo-guardian.js` entry point
- [x] Implement `lint` command with Puppeteer for headless CSS overflow detection
- [x] Implement locale simulation (pseudo-locale text expansion, RTL detection)
- [x] Add "Red Glow" detection logic (`scrollWidth > offsetWidth`)
- [x] Create reporter module for CLI output formatting
- [x] Build and test CLI
- [x] **Integrate Lingo.dev CLI (`npx lingo.dev run`) as core engine**
- [x] Detect and use `i18n.json` / `lingo.config.js` configuration
- [x] Switch from Puppeteer to Playwright for cross-platform support (Mac/Win/Linux)

## Feature 2: Visual PR Guardian
- [x] Add Markdown reporter to CLI
- [x] Add `visual` screenshot stitching command
- [x] Create Composite GitHub Action (`packages/action`)
- [x] Create "Zero-Config" Guide (`docs/VISUAL_PR_GUARDIAN.md`)
- [x] Implement workflow file (`.github/workflows/visual-pr.yml`)
- [ ] Test with sample PR

## Phase 3: Reporter Hook (`@lingo-guardian/reporter`)
- [ ] Create React hook `useLingoGuardian`
- [ ] Implement DOM observation for overflow detection
- [ ] Set up WebSocket communication bridge
- [ ] Create visual overlay indicators

## Phase 4: Electron Sidecar (Demo Wow Factor)
- [ ] Set up Electron app with 4-pane layout
- [ ] WebSocket server for real-time sync
- [ ] Integrate Lingo.dev SDK for instant locale switching
- [ ] Add visual "Red Glow" highlights

## Phase 5: Documentation & Demo
- [x] Write comprehensive README.md
- [x] Publish package to npm
- [/] Create demo video script (See demo-guide.md)
- [ ] Build demo React app
