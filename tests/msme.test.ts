import { describe, expect, it } from 'vitest';
import { getMSMEInfo, isValidMSME, isValidUAM } from '../src/validators/msme';

describe('MSME Validator - Valid Udyam Numbers', () => {
    it.each([
        'UDYAM-MH-07-0012345',
        'UDYAM-DL-11-7349051',
        'UDYAM-UP-22-1904736',
        'UDYAM-KA-03-8456201',
        'UDYAM-TN-16-5029184',
        'UDYAM-RJ-08-9734152',
        'UDYAM-GJ-27-2816409',
        'UDYAM-WB-05-6493028',
    ])('accepts valid Udyam number: %s', (value) => {
        expect(isValidMSME(value)).toBe(true);
    });
});

describe('MSME Validator - Invalid Structure', () => {
    it('rejects missing UDYAM prefix', () => {
        expect(isValidMSME('MH-07-0012345')).toBe(false);
    });

    it('rejects wrong delimiter with slashes', () => {
        expect(isValidMSME('UDYAM/MH/07/0012345')).toBe(false);
    });

    it('rejects invalid state code', () => {
        expect(isValidMSME('UDYAM-ZZ-07-0012345')).toBe(false);
    });

    it('rejects district 00', () => {
        expect(isValidMSME('UDYAM-MH-00-0012345')).toBe(false);
    });

    it('rejects all-zero serial', () => {
        expect(isValidMSME('UDYAM-MH-07-0000000')).toBe(false);
    });

    it('rejects wrong serial length (6 digits)', () => {
        expect(isValidMSME('UDYAM-MH-07-012345')).toBe(false);
    });
});

describe('MSME Validator - Null Safety', () => {
    it.each([
        null,
        undefined,
        12345,
        12345n,
        true,
        false,
        {},
        [],
        ['UDYAM-MH-07-0012345'],
        () => 'UDYAM-MH-07-0012345',
        Symbol('msme'),
        new Date('2026-04-09'),
    ])('returns false for unsafe input: %p', (value) => {
        expect(isValidMSME(value)).toBe(false);
    });
});

describe('MSME Validator - Normalisation', () => {
    it('accepts lowercase input after normalization', () => {
        expect(isValidMSME('udyam-mh-07-0012345')).toBe(true);
    });

    it('accepts input with extra spaces after normalization', () => {
        expect(isValidMSME('  UDYAM - MH - 07 - 0012345  ')).toBe(true);
    });
});

describe('getMSMEInfo()', () => {
    it('returns correct stateName for MH', () => {
        const info = getMSMEInfo('UDYAM-MH-07-0012345');
        expect(info).not.toBeNull();
        expect(info?.stateName).toBe('Maharashtra');
    });

    it('extracts districtCode correctly', () => {
        const info = getMSMEInfo('UDYAM-DL-11-7349051');
        expect(info).not.toBeNull();
        expect(info?.districtCode).toBe('11');
    });

    it('returns null for invalid MSME number', () => {
        expect(getMSMEInfo('UDYAM-ZZ-07-0012345')).toBeNull();
    });
});

describe('UAM Support', () => {
    it('accepts valid legacy UAM number', () => {
        expect(isValidUAM('DL05A0000001')).toBe(true);
    });

    it('rejects invalid legacy UAM number', () => {
        expect(isValidUAM('ZZ05A0000001')).toBe(false);
    });
});
