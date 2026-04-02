import { describe, it, expect } from 'vitest';
import { getTANInfo, isValidTAN } from '../src/validators/tan';

// ---------------------------------------------------------------------------
// Named TAN fixtures (avoid magic literals in tests)
// ---------------------------------------------------------------------------
const VALID_TAN_MUMBAI = 'MUMX12345B';
const VALID_TAN_DELHI = 'DELX54321C';
const VALID_TAN_CHENNAI = 'CHNX00001D';
const VALID_TAN_KOLKATA = 'KOLX99999E';
const VALID_TAN_HYDERABAD = 'HYDX24680F';
const VALID_TAN_PUNE = 'PUNX11111G';

const BASE_VALID_TAN = VALID_TAN_MUMBAI;
const TOO_SHORT_TAN = BASE_VALID_TAN.slice(0, 9);
const TOO_LONG_TAN = `${BASE_VALID_TAN}1`;

const INVALID_POS_1_DIGIT = '1UMX12345B';
const INVALID_POS_2_DIGIT = 'M1MX12345B';
const INVALID_POS_3_DIGIT = 'MU1X12345B';
const INVALID_POS_4_DIGIT = 'MUM112345B';
const INVALID_POS_4_SYMBOL = 'MUM@12345B';
const INVALID_POS_5_ALPHA = 'MUMXA2345B';
const INVALID_POS_6_ALPHA = 'MUMX1A345B';
const INVALID_POS_7_ALPHA = 'MUMX12A45B';
const INVALID_POS_8_ALPHA = 'MUMX123A5B';
const INVALID_POS_9_ALPHA = 'MUMX1234AB';
const INVALID_POS_10_DIGIT = 'MUMX123451';

const ALL_DIGITS_TAN = '1234567890';
const ALL_LETTERS_TAN = 'ABCDEFGHIJ';

const LOWERCASE_TAN = 'mumx12345b';
const SPACED_TAN = 'MUMX 12345 B';
const HYPHENATED_TAN = 'MUMX-12345-B';
const PADDED_TAN = '   MUMX12345B   ';

const EMPTY_STRING_TAN = '';
const WHITESPACE_ONLY_TAN = '     ';

const SAME_DIGITS_NUMERIC_SECTION_TAN = 'ABCD11111E';
const POSITION4_BOUNDARY_LOW_TAN = 'ABCA12345E';
const POSITION4_BOUNDARY_HIGH_TAN = 'ABCZ12345E';
const POSITION4_OUTSIDE_VALID_RANGE_TAN = 'ABC[12345E';

const INVALID_PAN_LIKE_VALUE = 'ABCPE1234F';
const INFO_INPUT_WITH_NOISE = ' mumx-12345-b ';

describe('TAN Validator - Valid Inputs', () => {
    it('accepts valid Mumbai TAN with standard structure', () => {
        expect(isValidTAN(VALID_TAN_MUMBAI)).toBe(true);
    });

    it('accepts valid Delhi TAN with different sequence and last character', () => {
        expect(isValidTAN(VALID_TAN_DELHI)).toBe(true);
    });

    it('accepts valid Chennai TAN with zero-heavy sequence', () => {
        expect(isValidTAN(VALID_TAN_CHENNAI)).toBe(true);
    });

    it('accepts valid Kolkata TAN with high numeric sequence', () => {
        expect(isValidTAN(VALID_TAN_KOLKATA)).toBe(true);
    });

    it('accepts valid Hyderabad TAN with alternating numeric sequence', () => {
        expect(isValidTAN(VALID_TAN_HYDERABAD)).toBe(true);
    });

    it('accepts valid Pune TAN with repeated numeric sequence', () => {
        expect(isValidTAN(VALID_TAN_PUNE)).toBe(true);
    });
});

describe('TAN Validator - Invalid Format (Structure)', () => {
    it('rejects TAN that is too short (9 chars)', () => {
        expect(isValidTAN(TOO_SHORT_TAN)).toBe(false);
    });

    it('rejects TAN that is too long (11 chars)', () => {
        expect(isValidTAN(TOO_LONG_TAN)).toBe(false);
    });

    it('rejects digit at position 1 where alphabet is required', () => {
        expect(isValidTAN(INVALID_POS_1_DIGIT)).toBe(false);
    });

    it('rejects digit at position 2 where alphabet is required', () => {
        expect(isValidTAN(INVALID_POS_2_DIGIT)).toBe(false);
    });

    it('rejects digit at position 3 where alphabet is required', () => {
        expect(isValidTAN(INVALID_POS_3_DIGIT)).toBe(false);
    });

    it('rejects digit at position 4 because TAN position 4 must be TAN-specific alphabetic code', () => {
        expect(isValidTAN(INVALID_POS_4_DIGIT)).toBe(false);
    });

    it('rejects symbol at position 4 because TAN position 4 must be alphabetic', () => {
        expect(isValidTAN(INVALID_POS_4_SYMBOL)).toBe(false);
    });

    it('rejects alphabet at position 5 where digit is required', () => {
        expect(isValidTAN(INVALID_POS_5_ALPHA)).toBe(false);
    });

    it('rejects alphabet at position 6 where digit is required', () => {
        expect(isValidTAN(INVALID_POS_6_ALPHA)).toBe(false);
    });

    it('rejects alphabet at position 7 where digit is required', () => {
        expect(isValidTAN(INVALID_POS_7_ALPHA)).toBe(false);
    });

    it('rejects alphabet at position 8 where digit is required', () => {
        expect(isValidTAN(INVALID_POS_8_ALPHA)).toBe(false);
    });

    it('rejects alphabet at position 9 where digit is required', () => {
        expect(isValidTAN(INVALID_POS_9_ALPHA)).toBe(false);
    });

    it('rejects digit at position 10 where alphabet is required', () => {
        expect(isValidTAN(INVALID_POS_10_DIGIT)).toBe(false);
    });

    it('rejects all-digits value because TAN requires alphabets at multiple positions', () => {
        expect(isValidTAN(ALL_DIGITS_TAN)).toBe(false);
    });

    it('rejects all-letters value because TAN requires five digits in the middle', () => {
        expect(isValidTAN(ALL_LETTERS_TAN)).toBe(false);
    });
});

