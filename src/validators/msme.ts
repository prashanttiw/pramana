import {
    UAM_STATE_CODE_NAME_MAP,
    UAM_STATE_CODES,
    UDYAM_STATE_CODE_NAME_MAP,
    UDYAM_STATE_CODES,
} from '../data/udyamStateCodes';

export interface MSMEInfo {
    raw: string;
    normalized: string;
    format: 'udyam' | 'uam';
    stateCode: string;
    stateName: string;
    districtCode: string;
    serialNumber: string;
}

interface ParsedUdyam {
    stateCode: string;
    districtCode: string;
    serialNumber: string;
}

interface ParsedUAM {
    stateCode: string;
    districtCode: string;
    serialNumber: string;
}

const UDYAM_PREFIX = 'UDYAM';
const UDYAM_SERIAL_ZERO = '0000000';
const UAM_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z][0-9]{7}$/;
const UDYAM_STATE_CODE_REGEX = /^[A-Z]{2}$/;
const UDYAM_DISTRICT_REGEX = /^[0-9]{2}$/;
const UDYAM_SERIAL_REGEX = /^[0-9]{7}$/;
const DISTRICT_MIN = 1;
const DISTRICT_MAX = 99;

const normalizeMSME = (input: string): string => (
    input.trim().toUpperCase().replace(/\s+/g, '')
);

const isDistrictCodeInRange = (districtCode: string): boolean => {
    if (!UDYAM_DISTRICT_REGEX.test(districtCode)) return false;
    const districtNumber = Number.parseInt(districtCode, 10);
    return districtNumber >= DISTRICT_MIN && districtNumber <= DISTRICT_MAX;
};

const parseUdyam = (normalized: string): ParsedUdyam | null => {
    if (!normalized.startsWith(`${UDYAM_PREFIX}-`)) return null;

    const parts = normalized.split('-');
    if (parts.length !== 4) return null;

    const [prefix, stateCode, districtCode, serialNumber] = parts;
    if (prefix !== UDYAM_PREFIX) return null;
    if (!UDYAM_STATE_CODE_REGEX.test(stateCode)) return null;
    if (!UDYAM_STATE_CODES.has(stateCode)) return null;
    if (!isDistrictCodeInRange(districtCode)) return null;
    if (!UDYAM_SERIAL_REGEX.test(serialNumber)) return null;
    if (serialNumber === UDYAM_SERIAL_ZERO) return null;

    return {
        stateCode,
        districtCode,
        serialNumber,
    };
};

const parseUAM = (normalized: string): ParsedUAM | null => {
    if (!UAM_REGEX.test(normalized)) return null;

    const stateCode = normalized.substring(0, 2);
    const districtCode = normalized.substring(2, 4);
    const serialNumber = normalized.substring(5);

    if (!UAM_STATE_CODES.has(stateCode)) return null;
    if (!isDistrictCodeInRange(districtCode)) return null;
    if (serialNumber === UDYAM_SERIAL_ZERO) return null;

    return {
        stateCode,
        districtCode,
        serialNumber,
    };
};

/**
 * Validates MSME Udyam Registration Number.
 *
 * Expected normalized format: UDYAM-XX-00-0000000
 */
export const isValidMSME = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeMSME(input);
    return parseUdyam(normalized) != null;
};

/**
 * Validates legacy UAM (Udyog Aadhaar Memorandum) identifier.
 *
 * Expected format: XX00A0000000 (12 chars total).
 */
export const isValidUAM = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeMSME(input);
    return parseUAM(normalized) != null;
};

/**
 * Returns parsed metadata for valid MSME IDs (Udyam or UAM).
 */
export const getMSMEInfo = (input: string): MSMEInfo | null => {
    const normalized = normalizeMSME(input);

    const udyam = parseUdyam(normalized);
    if (udyam != null) {
        return {
            raw: input,
            normalized: `${UDYAM_PREFIX}-${udyam.stateCode}-${udyam.districtCode}-${udyam.serialNumber}`,
            format: 'udyam',
            stateCode: udyam.stateCode,
            stateName: UDYAM_STATE_CODE_NAME_MAP[udyam.stateCode] ?? 'Unknown',
            districtCode: udyam.districtCode,
            serialNumber: udyam.serialNumber,
        };
    }

    const uam = parseUAM(normalized);
    if (uam != null) {
        return {
            raw: input,
            normalized,
            format: 'uam',
            stateCode: uam.stateCode,
            stateName: UAM_STATE_CODE_NAME_MAP[uam.stateCode] ?? 'Unknown',
            districtCode: uam.districtCode,
            serialNumber: uam.serialNumber,
        };
    }

    return null;
};
