/**
 * SourceFinder - Scans project source files to find where text content is defined
 * 
 * This uses the CLI's direct file system access to match detected overflow
 * elements back to their source code locations.
 * 
 * PRIORITY:
 * 1. t("text") or translate("text") - Actual i18n usage (highest priority)
 * 2. JSX text content: >text< - Rendered content
 * 3. Regular strings - Configuration/metadata (lowest priority)
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SourceLocation {
    file: string;
    line: number;
    column?: number;
    priority: 'i18n' | 'jsx' | 'string';
}

interface TextLocationMap {
    [text: string]: SourceLocation[];
}

export class SourceFinder {
    private projectRoot: string;
    private i18nMap: TextLocationMap = {};     // t("text"), translate("text")
    private jsxMap: TextLocationMap = {};      // >text<
    private stringMap: TextLocationMap = {};   // "text", 'text', `text`
    private scanned: boolean = false;

    // File extensions to scan
    private readonly EXTENSIONS = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte', '.html'];

    // Directories to skip
    private readonly SKIP_DIRS = ['node_modules', '.next', 'dist', 'build', '.git', 'coverage'];

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
    }

    /**
     * Scan project source files and build a map of text content to source locations
     */
    public async scan(): Promise<void> {
        if (this.scanned) return;

        await this.scanDirectory(this.projectRoot);
        this.scanned = true;
    }

    /**
     * Find source location for given text content
     * Priority: i18n patterns > JSX content > regular strings
     */
    public findSource(textContent: string): SourceLocation | null {
        const normalizedText = this.normalizeText(textContent);

        // 1. Try i18n patterns first (highest priority)
        const i18nMatch = this.findInMap(normalizedText, this.i18nMap, 'i18n');
        if (i18nMatch) return i18nMatch;

        // 2. Try JSX text content
        const jsxMatch = this.findInMap(normalizedText, this.jsxMap, 'jsx');
        if (jsxMatch) return jsxMatch;

        // 3. Fall back to regular strings (metadata, etc.)
        const stringMatch = this.findInMap(normalizedText, this.stringMap, 'string');
        if (stringMatch) return stringMatch;

        return null;
    }

    /**
     * Find text in a specific map with exact or partial matching
     */
    private findInMap(text: string, map: TextLocationMap, priority: 'i18n' | 'jsx' | 'string'): SourceLocation | null {
        // Exact match
        if (map[text] && map[text].length > 0) {
            return { ...map[text][0], priority };
        }

        // Partial match
        for (const [key, locations] of Object.entries(map)) {
            if (locations.length > 0 && (key.includes(text) || text.includes(key))) {
                return { ...locations[0], priority };
            }
        }

        return null;
    }

    /**
     * Recursively scan a directory for source files
     */
    private async scanDirectory(dir: string): Promise<void> {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    if (!this.SKIP_DIRS.includes(entry.name)) {
                        await this.scanDirectory(fullPath);
                    }
                } else if (entry.isFile() && this.EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
                    await this.scanFile(fullPath);
                }
            }
        } catch {
            // Ignore errors (permission denied, etc.)
        }
    }

    /**
     * Scan a single file for text content
     */
    private async scanFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const relativePath = path.relative(this.projectRoot, filePath);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNumber = i + 1;

                this.extractStrings(line, relativePath, lineNumber);
            }
        } catch {
            // Ignore errors
        }
    }

    /**
     * Extract string literals from a line of code into categorized maps
     */
    private extractStrings(line: string, file: string, lineNumber: number): void {
        // Pattern 1: i18n functions (highest priority)
        const i18nPatterns = [
            /t\(["'`]([^"'`]+)["'`]\)/g,
            /translate\(["'`]([^"'`]+)["'`]\)/g,
            /\$t\(["'`]([^"'`]+)["'`]\)/g,
            /i18n\.t\(["'`]([^"'`]+)["'`]\)/g,
        ];
        for (const pattern of i18nPatterns) {
            let match;
            while ((match = pattern.exec(line)) !== null) {
                this.addToMap(this.i18nMap, match[1], file, lineNumber);
            }
        }

        // Pattern 2: JSX text content
        const jsxPattern = />([^<>]{3,})</g;
        let jsxMatch;
        while ((jsxMatch = jsxPattern.exec(line)) !== null) {
            const text = jsxMatch[1].trim();
            if (text.length >= 3 && !text.startsWith('{')) {
                this.addToMap(this.jsxMap, text, file, lineNumber);
            }
        }

        // Pattern 3: Regular string literals (exclude object keys and imports)
        if (!line.includes('import ') && !line.includes('require(')) {
            const stringPatterns = [
                /"([^"\\]{3,})"/g,
                /'([^'\\]{3,})'/g,
            ];
            for (const pattern of stringPatterns) {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    // Skip if it looks like an object key (followed by :)
                    const afterMatch = line.substring(match.index + match[0].length);
                    if (!afterMatch.trim().startsWith(':')) {
                        this.addToMap(this.stringMap, match[1], file, lineNumber);
                    }
                }
            }
        }
    }

    /**
     * Add a text entry to a map
     */
    private addToMap(map: TextLocationMap, text: string, file: string, line: number): void {
        const normalizedText = this.normalizeText(text);
        if (normalizedText.length >= 3) {
            if (!map[normalizedText]) {
                map[normalizedText] = [];
            }
            map[normalizedText].push({ file, line, priority: 'string' });
        }
    }

    /**
     * Normalize text for matching (trim, collapse whitespace)
     */
    private normalizeText(text: string): string {
        return text
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }
}
