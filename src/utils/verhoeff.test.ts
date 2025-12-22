import { describe, it, expect } from 'vitest';
import { validateVerhoeff, generateVerhoeff } from './verhoeff';

describe('Verhoeff Algorithm', () => {
    describe('validateVerhoeff', () => {
        it('should validate correct Verhoeff numbers', () => {
            // Examples: 236, 12340
            expect(validateVerhoeff('236')).toBe(true);
            expect(validateVerhoeff('12340')).toBe(true);
        });

        it('should reject incorrect Verhoeff numbers', () => {
            // 237 is invalid (checksum of 23 is 6)
            expect(validateVerhoeff('237')).toBe(false);
            expect(validateVerhoeff('12341')).toBe(false);
        });

        it('should reject non-numeric strings', () => {
            expect(validateVerhoeff('abc')).toBe(false);
            expect(validateVerhoeff('123a')).toBe(false);
        });
    });

    describe('generateVerhoeff', () => {
        it('should generate correct checksums', () => {
            expect(generateVerhoeff('23')).toBe(6);
            expect(generateVerhoeff('1234')).toBe(0);
        });

        it('should throw error for non-numeric input', () => {
            expect(() => generateVerhoeff('12a')).toThrow();
        });
    });
});
