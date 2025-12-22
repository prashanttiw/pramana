import { validateGSTCheckDigit } from '../utils/mod36';

/**
 * Validates a GSTIN (Goods and Services Tax Identification Number).
 * @param gstin The 15-character GSTIN string.
 * @returns True if valid, false otherwise.
 */
export const isValidGSTIN = (gstin: string): boolean => {
    // 1. Basic Regex Structure
    // \d{2} -> State Code 
    // [A-Z]{5}\d{4}[A-Z]{1} -> PAN
    // [1-9A-Z]{1} -> Entity Number
    // Z -> Default
    // [0-9A-Z]{1} -> Check Digit
    const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!regex.test(gstin)) return false;

    // 2. Validate Mod-36 Check Digit
    return validateGSTCheckDigit(gstin);
};
