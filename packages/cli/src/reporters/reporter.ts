/**
 * Reporter - Formats and outputs audit results
 *
 * Supports multiple output formats:
 * - Table (default): Pretty terminal output
 * - JSON: Machine-readable format
 * - HTML: Visual report with styling
 */

import chalk from 'chalk';
import { table } from 'table';
import type { AuditResult, OverflowIssue, Severity } from '../constants.js';
import fs from 'fs/promises';
import path from 'path';

export type OutputFormat = 'table' | 'json' | 'html';

export class Reporter {
    private format: OutputFormat;

    constructor(format: OutputFormat = 'table') {
        this.format = format;
    }

    /**
     * Generate report from audit results
     */
    async report(results: AuditResult[]): Promise<string> {
        switch (this.format) {
            case 'json':
                return this.formatJSON(results);
            case 'html':
                return this.formatHTML(results);
            case 'table':
            default:
                return this.formatTable(results);
        }
    }

    /**
     * Print report to console
     */
    print(results: AuditResult[]): void {
        const totalIssues = results.reduce((sum, r) => sum + r.issueCount, 0);
        const errors = results.flatMap((r) => r.issues).filter((i) => i.severity === 'error').length;
        const warnings = results.flatMap((r) => r.issues).filter((i) => i.severity === 'warning').length;

        console.log('\n' + chalk.bold('═══ LINGO-GUARDIAN AUDIT RESULTS ═══') + '\n');

        // Summary
        console.log(chalk.bold('📊 Summary'));
        console.log(`   URL: ${chalk.cyan(results[0]?.url || 'N/A')}`);
        console.log(`   Locales tested: ${chalk.cyan(results.map((r) => r.locale).join(', '))}`);
        console.log(`   Total issues: ${this.colorize(totalIssues, 'count')}`);
        console.log(`   Errors: ${chalk.red(errors)}`);
        console.log(`   Warnings: ${chalk.yellow(warnings)}`);
        console.log();

        // Issues by locale
        for (const result of results) {
            if (result.issues.length === 0) {
                console.log(chalk.green(`✓ ${result.locale.toUpperCase()}: No issues found`));
                continue;
            }

            console.log(chalk.bold(`\n🔍 ${result.locale.toUpperCase()} (${result.issues.length} issues)`));

            const tableData = [
                [
                    chalk.bold('Severity'),
                    chalk.bold('Element'),
                    chalk.bold('Overflow'),
                    chalk.bold('Text'),
                ],
                ...result.issues.map((issue) => [
                    this.formatSeverity(issue.severity),
                    this.truncate(issue.selector, 40),
                    this.formatOverflow(issue),
                    this.truncate(issue.textContent, 25),
                ]),
            ];

            console.log(
                table(tableData, {
                    border: {
                        topBody: '─',
                        topJoin: '┬',
                        topLeft: '┌',
                        topRight: '┐',
                        bottomBody: '─',
                        bottomJoin: '┴',
                        bottomLeft: '└',
                        bottomRight: '┘',
                        bodyLeft: '│',
                        bodyRight: '│',
                        bodyJoin: '│',
                        joinBody: '─',
                        joinLeft: '├',
                        joinRight: '┤',
                        joinJoin: '┼',
                    },
                })
            );
        }

        // Overall status
        console.log();
        if (errors > 0) {
            console.log(
                chalk.bgRed.white.bold(' FAIL ') +
                ` Found ${errors} error(s) that will likely cause layout breaks.`
            );
        } else if (warnings > 0) {
            console.log(
                chalk.bgYellow.black.bold(' WARN ') +
                ` Found ${warnings} warning(s) that should be reviewed.`
            );
        } else if (totalIssues > 0) {
            console.log(
                chalk.bgBlue.white.bold(' INFO ') +
                ` Found ${totalIssues} minor issue(s).`
            );
        } else {
            console.log(chalk.bgGreen.white.bold(' PASS ') + ' No i18n layout issues detected! 🎉');
        }
        console.log();
    }

