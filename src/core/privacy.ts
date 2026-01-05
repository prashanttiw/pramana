import { validateVerhoeff } from '../utils/verhoeff';
import { isValidPAN } from '../validators/pan';
import { isValidGSTIN } from '../validators/gstin';

export interface ScrubOptions {
    maskChar?: string; // Default '*'
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
 * Scans text for sensitive Indian PII (Aadhaar, PAN, GSTIN) and redacts them.
 * Uses strict checksum verification to avoid false positives (e.g., random 12-digit numbers).
 * @param text Input text.
 * @param options Configuration for scrubbing.
 */
export const scrubPII = (text: string, options: ScrubOptions = {}): string => {
    if (!text) return '';

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const mask = (len: number) => opts.maskChar!.repeat(len);

    let processed = text;

    // 1. Scrub Aadhaar (12 digits, optional spaces/dashes)
    if (opts.scrubAadhaar) {
        // Regex to find candidate 12-digit numbers with common separators
        // Matches: "1234 5678 9012", "1234-5678-9012", "123456789012"
        const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;

        processed = processed.replace(aadhaarRegex, (match) => {
            const clean = match.replace(/[- ]/g, '');
            if (clean.length === 12 && validateVerhoeff(clean)) {
                return `[AADHAAR_MASKED]`; // Or mask(match.length)
            }
            return match; // Not a valid Aadhaar (checksum failed)
        });
    }

    // 2. Scrub PAN
    if (opts.scrubPAN) {
        // Regex for PAN structure
        const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;

        processed = processed.replace(panRegex, (match) => {
            // We can strictly verify using existing validator logic if needed,
            // but the Regex itself is quite specific.
            // Using isValidPAN to be sure (e.g. 4th char check).
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
