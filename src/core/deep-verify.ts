import { GST_STATE_CODES } from '../data/gst_states';

export type VerificationType = 'VOTER_ID' | 'RC' | 'UDID';

// Invert GST_STATE_CODES to check valid codes (e.g. '07' -> 'Delhi', but usually we need 'DL' -> 'Delhi')
// Wait, GST codes are numeric '07'. RC/VoterID use Alpha codes 'DL', 'MH'.
// I need a map of 'DL', 'MH', etc.
// I'll create a basic list here or reuse if available.
// Pincode data might map states?
// I'll define a set of valid State abbreviations.
const VALID_STATE_CODES = new Set([
    'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TS', 'TR', 'UP', 'UK', 'WB', 'AN', 'CH', 'DN', 'DD', 'DL', 'LD', 'PY', 'LA'
]);

/**
 * Deep Verification for government IDs.
 * Goes beyond simple Regex by validating component logic (State codes, Structure).
 * @param id The ID string.
 * @param type The ID type.
 */
export const deepVerify = (id: string, type: VerificationType): boolean => {
    if (!id || typeof id !== 'string') return false;
    const cleanId = id.toUpperCase().trim();

    switch (type) {
        case 'VOTER_ID':
            return verifyVoterID(cleanId);
        case 'RC':
            return verifyRC(cleanId);
        case 'UDID':
            return verifyUDID(cleanId);
        default:
            return false;
    }
};

const verifyVoterID = (id: string): boolean => {
    // Standard EPIC Format: 3 Alpha (Series) + 7 Numeric
    // Example: ABC1234567
    const standardRegex = /^[A-Z]{3}[0-9]{7}$/;

    // Old Format support could be added, but standardizing on modern EPIC for "Deep Verify".
    // Old: DL/01/023/123456 (State/Const/Part/Serial)
    const oldRegex = /^[A-Z]{2}\/\d{2}\/\d{3}\/\d{6}$/;

    if (standardRegex.test(id)) {
        return true;
    }
    if (oldRegex.test(id)) {
        // Validate State Code in old format
        const state = id.split('/')[0];
        if (VALID_STATE_CODES.has(state)) return true;
    }

    return false;
};

const verifyRC = (id: string): boolean => {
    // Format: SS-RR-AA-NNNN
    // SS: State Code (2 char)
    // RR: RTO Code (2 digits)
    // AA: Series (optional, 1-3 chars)
    // NNNN: Number (4 digits)
    // Clean spaces/hyphens first?
    const clean = id.replace(/[- ]/g, '');

    // Regex: ^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{4}$
    // Minimum length check? e.g. DL1C1234 -> DL 1 C 1234

    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(clean)) return false;

    // Check State Code
    const state = clean.substring(0, 2);
    if (!VALID_STATE_CODES.has(state)) return false;

    return true;
};

const verifyUDID = (id: string): boolean => {
    // Format: SS DD YYYY NNNNNNN
    // SS: State Code
    // DD: District Code
    // YYYY: Year of Birth? or Issuance?
    // NNNNNNN: Serial
    // Total 18 chars usually. "UDID Card Number is an 18 digit numeric string"?
    // Actually, usually it looks like: MH 01 101 1990 0000001 (example)
    // Often starts with State Code.

    // Pattern: ^[A-Z]{2}[0-9A-Z]{16}$ (Generic)

    if (id.length !== 18) return false;

    // Check State Code
    const state = id.substring(0, 2);
    if (!VALID_STATE_CODES.has(state)) return false;

    // Basic structure check
    // Expecting alphanumerics after state
    return /^[A-Z]{2}[0-9A-Z]{16}$/.test(id);
};
