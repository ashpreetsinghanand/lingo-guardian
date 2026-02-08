# 🎮 Lingo-Guardian Demo Guide

Use this guide to **test** the tool yourself or **showcase** it in a demo.

## 🏃 Quick Demo Script

We will create a "Victim App" with a fixed-width button that breaks when translated to German (or Pseudo-locale).

### Phase 1: Setup the "Victim" App

1.  **Create a new React app**
    ```bash
    npm create vite@latest demo-victim -- --template react-ts
    cd demo-victim
    npm install
    ```

2.  **Add text overflow bug**
    Edit `src/App.tsx` and replace the button with this "fragile" one:
    ```tsx
    // The fixed width (w-32) will break with longer text!
    <button style={{ 
      width: '120px', 
      whiteSpace: 'nowrap', 
      overflow: 'hidden',
      padding: '10px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #ccc'
    }}>
      Submit Order
    </button>
    ```

3.  **Start the app**
    ```bash
    npm run dev
    # Running at http://localhost:5173
    ```

### Phase 2: Initialize Lingo.dev

1.  **Init Lingo.dev** (in `demo-victim` root)
    ```bash
    npx lingo.dev@latest init
    ```
    - *Select default options.*
    - *Ensure `pseudo` and `de` (German) are in target locales.*

2.  **Set your API Key**
    ```bash
    export LINGODOTDEV_API_KEY="your-api-key"
    ```

### Phase 3: The "Magic" Moment ✨

Run **Lingo-Guardian** against your local app:

```bash
# Run the audit (make sure you're in the demo-victim folder)
npx lingo-guardian@latest lint http://localhost:5173
```

### Phase 4: See the Results 📊

1.  **CLI Output**: You'll see a red **ERROR** in the table for `de` or `pseudo` locale.
2.  **What happened?**
    - Lingo-Guardian saw `i18n.json`.
    - It ran `npx lingo.dev run` to generate `locales/pseudo.json`.
    - It loaded your app with `?lang=pseudo`.
    - It detected that "Submit Order" became `[Sübmït Ördër ẍỳẑ]` (or similar) and overflowed the `120px` width.

---

## 🎥 Hackathon Demo Flow (Video Script)

**[0:00] Intro**
"Hi, I'm building Lingo-Guardian. We all know the pain of shipping a UI that looks great in English but breaks completely in German or Arabic."

**[0:30] The Problem**
"Here's a simple React app. It looks fine."
*(Show the app running in English)*

**[0:45] The Audit**
"Instead of manually checking every language, I run Lingo-Guardian."
*(Run terminal command: `npx lingo-guardian lint ...`)*

**[1:00] The Engine (Lingo.dev Integration)**
"Under the hood, this detects our `i18n.json`, talks to the Lingo.dev CLI to generate fresh translations on the fly, and uses the SDK to render them."

**[1:30] The Result**
"Boom. It caught an overflow in German and a layout break in Pseudo-locale. It saved us from a production bug in 30 seconds."
*(Show the CLI table output)*

---

## 🧪 Advanced Testing

### 1. Test RTL (Right-to-Left)
Add a text alignment bug in `src/App.tsx`:
```tsx
// This 'left' alignment will look wrong in Arabic
<div style={{ textAlign: 'left' }}>
  Welcome to our app
</div>
```
Run with Arabic:
```bash
npx lingo-guardian lint http://localhost:5173 --locale ar
```

### 2. CI/CD Simulation
Run with error flag to verify it fails a build:
```bash
npx lingo-guardian lint http://localhost:5173 --fail-on-error
# Exit code will be 1 (failure)
```
path->

/Users/ashpreetsinghanand/Desktop/lingo-guardin/demo/demo2-app