import { describe, it, expect } from 'vitest';
import { isValidIFSC } from './ifsc';

describe('IFSC Validator', () => {
    it('should validate correct IFSC numbers', () => {
        expect(isValidIFSC('SBIN0000300')).toBe(true); // State Bank of India
        expect(isValidIFSC('HDFC0001234')).toBe(true); // HDFC
    });

    it('should reject invalid structure', () => {
        expect(isValidIFSC('SBI00000300')).toBe(false); // 3 chars at start
        expect(isValidIFSC('SBIN000030')).toBe(false); // Short
        expect(isValidIFSC('SBIN1000300')).toBe(false); // 5th char not 0
    });

    it('should reject unknown bank codes', () => {
        expect(isValidIFSC('ZZZZ0000300')).toBe(false); // Unknown bank
    });

    it('should reject null/undefined input', () => {
        expect(isValidIFSC(null)).toBe(false);
        expect(isValidIFSC(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidIFSC(123)).toBe(false);
        expect(isValidIFSC({})).toBe(false);
        expect(isValidIFSC([])).toBe(false);
    });

    it('should reject whitespace and special characters', () => {
        // IFSC with valid structure
        const validIFSC = 'SBIN0000300';
        
        // Whitespace should invalidate
        expect(isValidIFSC(' ' + validIFSC)).toBe(false);
        expect(isValidIFSC(validIFSC + ' ')).toBe(false);
        expect(isValidIFSC(validIFSC.substring(0, 4) + ' ' + validIFSC.substring(4))).toBe(false);
        
        // Dashes/special chars
        expect(isValidIFSC('SBIN-0000-300')).toBe(false);
        expect(isValidIFSC('SBIN 0000 300')).toBe(false);
    });

    it('should reject empty string', () => {
        expect(isValidIFSC('')).toBe(false);
    });
});
