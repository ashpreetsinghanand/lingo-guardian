
import { getDictionary } from '@/lib/i18n';

export default async function Home(props: { searchParams: Promise<{ lang?: string }> }) {
  const searchParams = await props.searchParams;
  const lang = searchParams.lang || 'en';
  const dict = await getDictionary(lang);

  const t = (key: string) => dict[key] || key;

  return (
    <main className="cli-demo-page" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="cli-hero">
        <div className="cli-badge">
          <span className="cli-badge-icon">⚡</span>
          <span>CLI Tool</span>
        </div>
        <h1 className="cli-title">
          <span className="cli-title-icon">🛡️</span>
          Lingo-Guardian CLI
        </h1>
        <p className="cli-subtitle">
          Catch i18n layout issues before they reach production
        </p>
      </section>

      {/* Install Section */}
      <section className="cli-section">
        <h2 className="cli-section-title">📦 Installation</h2>
        <div className="cli-code-block">
          <code>npm install -g lingo-guardian</code>
          <button className="cli-copy-btn" title="Copy">📋</button>
        </div>
      </section>

      {/* Commands Section */}
      <section className="cli-section">
        <h2 className="cli-section-title">🚀 Commands</h2>

        <div className="cli-command-card">
          <div className="cli-command-header">
            <span className="cli-command-name">lingo lint</span>
            <span className="cli-command-badge">Most Used</span>
          </div>
          <p className="cli-command-desc">Scan your project for i18n overflow issues</p>
          <div className="cli-code-block">
            <code>npx lingo-guardian lint ./src</code>
          </div>
        </div>

        <div className="cli-command-card">
          <div className="cli-command-header">
            <span className="cli-command-name">lingo scan</span>
          </div>
          <p className="cli-command-desc">Deep scan with visual screenshots</p>
          <div className="cli-code-block">
            <code>npx lingo-guardian scan --url http://localhost:3000</code>
          </div>
        </div>

        <div className="cli-command-card">
          <div className="cli-command-header">
            <span className="cli-command-name">lingo report</span>
          </div>
          <p className="cli-command-desc">Generate HTML report of all issues</p>
          <div className="cli-code-block">
            <code>npx lingo-guardian report --format html</code>
          </div>
        </div>
      </section>

      {/* Demo Section - Show Overflow Example */}
      <section className="cli-section">
        <h2 className="cli-section-title">🔴 {t("Overflow Example")}</h2>
        <p className="cli-section-desc">
          {t("Switch language to see how text can overflow in different locales")}
        </p>

        {/* Language Switcher */}
        <div className="cli-lang-switcher">
          <a href="?lang=en" className={`cli-lang-btn ${lang === 'en' ? 'active' : ''}`}>🇺🇸 English</a>
          <a href="?lang=de" className={`cli-lang-btn ${lang === 'de' ? 'active' : ''}`}>🇩🇪 Deutsch</a>
          <a href="?lang=ja" className={`cli-lang-btn ${lang === 'ja' ? 'active' : ''}`}>🇯🇵 日本語</a>
          <a href="?lang=ar" className={`cli-lang-btn ${lang === 'ar' ? 'active' : ''}`}>🇸🇦 العربية</a>
        </div>

        {/* Overflow Examples Grid */}
        <div className="cli-overflow-examples">
          {/* Example 1: Fixed Width Button */}
          <div className="cli-example-card">
            <div className="cli-example-title">1. Fixed Width Button</div>
            <div className="cli-example-content">
              <button style={{ width: '100px', whiteSpace: 'nowrap', overflow: 'hidden' }} className="cli-overflow-btn">
                {t("Submit Order")}
              </button>
            </div>
            <div className="cli-example-issue">❌ 100px fixed width</div>
          </div>

          {/* Example 2: Navigation Menu */}
          <div className="cli-example-card">
            <div className="cli-example-title">2. Navigation Menu</div>
            <div className="cli-example-content">
              <nav className="cli-overflow-nav">
                <a href="#" style={{ width: '80px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("Dashboard")}</a>
                <a href="#" style={{ width: '80px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("Settings")}</a>
                <a href="#" style={{ width: '80px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("My Account")}</a>
              </nav>
            </div>
            <div className="cli-example-issue">❌ Fixed 80px nav items</div>
          </div>

          {/* Example 3: Badge/Tag */}
          <div className="cli-example-card">
            <div className="cli-example-title">3. Status Badge</div>
            <div className="cli-example-content">
              <span style={{ width: '90px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }} className="cli-overflow-badge">
                {t("In Progress")}
              </span>
            </div>
            <div className="cli-example-issue">❌ 90px badge width</div>
          </div>

          {/* Example 4: Table Header */}
          <div className="cli-example-card">
            <div className="cli-example-title">4. Table Header</div>
            <div className="cli-example-content">
              <div className="cli-overflow-table">
                <div style={{ width: '100px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("Order Number")}</div>
                <div style={{ width: '80px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("Customer")}</div>
                <div style={{ width: '70px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{t("Status")}</div>
              </div>
            </div>
            <div className="cli-example-issue">❌ Fixed column widths</div>
          </div>

          {/* Example 5: Card Title */}
          <div className="cli-example-card">
            <div className="cli-example-title">5. Card Title</div>
            <div className="cli-example-content">
              <div className="cli-overflow-card-title" style={{ width: '150px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {t("Weekly Performance Report")}
              </div>
            </div>
            <div className="cli-example-issue">❌ 150px title width</div>
          </div>

          {/* Example 6: Tooltip */}
          <div className="cli-example-card">
            <div className="cli-example-title">6. Tooltip</div>
            <div className="cli-example-content">
              <div className="cli-overflow-tooltip" style={{ width: '130px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {t("Click to view more details")}
              </div>
            </div>
            <div className="cli-example-issue">❌ 130px tooltip width</div>
          </div>
        </div>
      </section>

      {/* Terminal Output Preview */}
      <section className="cli-section">
        <h2 className="cli-section-title">📟 Sample Output</h2>
        <div className="cli-terminal">
          <div className="cli-terminal-header">
            <span className="cli-terminal-dot red"></span>
            <span className="cli-terminal-dot yellow"></span>
            <span className="cli-terminal-dot green"></span>
            <span className="cli-terminal-title">Terminal</span>
          </div>
          <pre className="cli-terminal-content">
            {`$ npx lingo-guardian lint ./src

🛡️ Lingo-Guardian v0.1.4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scanning 42 files...

⚠️  Found 3 potential overflow issues:

  1. src/components/Button.tsx:24
     ❌ Fixed width (120px) may overflow
     Text: "Bestellung absenden" (de)
     
  2. src/pages/checkout.tsx:89
     ❌ Hardcoded padding breaks RTL
     
  3. src/nav/Menu.tsx:15
     ⚠️ No text wrapping on long labels

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Scan complete. 3 issues found.`}
          </pre>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="cli-footer">
        <p>Ready to catch i18n issues?</p>
        <div className="cli-code-block cli-code-inline">
          <code>npm install -g lingo-guardian</code>
        </div>
      </section>
    </main>
  );
}
