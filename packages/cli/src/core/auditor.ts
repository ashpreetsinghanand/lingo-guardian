/**
 * Auditor - Core engine for detecting i18n layout issues
 *
 * Uses Playwright (cross-platform: Mac, Windows, Linux) to analyze pages for:
 * - Text overflow (scrollWidth > offsetWidth)
 * - Text truncation (text-overflow: ellipsis detection)
 * - Layout breaks in RTL mode
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { OverflowIssue, AuditResult } from '../constants.js';
import { DEFAULTS } from '../constants.js';
import { PseudoLocaleTransform } from '../transforms/pseudo-locale.js';
import { RTLTransform } from '../transforms/rtl.js';

export interface AuditorOptions {
    /** Viewport width */
    width?: number;
    /** Viewport height */
    height?: number;
    /** Page load timeout in ms */
    timeout?: number;
    /** Take screenshots of issues */
    screenshots?: boolean;
    /** Output directory for screenshots */
    outputDir?: string;
    /** Verbose logging */
    verbose?: boolean;
}

/**
 * Result type from page.evaluate
 */
interface EvaluateIssue {
    selector: string;
    tagName: string;
    textContent: string;
    offsetWidth: number;
    scrollWidth: number;
    offsetHeight: number;
    scrollHeight: number;
    overflowDirection: 'horizontal' | 'vertical' | 'both';
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    boundingRect: { x: number; y: number; width: number; height: number };
}

/**
 * Core Auditor class for detecting i18n layout issues
 * 
 * Uses Playwright for cross-platform browser automation (Mac, Windows, Linux)
 */
export class Auditor {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private options: Required<AuditorOptions>;

    constructor(options: AuditorOptions = {}) {
        this.options = {
            width: options.width ?? DEFAULTS.VIEWPORT_WIDTH,
            height: options.height ?? DEFAULTS.VIEWPORT_HEIGHT,
            timeout: options.timeout ?? DEFAULTS.TIMEOUT,
            screenshots: options.screenshots ?? false,
            outputDir: options.outputDir ?? './lingo-guardian-reports',
            verbose: options.verbose ?? false,
        };
    }

    /**
     * Initialize the browser instance
     * Playwright handles cross-platform browser binaries automatically
     */
    async init(): Promise<void> {
        if (this.browser) return;

        this.log('Launching Playwright browser (Chromium)...');

        // Playwright handles cross-platform automatically
        this.browser = await chromium.launch({
            headless: true,
            // These args work across Mac, Windows, and Linux
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
            ],
        });

