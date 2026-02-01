/**
 * Visual Command - Generates 4-locale comparison grid
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { chromium, Browser, Page } from 'playwright';
import sharp from 'sharp';
import { LingoIntegration } from '../core/lingo-integration.js';
import { DEFAULTS } from '../constants.js';

export const visualCommand = new Command('visual')
    .description('Generate a visual comparison grid of 4 locales')
    .argument('<url>', 'URL to audit (e.g., http://localhost:3000)')
    .option('-o, --output <file>', 'Output file path', 'visual-report.png')
    .option(
        '-p, --project <path>',
        'Path to project directory containing i18n.json',
        process.cwd()
    )
    .action(async (url: string, options: any) => {
        await runVisualAudit(url, options);
    });

async function runVisualAudit(url: string, options: any): Promise<void> {
    const spinner = ora('Starting Visual Audit...').start();
    const projectPath = path.resolve(options.project);
    const lingo = new LingoIntegration(projectPath, true);

    // 1. Generate Lingo Translations
    try {
        spinner.text = 'Generating translations (pseudo-locale)...';
        // We ensure pseudo is enabled and generated
        await lingo.enablePseudoLocale();
        await lingo.runTranslation({ force: false });
        spinner.succeed('Translations ready');
    } catch (e) {
        spinner.warn('Could not generate translations (continuing anyway)');
    }

    spinner.start('Launching browser for screenshots...');

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });

        const context = await browser.newContext({
            viewport: { width: 1200, height: 800 }, // Standard viewport
        });

        const page = await context.newPage();

        const locales = [
            { code: 'en', name: 'Original (English)' },
            { code: 'pseudo', name: 'Stress Test (German/Expansion)' },
            { code: 'ar', name: 'RTL (Arabic)' },
            { code: 'ja', name: 'Characters (Japanese)' } // Ensure user has 'ja' in lingo config or it defaults to English? 
            // Actually lingo SDK handles fallback.
        ];

        const screenshots: { buffer: Buffer; label: string }[] = [];

        for (const locale of locales) {
            spinner.text = `Snapping ${locale.name}...`;

            // Build URL: append ?lang=code (common Lingo SDK pattern)
            // If already has params, append &lang=code
            const localeUrl = new URL(url);
            localeUrl.searchParams.set('lang', locale.code);

            await page.goto(localeUrl.toString(), { waitUntil: 'networkidle' });

            // Inject a label overlay on the screenshot? 
            // The user didn't ask for it, but it helps. 
            // For now, raw screenshots.

            const buffer = await page.screenshot({ fullPage: false }); // User used fullPage: true but grid needs fixed size usually.
            // User script: await page.screenshot({ fullPage: true });
            // But then stitching logic: top: 0, left: width.
            // If pages are different heights, grid is messy.
            // I'll stick to viewport screenshot for clean grid.
            screenshots.push({ buffer, label: locale.name });
        }

        await browser.close();
        browser = null;

        // 2. Stitch Images
        spinner.text = 'Creating Composite Grid...';

        const width = 1200;
        const height = 800;

        // 2x2 Grid configuration
        // Top-Left: En, Top-Right: Pseudo
        // Bot-Left: Ar, Bot-Right: Ja

        const composite = await sharp({
            create: {
                width: width * 2,
                height: height * 2,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
            .composite([
                { input: screenshots[0].buffer, top: 0, left: 0 },
                { input: screenshots[1].buffer, top: 0, left: width },
                { input: screenshots[2].buffer, top: height, left: 0 },
                { input: screenshots[3].buffer, top: height, left: width },
            ])
            .png()
            .toBuffer();

        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, composite);

        spinner.succeed(chalk.green(`Generated visual report: ${outputPath}`));

    } catch (error) {
        spinner.fail('Visual audit failed');
        console.error(error);
        if (browser) await browser.close();
        process.exit(1);
    }
}
