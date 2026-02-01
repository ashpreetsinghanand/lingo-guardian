#!/usr/bin/env node
/**
 * Lingo-Guardian CLI
 * The Automated DevSecOps Firewall for Internationalization
 *
 * Detects UI overflows, RTL layout breaks, and missing i18n keys
 * before they reach production.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { lintCommand } from '../commands/lint.js';
import { visualCommand } from '../commands/visual.js';
import { VERSION, BANNER } from '../constants.js';

const program = new Command();

// Display banner
console.log(chalk.cyan(BANNER));

program
    .name('lingo-guardian')
    .description('The Automated DevSecOps Firewall for Internationalization')
    .version(VERSION, '-v, --version', 'Display version number');

// Register commands
program.addCommand(lintCommand);
program.addCommand(visualCommand);

// Error handling
program.exitOverride((err) => {
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(0);
    }
    console.error(chalk.red(`\n❌ Error: ${err.message}`));
    process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
