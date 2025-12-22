import { describe, it, expect } from 'vitest';
import { isValidGSTIN } from './gstin';
import { generateGSTCheckDigit } from '../utils/mod36';

describe('GSTIN Validator', () => {
    it('should validate correct GSTIN numbers', () => {
        // Generate a valid GSTIN with proper check digit
        const base = '27AAPFR5055K1Z';
        const checkDigitIndex = generateGSTCheckDigit(base);
        const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const validGSTIN = base + charset[checkDigitIndex];

        expect(isValidGSTIN(validGSTIN)).toBe(true);
    });

    it('should reject invalid check digit', () => {
        expect(isValidGSTIN('27AAPFR5055K1Z0')).toBe(false);
        expect(isValidGSTIN('27AAPFR5055K1Z9')).toBe(false);
    });

    it('should reject invalid structure', () => {
        // Invalid State Code
        expect(isValidGSTIN('A9ABCDE1234F1Z5')).toBe(false);
        // Invalid Z char (must be Z)
        expect(isValidGSTIN('29ABCDE1234F1A5')).toBe(false);
    });

    it('should reject null/undefined input', () => {
        expect(isValidGSTIN(null)).toBe(false);
        expect(isValidGSTIN(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidGSTIN(123)).toBe(false);
        expect(isValidGSTIN({})).toBe(false);
        expect(isValidGSTIN([])).toBe(false);
    });

    it('should reject whitespace and special characters', () => {
        const base = '27AAPFR5055K1Z';
        const checkDigitIndex = generateGSTCheckDigit(base);
        const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const validGSTIN = base + charset[checkDigitIndex];
        
        // Whitespace should invalidate
        expect(isValidGSTIN(' ' + validGSTIN)).toBe(false);
        expect(isValidGSTIN(validGSTIN + ' ')).toBe(false);
        expect(isValidGSTIN(validGSTIN.substring(0, 7) + ' ' + validGSTIN.substring(7))).toBe(false);
        
        // Dashes/special chars
        expect(isValidGSTIN(validGSTIN.substring(0, 2) + '-' + validGSTIN.substring(2))).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isValidGSTIN('')).toBe(false);
    });
});
