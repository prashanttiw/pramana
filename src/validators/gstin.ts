import { validateGSTCheckDigit } from '../utils/mod36';
import { GST_STATE_CODES } from '../data/gst_states';

/**
 * Validates a GSTIN.
 * @param gstin The 15-character GSTIN string.
 * @returns True if valid, false otherwise.
 */
export const isValidGSTIN = (gstin: any): boolean => {
    // 0. Null/undefined check
    if (gstin == null) return false;
    if (typeof gstin !== 'string') return false;
    
    // 1. Basic Regex Structure
    const regex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!regex.test(gstin)) return false;

    // 2. Validate Mod-36 Check Digit
    return validateGSTCheckDigit(gstin);
};

export interface GSTINInfo {
    valid: boolean;
    state?: string;
    stateCode?: string;
}

/**
 * Extracts metadata from a GSTIN.
 * @param gstin The GSTIN string.
 * @returns Object containing validity and metadata (State Name).
 */
export const getGSTINInfo = (gstin: string): GSTINInfo => {
    if (!isValidGSTIN(gstin)) {
        return { valid: false };
    }

    const stateCode = gstin.substring(0, 2);

    return {
        valid: true,
        stateCode,
        state: GST_STATE_CODES[stateCode] || 'Unknown State',
    };
};
