import { describe, it, expect } from 'vitest';
import { getVoterIDInfo, isValidVoterID } from '../../src/validators/voterId';

describe('Voter ID Validator', () => {
    it('should validate correct voter IDs', () => {
        expect(isValidVoterID('ABC1234567')).toBe(true);
        expect(isValidVoterID('zzz7654321')).toBe(true);
    });

    it('should normalize spaces, hyphens, and lowercase input', () => {
        expect(isValidVoterID(' abc-123 4567 ')).toBe(true);
    });

    it('should reject invalid structure', () => {
        expect(isValidVoterID('AB12345678')).toBe(false);   // 2 letters + 8 digits
        expect(isValidVoterID('ABCD123456')).toBe(false);   // 4 letters + 6 digits
        expect(isValidVoterID('ABC12A4567')).toBe(false);   // alpha in numeric section
        expect(isValidVoterID('1BC1234567')).toBe(false);   // number in prefix
    });

    it('should reject invalid lengths', () => {
        expect(isValidVoterID('ABC123456')).toBe(false);    // 9 chars
        expect(isValidVoterID('ABC12345678')).toBe(false);  // 11 chars
    });

    it('should reject all-zero numeric suffix', () => {
        expect(isValidVoterID('ABC0000000')).toBe(false);
    });

    it('should reject null/undefined and non-string input', () => {
        expect(isValidVoterID(null)).toBe(false);
        expect(isValidVoterID(undefined)).toBe(false);
        expect(isValidVoterID(1234567890)).toBe(false);
        expect(isValidVoterID({})).toBe(false);
        expect(isValidVoterID([])).toBe(false);
    });

    it('should reject empty and whitespace-only input', () => {
        expect(isValidVoterID('')).toBe(false);
        expect(isValidVoterID('   ')).toBe(false);
    });
});

describe('Voter ID Info', () => {
    it('should return parsed metadata for valid voter ID', () => {
        const info = getVoterIDInfo(' abc-123 4567 ');
        expect(info).not.toBeNull();
        expect(info).toEqual({
            raw: ' abc-123 4567 ',
            normalized: 'ABC1234567',
            stateCode: 'ABC',
            stateName: 'Unknown',
            sequenceNumber: '1234567',
        });
    });

    it('should return null for invalid voter ID', () => {
        expect(getVoterIDInfo('ABC0000000')).toBeNull();
        expect(getVoterIDInfo('INVALID')).toBeNull();
    });
});
