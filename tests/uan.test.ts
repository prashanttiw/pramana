import { describe, expect, it } from 'vitest';
import { getUANInfo, isValidUAN } from '../src/validators/uan';

// ---------------------------------------------------------------------------
// Named UAN fixtures (avoid magic literals in tests)
// ---------------------------------------------------------------------------
const VALID_UAN_PREFIX_100 = '100123456789';
const VALID_UAN_PREFIX_101 = '101234567890';
const VALID_UAN_PREFIX_123 = '123456789012';
const VALID_UAN_PREFIX_150 = '150987654321';
const VALID_UAN_PREFIX_175 = '175246813579';
const VALID_UAN_PREFIX_199 = '199135792468';

const VALID_UAN_RANGE_START = '100000000001';
const VALID_UAN_RANGE_END = '199999999998';

const INVALID_SHORT_UAN = '10012345678';
const INVALID_LONG_UAN = '1001234567890';
const INVALID_ALPHA_UAN = '10012345A789';
const INVALID_SPECIAL_CHAR_UAN = '10012345@789';
const INVALID_ALL_ZERO_UAN = '000000000000';
const INVALID_ALL_SAME_DIGIT_UAN = '111111111111';
const INVALID_ZERO_PREFIX_UAN = '012345678901';

const INVALID_BELOW_ALLOCATED_RANGE_UAN = '099123456789';
const INVALID_ABOVE_ALLOCATED_RANGE_UAN = '200123456789';

const SPACED_VALID_UAN = '100 1234 5678 9';
const HYPHENATED_VALID_UAN = '101-2345-6789-0';
const PADDED_VALID_UAN = '   123456789012   ';

const EMPTY_STRING_UAN = '';
const WHITESPACE_ONLY_UAN = '      ';

const EXPECTED_RANGE_NOTE = 'EPFO series 1xx - allocated post-2014';

describe('UAN Validator - Valid Inputs', () => {
    it('accepts valid UAN with prefix 100 because it is in allocated EPFO 1xx range', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_100)).toBe(true);
    });

    it('accepts valid UAN with prefix 101 to cover nearby allocated prefix', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_101)).toBe(true);
    });

    it('accepts valid UAN with prefix 123 to cover mid-series allocation', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_123)).toBe(true);
    });

    it('accepts valid UAN with prefix 150 to cover diverse allocated ranges', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_150)).toBe(true);
    });

    it('accepts valid UAN with prefix 175 to ensure broad 1xx coverage', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_175)).toBe(true);
    });

    it('accepts valid UAN with prefix 199 at the upper side of current allocated range', () => {
        expect(isValidUAN(VALID_UAN_PREFIX_199)).toBe(true);
    });

    it('accepts edge case: first valid UAN prefix in allocated series', () => {
        expect(isValidUAN(VALID_UAN_RANGE_START)).toBe(true);
    });

    it('accepts edge case: last valid UAN prefix in allocated series', () => {
        expect(isValidUAN(VALID_UAN_RANGE_END)).toBe(true);
    });
});

describe('UAN Validator - Invalid Format', () => {
    it('rejects UAN with 11 digits because it is too short', () => {
        expect(isValidUAN(INVALID_SHORT_UAN)).toBe(false);
    });

    it('rejects UAN with 13 digits because it is too long', () => {
        expect(isValidUAN(INVALID_LONG_UAN)).toBe(false);
    });

    it('rejects UAN containing letters because UAN must be numeric only', () => {
        expect(isValidUAN(INVALID_ALPHA_UAN)).toBe(false);
    });

    it('rejects UAN containing special characters because only digits are allowed', () => {
        expect(isValidUAN(INVALID_SPECIAL_CHAR_UAN)).toBe(false);
    });

    it('rejects all-zero UAN because it is a known synthetic invalid pattern', () => {
        expect(isValidUAN(INVALID_ALL_ZERO_UAN)).toBe(false);
    });

    it('rejects all-same-digit UAN because repeated synthetic patterns are invalid', () => {
        expect(isValidUAN(INVALID_ALL_SAME_DIGIT_UAN)).toBe(false);
    });

    it('rejects UAN starting with 0 because prefix is outside allocated EPFO range', () => {
        expect(isValidUAN(INVALID_ZERO_PREFIX_UAN)).toBe(false);
    });

    it('rejects UAN one prefix below allocated range to prevent near-boundary false positives', () => {
        expect(isValidUAN(INVALID_BELOW_ALLOCATED_RANGE_UAN)).toBe(false);
    });

    it('rejects UAN one prefix above allocated range to enforce strict allocation boundaries', () => {
        expect(isValidUAN(INVALID_ABOVE_ALLOCATED_RANGE_UAN)).toBe(false);
    });
});

