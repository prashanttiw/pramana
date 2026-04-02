import { getAllocatedUANRange } from '../data/uanRanges';

export interface UANInfo {
    raw: string;
    normalized: string;
    isAllocated: boolean;
    rangeNote: string;
}

const UAN_LENGTH = 12;
const UAN_STRUCTURE_REGEX = /^\d{12}$/;
const ALL_ZEROS_REGEX = /^0{12}$/;
const ALL_SAME_DIGIT_REGEX = /^(\d)\1{11}$/;

/**
 * Normalizes UAN input to canonical validation form:
 * - Trims outer whitespace
 * - Removes internal spaces and hyphens
 *
 * @param input Raw UAN input.
 * @returns Normalized UAN candidate.
 */
const normalizeUAN = (input: string): string => (
    input.trim().replace(/[\s-]/g, '')
);

/**
 * Validates an EPFO Universal Account Number (UAN).
 *
 * Validation rules:
 * - Input must be a non-empty string
 * - Normalized value must be exactly 12 digits
 * - Reject known synthetic invalid patterns (all zeros / all same digit)
 * - Prefix must fall in a known allocated EPFO range
 *
 * @param input UAN input from caller.
 * @returns True for valid UAN, false for invalid input. Never throws.
 */
export const isValidUAN = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeUAN(input);
    if (normalized.length !== UAN_LENGTH) return false;
    if (!UAN_STRUCTURE_REGEX.test(normalized)) return false;
    if (ALL_ZEROS_REGEX.test(normalized)) return false;
    if (ALL_SAME_DIGIT_REGEX.test(normalized)) return false;

    const allocatedRange = getAllocatedUANRange(normalized);
    if (allocatedRange == null) return false;

    return true;
};

/**
 * Returns parsed UAN metadata for valid input.
 *
 * @param input UAN string.
 * @returns Parsed UANInfo object, or null when UAN is invalid.
 */
export const getUANInfo = (input: string): UANInfo | null => {
    if (!isValidUAN(input)) return null;

    const normalized = normalizeUAN(input);
    const allocatedRange = getAllocatedUANRange(normalized);
    if (allocatedRange == null) return null;

    return {
        raw: input,
        normalized,
        isAllocated: true,
        rangeNote: allocatedRange.note,
    };
};
