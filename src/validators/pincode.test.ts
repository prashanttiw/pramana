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
});
