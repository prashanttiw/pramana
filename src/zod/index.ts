import { z } from 'zod';
import {
    isValidAadhaar,
    isValidPAN,
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

export const gstinSchema = z.string().refine(isValidGSTIN, {
    message: "Invalid GSTIN Number",
});

export const ifscSchema = z.string().refine(isValidIFSC, {
    message: "Invalid IFSC Code",
});

export const pincodeSchema = z.string().refine(isValidPincode, {
    message: "Invalid Pincode",
});
