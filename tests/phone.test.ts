import { describe, expect, it } from 'vitest';
import { getPhoneInfo, isValidIndianPhone, normalisePhone } from '../src/validators/phone';

describe('Phone Validator - Valid Numbers', () => {
    it.each([
        // 6-series (at least 2)
        '6123456789',
        '6987654321',
        // 7-series (at least 2)
        '7123456789',
        '7987654321',
        // 8-series (at least 2)
        '8123456789',
        '8876543210',
        // 9-series (at least 2)
        '9123456789',
        '9876543210',
        // Required formatting variants
        '+91 9876543210',
        '0091 9876543210',
        '98765 43210',
        '9876-543-210',
    ])('accepts valid number: %s', (value) => {
        expect(isValidIndianPhone(value)).toBe(true);
    });
});

describe('Phone Validator - Invalid Series', () => {
    it('rejects numbers starting with 1', () => {
        expect(isValidIndianPhone('1234567890')).toBe(false);
    });

    it('rejects numbers starting with 2', () => {
        expect(isValidIndianPhone('2345678901')).toBe(false);
    });

    it('rejects numbers starting with 5', () => {
        expect(isValidIndianPhone('5678901234')).toBe(false);
    });

    it('rejects numbers starting with 0 after normalization check', () => {
        expect(isValidIndianPhone('0987654321')).toBe(false);
    });

    it('rejects known unallocated 6-series bucket', () => {
        expect(isValidIndianPhone('6000123456')).toBe(false);
    });
});

describe('Phone Validator - Invalid Format', () => {
    it('rejects 9-digit number', () => {
        expect(isValidIndianPhone('987654321')).toBe(false);
    });

    it('rejects 11-digit number without supported prefix pattern', () => {
        expect(isValidIndianPhone('98765432101')).toBe(false);
    });

    it('rejects numbers containing letters', () => {
        expect(isValidIndianPhone('98765ABCDE')).toBe(false);
    });

    it('rejects all same digit', () => {
        expect(isValidIndianPhone('9999999999')).toBe(false);
    });

    it('rejects known fake pattern', () => {
        expect(isValidIndianPhone('1234567890')).toBe(false);
    });

    it('rejects unsupported country code', () => {
        expect(isValidIndianPhone('+1 9876543210')).toBe(false);
    });
});

describe('Phone Validator - Null Safety', () => {
    it.each([
        null,
        undefined,
        9876543210,
        9876543210n,
        true,
        false,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        {},
        [],
        ['9876543210'],
        () => '9876543210',
        Symbol('phone'),
        new Date('2026-04-09'),
    ])('returns false for unsafe input: %p', (value) => {
        expect(isValidIndianPhone(value)).toBe(false);
    });
});

describe('Phone Validator - Normalisation Cases', () => {
    it('accepts +91-9876543210', () => {
        expect(isValidIndianPhone('+91-9876543210')).toBe(true);
    });

    it('accepts +91 98765 43210', () => {
        expect(isValidIndianPhone('+91 98765 43210')).toBe(true);
    });

    it('accepts 09876543210 after leading 0 stripping', () => {
        expect(isValidIndianPhone('09876543210')).toBe(true);
    });

    it('accepts (+91)9876543210', () => {
        expect(isValidIndianPhone('(+91)9876543210')).toBe(true);
    });

    it('normalizes +91 format correctly', () => {
        expect(normalisePhone('+91 9876543210')).toBe('9876543210');
    });
});

describe('getPhoneInfo()', () => {
    it('returns normalized form with country code', () => {
        const info = getPhoneInfo('+91 98765 43210');
        expect(info).not.toBeNull();
        expect(info?.normalized).toBe('9876543210');
        expect(info?.withCountryCode).toBe('+919876543210');
        expect(info?.series).toBe('9');
        expect(info?.isValid).toBe(true);
    });

    it('returns null for invalid formatted input', () => {
        expect(getPhoneInfo('98765ABCDE')).toBeNull();
    });

    it('returns null for invalid but normalizable fake input', () => {
        expect(getPhoneInfo('1234567890')).toBeNull();
    });
});
