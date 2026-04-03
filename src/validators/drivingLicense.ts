import { INDIA_RTO_CODE_RANGES, INDIA_STATE_CODES } from '../data/rtoCodes';

export interface DLInfo {
    raw: string;
    normalized: string;
    stateCode: string;
    stateName: string;
    rtoCode: string;
    rtoNumber: number;
    format: 'pre-2021' | 'post-2021' | 'unknown';
    yearHint: number | null;
}

const POST_2021_NORMALIZED_LENGTH = 15; // SS + RR + YYYY + NNNNNNN
const PRE_2021_NORMALIZED_LENGTH = 16;  // SS + RR + X + YYYY + NNNNNNN
const MIN_RTO_CODE = 1;
const MAX_RTO_CODE = 99;
const MIN_ISSUE_YEAR = 1900;

/**
 * Normalizes driving licence input:
 * - Trims outer whitespace
 * - Converts to uppercase
 * - Removes spaces, hyphens and slashes
 */
const normaliseLD = (input: string): string => (
    input.trim().toUpperCase().replace(/[\s\-/]/g, '')
);

const getCurrentUpperYearBound = (): number => new Date().getFullYear() + 1;

const isPlausibleIssueYear = (year: number): boolean => (
    Number.isInteger(year) && year >= MIN_ISSUE_YEAR && year <= getCurrentUpperYearBound()
);

const isRTOCodeValidForState = (stateCode: string, rtoNumber: number): boolean => {
    const ranges = INDIA_RTO_CODE_RANGES[stateCode];
    if (!ranges || ranges.length === 0) return false;

    return ranges.some(([min, max]) => rtoNumber >= min && rtoNumber <= max);
};

const detectFormat = (normalized: string): DLInfo['format'] => {
    if (normalized.length === POST_2021_NORMALIZED_LENGTH) return 'post-2021';
    if (normalized.length === PRE_2021_NORMALIZED_LENGTH) return 'pre-2021';
    return 'unknown';
};

const extractYearHint = (normalized: string, format: DLInfo['format']): number | null => {
    if (format === 'post-2021') {
        const year = Number.parseInt(normalized.substring(4, 8), 10);
        return isPlausibleIssueYear(year) ? year : null;
    }

    if (format === 'pre-2021') {
        const year = Number.parseInt(normalized.substring(5, 9), 10);
        return isPlausibleIssueYear(year) ? year : null;
    }

    return null;
};

/**
 * Validates Indian Driving Licence numbers.
 *
 * Supported normalized formats:
 * - Post-2021: SSRRYYYYNNNNNNN
 * - Pre-2021:  SSRRXYYYYNNNNNNN
 *
 * Where:
 * - SS: State code
 * - RR: RTO code (01-99)
 * - X: Legacy extra area code digit (pre-2021 only)
 * - YYYY: Year hint
 * - NNNNNNN: Running serial
 *
 * Returns false for any invalid input and never throws.
 */
export const isValidDrivingLicense = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normaliseLD(input);
    const format = detectFormat(normalized);
    if (format === 'unknown') return false;

    const stateCode = normalized.substring(0, 2);
    if (!(stateCode in INDIA_STATE_CODES)) return false;

    const rtoCode = normalized.substring(2, 4);
    if (!/^\d{2}$/.test(rtoCode)) return false;

    const rtoNumber = Number.parseInt(rtoCode, 10);
    if (Number.isNaN(rtoNumber)) return false;
    if (rtoNumber < MIN_RTO_CODE || rtoNumber > MAX_RTO_CODE) return false;
    if (!isRTOCodeValidForState(stateCode, rtoNumber)) return false;

    const remainder = normalized.substring(4);
    if (!/^\d+$/.test(remainder)) return false;

    if (format === 'post-2021') {
        // YYYY + NNNNNNN
        if (!/^\d{4}\d{7}$/.test(remainder)) return false;
        const issueYear = Number.parseInt(remainder.substring(0, 4), 10);
        if (!isPlausibleIssueYear(issueYear)) return false;
        return true;
    }

    // pre-2021: X + YYYY + NNNNNNN
    if (!/^\d{1}\d{4}\d{7}$/.test(remainder)) return false;
    const issueYear = Number.parseInt(remainder.substring(1, 5), 10);
    if (!isPlausibleIssueYear(issueYear)) return false;
    return true;
};

/**
 * Returns parsed metadata for a valid Indian Driving Licence.
 */
export const getDrivingLicenseInfo = (input: string): DLInfo | null => {
    if (!isValidDrivingLicense(input)) return null;

    const normalized = normaliseLD(input);
    const format = detectFormat(normalized);
    const stateCode = normalized.substring(0, 2);
    const rtoCode = normalized.substring(2, 4);
    const rtoNumber = Number.parseInt(rtoCode, 10);

    return {
        raw: input,
        normalized,
        stateCode,
        stateName: INDIA_STATE_CODES[stateCode] ?? 'Unknown',
        rtoCode,
        rtoNumber,
        format,
        yearHint: extractYearHint(normalized, format),
    };
};
