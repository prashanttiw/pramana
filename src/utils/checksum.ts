/**
 * Validates a number string using the Luhn algorithm (Mod 10).
 * Used for credit cards, IMEI, etc.
 * @param numStr The number string to validate.
 * @returns True if valid, false otherwise.
 */
export const validateLuhn = (numStr: string): boolean => {
    if (!/^\d+$/.test(numStr)) return false;

    let sum = 0;
    let shouldDouble = false;

    // Loop through values starting from the rightmost digit
    for (let i = numStr.length - 1; i >= 0; i--) {
        let digit = parseInt(numStr.charAt(i));

        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
};

/**
 * Validates using Mod 11 algorithm with specified weights.
 * @param numStr The number string to validate.
 * @param weights The weights array (aligned from right to left).
 * @returns True if remainder is 0 (or matches specific check digit logic).
 * Note: This is a base implementation, specific IDs often have variations.
 */
// export const validateMod11 = ... // Saving for specific implementation needs (PAN/TAN have alpha-numeric logic)
