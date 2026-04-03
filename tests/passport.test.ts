import { describe, expect, it } from 'vitest';
import { getPassportInfo, isValidPassport } from '../src/validators/passport';

describe('Passport Validator - Valid Inputs', () => {
    // At least one sample from each valid series letter in current validator set.
    const validSeriesSamples = [
        ['A', 'A1234567'],
        ['B', 'B7654321'],
        ['C', 'C2468135'],
        ['D', 'D1357924'],
        ['E', 'E9076543'],
        ['F', 'F8080808'],
        ['G', 'G1029384'],
        ['H', 'H5647382'],
        ['J', 'J1112345'],
        ['K', 'K6789054'],
        ['L', 'L4928173'],
        ['M', 'M3141592'],
        ['N', 'N2718281'],
        ['P', 'P4242424'],
        ['R', 'R9876501'],
        ['S', 'S5566778'],
        ['T', 'T1200345'],
        ['U', 'U9090901'],
        ['V', 'V7001002'],
        ['W', 'W3334445'],
        ['X', 'X8182838'],
        ['Y', 'Y6307418'],
        ['Z', 'Z9501234'],
    ] as const;

    it.each(validSeriesSamples)('accepts valid %s-series sample', (_, passport) => {
        expect(isValidPassport(passport)).toBe(true);
    });
});

describe('Passport Validator - Invalid Series', () => {
    it.each([
        'I1234567',
        'O1234567',
        'Q1234567',
        'i4567890',
        'o7654321',
    ])('rejects invalid series letter: %s', (input) => {
        expect(isValidPassport(input)).toBe(false);
    });

    it('accepts lowercase valid series after normalisation', () => {
        expect(isValidPassport('a1234567')).toBe(true);
    });
});

describe('Passport Validator - Invalid Format', () => {
    it('rejects too short input (7 chars)', () => {
        expect(isValidPassport('A123456')).toBe(false);
    });

    it('rejects too long input (9 chars)', () => {
        expect(isValidPassport('A12345678')).toBe(false);
    });

    it('rejects input starting with digit', () => {
        expect(isValidPassport('11234567')).toBe(false);
    });

    it('rejects non-digit character in positions 2-8', () => {
        expect(isValidPassport('A12X4567')).toBe(false);
    });

    it('rejects all zeros in numeric portion', () => {
        expect(isValidPassport('A0000000')).toBe(false);
    });
});

describe('Passport Validator - Null Safety', () => {
    const unsafeValues: unknown[] = [
        null,
        undefined,
        12345678,
        12345678n,
        true,
        false,
        {},
        [],
        () => 'A1234567',
        Symbol('passport'),
    ];

    it.each(unsafeValues)('returns false for non-string input: %p', (value) => {
        expect(isValidPassport(value)).toBe(false);
    });
});

describe('Passport Validator - Normalisation', () => {
    it('accepts whitespace-padded value " A1234567 "', () => {
        expect(isValidPassport(' A1234567 ')).toBe(true);
    });

    it('accepts lowercase value "a1234567" after normalisation', () => {
        expect(isValidPassport('a1234567')).toBe(true);
    });
});

describe('getPassportInfo()', () => {
    it('returns Diplomatic for D series', () => {
        const info = getPassportInfo('D1357924');
        expect(info).not.toBeNull();
        expect(info?.seriesType).toBe('Diplomatic');
    });

    it('returns Official for S series', () => {
        const info = getPassportInfo('S5566778');
        expect(info).not.toBeNull();
        expect(info?.seriesType).toBe('Official');
    });

    it('returns Regular for A series', () => {
        const info = getPassportInfo('A1234567');
        expect(info).not.toBeNull();
        expect(info?.seriesType).toBe('Regular');
    });

    it('extracts correct sequenceNumber', () => {
        const info = getPassportInfo(' Z9501234 ');
        expect(info).not.toBeNull();
        expect(info?.sequenceNumber).toBe('9501234');
    });

    it('returns null for invalid passport', () => {
        expect(getPassportInfo('Q1234567')).toBeNull();
    });
});

describe('Passport Validator - Series Boundary', () => {
    it('accepts last valid series letter', () => {
        expect(isValidPassport('Z1234567')).toBe(true);
    });

    it('rejects one character past valid range', () => {
        expect(isValidPassport('[1234567')).toBe(false);
    });
});

