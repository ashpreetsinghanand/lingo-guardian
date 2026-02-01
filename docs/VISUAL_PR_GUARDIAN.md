# 👁️ Visual PR Guardian Setup

Turn every PR into an automated i18n audit with screenshots.

## ⚡ The "Plug & Play" Workflow

Create this file in your repo at `.github/workflows/lingo-guardian.yml`:

```yaml
name: 🛡️ Visual PR Guardian

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write # Required for posting comments

jobs:
  audit:
    name: 🌍 i18n Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # ⚡ Step 1: Start your app in the background
      - name: Build and Start App
        run: |
          npm run build
          npm run start & 
          npx wait-on http://localhost:3000
        env:
          LINGODOTDEV_API_KEY: ${{ secrets.LINGODOTDEV_API_KEY }}

      # 🌍 Step 2: Initialize Lingo.dev
      - name: Initialize Lingo.dev
        run: npx lingo.dev@latest init --yes
        env:
          LINGODOTDEV_API_KEY: ${{ secrets.LINGODOTDEV_API_KEY }}

      # 🔍 Step 3: Run the Audit
      # - Validates en, pseudo, ar, de, ja
      # - Takes screenshots of issues (--screenshot)
      # - Outputs markdown report (--format markdown)
      - name: Run Lingo-Guardian
        run: |
          npx lingo-guardian@latest lint http://localhost:3000 \
            --locale en pseudo ar de ja \
            --screenshot \
            --format markdown \
            --output ./lingo-report \
            --fail-on-error=false
        continue-on-error: true # Ensure we post stats even if issues found

      # 📸 Step 4: Upload Screenshots as Evidence
      - name: Upload Visual Evidence
        uses: actions/upload-artifact@v4
        with:
          name: lingo-guardian-screenshots
          path: lingo-report/
          retention-days: 7

      # 💬 Step 5: Post Comment to PR
      - name: Post PR Comment
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: lingo-guardian-report
          path: lingo-report/*.md
```

## 🔑 Setup Secrets

1. Go to your repo **Settings** > **Secrets and variables** > **Actions**.
2. Add `LINGODOTDEV_API_KEY` (Get it from [lingo.dev](https://lingo.dev)).

## 🖼️ How It Works

1.  **Dev opens a PR.**
2.  Action spins up the app and runs Lingo-Guardian.
3.  **Lingo-Guardian** generates a Markdown table of issues and takes screenshots.
4.  **Action posts a comment** on the PR with the results.
5.  **Screenshots** are available in the "Artifacts" tab of the Action run.

## 📸 Example Output

| Severity | Element | Overflow | Text |
| --- | --- | --- | --- |
| 🔴 **ERROR** | `.btn-primary` | ↔ +45px | "Sübmït Ördër..." |
| 🟡 **WARN** | `.nav-link` | ↔ +12px | "Cöntäçt Üs..." |

*Images available in [Workflow Artifacts]*