describe('TAN Validator - Invalid Type Inputs (Null Safety)', () => {
    it('returns false for null input', () => {
        expect(isValidTAN(null)).toBe(false);
    });

    it('returns false for undefined input', () => {
        expect(isValidTAN(undefined)).toBe(false);
    });

    it('returns false for number input', () => {
        expect(isValidTAN(12345)).toBe(false);
    });

    it('returns false for boolean input', () => {
        expect(isValidTAN(true)).toBe(false);
    });

    it('returns false for empty string input', () => {
        expect(isValidTAN(EMPTY_STRING_TAN)).toBe(false);
    });

    it('returns false for whitespace-only input', () => {
        expect(isValidTAN(WHITESPACE_ONLY_TAN)).toBe(false);
    });

    it('returns false for empty array input', () => {
        expect(isValidTAN([])).toBe(false);
    });

    it('returns false for empty object input', () => {
        expect(isValidTAN({})).toBe(false);
    });
});

describe('TAN Validator - Normalisation', () => {
    it('validates lowercase TAN by normalizing to uppercase', () => {
        expect(isValidTAN(LOWERCASE_TAN)).toBe(true);
    });

    it('validates TAN containing spaces by removing spacing characters', () => {
        expect(isValidTAN(SPACED_TAN)).toBe(true);
    });

    it('validates TAN containing hyphens by removing separators', () => {
        expect(isValidTAN(HYPHENATED_TAN)).toBe(true);
    });

    it('validates TAN with leading/trailing whitespace after trim normalization', () => {
        expect(isValidTAN(PADDED_TAN)).toBe(true);
    });
});

describe('TAN Validator - Edge Cases', () => {
    it('accepts TAN with all-same digits in numeric section because digits are structurally valid', () => {
        expect(isValidTAN(SAME_DIGITS_NUMERIC_SECTION_TAN)).toBe(true);
    });

    it('accepts boundary-valid TAN where position 4 is A', () => {
        expect(isValidTAN(POSITION4_BOUNDARY_LOW_TAN)).toBe(true);
    });

    it('accepts boundary-valid TAN where position 4 is Z', () => {
        expect(isValidTAN(POSITION4_BOUNDARY_HIGH_TAN)).toBe(true);
    });

    it('rejects TAN where position 4 is one character outside A-Z range', () => {
        expect(isValidTAN(POSITION4_OUTSIDE_VALID_RANGE_TAN)).toBe(false);
    });

    it('rejects PAN-like value in TAN validator to avoid PAN/TAN confusion', () => {
        expect(isValidTAN(INVALID_PAN_LIKE_VALUE)).toBe(false);
    });
});

describe('getTANInfo() - Parsed Output', () => {
    it('returns null for invalid TAN input', () => {
        expect(getTANInfo(INVALID_PAN_LIKE_VALUE)).toBeNull();
    });

    it('returns correct cityCode for a known valid TAN', () => {
        const info = getTANInfo(VALID_TAN_DELHI);
        expect(info?.cityCode).toBe('DELX');
    });

    it('returns normalized TAN in uppercase without spaces/hyphens', () => {
        const info = getTANInfo(INFO_INPUT_WITH_NOISE);
        expect(info?.normalized).toBe('MUMX12345B');
    });

    it('returns correct sequenceNumber and lastChar for valid TAN', () => {
        const info = getTANInfo(VALID_TAN_MUMBAI);
        expect(info?.sequenceNumber).toBe('12345');
        expect(info?.lastChar).toBe('B');
    });

    it('returns all fields with correct runtime types', () => {
        const info = getTANInfo(VALID_TAN_HYDERABAD);
        expect(info).not.toBeNull();
        if (info) {
            expect(typeof info.raw).toBe('string');
            expect(typeof info.normalized).toBe('string');
            expect(typeof info.cityCode).toBe('string');
            expect(typeof info.sequenceNumber).toBe('string');
            expect(typeof info.lastChar).toBe('string');
            expect(typeof info.deductorType).toBe('string');
        }
    });
});

