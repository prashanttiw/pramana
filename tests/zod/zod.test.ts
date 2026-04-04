import { describe, it, expect } from 'vitest';
import {
    aadhaarSchema,
    panSchema,
    tanSchema,
    gstinSchema,
    voterIdSchema,
    drivingLicenseSchema,
    passportSchema,
    upiSchema,
} from '../../src/zod';

describe('Zod Adapters', () => {
    it('should validate valid ID via Zod', () => {
        expect(panSchema.safeParse('ABCPE1234F').success).toBe(true);
    });

    it('should return error for invalid ID', () => {
        const result = panSchema.safeParse('ABCDE1234F'); // Invalid 4th char
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid PAN Number');
        }
    });

    it('should validate TAN schema', () => {
        expect(tanSchema.safeParse('dela12345b').success).toBe(true);
        expect(tanSchema.safeParse('DELA-12345-B').success).toBe(true);
    });

    it('should validate Voter ID schema', () => {
        expect(voterIdSchema.safeParse('abc-123 4567').success).toBe(true);
    });

    it('should return error for invalid Voter ID schema', () => {
        const result = voterIdSchema.safeParse('ABC0000000');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid Voter ID \u2014 must be in format ABC1234567 (3 letters + 7 digits)');
        }
    });

    it('should validate Driving License schema', () => {
        expect(drivingLicenseSchema.safeParse('MH-01-20110169971').success).toBe(true);
    });

    it('should return error for invalid Driving License schema', () => {
        const result = drivingLicenseSchema.safeParse('ZZ-00-20110169971');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid Driving License \u2014 expected format: SS00YYYYNNNNNNN');
        }
    });

    it('should validate Passport schema', () => {
        expect(passportSchema.safeParse('a1234567').success).toBe(true);
        expect(passportSchema.safeParse('A 1234567').success).toBe(true);
    });

    it('should return error for invalid Passport schema', () => {
        const result = passportSchema.safeParse('A0000000');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid Indian passport number \u2014 expected format: A1234567');
        }
    });

    it('should validate UPI schema', () => {
        expect(upiSchema.safeParse('name@okaxis').success).toBe(true);
        expect(upiSchema.safeParse('9876543210@UPI').success).toBe(true);
    });

    it('should return error for invalid UPI schema', () => {
        const result = upiSchema.safeParse('name@notarealpsp');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid UPI ID \u2014 expected format: handle@provider (e.g., name@okaxis)');
        }
    });

    // We can rely on core validators logic being tested elsewhere.
    // This just tests the wiring.
});
