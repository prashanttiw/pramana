import { validateVerhoeff } from '../utils/verhoeff';

/**
 * Validates an Aadhaar number.
 * @param aadhaar The 12-digit Aadhaar number string.
 * @returns True if valid, false otherwise.
 */
export const isValidAadhaar = (aadhaar: any): boolean => {
    // 0. Null/undefined check
    if (aadhaar == null) return false;
    if (typeof aadhaar !== 'string') return false;
    
    // 1. Structure: 12 digits
    if (!/^\d{12}$/.test(aadhaar)) return false;

    // 2. Logic: Should not start with 0 or 1
    if (/^[01]/.test(aadhaar)) return false;

    // 3. Algorithm: Verhoeff Checksum
    return validateVerhoeff(aadhaar);
};
