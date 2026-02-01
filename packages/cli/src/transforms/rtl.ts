/**
 * RTL (Right-to-Left) Transformation
 *
 * Applies RTL layout transformation for testing Arabic, Hebrew,
 * Farsi, and other RTL languages.
 *
 * Detects layout breaks from improper CSS that doesn't support
 * bidirectional text properly.
 */

import type { Page as PlaywrightPage } from 'playwright';

/**
 * RTL locale codes
 */
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur', 'yi', 'ps', 'sd', 'ug'];

export class RTLTransform {
    /**
     * Check if a locale is RTL
     */
    static isRTL(locale: string): boolean {
        return RTL_LOCALES.includes(locale.toLowerCase().split('-')[0]);
    }

    /**
     * Apply RTL transformation using Playwright
     * Cross-platform compatible (Mac, Windows, Linux)
     */
    static async applyPlaywright(page: PlaywrightPage, locale: string = 'ar'): Promise<void> {
        await page.evaluate((localeCode: string) => {
            // Set document direction
            document.documentElement.dir = 'rtl';
            document.documentElement.lang = localeCode;

            // Add RTL styles
            const rtlStyles = document.createElement('style');
            rtlStyles.id = 'lingo-guardian-rtl-styles';
            rtlStyles.textContent = `
        /* Base RTL direction */
        html[dir="rtl"] body {
          direction: rtl;
          text-align: right;
        }

        /* Fix common RTL issues */
        html[dir="rtl"] [style*="text-align: left"] {
          text-align: right !important;
        }

        /* Flip flexbox alignment */
        html[dir="rtl"] .flex-row,
        html[dir="rtl"] [style*="flex-direction: row"] {
          flex-direction: row-reverse;
        }

        /* Highlight potential RTL issues */
        html[dir="rtl"] [style*="margin-left"]:not([style*="margin-right"]),
        html[dir="rtl"] [style*="padding-left"]:not([style*="padding-right"]),
        html[dir="rtl"] [style*="left:"]:not([style*="right:"]) {
          outline: 2px dashed #FF6B6B !important;
          outline-offset: 2px;
        }

        /* Indicator */
        #lingo-guardian-rtl-indicator {
          position: fixed;
          top: 4px;
          left: 4px;
          background: #10B981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          z-index: 99999;
          opacity: 0.9;
          direction: ltr;
        }
      `;
            document.head.appendChild(rtlStyles);

            // Process inline styles that might cause RTL issues
            const elementsWithInlineStyles = document.querySelectorAll('[style]');
            elementsWithInlineStyles.forEach((el) => {
                const htmlEl = el as HTMLElement;
                const style = htmlEl.style;

                const marginLeft = style.marginLeft;
                const marginRight = style.marginRight;
                if (marginLeft && !marginRight) {
                    style.marginRight = marginLeft;
                    style.marginLeft = '';
                }

                const paddingLeft = style.paddingLeft;
                const paddingRight = style.paddingRight;
                if (paddingLeft && !paddingRight) {
                    style.paddingRight = paddingLeft;
                    style.paddingLeft = '';
                }

                if (style.textAlign === 'left') {
                    style.textAlign = 'right';
                } else if (style.textAlign === 'right') {
                    style.textAlign = 'left';
                }
            });

            // Add visual indicator
            const indicator = document.createElement('div');
            indicator.id = 'lingo-guardian-rtl-indicator';
            indicator.innerHTML = `⬅️ RTL (${localeCode.toUpperCase()})`;
            document.body.appendChild(indicator);
        }, locale);
    }

    /**
     * Get sample RTL text for testing
     */
    static getSampleText(locale: string = 'ar'): string {
        const samples: Record<string, string> = {
            ar: 'مرحبا بالعالم',
            he: 'שלום עולם',
            fa: 'سلام دنیا',
            ur: 'ہیلو ورلڈ',
        };
        return samples[locale] || samples.ar;
    }
}
