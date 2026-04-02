import { describe, it, expect } from 'vitest';
import { isValidTAN, getTANInfo } from '../../src/validators/tan';

describe('TAN Validator', () => {
    it('should validate correct TAN numbers', () => {
        expect(isValidTAN('DELA12345B')).toBe(true);
        expect(isValidTAN('MUMA00001A')).toBe(true);
    });

    it('should accept lowercase input by normalizing to uppercase', () => {
        expect(isValidTAN('dela12345b')).toBe(true);
    });

    it('should reject invalid length', () => {
        expect(isValidTAN('DELA12345')).toBe(false); // 9 chars
        expect(isValidTAN('DELA12345BC')).toBe(false); // 11 chars
    });

    it('should reject invalid structure by position', () => {
        expect(isValidTAN('DEL112345B')).toBe(false); // 4th char must be alphabet
        expect(isValidTAN('DELA12A45B')).toBe(false); // positions 5-9 must be digits
        expect(isValidTAN('DELA123451')).toBe(false); // last char must be alphabet
    });

    it('should normalize whitespace and separators before validation', () => {
        expect(isValidTAN(' DELA12345B')).toBe(true);
        expect(isValidTAN('DELA12345B ')).toBe(true);
        expect(isValidTAN('DELA 12345 B')).toBe(true);
        expect(isValidTAN('DELA-12345-B')).toBe(true);
    });

    it('should reject empty string', () => {
        expect(isValidTAN('')).toBe(false);
    });

    it('should reject null/undefined input', () => {
        expect(isValidTAN(null)).toBe(false);
        expect(isValidTAN(undefined)).toBe(false);
    });

    it('should reject non-string input', () => {
        expect(isValidTAN(123)).toBe(false);
        expect(isValidTAN({})).toBe(false);
        expect(isValidTAN([])).toBe(false);
    });

    it('should reject PAN-like pattern in TAN validator', () => {
        expect(isValidTAN('ABCPE1234F')).toBe(false);
    });
});

describe('getTANInfo', () => {
    it('should return parsed TAN info for valid TAN', () => {
        const info = getTANInfo(' dela-12345-b ');
        expect(info).not.toBeNull();
        if (info) {
            expect(info.raw).toBe(' dela-12345-b ');
            expect(info.normalized).toBe('DELA12345B');
            expect(info.cityCode).toBe('DELA');
            expect(info.sequenceNumber).toBe('12345');
            expect(info.lastChar).toBe('B');
            expect(info.deductorType).toContain('initial of deductor/collector name');
        }
    });

    it('should return null for invalid TAN', () => {
        expect(getTANInfo('ABCPE1234F')).toBeNull();
    });
});
