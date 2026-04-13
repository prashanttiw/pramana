import * as v from 'valibot';
import {
    isValidAadhaar,
    isValidPAN,
    isValidGSTIN,
    isValidIFSC,
    isValidPincode,
    isValidTAN,
    isValidUAN,
    isValidVoterID,
    isValidDrivingLicense,
    isValidPassport,
    isValidUPI,
    isValidIndianPhone,
    isValidMSME,
} from '../index';

/**
 * @example
 * import * as v from 'valibot'
 * import { aadhaar, pan, gstin } from '@prashanttiw/pramana/valibot'
 *
 * const KYCSchema = v.object({
 *   aadhaarNumber: v.pipe(v.string(), aadhaar()),
 *   panNumber: v.pipe(v.string(), pan()),
 *   gstinNumber: v.optional(v.pipe(v.string(), gstin())),
 * })
 *
 * const result = v.safeParse(KYCSchema, {
 *   aadhaarNumber: '999999990019',
 *   panNumber: 'ABCPE1234F',
 * })
 */
export const aadhaar = (message = 'Invalid Aadhaar number') =>
    v.check(isValidAadhaar, message);

export const pan = (message = 'Invalid PAN number') =>
    v.check(isValidPAN, message);

export const gstin = (message = 'Invalid GSTIN') =>
    v.check(isValidGSTIN, message);

export const ifsc = (message = 'Invalid IFSC code') =>
    v.check(isValidIFSC, message);

export const pincode = (message = 'Invalid pincode') =>
    v.check(isValidPincode, message);

export const tan = (message = 'Invalid TAN') =>
    v.check(isValidTAN, message);

export const uan = (message = 'Invalid UAN') =>
    v.check(isValidUAN, message);

export const voterId = (message = 'Invalid voter ID') =>
    v.check(isValidVoterID, message);

export const dl = (message = 'Invalid driving license') =>
    v.check(isValidDrivingLicense, message);

export const passport = (message = 'Invalid passport number') =>
    v.check(isValidPassport, message);

export const upi = (message = 'Invalid UPI ID') =>
    v.check(isValidUPI, message);

export const phone = (message = 'Invalid Indian phone number') =>
    v.check(isValidIndianPhone, message);

export const msme = (message = 'Invalid MSME number') =>
    v.check(isValidMSME, message);
