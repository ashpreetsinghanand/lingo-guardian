/**
 * Lingo.dev Integration Module
 *
 * This module integrates with the official Lingo.dev CLI and SDK.
 * It runs `npx lingo.dev run` to generate translations using their engine.
 *
 * This is the KEY integration that makes Lingo-Guardian work with Lingo.dev
 * rather than being a standalone tool.
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Lingo.dev configuration file structure
 */
export interface LingoConfig {
    $schema?: string;
    version: string;
    locale: {
        source: string;
        targets: string[];
    };
    buckets: Record<
        string,
        {
            include: string[];
            exclude?: string[];
        }
    >;
}

/**
 * Result of running Lingo.dev CLI
 */
export interface LingoRunResult {
    success: boolean;
    output: string;
    error?: string;
    localesGenerated: string[];
    filesModified: string[];
}

/**
 * Lingo.dev Integration - Orchestrates the Lingo.dev CLI
 *
 * Usage:
 *   const lingo = new LingoIntegration('/path/to/project');
 *   await lingo.detectConfig();
 *   await lingo.runTranslation({ locale: 'pseudo' });
 */
export class LingoIntegration {
    private projectPath: string;
    private configPath: string | null = null;
    private config: LingoConfig | null = null;
    private verbose: boolean;

    constructor(projectPath: string, verbose = false) {
        this.projectPath = projectPath;
        this.verbose = verbose;
    }

    /**
     * Detect Lingo.dev configuration in the project
     * Looks for: i18n.json, lingo.config.js, lingo.config.json
     */
    async detectConfig(): Promise<boolean> {
        const configFiles = ['i18n.json', 'lingo.config.json', 'lingo.config.js'];

        for (const configFile of configFiles) {
            const fullPath = path.join(this.projectPath, configFile);
            try {
                await fs.access(fullPath);
                this.configPath = fullPath;
                this.log(`Found Lingo.dev config: ${configFile}`);

                // Read the config
                if (configFile.endsWith('.json')) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    this.config = JSON.parse(content) as LingoConfig;
                }

                return true;
            } catch {
                // File doesn't exist, try next
            }
        }

        this.log('No Lingo.dev config found');
        return false;
    }

    /**
     * Get the detected configuration
     */
    getConfig(): LingoConfig | null {
        return this.config;
    }

    /**
     * Get available target locales from config
     */
    getTargetLocales(): string[] {
        if (!this.config) return [];
        return this.config.locale.targets;
    }

    /**
     * Get source locale from config
     */
    getSourceLocale(): string {
        return this.config?.locale.source || 'en';
    }

    /**
     * Initialize a new Lingo.dev project if config doesn't exist
     */
    async initProject(): Promise<boolean> {
        this.log('Initializing Lingo.dev project...');

        try {
            const { stdout, stderr } = await execAsync('npx lingo.dev@latest init --yes', {
                cwd: this.projectPath,
                timeout: 60000,
            });

            this.log(stdout);
            if (stderr) this.log(`Warning: ${stderr}`);

            // Re-detect config after init
            return this.detectConfig();
        } catch (error) {
            const err = error as Error;
            this.log(`Failed to init: ${err.message}`);
            return false;
        }
    }

    /**
     * Run Lingo.dev CLI translation
     *
     * This is the KEY integration - we run their CLI to generate translations
     *
     * @param options.locale - Optional specific locale to target
     * @param options.force - Force retranslation even if cached
     */
    async runTranslation(options: { locale?: string; force?: boolean } = {}): Promise<LingoRunResult> {
        const args = ['lingo.dev@latest', 'run'];

        if (options.locale) {
            args.push('--locale', options.locale);
        }

        if (options.force) {
            args.push('--force');
        }

        this.log(`Running: npx ${args.join(' ')}`);

        return new Promise((resolve) => {
            const proc = spawn('npx', args, {
                cwd: this.projectPath,
                shell: true,
                env: { ...process.env },
            });

            let output = '';
            let errorOutput = '';

            proc.stdout.on('data', (data: Buffer) => {
                const text = data.toString();
                output += text;
                if (this.verbose) console.log(text);
            });

            proc.stderr.on('data', (data: Buffer) => {
                const text = data.toString();
                errorOutput += text;
                if (this.verbose) console.error(text);
            });

            proc.on('close', (code) => {
                const success = code === 0;
                const localesGenerated = this.parseLocalesFromOutput(output);
                const filesModified = this.parseFilesFromOutput(output);

                resolve({
                    success,
                    output,
                    error: errorOutput || undefined,
                    localesGenerated,
                    filesModified,
                });
            });

            proc.on('error', (error) => {
                resolve({
                    success: false,
                    output,
                    error: error.message,
                    localesGenerated: [],
                    filesModified: [],
                });
            });
        });
    }

    /**
     * Add pseudo-locale to the Lingo.dev config if not present
     * This enables testing with expanded text
     */
    async enablePseudoLocale(): Promise<boolean> {
        if (!this.config || !this.configPath) {
            this.log('No config to modify');
            return false;
        }

        // Check if pseudo is already a target
        if (this.config.locale.targets.includes('pseudo')) {
            this.log('Pseudo-locale already enabled');
            return true;
        }

        // Add pseudo to targets
        this.config.locale.targets.push('pseudo');

        try {
            await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            this.log('Added pseudo-locale to config');
            return true;
        } catch (error) {
            const err = error as Error;
            this.log(`Failed to update config: ${err.message}`);
            return false;
        }
    }

    /**
     * Check if Lingo.dev CLI is available
     */
    async isLingoCliAvailable(): Promise<boolean> {
        try {
            await execAsync('npx lingo.dev@latest --version', { timeout: 10000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the locale query parameter for SDK integration
     * The Lingo.dev SDK can switch locales via URL param
     */
    getLocaleQueryParam(locale: string): string {
        return `?lang=${locale}`;
    }

    /**
     * Parse generated locales from CLI output
     */
    private parseLocalesFromOutput(output: string): string[] {
        const locales: string[] = [];
        const matches = output.match(/Translating to (\w+)/g);
        if (matches) {
            for (const match of matches) {
                const locale = match.replace('Translating to ', '');
                locales.push(locale);
            }
        }
        return locales;
    }

    /**
     * Parse modified files from CLI output
     */
    private parseFilesFromOutput(output: string): string[] {
        const files: string[] = [];
        const matches = output.match(/Writing to ([^\s]+)/g);
        if (matches) {
            for (const match of matches) {
                const file = match.replace('Writing to ', '');
                files.push(file);
            }
        }
        return files;
    }

    /**
     * Log message if verbose mode is enabled
     */
    private log(message: string): void {
        if (this.verbose) {
            console.log(`  [Lingo.dev] ${message}`);
        }
    }
}
