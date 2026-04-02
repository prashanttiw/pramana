import { GST_STATE_CODES } from '../data/gst_states';

// --------------------------------------------------------------------------
// 0. GRAPHEME-SAFE UTILITIES
// --------------------------------------------------------------------------

/**
 * Safely slices text respecting grapheme cluster boundaries.
 * Prevents breaking combined characters (e.g., consonant + matra in Devanagari).
 * Uses Intl.Segmenter (Node 16+, modern browsers).
 * 
 * @param text The input string.
 * @param start Start index (grapheme-based, 0-indexed).
 * @param end End index (grapheme-based, exclusive).
 * @returns Sliced string without breaking graphemes.
 * 
 * @complexity O(n) where n is the number of graphemes.
 */
export const safeSlice = (text: string, start: number, end?: number): string => {
    if (!text) return '';

    // Fallback for environments without Intl.Segmenter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IntlAny = Intl as any;
    if (typeof IntlAny.Segmenter !== 'function') {
        return text.slice(start, end);
    }

    const segmenter = new IntlAny.Segmenter(undefined, { granularity: 'grapheme' });
    const graphemes = Array.from(segmenter.segment(text), (s: any) => s.segment);

    return graphemes.slice(start, end).join('');
};

/**
 * Returns the number of grapheme clusters in a string.
 * Useful for accurate length measurement of Indic text.
 * 
 * @param text The input string.
 * @returns Number of grapheme clusters.
 */
export const graphemeLength = (text: string): number => {
    if (!text) return 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IntlAny = Intl as any;
    if (typeof IntlAny.Segmenter !== 'function') {
        return text.length;
    }

    const segmenter = new IntlAny.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).length;
};

// --------------------------------------------------------------------------
// 1. INDIC TEXT NORMALIZATION
// --------------------------------------------------------------------------

/**
 * Normalizes Indic text for NLP and LLM preprocessing.
 * - Converts to NFC Normalization Form.
 * - Removes Zero Width Joiners (ZWJ) and Non-Joiners (ZWNJ).
 * - Standardizes whitespace.
 * 
 * @param text The input string (e.g., Devanagari text).
 * @returns Cleaned and normalized string.
 * 
 * @complexity O(n) where n is string length.
 */
export const normalizeIndic = (text: string): string => {
    if (!text) return '';

    // 1. Unicode NFC Normalization (Canonical Composition)
    let normalized = text.normalize('NFC');

    // 2. Remove ZWNJ (\u200C) and ZWJ (\u200D)
    normalized = normalized.replace(/[\u200C\u200D]/g, '');

    // 3. Normalize whitespace (tabs, zero-width spaces, multiple spaces -> single space)
    normalized = normalized.replace(/[\s\u200b]+/g, ' ').trim();

    return normalized;
};

// --------------------------------------------------------------------------
// 2. PHONETIC MATCHING (INDIAN SOUNDEX)
// --------------------------------------------------------------------------

/**
 * Generates phonetic code tailored for Indian names.
 * Handles common variations: PH→F, BH→B, V→B, SH→S, etc.
 * 
 * @complexity O(n) where n is word length.
 */
const getIndicPhoneticCode = (word: string): string => {
    if (!word) return '';

    // 1. Uppercase and remove non-alpha
    let code = word.toUpperCase().replace(/[^A-Z]/g, '');

    if (code.length === 0) return '';

    // 2. Common Indian Phonetic Replacements (order matters)
    code = code.replace(/PH/g, 'F');
    code = code.replace(/BH/g, 'B');
    code = code.replace(/TH/g, 'T');
    code = code.replace(/SH/g, 'S');
    code = code.replace(/X/g, 'K');
    code = code.replace(/KS/g, 'K');
    code = code.replace(/[VW]/g, 'B');
    code = code.replace(/Z/g, 'J');
    code = code.replace(/EE/g, 'I');
    code = code.replace(/OO/g, 'U');
    code = code.replace(/AU|OU/g, 'O');

    // 3. Dedup adjacent characters
    code = code.replace(/(.)\1+/g, '$1');

    // 4. Remove vowels except first character
    const firstChar = code.charAt(0);
    const rest = code.slice(1).replace(/[AEIOUY]/g, '');

    return firstChar + rest;
};

/**
 * Calculates phonetic similarity score (0-1) between two Indian names.
 * Uses modified Soundex + Levenshtein distance.
 * 
 * @param str1 First string.
 * @param str2 Second string.
 * @returns Similarity score between 0 and 1.
 * 
 * @complexity O(m*n) time, O(min(m,n)) space where m,n are phonetic code lengths.
 */
