import { describe, it, expect } from 'vitest';
import { isValidAadhaar } from './aadhaar';
import { generateVerhoeff } from '../utils/verhoeff';

describe('Aadhaar Validator', () => {
    it('should validate correct aadhaar numbers', () => {
        // Valid Verhoeff nums: 
        // 999999990026 -> 99999999002 + 6 (Check)
        // Let's generate a valid one or use known ones.
        // 200000000010 (Verhoeff: 20000000001 -> 0)

        // Generate a valid 12-digit Aadhaar (starts with 2-9)
        const base = '99999999001';
        const check = generateVerhoeff(base);
        const validAadhaar = base + check;

        expect(isValidAadhaar(validAadhaar)).toBe(true);
        expect(isValidAadhaar('222222220023')).toBe(false); // 23 assumption was wrong.
    });

    it('should reject numbers starting with 0 or 1', () => {
        // Even if Verhoeff is valid, these should fail
        expect(isValidAadhaar('099999990019')).toBe(false);
        expect(isValidAadhaar('199999990019')).toBe(false);
    });

    it('should reject invalid length', () => {
        expect(isValidAadhaar('99999999001')).toBe(false); // 11 digits
        expect(isValidAadhaar('9999999900199')).toBe(false); // 13 digits
    });

    it('should reject invalid checksum', () => {
        expect(isValidAadhaar('999999990018')).toBe(false);
    });

    it('should reject null/undefined input', () => {
        expect(isValidAadhaar(null)).toBe(false);
        expect(isValidAadhaar(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidAadhaar(999999990019)).toBe(false);
        expect(isValidAadhaar({})).toBe(false);
        expect(isValidAadhaar([])).toBe(false);
    });

    it('should reject whitespace and special characters', () => {
        const base = '99999999001';
        const check = generateVerhoeff(base);
        const validAadhaar = base + check;
        
        // Whitespace should invalidate
        expect(isValidAadhaar(' ' + validAadhaar)).toBe(false);
        expect(isValidAadhaar(validAadhaar + ' ')).toBe(false);
        expect(isValidAadhaar(validAadhaar.substring(0, 6) + ' ' + validAadhaar.substring(6))).toBe(false);
        
        // Dashes/special chars
        expect(isValidAadhaar('9999-9999-0019')).toBe(false);
        expect(isValidAadhaar('9999 9999 0019')).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isValidAadhaar('')).toBe(false);
    });
});
