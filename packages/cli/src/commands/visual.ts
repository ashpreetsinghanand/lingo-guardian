
// ... (imports remain the same, adding one for svg)
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
        // Ensure API Key is available to the process
        if (process.env.LINGODOTDEV_API_KEY) {
            process.env.LINGO_API_KEY = process.env.LINGODOTDEV_API_KEY;
        }
        await runVisualAudit(url, options);
    });

async function runVisualAudit(url: string, options: any): Promise<void> {
    const spinner = ora('Starting Visual Audit...').start();
    const projectPath = path.resolve(options.project);
    const lingo = new LingoIntegration(projectPath, true);

    // 1. Generate Lingo Translations
    try {
        spinner.text = 'Generating translations (pseudo-locale)...';
        await lingo.detectConfig(); // Fix: Must load config first
        await lingo.enablePseudoLocale();
        // Force env var injection for child process
        await lingo.runTranslation({ force: true });
        spinner.succeed('Translations ready');
    } catch (e) {
        spinner.warn('Could not generate translations (checking for existing files...)');
        // If files don't exist, we might fail, but let's try visual anyway
    }

    spinner.start('Launching browser for screenshots...');

    let browser: Browser | null = null;

    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });

        const context = await browser.newContext({
            viewport: { width: 1200, height: 800 },
        });

        const page = await context.newPage();

        const locales = [
            { code: 'en', name: 'Original (English)' },
            { code: 'pseudo', name: 'Stress Test (German/Expansion)' },
            { code: 'ar', name: 'RTL (Arabic)' },
            { code: 'ja', name: 'Characters (Japanese)' }
        ];

        const screenshots: { buffer: Buffer; label: string }[] = [];

        for (const locale of locales) {
            spinner.text = `Snapping ${locale.name}...`;
            const localeUrl = new URL(url);
            localeUrl.searchParams.set('lang', locale.code);

            // Wait for network idle to ensure content is fully loaded
            // Add a small delay for Next.js to re-hydrate with new translations if hot-reloading
            await page.goto(localeUrl.toString(), { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const buffer = await page.screenshot({ fullPage: false });
            screenshots.push({ buffer, label: locale.name });
        }

        await browser.close();
        browser = null;

        // 2. Stitch Images with "Premium" UI
        spinner.text = 'Creating Professional Report...';

        const imgWidth = 1200;
        const imgHeight = 800;
        const padding = 40;
        const headerHeight = 100;
        const labelHeight = 50;

        const canvasWidth = (imgWidth * 2) + (padding * 3);
        const canvasHeight = headerHeight + (imgHeight * 2) + (labelHeight * 2) + (padding * 3);

        // Helper to generate text SVG for sharp
        const createTextSvg = (text: string, width: number, height: number, fontSize: number = 30, color: string = '#333') => {
            return Buffer.from(`
                <svg width="${width}" height="${height}">
                    <style>
                        .title { fill: ${color}; font-size: ${fontSize}px; font-family: sans-serif; font-weight: bold; }
                    </style>
                    <text x="50%" y="60%" text-anchor="middle" class="title">${text}</text>
                </svg>
            `);
        };

        const composites: any[] = [
            // Header
            {
                input: createTextSvg("Lingo-Guardian Visual Report", canvasWidth, headerHeight, 48, '#1a1a1a'),
                top: 0,
                left: 0,
            }
        ];

        // Grid Positioning
        const positions = [
            { col: 0, row: 0 },
            { col: 1, row: 0 },
            { col: 0, row: 1 },
            { col: 1, row: 1 },
        ];

        screenshots.forEach((shot, index) => {
            const pos = positions[index];
            const x = padding + (pos.col * (imgWidth + padding));
            const y = headerHeight + padding + (pos.row * (imgHeight + labelHeight + padding));

            // Add Label
            composites.push({
                input: createTextSvg(shot.label, imgWidth, labelHeight, 32, '#555'),
                top: y,
                left: x
            });

            // Add Screenshot
            composites.push({
                input: shot.buffer,
                top: y + labelHeight,
                left: x
            });
        });

        const composite = await sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 4,
                background: { r: 240, g: 244, b: 248, alpha: 1 } // Light grey-blue background
            }
        })
            .composite(composites)
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

