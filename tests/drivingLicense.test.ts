import { describe, expect, it } from 'vitest';
import { getDrivingLicenseInfo, isValidDrivingLicense } from '../src/validators/drivingLicense';

describe('Driving License Validator - Valid Inputs (Pre-2021)', () => {
    // Pre-2021 structure supported by this validator:
    // SS RR X YYYY NNNNNNN (normalized length = 16)
    const validPre2021Samples = [
        ['MH with hyphens', 'MH-012-2011-0169971'],
        ['DL with spaces', 'DL 013 2014 7654321'],
        ['KA mixed separators', 'KA-014 2005-1234567'],
        ['TN with spaces', 'TN 015 1999 7654321'],
        ['UP with hyphens', 'UP-016-2018-0001234'],
    ] as const;

    it.each(validPre2021Samples)('validates %s', (_, input) => {
        expect(isValidDrivingLicense(input)).toBe(true);
    });
});

describe('Driving License Validator - Valid Inputs (Post-2021)', () => {
    // Post-2021 structure:
    // SS RR YYYY NNNNNNN (normalized length = 15)
    const validPost2021Samples = [
        ['MH standard', 'MH0120110169971'],
        ['DL hyphenated', 'DL-01-20197654321'],
        ['KA spaced', 'KA 02 20201234567'],
        ['TN standard', 'TN0320221234567'],
        ['UP hyphenated', 'UP-04-2025-7654321'],
    ] as const;

    it.each(validPost2021Samples)('validates %s', (_, input) => {
        expect(isValidDrivingLicense(input)).toBe(true);
    });
});

describe('Driving License Validator - Invalid Format', () => {
    it.each([
        'ZZ0120110169971',
        'XX0120110169971',
        'AA0120110169971',
    ])('rejects invalid state code: %s', (input) => {
        expect(isValidDrivingLicense(input)).toBe(false);
    });

    it.each([
        'MH0020110169971',
        'DL00020110169971',
        'UP-00-2025-7654321',
    ])('rejects RTO code 00: %s', (input) => {
        expect(isValidDrivingLicense(input)).toBe(false);
    });

    it.each([
        'MH01A0110169971',
        'DL012201A0169971',
        'KA02202012X4567',
        'TN0152011ABC9971',
    ])('rejects non-numeric portion where digits are expected: %s', (input) => {
        expect(isValidDrivingLicense(input)).toBe(false);
    });

    it.each([
        'MH012011016997',      // too short
        'MH01201101699711',    // too long
        'DL01201101699',       // too short
        'UP01202576543210',    // too long
        'KA012000123',         // too short
    ])('rejects correct state but wrong total length: %s', (input) => {
        expect(isValidDrivingLicense(input)).toBe(false);
    });

    it.each([
        '',
        '   ',
        '-- / --',
    ])('rejects empty input after normalisation: %s', (input) => {
        expect(isValidDrivingLicense(input)).toBe(false);
    });
});

describe('Driving License Validator - Null Safety', () => {
    const unsafeValues: unknown[] = [
        null,
        undefined,
        12345,
        12345n,
        true,
        false,
        {},
        [],
        () => 'MH0120110169971',
        Symbol('dl'),
    ];

    it.each(unsafeValues)('returns false for non-string input: %p', (value) => {
        expect(isValidDrivingLicense(value)).toBe(false);
    });
});

describe('Driving License Validator - Normalisation', () => {
    it('treats hyphenated and compact forms equally', () => {
        const hyphenated = 'MH-01-2011-0169971';
        const compact = 'MH0120110169971';

        expect(isValidDrivingLicense(hyphenated)).toBe(true);
        expect(isValidDrivingLicense(compact)).toBe(true);
        expect(getDrivingLicenseInfo(hyphenated)?.normalized).toBe('MH0120110169971');
        expect(getDrivingLicenseInfo(compact)?.normalized).toBe('MH0120110169971');
    });

    it('treats lowercase + spaces and compact forms equally', () => {
        const spacedLower = 'mh01 20110169971';
        const compact = 'MH0120110169971';

        expect(isValidDrivingLicense(spacedLower)).toBe(true);
        expect(isValidDrivingLicense(compact)).toBe(true);
        expect(getDrivingLicenseInfo(spacedLower)?.normalized).toBe('MH0120110169971');
        expect(getDrivingLicenseInfo(compact)?.normalized).toBe('MH0120110169971');
    });
});

describe('getDrivingLicenseInfo()', () => {
    it('returns correct stateName for MH prefix', () => {
        const info = getDrivingLicenseInfo('MH0120110169971');
        expect(info).not.toBeNull();
        expect(info?.stateCode).toBe('MH');
        expect(info?.stateName).toBe('Maharashtra');
    });

    it('detects post-2021 format correctly', () => {
        const info = getDrivingLicenseInfo('DL0120197654321');
        expect(info).not.toBeNull();
        expect(info?.format).toBe('post-2021');
    });

    it('detects pre-2021 format correctly', () => {
        const info = getDrivingLicenseInfo('DL01220197654321');
        expect(info).not.toBeNull();
        expect(info?.format).toBe('pre-2021');
    });

    it('extracts a plausible yearHint when encodable', () => {
        const post = getDrivingLicenseInfo('UP0120257654321');
        const pre = getDrivingLicenseInfo('UP01220257654321');

        expect(post?.yearHint).toBe(2025);
        expect(pre?.yearHint).toBe(2025);
    });

    it('returns null for invalid input', () => {
        expect(getDrivingLicenseInfo('ZZ0020257654321')).toBeNull();
    });
});

describe('Driving License Validator - Cross-State Valid Samples', () => {
    const crossStateSamples = [
        ['MH', 'MH0120110169971'],
        ['DL', 'DL0120197654321'],
        ['KA', 'KA0120201234567'],
        ['TN', 'TN0120221234567'],
        ['UP', 'UP0120257654321'],
        ['GJ', 'GJ0120187654321'],
        ['RJ', 'RJ0120174567890'],
        ['WB', 'WB0120162345678'],
        ['AP', 'AP0120213456789'],
        ['CG', 'CG0120157654321'],
        ['HR', 'HR0120233456789'],
        ['PB', 'PB0120141234567'],
    ] as const;

    it.each(crossStateSamples)('accepts valid %s sample', (_, input) => {
        expect(isValidDrivingLicense(input)).toBe(true);
    });
});
