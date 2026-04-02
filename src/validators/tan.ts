export interface TANInfo {
    raw: string;
    normalized: string;
    cityCode: string;
    sequenceNumber: string;
    lastChar: string;
    deductorType: string;
}

/**
 * Normalizes TAN input to a canonical form:
 * - Trims outer whitespace
 * - Converts to uppercase
 * - Removes spaces and hyphens
 *
 * @param input Raw TAN input.
 * @returns Normalized TAN candidate.
 */
const normalizeTAN = (input: string): string => (
    input.trim().toUpperCase().replace(/[\s-]/g, '')
);

/**
 * Validates a Tax Deduction and Collection Account Number (TAN).
 *
 * Validation rules:
 * - Input must be a non-empty string
 * - Normalized structure must be exactly `AAAA99999A`
 * - Position 4 is TAN-specific name-initial character (alphabet),
 *   not PAN entity-type logic
 *
 * @param input TAN input from caller.
 * @returns True for valid TAN, false for invalid input. Never throws.
 */
export const isValidTAN = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeTAN(input);
    if (normalized.length !== 10) return false;

    if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(normalized)) return false;

    // TAN position 4: initial of deductor/collector name (alphabetic).
    const tanSpecificChar = normalized.charAt(3);
    if (!/^[A-Z]$/.test(tanSpecificChar)) return false;

    return true;
};

/**
 * Returns parsed TAN metadata for valid input.
 *
 * @param input TAN string.
 * @returns Parsed TANInfo object, or null when TAN is invalid.
 */
export const getTANInfo = (input: string): TANInfo | null => {
    if (!isValidTAN(input)) return null;

    const normalized = normalizeTAN(input);
    const nameInitial = normalized.charAt(3);

    return {
        raw: input,
        normalized,
        cityCode: normalized.substring(0, 4),
        sequenceNumber: normalized.substring(4, 9),
        lastChar: normalized.charAt(9),
        deductorType: `Name-initial code (${nameInitial}): initial of deductor/collector name`,
    };
};
