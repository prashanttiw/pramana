import { describe, expect, it } from 'vitest';
import { getPassportInfo, isValidPassport } from '../../src/validators/passport';

describe('Passport Validator', () => {
    it('validates correct passport numbers', () => {
        expect(isValidPassport('A1234567')).toBe(true);
        expect(isValidPassport('S2345678')).toBe(true);
        expect(isValidPassport('D7654321')).toBe(true);
    });

    it('normalizes whitespace and lowercase input', () => {
        expect(isValidPassport('  a1234567  ')).toBe(true);
        expect(isValidPassport('A 1234567')).toBe(true);
    });

    it('rejects invalid series letters', () => {
        expect(isValidPassport('I1234567')).toBe(false);
        expect(isValidPassport('O1234567')).toBe(false);
        expect(isValidPassport('Q1234567')).toBe(false);
    });

    it('rejects invalid structure and length', () => {
        expect(isValidPassport('AB123456')).toBe(false);
        expect(isValidPassport('A123456')).toBe(false);
        expect(isValidPassport('A12345678')).toBe(false);
        expect(isValidPassport('A12X4567')).toBe(false);
    });

    it('rejects all-zero numeric sequence', () => {
        expect(isValidPassport('A0000000')).toBe(false);
    });

    it('rejects null/undefined and non-string input safely', () => {
        expect(isValidPassport(null)).toBe(false);
        expect(isValidPassport(undefined)).toBe(false);
        expect(isValidPassport(12345678)).toBe(false);
        expect(isValidPassport({})).toBe(false);
        expect(isValidPassport([])).toBe(false);
    });
});

describe('Passport Metadata', () => {
    it('returns parsed metadata for regular passport series', () => {
        const info = getPassportInfo(' a1234567 ');
        expect(info).not.toBeNull();
        if (info == null) return;

        expect(info).toEqual({
            raw: ' a1234567 ',
            normalized: 'A1234567',
            series: 'A',
            seriesType: 'Regular',
            sequenceNumber: '1234567',
            mrzValid: null,
        });
    });

    it('maps D series to Diplomatic', () => {
        const info = getPassportInfo('D1234567');
        expect(info).not.toBeNull();
        expect(info?.seriesType).toBe('Diplomatic');
    });

    it('maps S series to Official', () => {
        const info = getPassportInfo('S1234567');
        expect(info).not.toBeNull();
        expect(info?.seriesType).toBe('Official');
    });

    it('returns null for invalid passport number', () => {
        expect(getPassportInfo('Q1234567')).toBeNull();
        expect(getPassportInfo('A0000000')).toBeNull();
    });
});

