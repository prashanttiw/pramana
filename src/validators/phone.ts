import { INVALID_6_SERIES_PREFIXES, VALID_MOBILE_PREFIXES } from '../data/mobileSeriesAllocation';

export interface PhoneInfo {
    raw: string;
    normalized: string;
    withCountryCode: string;
    series: string;
    isValid: boolean;
}

const NORMALIZATION_SEPARATOR_REGEX = /[\s\-().]/g;
const INVALID_INPUT_CHAR_REGEX = /[^0-9+\s\-().]/;
const DIGITS_ONLY_REGEX = /^\d+$/;
const TEN_DIGIT_REGEX = /^\d{10}$/;
const ALL_SAME_DIGIT_REGEX = /^(\d)\1{9}$/;
const KNOWN_FAKE_PHONE_PATTERNS: ReadonlySet<string> = new Set([
    '0123456789',
    '1234567890',
]);

const stripCountryCode = (value: string): string => {
    if (value.startsWith('0091')) return value.substring(4);
    if (value.startsWith('91') && value.length === 12) return value.substring(2);
    return value;
};

const normalizeLocalLeadingZero = (value: string): string => {
    if (value.startsWith('0') && value.length > 10) return value.substring(1);
    return value;
};

/**
 * Normalizes an Indian phone candidate to a 10-digit NSN.
 *
 * Supported cleanup:
 * - Removes spaces, hyphens, dots, and parentheses
 * - Strips +91 / 0091 / 91 country prefixes when applicable
 * - Strips a local leading 0 when present
 *
 * Returns null when normalization is impossible or cannot produce 10 digits.
 */
export const normalisePhone = (input: string): string | null => {
    if (typeof input !== 'string') return null;
    if (input.trim().length === 0) return null;
    if (INVALID_INPUT_CHAR_REGEX.test(input)) return null;

    let compact = input.trim().replace(NORMALIZATION_SEPARATOR_REGEX, '');
    if (compact.length === 0) return null;

    const plusCount = (compact.match(/\+/g) ?? []).length;
    if (plusCount > 1) return null;
    if (plusCount === 1 && !compact.startsWith('+')) return null;

    if (compact.startsWith('+')) {
        if (!compact.startsWith('+91')) return null;
        compact = compact.substring(3);
    }

    if (!DIGITS_ONLY_REGEX.test(compact)) return null;

    compact = stripCountryCode(compact);
    compact = normalizeLocalLeadingZero(compact);
    compact = stripCountryCode(compact);
    compact = normalizeLocalLeadingZero(compact);

    if (!TEN_DIGIT_REGEX.test(compact)) return null;
    return compact;
};

const isValidNormalizedIndianPhone = (normalized: string): boolean => {
    if (!TEN_DIGIT_REGEX.test(normalized)) return false;
    if (ALL_SAME_DIGIT_REGEX.test(normalized)) return false;
    if (KNOWN_FAKE_PHONE_PATTERNS.has(normalized)) return false;

    const series = normalized.charAt(0);
    if (!VALID_MOBILE_PREFIXES.has(series)) return false;

    if (series === '6') {
        const prefix4 = normalized.substring(0, 4);
        if (INVALID_6_SERIES_PREFIXES.has(prefix4)) return false;
    }

    return true;
};

/**
 * Validates an Indian mobile number candidate.
 *
 * Returns false for invalid input and never throws.
 */
export const isValidIndianPhone = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;

    const normalized = normalisePhone(input);
    if (normalized == null) return false;

    return isValidNormalizedIndianPhone(normalized);
};

/**
 * Returns normalized metadata for Indian phone input.
 *
 * Returns null if the value cannot be normalized to a 10-digit candidate.
 */
export const getPhoneInfo = (input: string): PhoneInfo | null => {
    const normalized = normalisePhone(input);
    if (normalized == null) return null;
    if (!isValidNormalizedIndianPhone(normalized)) return null;

    return {
        raw: input,
        normalized,
        withCountryCode: `+91${normalized}`,
        series: normalized.charAt(0),
        isValid: true,
    };
};
