/**
 * Lint Command
 *
 * Main command for auditing i18n layout issues.
 * 
 * NEW: Now integrates with Lingo.dev CLI to generate translations!
 * 
 * Usage: lingo-guardian lint <url> [options]
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { select, checkbox } from '@inquirer/prompts';
import { Auditor } from '../core/auditor.js';
import { LingoIntegration } from '../core/lingo-integration.js';
import { SourceFinder } from '../core/source-finder.js';
import { TranslationMapper } from '../core/translation-mapper.js';
import { Reporter, OutputFormat } from '../reporters/reporter.js';
import { DEFAULTS, EXIT_CODES, LintOptions, AuditResult } from '../constants.js';

export interface ExtendedLintOptions extends LintOptions {
    /** Project directory containing i18n.json */
    project: string;
    /** Run Lingo.dev CLI to generate translations before audit */
    useLingo: boolean;
}

export const lintCommand = new Command('lint')
    .description('Audit a URL for i18n layout issues using Lingo.dev for translations')
    .argument('<url>', 'URL to audit (e.g., http://localhost:3000)')
    .option(
        '-p, --project <path>',
        'Path to project directory containing i18n.json',
        process.cwd()
    )
    .option(
        '--use-lingo',
        'Run Lingo.dev CLI to generate translations before audit',
        true
    )
    .option(
        '-l, --locale <locales...>',
        'Locales to test (e.g., en pseudo ar de)'
        // Default removed to allow auto-detection
    )
    .option('-f, --format <format>', 'Output format: table, json, html, markdown', 'table')
    .option('-s, --screenshot', 'Capture screenshots of issues', false)
    .option('-o, --output <dir>', 'Output directory for reports', './lingo-guardian-reports')
    .option('--fail-on-error', 'Exit with error code if issues found', false)
    .option('-w, --width <pixels>', 'Viewport width', String(DEFAULTS.VIEWPORT_WIDTH))
    .option('--height <pixels>', 'Viewport height', String(DEFAULTS.VIEWPORT_HEIGHT))
    .option('-t, --timeout <ms>', 'Page load timeout in milliseconds', String(DEFAULTS.TIMEOUT))
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (url: string, options: Record<string, unknown>) => {
        const lintOptions: ExtendedLintOptions = {
            project: options.project as string,
            useLingo: options.useLingo as boolean,
            locale: options.locale as string[], // Now undefined if not passed
            format: options.format as OutputFormat,
            screenshot: options.screenshot as boolean,
            output: options.output as string,
            failOnError: options.failOnError as boolean,
            width: parseInt(options.width as string, 10),
            height: parseInt(options.height as string, 10),
            timeout: parseInt(options.timeout as string, 10),
            verbose: options.verbose as boolean,
        };

        await runLintAudit(url, lintOptions);
    });

/**
 * Execute the lint audit with Lingo.dev integration
 */