export const phoneticMatch = (str1: string, str2: string): number => {
    const code1 = getIndicPhoneticCode(str1);
    const code2 = getIndicPhoneticCode(str2);

    if (!code1 || !code2) return 0;
    if (code1 === code2) return 1;

    const distance = levenshteinOptimized(code1, code2);
    const maxLength = Math.max(code1.length, code2.length);

    return 1 - (distance / maxLength);
};

/**
 * Memory-optimized Levenshtein distance using two-row technique.
 * 
 * @complexity O(m*n) time, O(min(m,n)) space.
 */
const levenshteinOptimized = (a: string, b: string): number => {
    // Ensure 'a' is the shorter string for space optimization
    if (a.length > b.length) [a, b] = [b, a];

    const m = a.length;
    const n = b.length;

    // Use only two rows instead of full matrix
    let prevRow = new Array(m + 1);
    let currRow = new Array(m + 1);

    // Initialize first row
    for (let j = 0; j <= m; j++) prevRow[j] = j;

    for (let i = 1; i <= n; i++) {
        currRow[0] = i;

        for (let j = 1; j <= m; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                currRow[j] = prevRow[j - 1];
            } else {
                currRow[j] = 1 + Math.min(
                    prevRow[j - 1], // substitution
                    prevRow[j],     // deletion
                    currRow[j - 1]  // insertion
                );
            }
        }

        // Swap rows
        [prevRow, currRow] = [currRow, prevRow];
    }

    return prevRow[m];
};


// --------------------------------------------------------------------------
// 3. ADDRESS PARSING (NER-LITE)
// --------------------------------------------------------------------------

export interface AddressObject {
    pincode: string | null;
    city: string | null;
    state: string | null;
    landmarks: string[];
}

// Inverted state map: Name -> Code
const STATE_NAMES = Object.values(GST_STATE_CODES).map(s => s.toLowerCase());

/**
 * Heuristically parses an Indian address string.
 * @param address The raw address string.
 */
export const parseAddress = (address: string): AddressObject => {
    const result: AddressObject = {
        pincode: null,
        city: null,
        state: null,
        landmarks: []
    };

    if (!address) return result;

    const lowerAddr = address.toLowerCase();

    // 1. Extract Pincode (6 digits, word boundary)
    // Look for pattern like "110001"
    const pinMatch = address.match(/\b\d{6}\b/);
    if (pinMatch) {
        result.pincode = pinMatch[0];
    }

    // 2. Extract State (Simple keyword matching)
    // We iterate known states.
    // Optimization: This is O(N) on states.
    for (const stateName of STATE_NAMES) {
        // Check valid boundaries to avoid partial matches inside words
        if (new RegExp(`\\b${stateName}\\b`, 'i').test(address)) {
            result.state = stateName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase()))); // Title Case
            break; // Assume one state
        }
    }

    // 3. Extract Landmarks (Near, Opp, Behind)
    const landmarkKeywords = ['near', 'opposite', 'opp', 'behind', 'adj', 'adjacent', 'next to'];
    // Split by comma or newline, but NOT by dot (which breaks 'Opp.')
    const parts = address.split(/[,|\n]+/);

    for (const part of parts) {
        const trimmed = part.trim();
        const lowerPart = trimmed.toLowerCase();

        for (const kw of landmarkKeywords) {
            // Check if it STARTS with keyword followed by non-alpha (space, dot, etc)
            // Or contains keyword surrounded by spaces
            // Regex for keyword at start: ^kw(\W|$)
            const kwRegex = new RegExp(`^${kw}(\\W|$)`, 'i');

            if (kwRegex.test(lowerPart) || lowerPart.includes(' ' + kw + ' ')) {
                // Clean trailing punctuation (dots, commas are already gone from split, but dots remain)
                const cleanLandmark = trimmed.replace(/[.]+$/, '');
                result.landmarks.push(cleanLandmark);
                break;
            }
        }
    }

    // 4. City Extraction (Very hard without a DB)
    // Heuristic: If we found a Pincode, sometimes we can look near it?
    // Or assume the word before state?
    // Currently leaving City as null unless we match explicit known cities (out of scope for "Lite").
    // We will leave it as null for now or implement a basic "last word before pincode" heuristic if requested,
    // but the prompt asked for "Identify Indian-specific keywords... extract PIN, State, City, Landmark".
    // I'll try to guess standard metros if present.
    const COMMON_CITIES = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow'];
    for (const city of COMMON_CITIES) {
        if (new RegExp(`\\b${city}\\b`, 'i').test(address)) {
            result.city = city.charAt(0).toUpperCase() + city.slice(1);
            break;
        }
    }

    return result;
};
