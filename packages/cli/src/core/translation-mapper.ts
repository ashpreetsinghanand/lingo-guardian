/**
 * Translation Mapper
 * 
 * Maps translated text back to original English text and source location.
 * This helps developers identify which component has issues when testing
 * non-English locales.
 */

import fs from 'fs/promises';
import path from 'path';

export interface TranslationEntry {
    englishText: string;
    translatedText: string;
    key: string;
}

export interface TranslationMap {
    /** Map from translated text (normalized) to English original */
    reverseMap: Map<string, TranslationEntry>;
    /** Map from English text (normalized) to translation key */
    englishToKey: Map<string, string>;
}

export class TranslationMapper {
    private projectPath: string;
    private localesDir: string;
    private englishLocale: Record<string, string> = {};
    private translationMaps: Map<string, TranslationMap> = new Map();

    constructor(projectPath: string) {
        this.projectPath = projectPath;
        this.localesDir = path.join(projectPath, 'locales');
    }

    /**
     * Load all locale files and build reverse translation maps
     */
    async load(): Promise<void> {
        try {
            // Load English locale first
            const enPath = path.join(this.localesDir, 'en.json');
            const enContent = await fs.readFile(enPath, 'utf-8');
            this.englishLocale = JSON.parse(enContent);

            // Build English text to key map
            const englishToKey = new Map<string, string>();
            for (const [key, value] of Object.entries(this.englishLocale)) {
                englishToKey.set(this.normalize(value), key);
            }

            // Load all other locales and build reverse maps
            const files = await fs.readdir(this.localesDir);
            for (const file of files) {
                if (!file.endsWith('.json') || file === 'en.json') continue;

                const locale = file.replace('.json', '');
                const localePath = path.join(this.localesDir, file);
                const content = await fs.readFile(localePath, 'utf-8');
                const translations: Record<string, string> = JSON.parse(content);

                // Build reverse map: translated text → English original
                const reverseMap = new Map<string, TranslationEntry>();
                for (const [key, translatedText] of Object.entries(translations)) {
                    const englishText = this.englishLocale[key] || key;
                    reverseMap.set(this.normalize(translatedText), {
                        englishText,
                        translatedText,
                        key,
                    });
                }

                this.translationMaps.set(locale, { reverseMap, englishToKey });
            }
        } catch (error) {
            // Silently fail - locales may not exist
        }
    }

    /**
     * Find the English original for a translated text
     */
    findEnglishOriginal(text: string, locale?: string): TranslationEntry | null {
        const normalizedText = this.normalize(text);

        // If checking a specific locale
        if (locale && locale !== 'en') {
            const map = this.translationMaps.get(locale);
            if (map) {
                // Try exact match first
                const entry = map.reverseMap.get(normalizedText);
                if (entry) return entry;

                // Try partial match (text might be truncated or contain extra content)
                for (const [key, entry] of map.reverseMap) {
                    if (normalizedText.includes(key) || key.includes(normalizedText)) {
                        return entry;
                    }
                }
            }
        }

        // Check all locales
        for (const [localeKey, map] of this.translationMaps) {
            const entry = map.reverseMap.get(normalizedText);
            if (entry) return entry;

            // Partial match
            for (const [key, entry] of map.reverseMap) {
                if (normalizedText.includes(key) || key.includes(normalizedText)) {
                    return entry;
                }
            }
        }

        return null;
    }

    /**
     * Check if text is English (exists in English locale)
     */
    isEnglish(text: string): boolean {
        const normalized = this.normalize(text);
        for (const value of Object.values(this.englishLocale)) {
            if (this.normalize(value) === normalized ||
                normalized.includes(this.normalize(value)) ||
                this.normalize(value).includes(normalized)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get English text for a translation key
     */
    getEnglishForKey(key: string): string | null {
        return this.englishLocale[key] || null;
    }

    /**
     * Normalize text for comparison
     */
    private normalize(text: string): string {
        return text
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }
}