async function runLintAudit(url: string, options: ExtendedLintOptions): Promise<void> {
    const spinner = ora({
        text: 'Initializing Lingo-Guardian...',
        color: 'cyan',
    }).start();

    const projectPath = path.resolve(options.project);
    const lingo = new LingoIntegration(projectPath, options.verbose);

    const auditor = new Auditor({
        width: options.width,
        height: options.height,
        timeout: options.timeout,
        screenshots: options.screenshot,
        outputDir: options.output,
        verbose: options.verbose,
    });

    const reporter = new Reporter(options.format);

    try {
        // STEP 1: Detect Lingo.dev configuration
        spinner.text = 'Detecting Lingo.dev configuration...';
        const hasConfig = await lingo.detectConfig();

        // RESOLVE LOCALES: Interactive Selection
        // ----------------------------------------------------------------
        // If no CLI locales specified, prompt user interactively
        const configLocales = lingo.getConfig()?.locale.targets || [];
        const sourceLocale = lingo.getConfig()?.locale.source || 'en';

        spinner.stop();
        const locales = await promptLanguageSelection(sourceLocale, configLocales, options.locale);
        spinner.start();

        // Update options reference so downstream checks work
        options.locale = locales;
        // ----------------------------------------------------------------

        if (options.useLingo) {
            if (!hasConfig) {
                spinner.warn('No Lingo.dev config (i18n.json) found. Use --no-use-lingo to skip.');
                console.log(chalk.yellow('\n💡 To initialize Lingo.dev, run:'));
                console.log(chalk.cyan(`   cd ${projectPath} && npx lingo.dev@latest init\n`));
            } else {
                // Show detected config
                const config = lingo.getConfig();
                if (config) {
                    spinner.info(
                        `Lingo.dev config: source=${config.locale.source}, targets=${config.locale.targets.join(', ')}`
                    );
                    spinner.start();
                }

                // STEP 2: Ensure pseudo-locale is enabled for testing
                if (options.locale.includes('pseudo')) {
                    spinner.text = 'Ensuring pseudo-locale is enabled...';
                    await lingo.enablePseudoLocale();
                }

                // STEP 3: Run Lingo.dev CLI to generate translations
                spinner.text = chalk.magenta('🌍 Running Lingo.dev CLI to generate translations...');
                const lingoResult = await lingo.runTranslation({ force: false });

                if (lingoResult.success) {
                    spinner.succeed(
                        chalk.green(`Lingo.dev generated ${lingoResult.localesGenerated.length} locale(s)`)
                    );
                } else {
                    spinner.warn('Lingo.dev CLI completed with warnings');
                    if (options.verbose && lingoResult.error) {
                        console.log(chalk.yellow(lingoResult.error));
                    }
                }
                spinner.start();
            }
        }

        // STEP 4: Initialize browser for overflow detection
        spinner.text = 'Launching headless browser...';
        await auditor.init();

        const results = [];

        // STEP 5: Scan project source files for text locations
        const sourceFinder = new SourceFinder(projectPath);
        await sourceFinder.scan();

        // STEP 5b: Load translation mapper for English reference
        const translationMapper = new TranslationMapper(projectPath);
        await translationMapper.load();

        // STEP 6: Audit each selected locale
        for (const locale of locales) {
            spinner.text = `Auditing ${locale.toUpperCase()}...`;

            // Support dynamic URL patterns (e.g., http://localhost:3000?lang={locale})
            // If {locale} is present, replace it directly. Otherwise, use buildLocaleUrl to add ?lang=locale.
            const auditUrl = url.includes('{locale}')
                ? url.replace('{locale}', locale)
                : buildLocaleUrl(url, locale);

            if (options.verbose) {
                console.log(chalk.gray(`  URL: ${auditUrl}`));
            }

            const result = await auditor.audit(auditUrl, locale);

            // Enrich issues with source location and English text
            for (const issue of result.issues) {
                // Find source location
                const sourceLocation = sourceFinder.findSource(issue.textContent);
                if (sourceLocation) {
                    issue.sourceFile = sourceLocation.file;
                    issue.sourceLine = sourceLocation.line;
                }

                // Find English original for non-English locales
                if (locale !== 'en') {
                    const englishEntry = translationMapper.findEnglishOriginal(issue.textContent, locale);
                    if (englishEntry) {
                        (issue as any).englishText = englishEntry.englishText;
                        // Use English text to find source if not already found
                        if (!issue.sourceFile) {
                            const engSource = sourceFinder.findSource(englishEntry.englishText);
                            if (engSource) {
                                issue.sourceFile = engSource.file;
                                issue.sourceLine = engSource.line;
                            }
                        }
                    }
                }
            }

            results.push(result);

            if (options.verbose) {
                spinner.info(`${locale}: Found ${result.issueCount} issues (${result.duration}ms)`);
                spinner.start();
            }
        }

        // Close browser
        await auditor.close();
        spinner.succeed('Audit complete!');

        // Ask user for display mode
        const displayMode = await promptDisplayMode();

        // Deduplicate if user chose mode 2
        const processedResults = displayMode === 2 ? deduplicateResults(results) : results;

        // Print results
        reporter.print(processedResults);

        // Print Lingo.dev integration note
        console.log(
            chalk.gray('\n📦 Powered by Lingo.dev - https://lingo.dev\n')
        );

        // Save report if output format is json, html, or markdown
        if (options.format === 'json' || options.format === 'html' || options.format === 'markdown') {
            await reporter.save(processedResults, options.output);
        }

        // Exit with error if issues found and failOnError is set
        const hasErrors = results.some((r) => r.issues.some((i) => i.severity === 'error'));

        if (options.failOnError && hasErrors) {
            console.log(chalk.red('\n💥 Exiting with error due to --fail-on-error flag'));
            process.exit(EXIT_CODES.LINT_ISSUES_FOUND);
        }
    } catch (error) {
        spinner.fail('Audit failed');

        if (error instanceof Error) {
            console.error(chalk.red(`\n❌ Error: ${error.message}`));

            if (options.verbose && error.stack) {
                console.error(chalk.gray(error.stack));
            }
        }

        await auditor.close();
        process.exit(EXIT_CODES.GENERAL_ERROR);
    }
}

