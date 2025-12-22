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
});
