/**
 * Pseudo-Locale Transformation
 *
 * Expands text content to simulate translations that are longer than English.
 * German text is ~30% longer, some languages can be 40%+ longer.
 *
 * NOTE: This is a fallback when Lingo.dev integration is not used.
 * The preferred approach is using Lingo.dev's built-in pseudo-locale.
 */

import type { Page as PlaywrightPage } from 'playwright';
import { DEFAULTS } from '../constants.js';

/**
 * Character mappings for pseudo-localization
 * Maps ASCII to accented equivalents for visual distinction
 */
const CHAR_MAP: Record<string, string> = {
    a: 'à',
    b: 'ƀ',
    c: 'ç',
    d: 'ð',
    e: 'è',
    f: 'ƒ',
    g: 'ĝ',
    h: 'ĥ',
    i: 'ï',
    j: 'ĵ',
    k: 'ķ',
    l: 'ĺ',
    m: 'ɱ',
    n: 'ñ',
    o: 'ö',
    p: 'þ',
    q: 'ǫ',
    r: 'ŕ',
    s: 'š',
    t: 'ţ',
    u: 'ü',
    v: 'ṿ',
    w: 'ŵ',
    x: 'ẋ',
    y: 'ÿ',
    z: 'ž',
    A: 'À',
    B: 'Ɓ',
    C: 'Ç',
    D: 'Ð',
    E: 'È',
    F: 'Ƒ',
    G: 'Ĝ',
    H: 'Ĥ',
    I: 'Ï',
    J: 'Ĵ',
    K: 'Ķ',
    L: 'Ĺ',
    M: 'Ṃ',
    N: 'Ñ',
    O: 'Ö',
    P: 'Þ',
    Q: 'Ǫ',
    R: 'Ŕ',
    S: 'Š',
    T: 'Ţ',
    U: 'Ü',
    V: 'Ṿ',
    W: 'Ŵ',
    X: 'Ẋ',
    Y: 'Ÿ',
    Z: 'Ž',
};

/**
 * Padding characters added to expand text length
 */
const PADDING_CHARS = ['ẍ', 'ỳ', 'ẑ', 'ẅ'];

export class PseudoLocaleTransform {
    /**
     * Apply pseudo-locale transformation using Playwright
     * Cross-platform compatible (Mac, Windows, Linux)
     */
    static async applyPlaywright(
        page: PlaywrightPage,
        expansionFactor: number = DEFAULTS.PSEUDO_EXPANSION_FACTOR
    ): Promise<void> {
        await page.evaluate(
            ({ charMap, paddingChars, factor }) => {
                function pseudoLocalize(text: string): string {
                    if (!text || text.trim().length === 0) return text;

                    if (
                        text.includes('://') ||
                        text.includes('{') ||
                        text.includes('<') ||
                        /^[\d\s.,!?]+$/.test(text)
                    ) {
                        return text;
                    }

                    let result = '';
                    for (const char of text) {
                        result += charMap[char] || char;
                    }

                    const paddingLength = Math.ceil(text.length * factor);
                    if (paddingLength > 0) {
                        let padding = '';
                        for (let i = 0; i < paddingLength; i++) {
                            padding += paddingChars[i % paddingChars.length];
                        }
                        result = `[${result}${padding}]`;
                    }

                    return result;
                }

                function processTextNodes(node: Node): void {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const text = node.textContent;
                        if (text && text.trim().length > 0) {
                            node.textContent = pseudoLocalize(text);
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        const tagName = element.tagName.toLowerCase();

                        if (
                            tagName === 'script' ||
                            tagName === 'style' ||
                            tagName === 'noscript' ||
                            tagName === 'svg' ||
                            tagName === 'textarea' ||
                            tagName === 'input'
                        ) {
                            return;
                        }

                        for (const child of Array.from(node.childNodes)) {
                            processTextNodes(child);
                        }

                        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                            if (element.placeholder) {
                                element.placeholder = pseudoLocalize(element.placeholder);
                            }
                        }

                        const title = element.getAttribute('title');
                        if (title) {
                            element.setAttribute('title', pseudoLocalize(title));
                        }

                        const ariaLabel = element.getAttribute('aria-label');
                        if (ariaLabel) {
                            element.setAttribute('aria-label', pseudoLocalize(ariaLabel));
                        }
                    }
                }

                processTextNodes(document.body);

                // Add visual indicator
                const indicator = document.createElement('div');
                indicator.id = 'lingo-guardian-pseudo-indicator';
                indicator.style.cssText = `
          position: fixed;
          top: 4px;
          right: 4px;
          background: #8B5CF6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          z-index: 99999;
          opacity: 0.9;
        `;
                indicator.textContent = '🔤 PSEUDO';
                document.body.appendChild(indicator);
            },
            { charMap: CHAR_MAP, paddingChars: PADDING_CHARS, factor: expansionFactor }
        );
    }

    /**
     * Transform a single string to pseudo-locale (for testing)
     */
    static transform(text: string, expansionFactor: number = 0.35): string {
        if (!text || text.trim().length === 0) return text;

        let result = '';
        for (const char of text) {
            result += CHAR_MAP[char] || char;
        }

        const paddingLength = Math.ceil(text.length * expansionFactor);
        if (paddingLength > 0) {
            let padding = '';
            for (let i = 0; i < paddingLength; i++) {
                padding += PADDING_CHARS[i % PADDING_CHARS.length];
            }
            result = `[${result}${padding}]`;
        }

        return result;
    }
}
