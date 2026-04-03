import { describe, expect, it } from 'vitest';
import { getVoterIDInfo, isValidVoterID } from '../src/validators/voterId';

describe('Voter ID - Valid Inputs', () => {
    const validVoterIds = [
        'ABC1234567',
        'DEF7654321',
        'GHI2345678',
        'JKL3456789',
        'MNO4567891',
        'PQR5678912',
        'STU6789123',
        'VWX7891234',
    ];

    it.each(validVoterIds)('accepts valid EPIC %s', (epic) => {
        expect(isValidVoterID(epic)).toBe(true);
    });

    // Legacy-format EPIC examples are intentionally rejected by strict
    // modern-format validation (AAA9999999).
    it('rejects legacy slash-separated style old-format number sample 1', () => {
        expect(isValidVoterID('DL/01/001/123456')).toBe(false);
    });

    it('rejects legacy slash-separated style old-format number sample 2', () => {
        expect(isValidVoterID('AP/11/067/000321')).toBe(false);
    });
});

describe('Voter ID - Invalid Format', () => {
    it('rejects too short input', () => {
        expect(isValidVoterID('ABC123456')).toBe(false);
    });

    it('rejects too long input', () => {
        expect(isValidVoterID('ABC12345678')).toBe(false);
    });

    it('rejects only digits', () => {
        expect(isValidVoterID('1234567890')).toBe(false);
    });

    it('rejects only letters', () => {
        expect(isValidVoterID('ABCDEFGHIJ')).toBe(false);
    });

    it('rejects correct length but wrong structure (digits first)', () => {
        expect(isValidVoterID('123ABC4567')).toBe(false);
    });

    it('rejects numeric portion all zeros', () => {
        expect(isValidVoterID('ABC0000000')).toBe(false);
    });

    it('rejects special characters after normalization', () => {
        expect(isValidVoterID('ABC12@4567')).toBe(false);
    });

    it('accepts made-up alphabetic prefix under structural validation', () => {
        // No public complete ECI FUSN->state whitelist is available in library.
        expect(isValidVoterID('ZZZ1234567')).toBe(true);
    });
});

describe('Voter ID - Null Safety', () => {
    it('rejects null', () => {
        expect(isValidVoterID(null)).toBe(false);
    });

    it('rejects undefined', () => {
        expect(isValidVoterID(undefined)).toBe(false);
    });

    it('rejects number input', () => {
        expect(isValidVoterID(1010101010)).toBe(false);
    });

    it('rejects boolean true', () => {
        expect(isValidVoterID(true)).toBe(false);
    });

    it('rejects boolean false', () => {
        expect(isValidVoterID(false)).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isValidVoterID('')).toBe(false);
    });

    it('rejects whitespace string', () => {
        expect(isValidVoterID('     ')).toBe(false);
    });

    it('rejects array input', () => {
        expect(isValidVoterID(['ABC1234567'])).toBe(false);
    });

    it('rejects object input', () => {
        expect(isValidVoterID({ epic: 'ABC1234567' })).toBe(false);
    });
});

describe('Voter ID - Normalization', () => {
    it('accepts lowercase after normalization', () => {
        expect(isValidVoterID('abc1234567')).toBe(true);
    });

    it('accepts spaces after normalization', () => {
        expect(isValidVoterID('abc 123 4567')).toBe(true);
    });

    it('accepts hyphens after normalization', () => {
        expect(isValidVoterID('abc-123-4567')).toBe(true);
    });
});

describe('getVoterIDInfo()', () => {
    it('returns null for invalid input', () => {
        expect(getVoterIDInfo('BAD')).toBeNull();
    });

    it('returns null for all-zero numeric portion', () => {
        expect(getVoterIDInfo('ABC0000000')).toBeNull();
    });

    it('extracts correct sequenceNumber', () => {
        const info = getVoterIDInfo('abc1234567');
        expect(info).not.toBeNull();
        expect(info?.sequenceNumber).toBe('1234567');
    });

    it('extracts correct stateCode prefix', () => {
        const info = getVoterIDInfo('xyz7654321');
        expect(info).not.toBeNull();
        expect(info?.stateCode).toBe('XYZ');
    });

    it('returns Unknown stateName (prefix is not state-decoded)', () => {
        const info = getVoterIDInfo('ABC1234567');
        expect(info).not.toBeNull();
        expect(info?.stateName).toBe('Unknown');
    });

    it('returns all fields with expected types', () => {
        const info = getVoterIDInfo('abc-123-4567');
        expect(info).not.toBeNull();
        expect(typeof info?.raw).toBe('string');
        expect(typeof info?.normalized).toBe('string');
        expect(typeof info?.stateCode).toBe('string');
        expect(typeof info?.stateName).toBe('string');
        expect(typeof info?.sequenceNumber).toBe('string');
    });

    it('returns normalized output correctly', () => {
        const info = getVoterIDInfo(' abc-123 4567 ');
        expect(info).not.toBeNull();
        expect(info?.normalized).toBe('ABC1234567');
    });
});

describe('State-Code Integration Behavior', () => {
    const representativePrefixes = [
        'AAA',
        'BBB',
        'CCC',
        'DDD',
        'EEE',
        'FFF',
        'GGG',
        'HHH',
    ];

    it.each(representativePrefixes)('returns Unknown stateName for prefix %s', (prefix) => {
        const info = getVoterIDInfo(`${prefix}1234567`);
        expect(info).not.toBeNull();
        expect(info?.stateName).toBe('Unknown');
    });
});
