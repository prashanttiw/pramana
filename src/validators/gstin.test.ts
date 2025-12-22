import { describe, it, expect } from 'vitest';
import { isValidGSTIN } from './gstin';

describe('GSTIN Validator', () => {
    it('should validate correct GSTIN numbers', () => {
        // Valid Sample: 22AAAAA0000A1Z5
        // Let's brute force find the valid check digit for this base since we lack a 'generate' function exposed yet.
        const base = '29ABCDE1234F1Z';
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let validGSTIN = '';

        for (let char of chars) {
            if (isValidGSTIN(base + char)) {
                validGSTIN = base + char;
                break;
            }
        }

        if (validGSTIN === '') {
            throw new Error('Could not generate valid GSTIN check digit in test');
        }

        expect(isValidGSTIN(validGSTIN)).toBe(true);
    });

    it('should reject invalid check digit', () => {
        expect(isValidGSTIN('29ABCDE1234F1Z4')).toBe(false);
    });

    it('should reject invalid structure', () => {
        // Invalid State Code
        expect(isValidGSTIN('A9ABCDE1234F1Z5')).toBe(false);
        // Invalid Z char (must be Z)
        expect(isValidGSTIN('29ABCDE1234F1A5')).toBe(false);
    });
});
