import { describe, it, expect } from 'vitest';
import { isValidPincode } from './pincode';

describe('Pincode Validator', () => {
    it('should validate known pincode regions', () => {
        expect(isValidPincode('110001')).toBe(true); // Delhi
        expect(isValidPincode('400001')).toBe(true); // Maharashtra (Mumbai)
    });

    it('should reject invalid structure', () => {
        expect(isValidPincode('010001')).toBe(false); // Starts with 0
        expect(isValidPincode('11000')).toBe(false); // Short
        expect(isValidPincode('1100012')).toBe(false); // Long
        expect(isValidPincode('110a01')).toBe(false); // Non-numeric
    });

    it('should reject unknown regions', () => {
        expect(isValidPincode('980001')).toBe(false); // 98 not likely mapped/valid
    });

    it('should reject null/undefined input', () => {
        expect(isValidPincode(null)).toBe(false);
        expect(isValidPincode(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidPincode(110001)).toBe(false);
        expect(isValidPincode({})).toBe(false);
        expect(isValidPincode([])).toBe(false);
    });

    it('should reject whitespace and special characters', () => {
        // Pincode with valid structure
        const validPincode = '110001';
        
        // Whitespace should invalidate
        expect(isValidPincode(' ' + validPincode)).toBe(false);
        expect(isValidPincode(validPincode + ' ')).toBe(false);
        expect(isValidPincode(validPincode.substring(0, 3) + ' ' + validPincode.substring(3))).toBe(false);
        
        // Dashes/special chars
        expect(isValidPincode('110-001')).toBe(false);
        expect(isValidPincode('110 001')).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isValidPincode('')).toBe(false);
    });
});
