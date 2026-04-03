export interface VoterIDInfo {
    raw: string;
    normalized: string;
    stateCode: string;
    stateName: string;
    sequenceNumber: string;
}

const VOTER_ID_LENGTH = 10;
const VOTER_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/;
const ALL_ZERO_SEQUENCE_REGEX = /^0{7}$/;

/**
 * Normalizes Voter ID input to canonical validation form:
 * - Trims outer whitespace
 * - Converts to uppercase
 * - Removes internal spaces and hyphens
 *
 * @param input Raw Voter ID input.
 * @returns Normalized Voter ID candidate.
 */
const normalizeVoterID = (input: string): string => (
    input.trim().toUpperCase().replace(/[\s-]/g, '')
);

/**
 * Validates an EPIC / Voter ID number.
 *
 * Validation rules:
 * - Input must be a non-empty string
 * - Normalized value must be exactly 10 characters
 * - Structure must match `AAA9999999`
 * - Numeric suffix cannot be all zeros
 *
 * Note:
 * - The first three letters are FUSN (Assembly Constituency-level), not a
 *   publicly published state-code mapping. A complete official public prefix
 *   whitelist is not available, so no state-prefix whitelist check is applied.
 *
 * @param input Voter ID input from caller.
 * @returns True for valid Voter ID, false for invalid input. Never throws.
 */
export const isValidVoterID = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeVoterID(input);
    if (normalized.length !== VOTER_ID_LENGTH) return false;
    if (!VOTER_ID_REGEX.test(normalized)) return false;

    const sequenceNumber = normalized.substring(3);
    if (ALL_ZERO_SEQUENCE_REGEX.test(sequenceNumber)) return false;

    return true;
};

/**
 * Returns parsed Voter ID metadata for valid input.
 *
 * @param input Voter ID string.
 * @returns Parsed VoterIDInfo object, or null when Voter ID is invalid.
 */
export const getVoterIDInfo = (input: string): VoterIDInfo | null => {
    if (!isValidVoterID(input)) return null;

    const normalized = normalizeVoterID(input);

    return {
        raw: input,
        normalized,
        stateCode: normalized.substring(0, 3),
        stateName: 'Unknown',
        sequenceNumber: normalized.substring(3),
    };
};
