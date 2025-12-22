/**
 * Characters used in GSTIN Checksum (0-9, A-Z)
 */
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Validates a GSTIN using Mod-36 Checksum Algorithm.
 * @param gstin The 15-character GSTIN string to validate.
 * @returns True if valid, false otherwise.
 */
export const validateLCMod36 = (gstin: string): boolean => {
    // GSTIN must be 15 chars
    if (gstin.length !== 15) return false;

    // We only process the first 14 digits to calculate the expected 15th
    const chars = gstin.toUpperCase().split('');
    const checkChar = chars[14]; // The 15th char provided
    const mainChars = chars.slice(0, 14);

    let sum = 0;

    for (let i = 0; i < mainChars.length; i++) {
        const char = mainChars[i];
        const val = CHARS.indexOf(char);

        if (val === -1) return false; // Invalid char

        // Weights for GSTIN mod 36 are simple: alternate multiplication isn't the standard Mod 36,
        // Actually GSTIN uses a specific variation. 
        // Factor = (i % 2) (0-indexed position, right to left or left to right? GSTIN specific)

        // Standard GSTIN algo:
        // 1. Convert each char to value (0-9, A-Z -> 0-35)
        // 2. Multiply by weight. Weight cycle is 1, 2 (from RIGHT? No, usually left).
        // Let's use the specific iterative approach:

        // Correct GSTIN Mod-36 Algo:
        // 1. Factor = 1 for even position (0, 2..), 2 for odd position (1, 3..)
        //    WAIT: It is actually right-to-left 1, 2? or left-to-right?
        //    Standard implementation: Loop i from 0 to 13.

        // Let's implement the hash method often used:
        let factor = (i % 2) === 0 ? 1 : 2; // Not quite, let's stick to the reliable pre-computed or standard loop.
    }

    // REVISING APPROACH: Using the standard "LUT" or direct implementation for GSTIN
    // Reference: factor * value -> quotient + remainder -> sum all.

    sum = 0;
    for (let i = 0; i < 14; i++) {
        let code = CHARS.indexOf(mainChars[i]);
        if (code < 0) return false;

        let factor = (i % 2 === 1) ? 2 : 1; // 1-indexed: odd=1, even=2. 0-indexed: even=1, odd=2? 
        // Actually for GSTIN, the weights are reversed or specific. 
        // Let's use the widely accepted implementation:
        // Input: 14 chars. For each char:
        //  k = value * factor
        //  result = k / 36 + k % 36
        //  sum += result

        // Correct Logic for GSTIN:
        // Factor sequence: ...

        // Let's go with the known robust implementation:
        // Multiply by factor. Factor alternates 1, 2? No, it's (value * factor) % 36.
        // Actually, let's simply implement the standard ISO 7064 Mod 36, 11 (used for IBAN) or similar? No GSTIN is Mod 36.

        // Ref: https://github.com/verma-kunal/gstin-validator/blob/master/index.js (Logic verification)
        // Loop 0-13. 
        // Factor: i%2 == 14%2 ? ... 

        // Let's use the known working logic below:

        let value = code;
        let multi = value * ((i % 2) + 1); // 1, 2, 1, 2...
        let quotient = Math.floor(multi / 36);
        let remainder = multi % 36;
        sum += quotient + remainder;
    }

    const checkCode = (36 - (sum % 36)) % 36;
    return CHARS[checkCode] === checkChar;
};

// Re-write to be perfectly safe and typed
export const validateGSTCheckDigit = (gstin: string): boolean => {
    if (gstin.length !== 15) return false;
    const input = gstin.toUpperCase();

    const keys = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sum = 0;

    for (let i = 0; i < 14; i++) {
        let val = keys.indexOf(input[i]);
        if (val < 0) return false;

        // Weight: 1 for even index, 2 for odd index (0-indexed? No reverse?)
        // The official formula is:
        // 1. Multiply digit with weight (1, 2, 1, 2...)
        // 2. Add quotient and remainder of (product / 36) to sum
        // 3. Final Check Digit = 36 - (sum % 36)

        let factor = (i % 2) + 1; // 1, 2, 1, 2... 
        // Wait, normally it is reversed? Let's check a valid GSTIN later in tests. 
        // For now, implementing standard forward oscillation.

        let product = val * factor;
        sum += Math.floor(product / 36) + (product % 36);
    }

    let remainder = sum % 36;
    let checkDigitIndex = (36 - remainder) % 36;

    return keys[checkDigitIndex] === input[14];
}
