import { z } from 'zod';
import {
    isValidAadhaar,
    isValidPAN,
    isValidTAN,
    isValidUAN,
    isValidGSTIN,
    isValidIFSC,
    isValidPincode
} from '../validators';

export const aadhaarSchema = z.string().refine(isValidAadhaar, {
    message: "Invalid Aadhaar Number",
});

export const panSchema = z.string().refine(isValidPAN, {
    message: "Invalid PAN Number",
});

export const tanSchema = z.string().refine(isValidTAN, {
    message: 'Invalid TAN — must be 10 characters in format AAAA99999A',
});

export const uanSchema = z.string().refine(isValidUAN, {
    message: 'Invalid UAN — must be a 12-digit EPFO Universal Account Number',
});

export const gstinSchema = z.string().refine(isValidGSTIN, {
    message: "Invalid GSTIN Number",
});

export const ifscSchema = z.string().refine(isValidIFSC, {
    message: "Invalid IFSC Code",
});

export const pincodeSchema = z.string().refine(isValidPincode, {
    message: "Invalid Pincode",
});
