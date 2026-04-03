import { describe, expect, it } from 'vitest';
import { getDrivingLicenseInfo, isValidDrivingLicense } from '../../src/validators/drivingLicense';

describe('Driving License Validator', () => {
    it('validates a post-2021 format with separators', () => {
        expect(isValidDrivingLicense('MH-01-20110169971')).toBe(true);
    });

    it('validates a pre-2021 format with an extra legacy area digit', () => {
        expect(isValidDrivingLicense('DL-012-2011-0169971')).toBe(true);
    });

    it('rejects an unknown state code', () => {
        expect(isValidDrivingLicense('ZZ-01-20110169971')).toBe(false);
    });

    it('rejects invalid RTO code 00', () => {
        expect(isValidDrivingLicense('MH-00-20110169971')).toBe(false);
    });

    it('rejects non-numeric tail', () => {
        expect(isValidDrivingLicense('MH-01-2011-ABC9971')).toBe(false);
    });

    it('rejects null/undefined/non-string safely', () => {
        expect(isValidDrivingLicense(null)).toBe(false);
        expect(isValidDrivingLicense(undefined)).toBe(false);
        expect(isValidDrivingLicense(1234567890)).toBe(false);
        expect(isValidDrivingLicense({})).toBe(false);
    });
});

describe('Driving License Metadata', () => {
    it('returns parsed metadata for valid post-2021 DL', () => {
        const info = getDrivingLicenseInfo('MH-01-20110169971');
        expect(info).not.toBeNull();
        if (info == null) return;

        expect(info.normalized).toBe('MH0120110169971');
        expect(info.stateCode).toBe('MH');
        expect(info.stateName).toBe('Maharashtra');
        expect(info.rtoCode).toBe('01');
        expect(info.rtoNumber).toBe(1);
        expect(info.format).toBe('post-2021');
        expect(info.yearHint).toBe(2011);
    });

    it('returns parsed metadata for valid pre-2021 DL', () => {
        const info = getDrivingLicenseInfo('DL-012-2011-0169971');
        expect(info).not.toBeNull();
        if (info == null) return;

        expect(info.normalized).toBe('DL01220110169971');
        expect(info.stateCode).toBe('DL');
        expect(info.stateName).toBe('Delhi');
        expect(info.format).toBe('pre-2021');
        expect(info.yearHint).toBe(2011);
    });

    it('returns null for invalid DL', () => {
        expect(getDrivingLicenseInfo('INVALID')).toBeNull();
    });
});
