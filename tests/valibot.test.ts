import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import { generateGSTCheckDigit } from '../src/utils/mod36';
import { generateVerhoeff } from '../src/utils/verhoeff';
import {
    aadhaar,
    pan,
    gstin,
    ifsc,
    pincode,
    tan,
    uan,
    voterId,
    dl,
    passport,
    upi,
    phone,
    msme,
} from '../src/valibot';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;
const buildGSTIN = (base14: string): string => `${base14}${GST_CHARSET[generateGSTCheckDigit(base14)]}`;

const VALID_AADHAAR = buildAadhaar('28473910582');
const INVALID_AADHAAR = '999999990018';

const smokeCases = [
    { name: 'aadhaar', action: aadhaar, valid: VALID_AADHAAR, invalid: INVALID_AADHAAR },
    { name: 'pan', action: pan, valid: 'ABCPE1234F', invalid: 'ABCDE1234F' },
    { name: 'gstin', action: gstin, valid: buildGSTIN('27AAPFR5055K1Z'), invalid: '27AAPFR5055K1Z0' },
    { name: 'ifsc', action: ifsc, valid: 'SBIN0000300', invalid: 'SBIN1000300' },
    { name: 'pincode', action: pincode, valid: '110001', invalid: '010001' },
    { name: 'tan', action: tan, valid: 'DELA12345B', invalid: 'DEL112345B' },
    { name: 'uan', action: uan, valid: '100123456789', invalid: '099123456789' },
    { name: 'voterId', action: voterId, valid: 'ABC1234567', invalid: 'ABC0000000' },
    { name: 'dl', action: dl, valid: 'MH0120110169971', invalid: 'ZZ0120110169971' },
    { name: 'passport', action: passport, valid: 'A1234567', invalid: 'Q1234567' },
    { name: 'upi', action: upi, valid: '9876543210@ybl', invalid: 'name@fakepay' },
    { name: 'phone', action: phone, valid: '9876543210', invalid: '1234567890' },
    { name: 'msme', action: msme, valid: 'UDYAM-MH-07-0012345', invalid: 'UDYAM-ZZ-07-0012345' },
] as const;

describe('Valibot integration', () => {
    it('v.pipe(v.string(), aadhaar()) passes for valid Aadhaar', () => {
        const schema = v.pipe(v.string(), aadhaar());
        const result = v.safeParse(schema, VALID_AADHAAR);
        expect(result.success).toBe(true);
    });

    it('v.pipe(v.string(), aadhaar()) fails for invalid Aadhaar', () => {
        const schema = v.pipe(v.string(), aadhaar());
        const result = v.safeParse(schema, INVALID_AADHAAR);
        expect(result.success).toBe(false);
    });

    it('uses custom message when provided', () => {
        const schema = v.pipe(v.string(), aadhaar('Custom Aadhaar issue'));
        const result = v.safeParse(schema, INVALID_AADHAAR);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.issues[0]?.message).toBe('Custom Aadhaar issue');
        }
    });

    it('safeParse() returns issues array on failure', () => {
        const schema = v.pipe(v.string(), pan());
        const result = v.safeParse(schema, 'ABCDE1234F');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(Array.isArray(result.issues)).toBe(true);
            expect(result.issues.length).toBeGreaterThan(0);
        }
    });

    it('safeParse() returns success for valid simple schema', () => {
        const schema = v.pipe(v.string(), pan());
        const result = v.safeParse(schema, 'ABCPE1234F');
        expect(result.success).toBe(true);
    });

    it('works with v.object() for multiple valid document fields', () => {
        const schema = v.object({
            aadhaarNumber: v.pipe(v.string(), aadhaar()),
            panNumber: v.pipe(v.string(), pan()),
            gstinNumber: v.optional(v.pipe(v.string(), gstin())),
        });

        const result = v.safeParse(schema, {
            aadhaarNumber: VALID_AADHAAR,
            panNumber: 'ABCPE1234F',
            gstinNumber: buildGSTIN('27AAPFR5055K1Z'),
        });

        expect(result.success).toBe(true);
    });

    it('v.object() schema reports issues for invalid field values', () => {
        const schema = v.object({
            aadhaarNumber: v.pipe(v.string(), aadhaar()),
            panNumber: v.pipe(v.string(), pan()),
        });

        const result = v.safeParse(schema, {
            aadhaarNumber: INVALID_AADHAAR,
            panNumber: 'ABCPE1234F',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0]?.message).toContain('Aadhaar');
        }
    });

    it.each(smokeCases)(
        '%s action validates valid value and rejects invalid value',
        ({ action, valid, invalid }) => {
            const schema = v.pipe(v.string(), action());
            const validResult = v.safeParse(schema, valid);
            const invalidResult = v.safeParse(schema, invalid);

            expect(validResult.success).toBe(true);
            expect(invalidResult.success).toBe(false);
        },
    );
});