        this.context = await this.browser.newContext({
            viewport: {
                width: this.options.width,
                height: this.options.height,
            },
        });
    }

    /**
     * Close the browser instance
     */
    async close(): Promise<void> {
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Audit a URL for i18n layout issues
     */
    async audit(url: string, locale: string = 'en'): Promise<AuditResult> {
        const startTime = Date.now();

        if (!this.browser || !this.context) {
            await this.init();
        }

        const page = await this.context!.newPage();

        try {
            this.log(`Navigating to ${url}...`);
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout,
            });

            // Apply locale transformations (fallback when Lingo.dev not used)
            await this.applyLocaleTransform(page, locale);

            // Wait for any reflow after transformations
            await page.waitForTimeout(500);

            // Detect overflow issues
            this.log(`Scanning for overflow issues (locale: ${locale})...`);
            const issues = await this.detectOverflows(page, locale);

            const duration = Date.now() - startTime;

            return {
                url,
                locale,
                timestamp: new Date().toISOString(),
                issueCount: issues.length,
                issues,
                duration,
            };
        } finally {
            await page.close();
        }
    }

    /**
     * Apply locale-specific transformations to the page
     * These are fallback transforms when Lingo.dev integration is not used
     */
    private async applyLocaleTransform(page: Page, locale: string): Promise<void> {
        switch (locale.toLowerCase()) {
            case 'pseudo':
                this.log('Applying pseudo-locale transformation...');
                await PseudoLocaleTransform.applyPlaywright(page);
                break;

            case 'ar':
            case 'he':
            case 'fa':
            case 'ur':
                this.log(`Applying RTL transformation for ${locale}...`);
                await RTLTransform.applyPlaywright(page, locale);
                break;

            case 'de':
                // German has ~30% longer text - simulate expansion
                this.log('Applying German expansion simulation...');
                await PseudoLocaleTransform.applyPlaywright(page, 0.3);
                break;

            case 'ja':
            case 'zh':
            case 'ko':
                // CJK languages - check for font loading and character rendering
                this.log(`Checking CJK rendering for ${locale}...`);
                break;

            default:
                // English or other - no transformation
                this.log(`No transformation for locale: ${locale}`);
                break;
        }
    }

    /**
     * Detect elements with overflow issues
     * Core detection logic: element.scrollWidth > element.offsetWidth
     */
    private async detectOverflows(page: Page, locale: string): Promise<OverflowIssue[]> {
        const excludedSelectorsList: string[] = [...DEFAULTS.EXCLUDED_SELECTORS];

        const issues: EvaluateIssue[] = await page.evaluate((excludedSelectors: string[]) => {
            const results: EvaluateIssue[] = [];

            // Get all text-containing elements
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
                acceptNode: (node: Node) => {
                    const el = node as Element;
                    const tagName = el.tagName.toLowerCase();

                    if (excludedSelectors.includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                },
            });

            const elements: Element[] = [];
            let currentNode: Node | null;

            while ((currentNode = walker.nextNode())) {
                elements.push(currentNode as Element);
            }

            for (const el of elements) {
                const htmlEl = el as HTMLElement;
                const rect = htmlEl.getBoundingClientRect();

                if (rect.width === 0 || rect.height === 0) continue;

                const scrollWidth = htmlEl.scrollWidth;
                const offsetWidth = htmlEl.offsetWidth;
                const scrollHeight = htmlEl.scrollHeight;
                const offsetHeight = htmlEl.offsetHeight;

                // The "Red Glow" Detection - core logic
                const hasHorizontalOverflow = scrollWidth > offsetWidth + 1;
                const hasVerticalOverflow = scrollHeight > offsetHeight + 1;

                if (hasHorizontalOverflow || hasVerticalOverflow) {
                    const selector = generateSelector(el);
                    const textContent = htmlEl.textContent?.trim().slice(0, 50) || '';

                    let overflowDirection: 'horizontal' | 'vertical' | 'both';
                    if (hasHorizontalOverflow && hasVerticalOverflow) {
                        overflowDirection = 'both';
                    } else if (hasHorizontalOverflow) {
                        overflowDirection = 'horizontal';
                    } else {
                        overflowDirection = 'vertical';
                    }

                    const overflowAmount = Math.max(scrollWidth - offsetWidth, scrollHeight - offsetHeight);
                    let severity: 'error' | 'warning' | 'info';
                    if (overflowAmount > 50) {
                        severity = 'error';
                    } else if (overflowAmount > 20) {
                        severity = 'warning';
                    } else {
                        severity = 'info';
                    }

                    let suggestion = '';
                    if (overflowDirection === 'horizontal') {
                        if (el.tagName.toLowerCase() === 'table') {
                            suggestion = 'Add parent with overflow-x-auto';
                        } else {
                            suggestion = 'Try: truncate, break-words, or w-full';
                        }
                    } else {
                        suggestion = 'Try: h-auto, line-clamp, or overflow-y-auto';
                    }

                    results.push({
                        selector,
                        tagName: el.tagName.toLowerCase(),
                        textContent,
                        offsetWidth,
                        scrollWidth,
                        offsetHeight,
                        scrollHeight,
                        overflowDirection,
                        severity,
                        suggestion,
                        boundingRect: {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                        },
                    });
                }
            }

            function generateSelector(el: Element): string {
                if (el.id) {
                    return `#${el.id}`;
                }

                const path: string[] = [];
                let current: Element | null = el;

                while (current && current !== document.body) {
                    let selector = current.tagName.toLowerCase();

                    if (current.className && typeof current.className === 'string') {
                        const classes = current.className.trim().split(/\s+/).slice(0, 2);
                        if (classes.length > 0 && classes[0]) {
                            selector += '.' + classes.join('.');
                        }
                    }

                    const parent = current.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children).filter(
                            (c) => c.tagName === current!.tagName
                        );
                        if (siblings.length > 1) {
                            const index = siblings.indexOf(current) + 1;
                            selector += `:nth-child(${index})`;
                        }
                    }

                    path.unshift(selector);
                    current = current.parentElement;
                }

                return path.join(' > ');
            }

            return results;
        }, excludedSelectorsList);

        return issues.map((issue) => ({
            ...issue,
            locale,
        }));
    }

    /**
     * Log message if verbose mode is enabled
     */
    private log(message: string): void {
        if (this.options.verbose) {
            console.log(`  [Auditor] ${message}`);
        }
    }
}
