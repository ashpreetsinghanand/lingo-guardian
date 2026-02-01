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
import { Auditor } from '../core/auditor.js';
import { LingoIntegration } from '../core/lingo-integration.js';
import { Reporter, OutputFormat } from '../reporters/reporter.js';
import { DEFAULTS, EXIT_CODES, LintOptions } from '../constants.js';

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
        'Locales to test (e.g., en pseudo ar de)',
        ['en', 'pseudo']
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
            locale: options.locale as string[],
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

        // STEP 5: Audit each locale
        for (const locale of options.locale) {
            // Build URL with locale query param for Lingo SDK integration
            const localeUrl = buildLocaleUrl(url, locale);
            spinner.text = `Auditing with locale: ${chalk.cyan(locale.toUpperCase())}...`;

            if (options.verbose) {
                console.log(chalk.gray(`  URL: ${localeUrl}`));
            }

            const result = await auditor.audit(localeUrl, locale);
            results.push(result);

            if (options.verbose) {
                spinner.info(`${locale}: Found ${result.issueCount} issues (${result.duration}ms)`);
                spinner.start();
            }
        }

        // Close browser
        await auditor.close();
        spinner.succeed('Audit complete!');

        // Print results
        reporter.print(results);

        // Print Lingo.dev integration note
        console.log(
            chalk.gray('\n📦 Powered by Lingo.dev - https://lingo.dev\n')
        );

        // Save report if output format is json, html, or markdown
        if (options.format === 'json' || options.format === 'html' || options.format === 'markdown') {
            await reporter.save(results, options.output);
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
