# 👁️ Visual PR Guardian Setup

Turn every PR into an automated i18n audit with screenshots.

## ⚡ The "Zero-Config" Workflow

Create this file in your repo at `.github/workflows/lingo-audit.yml`:

```yaml
name: 🛡️ Visual PR Guardian

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write # Required for posting comments

jobs:
  visual-audit:
    name: 🎨 Visual Layout Verification
    runs-on: ubuntu-latest
    steps:
      - name: ⬇️ Checkout Code
        uses: actions/checkout@v4

      - name: 🟢 Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'

      # 1. Start Your App
      - name: 🏗️ Build & Start App
        run: |
          npm ci
          npm run build
          npm run start & 
          npx wait-on http://localhost:3000

      # 2. Run Lingo Guardian
      - name: 📸 Run Visual Audit
        uses: ashpreetsinghanand/lingo-guardian/packages/action@main
        with:
          url: 'http://localhost:3000'
          lingo-api-key: ${{ secrets.LINGODOTDEV_API_KEY }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          # Optional: project-dir: './' 
```

## 🔑 Setup Secrets

1. Go to your repo **Settings** > **Secrets and variables** > **Actions**.
2. Add `LINGODOTDEV_API_KEY` (Get it from [lingo.dev](https://lingo.dev)).

## 🖼️ How It Works

1.  **Dev opens a PR.**
2.  Action spins up the app and runs Lingo-Guardian.
3.  **Lingo-Guardian action**:
    *   Installs the CLI automatically.
    *   Generates 4-locale screenshot grid.
    *   Posts a comment on the PR.
4.  **Screenshots** are available in the "Artifacts" tab.

## 📸 Example Output

**[Visual Report Download Link]**

*Images available in Workflow Artifacts*