describe('UAN Validator - Null Safety', () => {
    it('returns false for null input', () => {
        expect(isValidUAN(null)).toBe(false);
    });

    it('returns false for undefined input', () => {
        expect(isValidUAN(undefined)).toBe(false);
    });

    it('returns false for number input', () => {
        expect(isValidUAN(100123456789)).toBe(false);
    });

    it('returns false for boolean input', () => {
        expect(isValidUAN(true)).toBe(false);
    });

    it('returns false for empty string input', () => {
        expect(isValidUAN(EMPTY_STRING_UAN)).toBe(false);
    });

    it('returns false for whitespace-only input', () => {
        expect(isValidUAN(WHITESPACE_ONLY_UAN)).toBe(false);
    });

    it('returns false for array input', () => {
        expect(isValidUAN([])).toBe(false);
    });

    it('returns false for object input', () => {
        expect(isValidUAN({})).toBe(false);
    });
});

describe('UAN Validator - Normalisation', () => {
    it('accepts UAN with spaces because separators should be removed before validation', () => {
        expect(isValidUAN(SPACED_VALID_UAN)).toBe(true);
    });

    it('accepts UAN with hyphens because separators should be removed before validation', () => {
        expect(isValidUAN(HYPHENATED_VALID_UAN)).toBe(true);
    });

    it('accepts UAN with leading/trailing whitespace because trim normalization is expected', () => {
        expect(isValidUAN(PADDED_VALID_UAN)).toBe(true);
    });
});

describe('getUANInfo() - Parsed Output', () => {
    it('returns null for invalid UAN', () => {
        expect(getUANInfo(INVALID_ALPHA_UAN)).toBeNull();
    });

    it('returns normalized UAN without spaces and hyphens', () => {
        const info = getUANInfo(SPACED_VALID_UAN);
        expect(info?.normalized).toBe(VALID_UAN_PREFIX_100);
    });

    it('returns isAllocated=true for known valid allocated UAN', () => {
        const info = getUANInfo(VALID_UAN_PREFIX_150);
        expect(info?.isAllocated).toBe(true);
    });

    it('returns expected range note for allocated 1xx UAN', () => {
        const info = getUANInfo(VALID_UAN_PREFIX_199);
        expect(info?.rangeNote).toBe(EXPECTED_RANGE_NOTE);
    });

    it('returns all fields with the expected runtime types', () => {
        const info = getUANInfo(HYPHENATED_VALID_UAN);
        expect(info).not.toBeNull();
        if (info) {
            expect(typeof info.raw).toBe('string');
            expect(typeof info.normalized).toBe('string');
            expect(typeof info.isAllocated).toBe('boolean');
            expect(typeof info.rangeNote).toBe('string');
        }
    });
});

describe('UAN Validator - Boundary Tests', () => {
    it('accepts first allocated prefix boundary (100)', () => {
        expect(isValidUAN(VALID_UAN_RANGE_START)).toBe(true);
    });

    it('accepts last allocated prefix boundary (199)', () => {
        expect(isValidUAN(VALID_UAN_RANGE_END)).toBe(true);
    });

    it('rejects one prefix below allocated boundary (099)', () => {
        expect(isValidUAN(INVALID_BELOW_ALLOCATED_RANGE_UAN)).toBe(false);
    });

    it('rejects one prefix above allocated boundary (200)', () => {
        expect(isValidUAN(INVALID_ABOVE_ALLOCATED_RANGE_UAN)).toBe(false);
    });
});
