import { z } from 'zod';
import {
    isValidAadhaar,
    isValidPAN,
    isValidTAN,
    isValidUAN,
    isValidGSTIN,
    isValidIFSC,
    isValidPincode,
    isValidVoterID,
    isValidDrivingLicense,
    isValidPassport,
    isValidUPI,
} from '../validators';

export const aadhaarSchema = z.string().refine(isValidAadhaar, {
    message: "Invalid Aadhaar Number",
});

export const panSchema = z.string().refine(isValidPAN, {
    message: "Invalid PAN Number",
});

export const tanSchema = z.string().refine(isValidTAN, {
    message: 'Invalid TAN \u2014 must be 10 characters in format AAAA99999A',
});

export const uanSchema = z.string().refine(isValidUAN, {
    message: 'Invalid UAN \u2014 must be a 12-digit EPFO Universal Account Number',
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

export const voterIdSchema = z.string().refine(isValidVoterID, {
    message: 'Invalid Voter ID \u2014 must be in format ABC1234567 (3 letters + 7 digits)',
});

export const drivingLicenseSchema = z.string().refine(isValidDrivingLicense, {
    message: 'Invalid Driving License \u2014 expected format: SS00YYYYNNNNNNN',
});

export const passportSchema = z.string().refine(isValidPassport, {
    message: 'Invalid Indian passport number \u2014 expected format: A1234567',
});

export const upiSchema = z.string().refine(isValidUPI, {
    message: 'Invalid UPI ID \u2014 expected format: handle@provider (e.g., name@okaxis)',
});
