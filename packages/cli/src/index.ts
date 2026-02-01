/**
 * Lingo-Guardian CLI - Public API
 * Export main functionality for programmatic usage
 */

export { Auditor } from './core/auditor.js';
export { LingoIntegration } from './core/lingo-integration.js';
export { PseudoLocaleTransform } from './transforms/pseudo-locale.js';
export { RTLTransform } from './transforms/rtl.js';
export { Reporter } from './reporters/reporter.js';

export type {
    OverflowIssue,
    AuditResult,
    LintOptions,
    Severity,
} from './constants.js';

export { VERSION, DEFAULTS } from './constants.js';
