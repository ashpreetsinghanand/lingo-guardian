'use client';

import { useEffect, useState } from 'react';
import { useLingoGuardian } from 'lingo-guardian-reporter';

// Simple i18n hook
function useTranslations(locale: string) {
    const [translations, setTranslations] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const response = await fetch(`/locales/${locale}.json`);
                if (response.ok) {
                    const data = await response.json();
                    setTranslations(data);
                }
            } catch (e) {
                console.warn(`Failed to load locale: ${locale}`, e);
            }
        };
        loadTranslations();
    }, [locale]);

    const t = (key: string) => translations[key] || key;
    return { t };
}

// Available languages for demo
const DEMO_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export default function LandingPage() {
    const [locale, setLocale] = useState('en');
    const [fixesEnabled, setFixesEnabled] = useState(false);

    // Enable the Lingo-Guardian reporter hook for live overflow detection
    useLingoGuardian({ enable: true });

    // Parse lang from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang');
        if (lang) setLocale(lang);
    }, []);

    // Apply/remove fixes class on body
    useEffect(() => {
        if (fixesEnabled) {
            document.body.classList.add('overflow-fixes-enabled');
        } else {
            document.body.classList.remove('overflow-fixes-enabled');
        }
    }, [fixesEnabled]);

    const { t } = useTranslations(locale);

    const handleLanguageChange = (code: string) => {
        setLocale(code);
        const url = new URL(window.location.href);
        url.searchParams.set('lang', code);
        window.history.pushState({}, '', url);
    };

    return (
        <div>
            {/* Floating Control Panel */}
            <div className="demo-control-panel">
                <div className="demo-panel-header">
                    <span className="demo-panel-icon">🛡️</span>
                    <span className="demo-panel-title">Lingo-Guardian Demo</span>
                </div>

                <div className="demo-panel-section">
                    <label className="demo-panel-label">Language:</label>
                    <div className="demo-language-grid">
                        {DEMO_LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                className={`demo-lang-btn ${locale === lang.code ? 'active' : ''}`}
                                onClick={() => handleLanguageChange(lang.code)}
                                title={lang.name}
                            >
                                {lang.flag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="demo-panel-hint">
                    🔴 Switch language to see overflow issues
                </div>
            </div>

            {/* Navigation */}
            <nav className="nav">
                <div className="nav-container">
                    <a href="/" className="nav-logo">
                        ☁️ CloudFlow
                    </a>
                    <ul className="nav-links">
                        <li><a href="#features">{t('nav.features')}</a></li>
                        <li><a href="#pricing">{t('nav.pricing')}</a></li>
                        <li><a href="#testimonials">{t('nav.docs')}</a></li>
                    </ul>
                    <div className="nav-actions">
                        <button className="btn btn-ghost">{t('nav.signIn')}</button>
                        <button className="btn btn-primary">{t('nav.getStarted')}</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <span className="hero-badge">{t('hero.badge')}</span>
                    <h1 className="hero-title" data-source="app/page.tsx:62">{t('hero.title')}</h1>
                    <p className="hero-subtitle" data-source="app/page.tsx:63">{t('hero.subtitle')}</p>
                    <div className="hero-cta">
                        <button className="btn btn-primary btn-lg">{t('hero.cta.primary')}</button>
                        <button className="btn btn-secondary btn-lg">{t('hero.cta.secondary')}</button>
                    </div>
                    <div className="hero-stats">
                        <span className="hero-stat">{t('hero.stats.users')}</span>
                        <span className="hero-stat">{t('hero.stats.uptime')}</span>
                        <span className="hero-stat">{t('hero.stats.support')}</span>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <h2 className="section-title" data-source="app/page.tsx:79">{t('features.title')}</h2>
                    <p className="section-subtitle" data-source="app/page.tsx:80">{t('features.subtitle')}</p>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3 className="feature-title">{t('features.realtime.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:87">{t('features.realtime.description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3 className="feature-title">{t('features.ai.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:93">{t('features.ai.description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔗</div>
                        <h3 className="feature-title">{t('features.integration.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:99">{t('features.integration.description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3 className="feature-title">{t('features.security.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:105">{t('features.security.description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3 className="feature-title">{t('features.collaboration.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:111">{t('features.collaboration.description')}</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3 className="feature-title">{t('features.customization.title')}</h3>
                        <p className="feature-description" data-source="app/page.tsx:117">{t('features.customization.description')}</p>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="pricing">
                <div className="section-header">
                    <h2 className="section-title">{t('pricing.title')}</h2>
                    <p className="section-subtitle">{t('pricing.subtitle')}</p>
                </div>
                <div className="pricing-grid">
                    {/* Starter Plan */}
                    <div className="pricing-card">
                        <h3 className="pricing-name">{t('pricing.starter.name')}</h3>
                        <div className="pricing-price" data-source="app/page.tsx:133">{t('pricing.starter.price')}</div>
                        <p className="pricing-description">{t('pricing.starter.description')}</p>
                        <ul className="pricing-features">
                            <li>{t('pricing.starter.feature1')}</li>
                            <li>{t('pricing.starter.feature2')}</li>
                            <li>{t('pricing.starter.feature3')}</li>
                            <li>{t('pricing.starter.feature4')}</li>
                        </ul>
                        <button className="btn btn-secondary" style={{ width: '100%' }}>{t('pricing.starter.cta')}</button>
                    </div>

                    {/* Pro Plan */}
                    <div className="pricing-card featured">
                        <span className="pricing-badge">{t('pricing.pro.badge')}</span>
                        <h3 className="pricing-name">{t('pricing.pro.name')}</h3>
                        <div className="pricing-price" data-source="app/page.tsx:150">{t('pricing.pro.price')}</div>
                        <p className="pricing-description">{t('pricing.pro.description')}</p>
                        <ul className="pricing-features">
                            <li>{t('pricing.pro.feature1')}</li>
                            <li>{t('pricing.pro.feature2')}</li>
                            <li>{t('pricing.pro.feature3')}</li>
                            <li>{t('pricing.pro.feature4')}</li>
                            <li>{t('pricing.pro.feature5')}</li>
                        </ul>
                        <button className="btn btn-primary" style={{ width: '100%' }}>{t('pricing.pro.cta')}</button>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="pricing-card">
                        <h3 className="pricing-name">{t('pricing.enterprise.name')}</h3>
                        <div className="pricing-price" data-source="app/page.tsx:168">{t('pricing.enterprise.price')}</div>
                        <p className="pricing-description">{t('pricing.enterprise.description')}</p>
                        <ul className="pricing-features">
                            <li>{t('pricing.enterprise.feature1')}</li>
                            <li>{t('pricing.enterprise.feature2')}</li>
                            <li>{t('pricing.enterprise.feature3')}</li>
                            <li>{t('pricing.enterprise.feature4')}</li>
                            <li>{t('pricing.enterprise.feature5')}</li>
                        </ul>
                        <button className="btn btn-secondary" style={{ width: '100%' }}>{t('pricing.enterprise.cta')}</button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials">
                <div className="section-header">
                    <h2 className="section-title">{t('testimonials.title')}</h2>
                    <p className="section-subtitle">{t('testimonials.subtitle')}</p>
                </div>
                <div className="testimonials-grid">
                    <div className="testimonial-card">
                        <p className="testimonial-quote" data-source="app/page.tsx:192">"{t('testimonials.1.quote')}"</p>
                        <div className="testimonial-author">
                            <div className="testimonial-avatar">SC</div>
                            <div>
                                <div className="testimonial-name">{t('testimonials.1.name')}</div>
                                <div className="testimonial-role">{t('testimonials.1.role')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p className="testimonial-quote" data-source="app/page.tsx:204">"{t('testimonials.2.quote')}"</p>
                        <div className="testimonial-author">
                            <div className="testimonial-avatar">MR</div>
                            <div>
                                <div className="testimonial-name">{t('testimonials.2.name')}</div>
                                <div className="testimonial-role">{t('testimonials.2.role')}</div>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial-card">
                        <p className="testimonial-quote" data-source="app/page.tsx:216">"{t('testimonials.3.quote')}"</p>
                        <div className="testimonial-author">
                            <div className="testimonial-avatar">EW</div>
                            <div>
                                <div className="testimonial-name">{t('testimonials.3.name')}</div>
                                <div className="testimonial-role">{t('testimonials.3.role')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <h2 className="cta-title" data-source="app/page.tsx:230">{t('cta.title')}</h2>
                <p className="cta-subtitle" data-source="app/page.tsx:231">{t('cta.subtitle')}</p>
                <button className="btn btn-primary btn-lg">{t('cta.button')}</button>
                <p className="cta-note">{t('cta.note')}</p>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-grid">
                    <div className="footer-column">
                        <h4>{t('footer.product')}</h4>
                        <ul>
                            <li><a href="#">{t('footer.features')}</a></li>
                            <li><a href="#">{t('footer.pricing')}</a></li>
                            <li><a href="#">{t('footer.integrations')}</a></li>
                            <li><a href="#">{t('footer.changelog')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>{t('footer.company')}</h4>
                        <ul>
                            <li><a href="#">{t('footer.about')}</a></li>
                            <li><a href="#">{t('footer.careers')}</a></li>
                            <li><a href="#">{t('footer.blog')}</a></li>
                            <li><a href="#">{t('footer.press')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>{t('footer.resources')}</h4>
                        <ul>
                            <li><a href="#">{t('footer.documentation')}</a></li>
                            <li><a href="#">{t('footer.guides')}</a></li>
                            <li><a href="#">{t('footer.apiReference')}</a></li>
                            <li><a href="#">{t('footer.status')}</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>{t('footer.legal')}</h4>
                        <ul>
                            <li><a href="#">{t('footer.privacy')}</a></li>
                            <li><a href="#">{t('footer.terms')}</a></li>
                            <li><a href="#">{t('footer.security')}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    {t('footer.copyright')}
                </div>
            </footer>
        </div>
    );
}
