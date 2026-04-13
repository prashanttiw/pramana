// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { generateGSTCheckDigit } from '../src/utils/mod36';
import { generateVerhoeff } from '../src/utils/verhoeff';
import { pramanaResolver, type PramanaResolverSchema } from '../src/rhf';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;
const buildGSTIN = (base14: string): string => `${base14}${GST_CHARSET[generateGSTCheckDigit(base14)]}`;

const VALID_AADHAAR = buildAadhaar('28473910582');
const INVALID_AADHAAR = '999999990018';
const VALID_PAN = 'ABCPE1234F';
const INVALID_PAN = 'ABCDE1234F';
const VALID_GSTIN = buildGSTIN('27AAPFR5055K1Z');
const INVALID_GSTIN = '27AAPFR5055K1Z0';

const callResolver = async (
    schema: PramanaResolverSchema,
    values: Record<string, unknown>,
) => {
    const resolver = pramanaResolver(schema);
    return resolver(values, undefined, {
        fields: {},
        names: undefined,
        shouldUseNativeValidation: false,
    });
};

describe('React Hook Form resolver integration', () => {
    it('valid values return empty errors', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar', panNumber: 'pan' },
            { aadhaarNumber: VALID_AADHAAR, panNumber: VALID_PAN },
        );

        expect(result.errors).toEqual({});
    });

    it('valid values return original values object', async () => {
        const values = { aadhaarNumber: VALID_AADHAAR, panNumber: VALID_PAN };
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar', panNumber: 'pan' },
            values,
        );

        expect(result.values).toEqual(values);
    });

    it('invalid Aadhaar returns errors.aadhaarNumber', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar' },
            { aadhaarNumber: INVALID_AADHAAR },
        );

        expect(result.errors.aadhaarNumber).toBeDefined();
    });

    it('invalid Aadhaar error type is pramana', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar' },
            { aadhaarNumber: INVALID_AADHAAR },
        );

        expect(result.errors.aadhaarNumber?.type).toBe('pramana');
    });

    it('invalid Aadhaar error message is human readable', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar' },
            { aadhaarNumber: INVALID_AADHAAR },
        );

        expect(result.errors.aadhaarNumber?.message).toContain('Aadhaar');
    });

    it('error message includes correction suggestion when available', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar' },
            { aadhaarNumber: INVALID_AADHAAR },
        );

        expect(result.errors.aadhaarNumber?.message).toContain('Did you mean');
        expect(result.errors.aadhaarNumber?.message).toContain('999999990019');
    });

    it('multiple fields with one invalid reports only the invalid field', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar', panNumber: 'pan' },
            { aadhaarNumber: VALID_AADHAAR, panNumber: INVALID_PAN },
        );

        expect(result.errors.aadhaarNumber).toBeUndefined();
        expect(result.errors.panNumber).toBeDefined();
    });

    it('multiple invalid fields report each invalid field', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar', panNumber: 'pan' },
            { aadhaarNumber: INVALID_AADHAAR, panNumber: INVALID_PAN },
        );

        expect(result.errors.aadhaarNumber).toBeDefined();
        expect(result.errors.panNumber).toBeDefined();
    });

    it('optional absent field (undefined) is skipped', async () => {
        const result = await callResolver(
            { aadhaarNumber: 'aadhaar', panNumber: 'pan' },
            { aadhaarNumber: VALID_AADHAAR, panNumber: undefined },
        );

        expect(result.errors.panNumber).toBeUndefined();
    });

    it('empty string field is skipped', async () => {
        const result = await callResolver(
            { panNumber: 'pan' },
            { panNumber: '' },
        );

        expect(result.errors.panNumber).toBeUndefined();
    });

    it('null field is skipped', async () => {
        const result = await callResolver(
            { panNumber: 'pan' },
            { panNumber: null },
        );

        expect(result.errors.panNumber).toBeUndefined();
    });

    it('non-string values are converted and validated', async () => {
        const result = await callResolver(
            { panNumber: 'pan' },
            { panNumber: 12345 },
        );

        expect(result.errors.panNumber).toBeDefined();
    });

    it('custom field names are preserved in returned errors', async () => {
        const result = await callResolver(
            { companyGSTIN: 'gstin', primaryPAN: 'pan' },
            { companyGSTIN: INVALID_GSTIN, primaryPAN: VALID_PAN },
        );

        expect(result.errors.companyGSTIN).toBeDefined();
        expect(result.errors.primaryPAN).toBeUndefined();
    });

    it('all schema field names are supported in one resolver', async () => {
        const result = await callResolver(
            {
                aadhaarNumber: 'aadhaar',
                panNumber: 'pan',
                gstinNumber: 'gstin',
                ifscCode: 'ifsc',
                pincodeCode: 'pincode',
                tanNumber: 'tan',
                uanNumber: 'uan',
                voterIdNumber: 'voter-id',
                dlNumber: 'dl',
                passportNumber: 'passport',
                upiId: 'upi',
                phoneNumber: 'phone',
                msmeNumber: 'msme',
            },
            {
                aadhaarNumber: INVALID_AADHAAR,
                panNumber: INVALID_PAN,
                gstinNumber: INVALID_GSTIN,
                ifscCode: 'SBIN1000300',
                pincodeCode: '010001',
                tanNumber: 'DEL112345B',
                uanNumber: '099123456789',
                voterIdNumber: 'ABC0000000',
                dlNumber: 'ZZ0120110169971',
                passportNumber: 'Q1234567',
                upiId: 'name@fakepay',
                phoneNumber: '1234567890',
                msmeNumber: 'UDYAM-ZZ-07-0012345',
            },
        );

        expect(Object.keys(result.errors)).toHaveLength(13);
    });

    it('schema field names work with RHF register()', () => {
        const schema = {
            aadhaarNumber: 'aadhaar',
            panNumber: 'pan',
            gstinNumber: 'gstin',
        } as const;

        const { result } = renderHook(() => useForm({
            resolver: pramanaResolver(schema),
        }));

        const aadhaarReg = result.current.register('aadhaarNumber');
        const panReg = result.current.register('panNumber');
        const gstinReg = result.current.register('gstinNumber');

        expect(aadhaarReg.name).toBe('aadhaarNumber');
        expect(panReg.name).toBe('panNumber');
        expect(gstinReg.name).toBe('gstinNumber');
    });
});