/**
 * Build URL with locale query parameter for Lingo.dev SDK
 * 
 * The Lingo.dev SDK can detect locale from URL params:
 * - ?lang=es
 * - ?locale=es
 */
function buildLocaleUrl(baseUrl: string, locale: string): string {
    const url = new URL(baseUrl);

    // Add locale query param for Lingo SDK
    url.searchParams.set('lang', locale);

    return url.toString();
}

/**
 * Prompt user to select display mode using inquirer
 */
async function promptDisplayMode(): Promise<1 | 2> {
    console.log(); // Add spacing
    const mode = await select({
        message: 'How would you like to display issues?',
        choices: [
            { name: 'Show all issues (default)', value: 1 as const },
            { name: 'Deduplicate by source (group similar)', value: 2 as const },
        ],
    });

    if (mode === 2) {
        console.log(chalk.gray('→ Showing deduplicated issues\n'));
    } else {
        console.log(chalk.gray('→ Showing all issues\n'));
    }
    return mode;
}

/**
 * Deduplicate results by grouping issues with same source
 * Keeps only the highest severity issue for each source
 */
function deduplicateResults(results: AuditResult[]): AuditResult[] {
    const severityOrder: Record<string, number> = { error: 3, warning: 2, info: 1 };

    return results.map((result) => {
        const sourceMap = new Map<string, typeof result.issues[0]>();

        for (const issue of result.issues) {
            const key = issue.sourceFile && issue.sourceLine
                ? `${issue.sourceFile}:${issue.sourceLine}`
                : issue.textContent;

            const existing = sourceMap.get(key);
            if (!existing || severityOrder[issue.severity] > severityOrder[existing.severity]) {
                sourceMap.set(key, issue);
            }
        }

        const deduplicatedIssues = Array.from(sourceMap.values());

        return {
            ...result,
            issues: deduplicatedIssues,
            issueCount: deduplicatedIssues.length,
        };
    });
}

/**
 * All languages supported by Lingo.dev (80+ locales)
 * Reference: https://lingo.dev/docs
 */
const ALL_LANGUAGES: Record<string, string> = {
    // Major World Languages
    'en': 'English',
    'es': 'Spanish',
    'zh': 'Chinese',
    'hi': 'Hindi',
    'ar': 'Arabic',
    'pt': 'Portuguese',
    'bn': 'Bengali',
    'ru': 'Russian',
    'ja': 'Japanese',
    'pa': 'Punjabi',
    'de': 'German',
    'ko': 'Korean',
    'fr': 'French',
    'vi': 'Vietnamese',
    'te': 'Telugu',
    'tr': 'Turkish',
    'ta': 'Tamil',
    'it': 'Italian',
    'th': 'Thai',
    'pl': 'Polish',
    'nl': 'Dutch',
    'uk': 'Ukrainian',
    'id': 'Indonesian',
    'ms': 'Malay',
    'ro': 'Romanian',
    'el': 'Greek',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'sv': 'Swedish',
    'he': 'Hebrew',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian',
    'sk': 'Slovak',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'lt': 'Lithuanian',
    'sl': 'Slovenian',
    'lv': 'Latvian',
    'et': 'Estonian',
    'sr': 'Serbian',
    'ca': 'Catalan',
    'af': 'Afrikaans',
    'sw': 'Swahili',
    'fa': 'Persian',
    'ur': 'Urdu',
    // Regional Variants
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'en-AU': 'English (Australia)',
    'es-ES': 'Spanish (Spain)',
    'es-MX': 'Spanish (Mexico)',
    'es-419': 'Spanish (Latin America)',
    'pt-BR': 'Portuguese (Brazil)',
    'pt-PT': 'Portuguese (Portugal)',
    'zh-CN': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'fr-FR': 'French (France)',
    'fr-CA': 'French (Canada)',
    'de-DE': 'German (Germany)',
    'de-AT': 'German (Austria)',
    'de-CH': 'German (Switzerland)',
    // Testing
    'pseudo': 'Pseudo-locale (testing)',
};

/**
 * Prompt user to select which languages to test using inquirer
 */
