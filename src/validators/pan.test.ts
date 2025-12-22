import { describe, it, expect } from 'vitest';
import { isValidPAN } from './pan';

describe('PAN Validator', () => {
    it('should validate correct PAN numbers', () => {
        expect(isValidPAN('ABCPE1234F')).toBe(true); // P = Person
        expect(isValidPAN('ZZZCZ9999Z')).toBe(true); // C = Company
    });

    it('should reject invalid 4th character', () => {
        expect(isValidPAN('ABCXE1234F')).toBe(false); // X is not a valid entity
    });

    it('should reject invalid structure', () => {
        expect(isValidPAN('1BCDE1234F')).toBe(false); // Number at start
        expect(isValidPAN('ABCDE12345')).toBe(false); // No last char
        expect(isValidPAN('ABCDE123A')).toBe(false);  // Too short
    });

    it('should reject null/undefined input', () => {
        expect(isValidPAN(null)).toBe(false);
        expect(isValidPAN(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidPAN(123)).toBe(false);
        expect(isValidPAN({})).toBe(false);
        expect(isValidPAN([])).toBe(false);
    });

    it('should reject whitespace and special characters', () => {
        // PAN with valid structure
        const validPAN = 'ABCPE1234F';
        
        // Whitespace should invalidate
        expect(isValidPAN(' ' + validPAN)).toBe(false);
        expect(isValidPAN(validPAN + ' ')).toBe(false);
        expect(isValidPAN(validPAN.substring(0, 5) + ' ' + validPAN.substring(5))).toBe(false);
        
        // Dashes/special chars
        expect(isValidPAN('ABCPE-1234-F')).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isValidPAN('')).toBe(false);
    });
});
