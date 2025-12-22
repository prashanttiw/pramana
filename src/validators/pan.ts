/**
 * Validates a Permanent Account Number (PAN).
 * @param pan The 10-character PAN string.
 * @returns True if valid, false otherwise.
 */
export const isValidPAN = (pan: string): boolean => {
    // 1. Structure: 5 chars, 4 digits, 1 char using Regex
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!regex.test(pan)) return false;

    // 2. Logic: 4th character must be one of the valid entity types
    // C - Company
    // P - Person
    // H - HUF
    // F - Firm
    // A - Association of Persons (AOP)
    // T - AOP (Trust)
    // B - Body of Individuals (BOI)
    // L - Local Authority
    // J - Artificial Juridical Person
    // G - Government
    const fourthChar = pan.charAt(3);
    const validEntityTypes = ['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];

    if (!validEntityTypes.includes(fourthChar)) return false;

    return true;
};