async function promptLanguageSelection(
    sourceLocale: string,
    configLocales: string[],
    cliLocales?: string[]
): Promise<string[]> {
    // If CLI specified locales, use those directly
    if (cliLocales && cliLocales.length > 0) {
        return cliLocales;
    }

    const allAvailableLocales = [sourceLocale, ...configLocales];
    const formatLocale = (code: string) => ALL_LANGUAGES[code] || code;

    console.log(chalk.bold('\n🌍 Language Selection:'));
    console.log(chalk.gray(`   Source: ${formatLocale(sourceLocale)}`));
    console.log(chalk.gray(`   Targets: ${configLocales.map(formatLocale).join(', ') || 'none detected'}\n`));

    // First prompt: Quick select or custom
    const mode = await select({
        message: 'How would you like to select languages?',
        choices: [
            { name: `Quick: Source only (${sourceLocale})`, value: 'source' },
            { name: `Quick: All from config (${allAvailableLocales.join(', ')})`, value: 'all' },
            { name: `Quick: ${sourceLocale} + pseudo (testing)`, value: 'pseudo' },
            { name: 'Custom: Select from ALL lingo.dev languages ↓', value: 'custom' },
        ],
    });

    switch (mode) {
        case 'source':
            console.log(chalk.gray(`→ Testing: ${sourceLocale}\n`));
            return [sourceLocale];
        case 'all':
            console.log(chalk.gray(`→ Testing: ${allAvailableLocales.join(', ')}\n`));
            return allAvailableLocales;
        case 'pseudo':
            console.log(chalk.gray(`→ Testing: ${sourceLocale}, pseudo\n`));
            return [sourceLocale, 'pseudo'];
        case 'custom':
            // Get all languages from lingo.dev CLI
            console.log(chalk.gray('   Fetching languages from lingo.dev...'));
            const allLingoLanguages = await getLingoDevLanguages();

            // Merge config locales with all primary lingo.dev languages
            const uniqueLanguages = new Set([...allAvailableLocales, ...allLingoLanguages]);
            const sortedLanguages = Array.from(uniqueLanguages).sort((a, b) => {
                // Put config languages first
                const aInConfig = allAvailableLocales.includes(a);
                const bInConfig = allAvailableLocales.includes(b);
                if (aInConfig && !bInConfig) return -1;
                if (!aInConfig && bInConfig) return 1;
                return formatLocale(a).localeCompare(formatLocale(b));
            });

            // Show checkbox for custom selection
            const selected = await checkbox({
                message: `Select languages to test (${sortedLanguages.length} available):`,
                choices: sortedLanguages.map(code => ({
                    name: allAvailableLocales.includes(code)
                        ? `${code} - ${formatLocale(code)} ✓ (configured)`
                        : `${code} - ${formatLocale(code)}`,
                    value: code,
                    checked: allAvailableLocales.includes(code), // Pre-check config locales
                })),
                pageSize: 15,
            });

            const result = selected.length > 0 ? selected : [sourceLocale];

            // Warn about unconfigured languages
            const unconfiguredSelected = result.filter(lang =>
                !allAvailableLocales.includes(lang)
            );

            if (unconfiguredSelected.length > 0) {
                console.log(chalk.yellow(`\n⚠ Warning: The following languages are NOT in your i18n.json config:`));
                console.log(chalk.yellow(`   ${unconfiguredSelected.join(', ')}`));
                console.log(chalk.yellow(`   Lingo.dev won't generate translations for these.`));
                console.log(chalk.yellow(`   Add them to i18n.json targets to enable translations.\n`));

                // Filter to only configured languages
                const configuredSelected = result.filter(lang =>
                    allAvailableLocales.includes(lang)
                );

                if (configuredSelected.length === 0) {
                    console.log(chalk.gray(`→ No configured languages selected. Using source: ${sourceLocale}\n`));
                    return [sourceLocale];
                }

                console.log(chalk.gray(`→ Testing configured languages only: ${configuredSelected.join(', ')}\n`));
                return configuredSelected;
            }

            console.log(chalk.gray(`→ Testing: ${result.join(', ')}\n`));
            return result;
        default:
            return [sourceLocale];
    }
}

/**
 * Get all supported languages from lingo.dev CLI
 * Filters to primary language codes (not regional variants like en-US)
 */
async function getLingoDevLanguages(): Promise<string[]> {
    const execAsync = promisify(exec);
    try {
        const { stdout } = await execAsync('npx lingo.dev@latest show locale targets', {
            timeout: 30000,
        });
        const allLocales = stdout.trim().split('\n').filter(Boolean);

        // Filter to primary language codes (2-3 letters, no region)
        const primaryLocales = allLocales.filter(locale => {
            // Keep only simple codes like 'en', 'es', 'zh', not 'en-US', 'zh-CN'
            return /^[a-z]{2,3}$/.test(locale) || locale === 'pseudo';
        });

        // Remove duplicates and sort
        return [...new Set(primaryLocales)].sort();
    } catch (error) {
        // Fallback to hardcoded list if CLI fails
        return Object.keys(ALL_LANGUAGES).filter(code => !code.includes('-'));
    }
}
