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
});
