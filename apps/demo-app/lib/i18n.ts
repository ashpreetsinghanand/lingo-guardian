
import fs from 'fs/promises';
import path from 'path';

export async function getDictionary(locale: string) {
    try {
        const filePath = path.join(process.cwd(), 'locales', `${locale}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // Fallback to empty if locale file doesn't exist yet
        // (This allows source language 'en' to work by just returning key)
        return {};
    }
}
