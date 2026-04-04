import { describe, expect, it } from 'vitest';
import { getUPIInfo, isValidUPI } from '../src/validators/upi';

describe('UPI Validator - Valid UPI IDs', () => {
    it.each([
        // Mandatory examples
        ['phone-number-based', '9876543210@ybl'],
        ['name-based with dot', 'prashant.tiwari@okaxis'],
        ['with underscore', 'prashant_tiwari@okhdfcbank'],
        ['short handle', 'abc@oksbi'],
        ['merchant-style', 'merchant123@axisbank'],
        // Additional valid IDs from different providers
        ['paytm provider', 'amit.kumar@paytm'],
        ['upi provider', 'rahul-01@upi'],
        ['waicici provider', 'mehul_2026@waicici'],
        ['pnb provider', 'user2026@pnb'],
        ['kotak provider', 'phone.person@kotak'],
        ['naviaxis provider', 'navi.user@naviaxis'],
        ['idfcbank provider', 'idfc-user@idfcbank'],
    ])('accepts %s: %s', (_, upiId) => {
        expect(isValidUPI(upiId)).toBe(true);
    });
});

describe('UPI Validator - Invalid Provider', () => {
    it.each([
        ['unknown PSP', 'name@fakepay'],
        ['empty provider', 'name@'],
        ['no @ symbol', 'nameprovider'],
        ['double @ symbol', 'name@ok@axis'],
    ])('rejects %s: %s', (_, upiId) => {
        expect(isValidUPI(upiId)).toBe(false);
    });
});

describe('UPI Validator - Invalid Handle', () => {
    it.each([
        ['empty handle', '@okaxis'],
        ['starting dot', '.name@okaxis'],
        ['consecutive dots', 'na..me@okaxis'],
        ['too short', 'a@okaxis'],
        ['invalid chars', 'name#here@okaxis'],
        ['ending special character', 'name_@okaxis'],
        ['starting hyphen', '-name@okaxis'],
        ['consecutive hyphen', 'na--me@okaxis'],
        ['consecutive mixed special chars', 'na.-me@okaxis'],
        ['too long', `${'a'.repeat(257)}@okaxis`],
    ])('rejects %s: %s', (_, upiId) => {
        expect(isValidUPI(upiId)).toBe(false);
    });
});

describe('UPI Validator - Null Safety', () => {
    it.each([
        ['null', null],
        ['undefined', undefined],
        ['number', 1234567890],
        ['negative number', -1],
        ['float', 123.45],
        ['NaN', Number.NaN],
        ['boolean true', true],
        ['boolean false', false],
        ['bigint', 1234567890n],
        ['object', { upi: 'name@okaxis' }],
        ['array', ['name@okaxis']],
        ['function', () => 'name@okaxis'],
        ['symbol', Symbol('upi')],
        ['date', new Date('2026-01-01')],
    ])('returns false for %s input', (_, value) => {
        expect(isValidUPI(value)).toBe(false);
    });
});

describe('UPI Validator - Case Normalization', () => {
    it('accepts Name@OKAxis after normalization', () => {
        expect(isValidUPI('Name@OKAxis')).toBe(true);
    });

    it('accepts NAME@OKSBI after normalization', () => {
        expect(isValidUPI('NAME@OKSBI')).toBe(true);
    });
});

describe('getUPIInfo()', () => {
    it('returns correct bank name for known provider', () => {
        const info = getUPIInfo('prashant@okaxis');
        expect(info).not.toBeNull();
        expect(info?.bank).toBe('Axis Bank');
    });

    it('extracts handle and provider correctly', () => {
        const info = getUPIInfo('prashant.tiwari@okaxis');
        expect(info).not.toBeNull();
        expect(info?.handle).toBe('prashant.tiwari');
        expect(info?.provider).toBe('okaxis');
    });

    it('returns normalized lowercased UPI ID', () => {
        const info = getUPIInfo('  Name@OKAxis  ');
        expect(info).not.toBeNull();
        expect(info?.normalized).toBe('name@okaxis');
    });

    it('returns personal type for numeric mobile-based handle', () => {
        const info = getUPIInfo('9876543210@upi');
        expect(info).not.toBeNull();
        expect(info?.type).toBe('personal');
    });

    it('returns merchant type for NETC-style handle', () => {
        const info = getUPIInfo('netc.mh12ab1234@hdfcbank');
        expect(info).not.toBeNull();
        expect(info?.type).toBe('merchant');
    });

    it('returns merchant type for merchant-token handle', () => {
        const info = getUPIInfo('merchant.store@axisbank');
        expect(info).not.toBeNull();
        expect(info?.type).toBe('merchant');
    });

    it('returns unknown type for generic name handle', () => {
        const info = getUPIInfo('prashant.tiwari@okaxis');
        expect(info).not.toBeNull();
        expect(info?.type).toBe('unknown');
    });

    it('returns null for invalid UPI IDs', () => {
        expect(getUPIInfo('name@fakepay')).toBeNull();
        expect(getUPIInfo('invalid')).toBeNull();
    });
});
