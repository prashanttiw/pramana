export interface PassportInfo {
    raw: string;
    normalized: string;
    series: string;
    seriesType: 'Regular' | 'Official' | 'Diplomatic' | 'Unknown';
    sequenceNumber: string;
    mrzValid: boolean | null;
}

const PASSPORT_LENGTH = 8;
const PASSPORT_SEQUENCE_REGEX = /^\d{7}$/;
const ALL_ZERO_SEQUENCE_REGEX = /^0{7}$/;

/**
 * Based on publicly observed Indian passport number prefixes.
 *
 * Important:
 * - MEA does not publish a complete official mapping of all active/retired
 *   serial prefix letters.
 * - We intentionally avoid all 26 letters and accept only commonly observed
 *   prefixes in production records.
 * - Letters I/O/Q are excluded to reduce ambiguity and false positives.
 */
const VALID_PASSPORT_SERIES = new Set([
    // Common ordinary booklet serial prefixes
    'A', 'B', 'C', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    // Government-travel contexts seen in public records
    'S', // Often associated with official/service passport contexts
    'D', // Often associated with diplomatic passport contexts
]);

const PASSPORT_SERIES_TYPE: Record<string, PassportInfo['seriesType']> = {
    D: 'Diplomatic',
    S: 'Official',
    A: 'Regular',
    B: 'Regular',
    C: 'Regular',
    E: 'Regular',
    F: 'Regular',
    G: 'Regular',
    H: 'Regular',
    J: 'Regular',
    K: 'Regular',
    L: 'Regular',
    M: 'Regular',
    N: 'Regular',
    P: 'Regular',
    R: 'Regular',
    T: 'Regular',
    U: 'Regular',
    V: 'Regular',
    W: 'Regular',
    X: 'Regular',
    Y: 'Regular',
    Z: 'Regular',
};

const normalizePassport = (input: string): string => (
    input.trim().toUpperCase().replace(/\s+/g, '')
);

/**
 * Validates Indian passport number.
 *
 * Supported normalized format: A1234567
 * - 1 letter prefix (series)
 * - 7 numeric digits
 * - digit block cannot be all zeros
 *
 * Note:
 * - MRZ check digit is not part of the passport number itself and therefore
 *   cannot be validated from this standalone field.
 */
export const isValidPassport = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizePassport(input);
    if (normalized.length !== PASSPORT_LENGTH) return false;

    const series = normalized.substring(0, 1);
    if (!VALID_PASSPORT_SERIES.has(series)) return false;

    const sequenceNumber = normalized.substring(1);
    if (!PASSPORT_SEQUENCE_REGEX.test(sequenceNumber)) return false;
    if (ALL_ZERO_SEQUENCE_REGEX.test(sequenceNumber)) return false;

    return true;
};

/**
 * Returns parsed metadata for a valid Indian passport number.
 */
export const getPassportInfo = (input: string): PassportInfo | null => {
    if (!isValidPassport(input)) return null;

    const normalized = normalizePassport(input);
    const series = normalized.substring(0, 1);
    const sequenceNumber = normalized.substring(1);

    return {
        raw: input,
        normalized,
        series,
        seriesType: PASSPORT_SERIES_TYPE[series] ?? 'Unknown',
        sequenceNumber,
        mrzValid: null,
    };
};

