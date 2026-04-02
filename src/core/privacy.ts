import { isValidAadhaar } from '../validators/aadhaar';
import { isValidPAN } from '../validators/pan';
import { isValidGSTIN } from '../validators/gstin';

export interface ScrubOptions {
    maskChar?: string;
    scrubAadhaar?: boolean;
    scrubPAN?: boolean;
    scrubGSTIN?: boolean;
}

const DEFAULT_OPTIONS: ScrubOptions = {
    maskChar: 'X',
    scrubAadhaar: true,
    scrubPAN: true,
    scrubGSTIN: true
};

/**
 * Invisible/control characters that attackers might inject between digits.
 * Includes: ZWNJ, ZWJ, Zero-Width Space, Soft Hyphen, etc.
 */
const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\u00AD\uFEFF\u2060\u180E]/g;

/**
 * Strips invisible Unicode characters from a string.
 * Critical for preventing obfuscation attacks on PII detection.
 * 
 * @param text Input text.
 * @returns Text with invisible characters removed.
 */
const stripInvisibleChars = (text: string): string => {
    return text.replace(INVISIBLE_CHARS_REGEX, '');
};

/**
 * Scans text for sensitive Indian PII (Aadhaar, PAN, GSTIN) and redacts them.
 * 
 * **Security Features**:
 * - Strips invisible Unicode characters before detection (prevents obfuscation).
 * - Uses strict checksum verification (Verhoeff for Aadhaar, Mod-36 for GSTIN).
 * - Prevents false positives on random numbers.
 * 
 * @param text Input text.
 * @param options Configuration for scrubbing.
 * @returns Sanitized text with PII replaced by mask tokens.
 * 
 * @complexity O(n) where n is text length.
 */
export const scrubPII = (text: string, options: ScrubOptions = {}): string => {
    if (!text) return '';

    const opts = { ...DEFAULT_OPTIONS, ...options };

    // SECURITY: Strip invisible characters before processing
    let processed = stripInvisibleChars(text);

    // 1. Scrub Aadhaar (12 digits, optional spaces/dashes)
    if (opts.scrubAadhaar) {
        // Regex to find candidate 12-digit numbers with common separators
        const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;

        processed = processed.replace(aadhaarRegex, (match) => {
            const clean = match.replace(/[- ]/g, '');
            if (isValidAadhaar(clean)) {
                return `[AADHAAR_MASKED]`;
            }
            return match;
        });
    }

    // 2. Scrub PAN
    if (opts.scrubPAN) {
        const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;

        processed = processed.replace(panRegex, (match) => {
            if (isValidPAN(match)) {
                return `[PAN_MASKED]`;
            }
            return match;
        });
    }

    // 3. Scrub GSTIN
    if (opts.scrubGSTIN) {
        const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g;

        processed = processed.replace(gstinRegex, (match) => {
            if (isValidGSTIN(match)) {
                return `[GSTIN_MASKED]`;
            }
            return match;
        });
    }

    return processed;
};
