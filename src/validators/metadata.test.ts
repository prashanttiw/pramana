import { describe, it, expect } from 'vitest';
import { getPANInfo } from './pan';
import { getGSTINInfo, isValidGSTIN } from './gstin';
import { getPincodeInfo } from './pincode';
import { generateGSTCheckDigit } from '../utils/mod36';

describe('Metadata Extraction', () => {
    describe('PAN Info', () => {
        it('should extract correct person category', () => {
            const info = getPANInfo('ABCPE1234F');
            expect(info.valid).toBe(true);
            expect(info.category).toBe('P');
            expect(info.categoryDesc).toBe('Person');
        });

        it('should extract correct company category', () => {
            const info = getPANInfo('ZZZCZ9999Z');
            expect(info.valid).toBe(true);
            expect(info.categoryDesc).toBe('Company');
        });

        it('should return invalid for bad PAN', () => {
            const info = getPANInfo('INVALID');
            expect(info.valid).toBe(false);
        });
    });

    describe('GSTIN Info', () => {
        it('should extract state name', () => {
            // Generate a valid GSTIN for Karnataka (state code 29)
            const base = '29ABCDE1234F1Z';
            const checkDigitIndex = generateGSTCheckDigit(base);
            const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const gstin = base + charset[checkDigitIndex];

            expect(isValidGSTIN(gstin)).toBe(true);
            
            const info = getGSTINInfo(gstin);
            expect(info.valid).toBe(true);
            expect(info.stateCode).toBe('29');
            expect(info.state).toBe('Karnataka');
        });

        it('should extract Delhi state', () => {
            // Generate a valid GSTIN for Delhi (state code 07)
            const base = '07ABCDE1234F1Z';
            const checkDigitIndex = generateGSTCheckDigit(base);
            const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const gstin = base + charset[checkDigitIndex];

            expect(isValidGSTIN(gstin)).toBe(true);
            
            const info = getGSTINInfo(gstin);
            expect(info.valid).toBe(true);
            expect(info.stateCode).toBe('07');
            expect(info.state).toBe('Delhi');
        });
    });

    describe('Pincode Info', () => {
        it('should extract region', () => {
            const info = getPincodeInfo('110001');
            expect(info.valid).toBe(true);
            expect(info.region).toBe('Delhi');
        });
    });
});
