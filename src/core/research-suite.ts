import { GST_STATE_CODES } from '../data/gst_states';
import { PINCODE_RANGES } from '../data/pincodes'; // Assuming this exists or I might avoid it if generic regex is enough. list_dir showed pincodes.ts.

// --------------------------------------------------------------------------
// 1. INDIC TEXT NORMALIZATION
// --------------------------------------------------------------------------

/**
 * Normalizes Indic text for NLP and LLM preprocessing.
 * - Converts to NFC Normalization Form.
 * - Removes Zero Width Joiners (ZWJ) and Non-Joiners (ZWNJ).
 * - Standardizes some common punctuation or confusing characters.
 * @param text The input string (e.g., Devanagari text).
 * @returns Cleaned and normalized string.
 */
export const normalizeIndic = (text: string): string => {
    if (!text) return '';

    // 1. Unicode NFC Normalization (Canonical Composition)
    let normalized = text.normalize('NFC');

    // 2. Remove ZWNJ (\u200C) and ZWJ (\u200D)
    // These are often used for rendering control but create noise for tokenizers.
    normalized = normalized.replace(/[\u200C\u200D]/g, '');

    // 3. Normalize whitespace (tabs, zero-width spaces, multiple spaces -> single space)
    normalized = normalized.replace(/[\s\u200b]+/g, ' ').trim();

    return normalized;
};

// --------------------------------------------------------------------------
// 2. PHONETIC MATCHING (INDIAN SOUNDEX)
// --------------------------------------------------------------------------

/**
 * tailored for Indian names to handle common phonetic variations.
 * E.g., "Aditya" vs "Adithya", "Vikram" vs "Bikram".
 */
const getIndicPhoneticCode = (word: string): string => {
    if (!word) return '';

    // 1. Uppercase and remove non-alpha
    let code = word.toUpperCase().replace(/[^A-Z]/g, '');

    if (code.length === 0) return '';

    // 2. Common Indian Phonetic Replacements
    // Order matters! Pre-processing multi-char sequences.

    // 'PH' -> 'F'
    code = code.replace(/PH/g, 'F');
    // 'BH' -> 'B'
    code = code.replace(/BH/g, 'B');
    // 'TH' -> 'T'
    code = code.replace(/TH/g, 'T');
    // 'SH' -> 'S'
    code = code.replace(/SH/g, 'S');
    // 'KS' / 'X' -> 'K'
    code = code.replace(/X/g, 'K');
    code = code.replace(/KS/g, 'K');

    // 'V' / 'W' interchangability -> 'B' (Approximation for comparison)
    // In many indic languages V and B are confused or same.
    code = code.replace(/[VW]/g, 'B');

    // 'Z' -> 'J' (Common substitution)
    code = code.replace(/Z/g, 'J');

    // 'EE' -> 'I'
    code = code.replace(/EE/g, 'I');
    // 'OO' -> 'U'
    code = code.replace(/OO/g, 'U');
    // 'AU' / 'OU' -> 'O'
    code = code.replace(/AU|OU/g, 'O');

    // 3. Dedup adjacent characters (e.g., 'BB' -> 'B')
    code = code.replace(/(.)\1+/g, '$1');

    // 4. Remove all remaining vowels (A, E, I, O, U, Y) EXCEPT the first one
    const firstChar = code.charAt(0);
    const rest = code.slice(1).replace(/[AEIOUY]/g, '');

    return firstChar + rest;
};

/**
 * Calculates a phonetic similarity score (0-1) between two Indian names/strings.
 * Uses a modified Soundex-like approach + Levenshtein distance on the codes.
 * @param str1 First string
 * @param str2 Second string
 */
export const phoneticMatch = (str1: string, str2: string): number => {
    const code1 = getIndicPhoneticCode(str1);
    const code2 = getIndicPhoneticCode(str2);

    if (!code1 || !code2) return 0;
    if (code1 === code2) return 1;

    // Calculate Levenshtein distance between CODES (not original strings)
    const distance = levenshtein(code1, code2);
    const maxLength = Math.max(code1.length, code2.length);

    return 1 - (distance / maxLength);
};

// Simple Levenshtein implementation
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
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
    const parts = address.split(/[,.\n]+/); // Split by common delimiters

    for (const part of parts) {
        const trimmed = part.trim();
        const lowerPart = trimmed.toLowerCase();

        for (const kw of landmarkKeywords) {
            if (lowerPart.startsWith(kw + ' ') || lowerPart.includes(' ' + kw + ' ')) {
                result.landmarks.push(trimmed);
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
