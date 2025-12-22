/**
 * Character set for Mod-36 checksum: 0-9, A-Z
 * Used in GSTIN validation (GST Identification Number)
 */
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates the Mod-36 check digit for a 14-character GSTIN base.
 * 
 * Algorithm:
 * 1. For each of the 14 characters (left to right, 0-indexed):
 *    - Convert character to numeric value (0-35)
 *    - Multiply by weight: weight = (index % 2) + 1, alternating 1, 2, 1, 2...
 *    - Calculate: quotient = product / 36, remainder = product % 36
 *    - Add quotient + remainder to sum
 * 2. Calculate check digit index: (36 - (sum % 36)) % 36
 * 3. Map index back to character
 * 
 * Reference: Official GSTIN format specification (Ministry of Finance, India)
 * 
 * @param gstinBase The first 14 characters of GSTIN (excluding check digit)
 * @returns The check digit index (0-35), or -1 if input is invalid
 */
export const generateGSTCheckDigit = (gstinBase: any): number => {
    // Defensive: Handle null/undefined/non-string
    if (gstinBase == null || typeof gstinBase !== 'string') return -1;
    if (gstinBase.length !== 14) return -1;
    
    const input = gstinBase.toUpperCase();
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        const charValue = CHARSET.indexOf(input[i]);
        if (charValue < 0) return -1; // Invalid character

        // Weight alternates: 1, 2, 1, 2, ... (for positions 0, 1, 2, 3, ...)
        const weight = (i % 2) + 1;
        const product = charValue * weight;
        
        // Add both quotient and remainder
        sum += Math.floor(product / 36) + (product % 36);
    }

    // Check digit index = (36 - (sum mod 36)) mod 36
    const checkDigitIndex = (36 - (sum % 36)) % 36;
    return checkDigitIndex;
};

/**
 * Validates a GSTIN using Mod-36 Checksum Algorithm.
 * 
 * @param gstin The 15-character GSTIN string to validate
 * @returns True if the check digit is valid, false otherwise
 */
export const validateGSTCheckDigit = (gstin: any): boolean => {
    // Defensive: Handle null/undefined/non-string
    if (gstin == null || typeof gstin !== 'string') return false;
    if (gstin.length !== 15) return false;
    
    const input = gstin.toUpperCase();
    const gstinBase = input.substring(0, 14);
    const providedCheckDigit = input.charAt(14);
    
    // Generate expected check digit
    const expectedCheckDigitIndex = generateGSTCheckDigit(gstinBase);
    if (expectedCheckDigitIndex < 0) return false;
    
    const expectedCheckDigit = CHARSET[expectedCheckDigitIndex];
    return providedCheckDigit === expectedCheckDigit;
};
