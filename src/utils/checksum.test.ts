import { describe, it, expect } from 'vitest';
import { validateLuhn } from './checksum';

describe('Checksum Utils', () => {
    describe('validateLuhn', () => {
        it('should validate correct Luhn numbers', () => {
            expect(validateLuhn('79927398713')).toBe(true);
            expect(validateLuhn('1234567812345670')).toBe(true);
        });

        it('should reject incorrect Luhn numbers', () => {
            expect(validateLuhn('79927398710')).toBe(false);
            expect(validateLuhn('1234567812345678')).toBe(false);
        });

        it('should reject non-numeric strings', () => {
            expect(validateLuhn('abc')).toBe(false);
        });
    });
});