    /**
     * Save report to file
     */
    async save(results: AuditResult[], outputPath: string): Promise<void> {
        const content = await this.report(results);
        const ext = this.format === 'json' ? 'json' : this.format === 'html' ? 'html' : 'txt';
        const filename = `lingo-guardian-report-${Date.now()}.${ext}`;
        const fullPath = path.join(outputPath, filename);

        await fs.mkdir(outputPath, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');

        console.log(chalk.green(`\n📄 Report saved to: ${fullPath}`));
    }

    private formatTable(results: AuditResult[]): string {
        // Return plain text version of the table
        const lines: string[] = [];

        for (const result of results) {
            lines.push(`\n=== ${result.locale.toUpperCase()} ===`);
            lines.push(`URL: ${result.url}`);
            lines.push(`Issues: ${result.issueCount}`);
            lines.push('');

            for (const issue of result.issues) {
                lines.push(
                    `[${issue.severity.toUpperCase()}] ${issue.selector}` +
                    `  (${issue.scrollWidth}x${issue.scrollHeight} > ${issue.offsetWidth}x${issue.offsetHeight})` +
                    `  "${issue.textContent}"`
                );
            }
        }

        return lines.join('\n');
    }

    private formatJSON(results: AuditResult[]): string {
        return JSON.stringify(results, null, 2);
    }

    private formatHTML(results: AuditResult[]): string {
        const totalIssues = results.reduce((sum, r) => sum + r.issueCount, 0);
        const errors = results.flatMap((r) => r.issues).filter((i) => i.severity === 'error').length;

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lingo-Guardian Audit Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #8B5CF6, #06B6D4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .stat {
      background: #1e293b;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .stat-value { font-size: 2.5rem; font-weight: bold; }
    .stat-label { color: #94a3b8; margin-top: 0.5rem; }
    .stat.error .stat-value { color: #f87171; }
    .stat.warning .stat-value { color: #fbbf24; }
    .stat.success .stat-value { color: #4ade80; }
    .locale-section { margin: 2rem 0; }
    .locale-header {
      background: #1e293b;
      padding: 1rem 1.5rem;
      border-radius: 12px 12px 0 0;
      font-weight: 600;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #1e293b; color: #94a3b8; font-weight: 500; }
    td { background: #0f172a; }
    .severity {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity.error { background: #7f1d1d; color: #fca5a5; }
    .severity.warning { background: #78350f; color: #fcd34d; }
    .severity.info { background: #1e3a5f; color: #7dd3fc; }
    .selector { font-family: monospace; font-size: 0.85rem; color: #06B6D4; }
    .overflow { color: #f472b6; font-family: monospace; }
    .text { color: #94a3b8; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pass-badge {
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      color: #0f172a;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      margin: 2rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛡️ Lingo-Guardian Audit Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>

    <div class="summary">
      <div class="stat ${totalIssues === 0 ? 'success' : errors > 0 ? 'error' : 'warning'}">
        <div class="stat-value">${totalIssues}</div>
        <div class="stat-label">Total Issues</div>
      </div>
      <div class="stat">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">Locales Tested</div>
      </div>
      <div class="stat error">
        <div class="stat-value">${errors}</div>
        <div class="stat-label">Errors</div>
      </div>
    </div>

    ${totalIssues === 0 ? '<div class="pass-badge">✓ No i18n layout issues detected! 🎉</div>' : ''}

    ${results
                .map(
                    (result) => `
    <div class="locale-section">
      <div class="locale-header">
        ${result.locale.toUpperCase()} - ${result.issues.length} issues
      </div>
      ${result.issues.length > 0
                            ? `
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Element</th>
            <th>Overflow</th>
            <th>Text</th>
          </tr>
        </thead>
        <tbody>
          ${result.issues
                                .map(
                                    (issue) => `
          <tr>
            <td><span class="severity ${issue.severity}">${issue.severity}</span></td>
            <td class="selector">${this.escapeHtml(issue.selector)}</td>
            <td class="overflow">${issue.overflowDirection}: ${issue.scrollWidth - issue.offsetWidth}px</td>
            <td class="text">${this.escapeHtml(issue.textContent)}</td>
          </tr>
          `
                                )
                                .join('')}
        </tbody>
      </table>
      `
                            : '<p style="padding: 1rem; background: #1e293b; border-radius: 0 0 12px 12px;">✓ No issues</p>'
                        }
    </div>
    `
                )
                .join('')}
  </div>
</body>
</html>`;
    }

    private formatSeverity(severity: Severity): string {
        switch (severity) {
            case 'error':
                return chalk.red('● ERROR');
            case 'warning':
                return chalk.yellow('● WARN');
            case 'info':
                return chalk.blue('● INFO');
        }
    }

    private formatOverflow(issue: OverflowIssue): string {
        const direction = issue.overflowDirection === 'horizontal' ? '↔' : issue.overflowDirection === 'vertical' ? '↕' : '↔↕';
        const widthDiff = issue.scrollWidth - issue.offsetWidth;
        const heightDiff = issue.scrollHeight - issue.offsetHeight;

        if (issue.overflowDirection === 'horizontal') {
            return chalk.magenta(`${direction} +${widthDiff}px`);
        } else if (issue.overflowDirection === 'vertical') {
            return chalk.magenta(`${direction} +${heightDiff}px`);
        }
        return chalk.magenta(`${direction} +${widthDiff}x${heightDiff}px`);
    }

    private colorize(value: number, type: 'count'): string {
        if (value === 0) return chalk.green(value.toString());
        if (value <= 3) return chalk.yellow(value.toString());
        return chalk.red(value.toString());
    }

    private truncate(str: string, maxLength: number): string {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
