/**
 * Constants and configuration for Lingo-Guardian CLI
 */

export const VERSION = '0.1.0';

export const BANNER = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛡️  LINGO-GUARDIAN                                      ║
║   The Automated i18n Firewall for React                   ║
║                                                           ║
║   Powered by Lingo.dev                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

/**
 * Default configuration values
 */
export const DEFAULTS = {
    /** Default timeout for page load in milliseconds */
    TIMEOUT: 30000,
    /** Default viewport width */
    VIEWPORT_WIDTH: 1280,
    /** Default viewport height */
    VIEWPORT_HEIGHT: 720,
    /** Default locales to test */
    LOCALES: ['en', 'pseudo', 'ar', 'de'] as const,
    /** Selectors to exclude from scanning */
    EXCLUDED_SELECTORS: ['script', 'style', 'noscript', 'svg', 'path'],
    /** Text expansion factor for pseudo-locale */
    PSEUDO_EXPANSION_FACTOR: 0.35,
} as const;

/**
 * Exit codes following standard conventions
 */
export const EXIT_CODES = {
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    LINT_ISSUES_FOUND: 2,
    INVALID_ARGUMENTS: 3,
} as const;

/**
 * Issue severity levels
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Overflow issue detected by the auditor
 */
export interface OverflowIssue {
    /** CSS selector path to the element */
    selector: string;
    /** HTML tag name */
    tagName: string;
    /** Text content (truncated) */
    textContent: string;
    /** Element's offset width */
    offsetWidth: number;
    /** Element's scroll width */
    scrollWidth: number;
    /** Element's offset height */
    offsetHeight: number;
    /** Element's scroll height */
    scrollHeight: number;
    /** Overflow direction */
    overflowDirection: 'horizontal' | 'vertical' | 'both';
    /** Severity of the issue */
    severity: Severity;
    /** Locale where issue was detected */
    locale: string;
    /** Bounding rect for screenshot */
    boundingRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Audit result for a single page
 */
export interface AuditResult {
    /** URL that was audited */
    url: string;
    /** Locale tested */
    locale: string;
    /** Timestamp of audit */
    timestamp: string;
    /** Total issues found */
    issueCount: number;
    /** List of overflow issues */
    issues: OverflowIssue[];
    /** Duration of audit in ms */
    duration: number;
    /** Screenshot path if captured */
    screenshotPath?: string;
}

/**
 * CLI options for lint command
 */
export interface LintOptions {
    /** Locales to test */
    locale: string[];
    /** Output format */
    format: 'table' | 'json' | 'html' | 'markdown';
    /** Take screenshots */
    screenshot: boolean;
    /** Output directory for reports */
    output: string;
    /** Fail on errors */
    failOnError: boolean;
    /** Custom viewport width */
    width: number;
    /** Custom viewport height */
    height: number;
    /** Timeout in ms */
    timeout: number;
    /** Verbose logging */
    verbose: boolean;
}
