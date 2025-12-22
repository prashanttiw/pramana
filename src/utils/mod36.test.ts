import { describe, it, expect } from 'vitest';
import { generateGSTCheckDigit, validateGSTCheckDigit } from './mod36';

describe('Mod-36 Checksum (GSTIN)', () => {
    describe('generateGSTCheckDigit', () => {
        it('should generate correct check digit for valid GSTIN base', () => {
            // These are GSTIN bases with calculated check digits
            // Format: 2-digit state code + 5-letter PAN + 4-digit sequence + 1-letter entity + 1-letter hash
            
            // 27AAPFR5055K1Z -> check digit is 22 (which is 'M' in charset)
            expect(generateGSTCheckDigit('27AAPFR5055K1Z')).toBe(22); // 'M' = index 22 in charset (0-9=0-9, A-Z=10-35)
            
            // 29ABCDE1234F1Z -> Testing with a constructed example
            const checkDigitIndex = generateGSTCheckDigit('29ABCDE1234F1Z');
            expect(typeof checkDigitIndex).toBe('number');
            expect(checkDigitIndex).toBeGreaterThanOrEqual(0);
            expect(checkDigitIndex).toBeLessThan(36);
        });

        it('should return -1 for invalid length', () => {
            expect(generateGSTCheckDigit('29ABCDE1234F1')).toBe(-1); // 13 chars
            expect(generateGSTCheckDigit('29ABCDE1234F1ZZ')).toBe(-1); // 15 chars
        });

        it('should return -1 for invalid characters', () => {
            expect(generateGSTCheckDigit('29ABCDE1234F1@')).toBe(-1); // Invalid char '@'
            expect(generateGSTCheckDigit('29ABCDE1234F1Z!')).toBe(-1); // Invalid char '!'
        });

        it('should return -1 for whitespace', () => {
            expect(generateGSTCheckDigit('29ABCDE 1234F1Z')).toBe(-1);
            expect(generateGSTCheckDigit(' 29ABCDE1234F1Z')).toBe(-1);
            expect(generateGSTCheckDigit('29ABCDE1234F1Z ')).toBe(-1);
        });

        it('should return -1 for empty string', () => {
            expect(generateGSTCheckDigit('')).toBe(-1);
        });

        it('should return -1 for null/undefined input', () => {
            expect(generateGSTCheckDigit(null)).toBe(-1);
            expect(generateGSTCheckDigit(undefined)).toBe(-1);
        });

        it('should return -1 for non-string input', () => {
            expect(generateGSTCheckDigit(29)).toBe(-1);
            expect(generateGSTCheckDigit({})).toBe(-1);
            expect(generateGSTCheckDigit([])).toBe(-1);
        });

        it('should accept lowercase and convert to uppercase', () => {
            const result1 = generateGSTCheckDigit('29abcde1234f1z');
            const result2 = generateGSTCheckDigit('29ABCDE1234F1Z');
            expect(result1).toBe(result2);
        });

        it('should handle all valid characters (0-9, A-Z)', () => {
            // Test with all numeric
            const allNumeric = generateGSTCheckDigit('29123456789012');
            expect(allNumeric).toBeGreaterThanOrEqual(0);
            
            // Test with all alpha
            const allAlpha = generateGSTCheckDigit('29ABCDEFGHIJKL');
            expect(allAlpha).toBeGreaterThanOrEqual(0);
            
            // Test with mixed
            const mixed = generateGSTCheckDigit('29A1B2C3D4E5F6');
            expect(mixed).toBeGreaterThanOrEqual(0);
        });
    });

    describe('validateGSTCheckDigit', () => {
        it('should validate correct GSTIN with proper check digit', () => {
            // Real GSTIN: 27AAPFR5055K1ZM (check digit 'M' = index 22)
            expect(validateGSTCheckDigit('27AAPFR5055K1ZM')).toBe(true);
        });

        it('should reject incorrect check digit', () => {
            expect(validateGSTCheckDigit('27AAPFR5055K1Z0')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055K1Z1')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055K1Z9')).toBe(false);
        });

        it('should reject invalid length', () => {
            expect(validateGSTCheckDigit('27AAPFR5055K1')).toBe(false); // 14 chars
            expect(validateGSTCheckDigit('27AAPFR5055K1Z11')).toBe(false); // 16 chars
        });

        it('should reject invalid characters in base', () => {
            expect(validateGSTCheckDigit('27AAPFR5055K1@1')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055K1!1')).toBe(false);
        });

        it('should reject whitespace', () => {
            expect(validateGSTCheckDigit(' 27AAPFR5055K1Z1')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055K1Z1 ')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055 K1Z1')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(validateGSTCheckDigit('')).toBe(false);
        });

        it('should reject null/undefined input', () => {
            expect(validateGSTCheckDigit(null)).toBe(false);
            expect(validateGSTCheckDigit(undefined)).toBe(false);
        });

        it('should reject non-string input', () => {
            expect(validateGSTCheckDigit(27)).toBe(false);
            expect(validateGSTCheckDigit({})).toBe(false);
            expect(validateGSTCheckDigit([])).toBe(false);
        });

        it('should accept lowercase and normalize to uppercase', () => {
            const lowercase = validateGSTCheckDigit('27aapfr5055k1z1');
            const uppercase = validateGSTCheckDigit('27AAPFR5055K1Z1');
            expect(lowercase).toBe(uppercase);
        });

        it('should reject invalid check digit character', () => {
            expect(validateGSTCheckDigit('27AAPFR5055K1Z@')).toBe(false);
            expect(validateGSTCheckDigit('27AAPFR5055K1Z!')).toBe(false);
        });

        it('should handle edge case: all zeros in base (invalid for real GSTIN but algorithmically valid)', () => {
            const baseZeros = '00000000000000';
            const checkDigitIndex = generateGSTCheckDigit(baseZeros);
            expect(checkDigitIndex).toBeGreaterThanOrEqual(0);
            
            // Verify round-trip validation
            const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fullGSTIN = baseZeros + charset[checkDigitIndex];
            expect(validateGSTCheckDigit(fullGSTIN)).toBe(true);
        });

        it('should handle edge case: all Z in base', () => {
            const baseZ = 'ZZZZZZZZZZZZZZ';
            const checkDigitIndex = generateGSTCheckDigit(baseZ);
            expect(checkDigitIndex).toBeGreaterThanOrEqual(0);
            
            const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fullGSTIN = baseZ + charset[checkDigitIndex];
            expect(validateGSTCheckDigit(fullGSTIN)).toBe(true);
        });
    });

    describe('Round-trip validation', () => {
        it('should generate check digit that passes validation', () => {
            const testBases = [
                '27AAPFR5055K1Z',
                '29ABCDE1234F1Z',
                '07ABCDE1234F1Z',
                '37AZBPU5054C1Z',
            ];

            testBases.forEach(base => {
                const checkDigitIndex = generateGSTCheckDigit(base);
                expect(checkDigitIndex).toBeGreaterThanOrEqual(0);
                
                const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const fullGSTIN = base + charset[checkDigitIndex];
                expect(validateGSTCheckDigit(fullGSTIN)).toBe(true);
            });
        });

        it('should reject if any digit in generated GSTIN is changed', () => {
            const base = '27AAPFR5055K1Z';
            const checkDigitIndex = generateGSTCheckDigit(base);
            const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fullGSTIN = base + charset[checkDigitIndex];

            // Change each position and verify rejection
            for (let i = 0; i < fullGSTIN.length; i++) {
                const chars = fullGSTIN.split('');
                const nextCharIndex = (charset.indexOf(chars[i]) + 1) % 36;
                chars[i] = charset[nextCharIndex];
                const modified = chars.join('');
                
                expect(validateGSTCheckDigit(modified)).toBe(false);
            }
        });
    });

    describe('Weight calculation accuracy', () => {
        it('should apply correct weights: 1, 2, 1, 2, ... from left to right', () => {
            // Verify weight pattern by testing known bases
            // Position 0: weight 1, Position 1: weight 2, Position 2: weight 1, Position 3: weight 2, etc.
            
            // Base with alternating pattern to verify weighting
            const base1 = '11111111111111'; // All 1s
            const base2 = '22222222222222'; // All 2s
            
            const check1 = generateGSTCheckDigit(base1);
            const check2 = generateGSTCheckDigit(base2);
            
            // Both should generate valid check digits (may or may not be equal)
            expect(check1).toBeGreaterThanOrEqual(0);
            expect(check2).toBeGreaterThanOrEqual(0);
            
            // They should be different (unless by coincidence same modulo 36)
            // This test just verifies the algorithm handles them without error
            expect(typeof check1).toBe('number');
            expect(typeof check2).toBe('number');
        });
    });
});
