import { beforeAll, describe, expect, it } from 'vitest';
import * as yup from 'yup';
import { generateGSTCheckDigit } from '../src/utils/mod36';
import { generateVerhoeff } from '../src/utils/verhoeff';
import {
    aadhaarMethod,
    setupPramanaYup,
} from '../src/yup';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;
const buildGSTIN = (base14: string): string => `${base14}${GST_CHARSET[generateGSTCheckDigit(base14)]}`;

const VALID_AADHAAR = buildAadhaar('28473910582');
const INVALID_AADHAAR = '999999990018';

const smokeCases = [
    { method: 'aadhaar', valid: VALID_AADHAAR, invalid: INVALID_AADHAAR },
    { method: 'pan', valid: 'ABCPE1234F', invalid: 'ABCDE1234F' },
    { method: 'gstin', valid: buildGSTIN('27AAPFR5055K1Z'), invalid: '27AAPFR5055K1Z0' },
    { method: 'ifsc', valid: 'SBIN0000300', invalid: 'SBIN1000300' },
    { method: 'pincode', valid: '110001', invalid: '010001' },
    { method: 'tan', valid: 'DELA12345B', invalid: 'DEL112345B' },
    { method: 'uan', valid: '100123456789', invalid: '099123456789' },
    { method: 'voterId', valid: 'ABC1234567', invalid: 'ABC0000000' },
    { method: 'dl', valid: 'MH0120110169971', invalid: 'ZZ0120110169971' },
    { method: 'passport', valid: 'A1234567', invalid: 'Q1234567' },
    { method: 'upi', valid: '9876543210@ybl', invalid: 'name@fakepay' },
    { method: 'phone', valid: '9876543210', invalid: '1234567890' },
    { method: 'msme', valid: 'UDYAM-MH-07-0012345', invalid: 'UDYAM-ZZ-07-0012345' },
] as const;

beforeAll(() => {
    setupPramanaYup();
});

describe('Yup integration', () => {
    it('aadhaarMethod() validates a valid Aadhaar', () => {
        const schema = aadhaarMethod().call(yup.string());
        expect(schema.isValidSync(VALID_AADHAAR)).toBe(true);
    });

    it('aadhaarMethod() rejects an invalid Aadhaar', () => {
        const schema = aadhaarMethod().call(yup.string());
        expect(schema.isValidSync(INVALID_AADHAAR)).toBe(false);
    });

    it('works with yup.string().required().aadhaar() chaining for valid input', () => {
        const schema = yup.string().required().aadhaar();
        expect(schema.isValidSync(VALID_AADHAAR)).toBe(true);
    });

    it('works with yup.string().required().aadhaar() by failing on empty input', () => {
        const schema = yup.string().required().aadhaar();
        expect(() => schema.validateSync('')).toThrow();
    });

    it('uses custom message when provided', () => {
        const schema = aadhaarMethod('Custom Aadhaar error').call(yup.string());
        expect(() => schema.validateSync(INVALID_AADHAAR)).toThrow('Custom Aadhaar error');
    });

    it('setupPramanaYup() registers string methods on yup schemas', () => {
        const schema = yup.string() as yup.StringSchema & Record<string, unknown>;
        expect(typeof schema.aadhaar).toBe('function');
        expect(typeof schema.pan).toBe('function');
        expect(typeof schema.gstin).toBe('function');
    });

    it('TypeScript augmentation allows yup.string().aadhaar() without compile errors', () => {
        const schema: yup.StringSchema = yup.string().aadhaar();
        expect(schema).toBeDefined();
    });

    it.each(smokeCases)(
        'method %s validates valid value and rejects invalid value',
        ({ method, valid, invalid }) => {
            const schema = (yup.string() as unknown as Record<string, () => yup.StringSchema>)[method]();
            expect(schema.isValidSync(valid)).toBe(true);
            expect(schema.isValidSync(invalid)).toBe(false);
        },
    );
});
