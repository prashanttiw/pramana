import { BANK_CODES } from '../data/banks';

/**
 * Validates an IFSC Code.
 * @param ifsc The 11-character IFSC string.
 * @returns True if valid, false otherwise.
 */
export const isValidIFSC = (ifsc: string): boolean => {
    // 1. Structure: 4 chars, 0, 6 chars (alphanumeric)
    const regex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!regex.test(ifsc)) return false;

    // 2. Knowledge: Check if the Bank Code (first 4 chars) is known
    const bankCode = ifsc.substring(0, 4);

    // In strict mode, we only allow known banks.
    // In permissive mode (if we hadn't hardcoded), we'd skip.
    // For this library, we want high performance validation, so checking the Set is fast.
    return BANK_CODES.has(bankCode);
};
