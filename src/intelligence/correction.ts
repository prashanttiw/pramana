import { generateGSTCheckDigit, validateGSTCheckDigit, validateVerhoeff } from '../utils';
import { isValidAadhaar } from '../validators/aadhaar';
import { isValidPAN } from '../validators/pan';
import { isValidGSTIN } from '../validators/gstin';
import { isValidIFSC } from '../validators/ifsc';
import { isValidPincode } from '../validators/pincode';
import { isValidTAN } from '../validators/tan';
import { isValidUAN } from '../validators/uan';
import { isValidIndianPhone, normalisePhone } from '../validators/phone';
import { isValidUPI } from '../validators/upi';
import { isValidMSME, isValidUAM } from '../validators/msme';
import { isValidVoterID } from '../validators/voterId';
import { isValidPassport } from '../validators/passport';
import { BANK_CODES } from '../data/bankCodes';
import { PINCODE_REGIONS } from '../data/postalCircles';
import { getAllocatedUANRange } from '../data/uanRanges';
import { INVALID_6_SERIES_PREFIXES, VALID_MOBILE_PREFIXES } from '../data/mobileSeriesAllocation';
import { VALID_UPI_HANDLES } from '../data/upiHandles';
import { UDYAM_STATE_CODES } from '../data/udyamStateCodes';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PAN_ENTITY_TYPES = new Set(['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);

type SupportedDocumentType =
    | 'aadhaar'
    | 'pan'
    | 'gstin'
    | 'ifsc'
    | 'pincode'
    | 'tan'
    | 'uan'
    | 'phone'
    | 'upi'
    | 'msme'
    | 'voterid'
    | 'passport';

const SUPPORTED_DOC_TYPES: ReadonlySet<SupportedDocumentType> = new Set([
    'aadhaar',
    'pan',
    'gstin',
    'ifsc',
    'pincode',
    'tan',
    'uan',
    'phone',
    'upi',
    'msme',
    'voterid',
    'passport',
]);

const isSupportedDocumentType = (documentType: string): documentType is SupportedDocumentType => (
    SUPPORTED_DOC_TYPES.has(documentType as SupportedDocumentType)
);

const DOCUMENT_TYPE_ALIASES: Readonly<Record<string, SupportedDocumentType>> = {
    aadhaar: 'aadhaar',
    pan: 'pan',
    gstin: 'gstin',
    ifsc: 'ifsc',
    pincode: 'pincode',
    tan: 'tan',
    uan: 'uan',
    phone: 'phone',
    upi: 'upi',
    msme: 'msme',
    voterid: 'voterid',
    voter_id: 'voterid',
    voter: 'voterid',
    passport: 'passport',
};

const normalizeDocumentType = (documentType: string): string => (
    (documentType || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
);

export type CorrectionConfidence = 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface CorrectionCandidate {
    corrected: string;
    changedPosition: number;
    changedFrom: string;
    changedTo: string;
    verificationAlgorithm: string;
}

export interface CorrectionResult {
    original: string;
    normalizedInput: string;
    documentType: string;
    isAlreadyValid: boolean;
    confidence: CorrectionConfidence;
    candidates: CorrectionCandidate[];
    primarySuggestion: string | null;
    note: string;
}

const normalizeInput = (documentType: SupportedDocumentType, input: string): string => {
    const base = input.trim();

    switch (documentType) {
        case 'aadhaar':
        case 'pincode':
        case 'uan':
        case 'phone':
            return base.replace(/\D/g, '');
        case 'upi':
            return base.toLowerCase().replace(/\s+/g, '');
        case 'msme':
            return base.toUpperCase().replace(/\s+/g, '');
        default:
            return base.toUpperCase().replace(/[\s-]/g, '');
    }
};

const isDocumentValid = (documentType: SupportedDocumentType, normalizedInput: string): boolean => {
    switch (documentType) {
        case 'aadhaar':
            return isValidAadhaar(normalizedInput);
        case 'pan':
            return isValidPAN(normalizedInput);
        case 'gstin':
            return isValidGSTIN(normalizedInput);
        case 'ifsc':
            return isValidIFSC(normalizedInput);
        case 'pincode':
            return isValidPincode(normalizedInput);
        case 'tan':
            return isValidTAN(normalizedInput);
        case 'uan':
            return isValidUAN(normalizedInput);
        case 'phone':
            return isValidIndianPhone(normalizedInput);
        case 'upi':
            return isValidUPI(normalizedInput);
        case 'msme':
            return isValidMSME(normalizedInput);
        case 'voterid':
            return isValidVoterID(normalizedInput);
        case 'passport':
            return isValidPassport(normalizedInput);
        default:
            return false;
    }
};

const recoverAadhaarByVerhoeff = (input: string): CorrectionCandidate[] => {
    if (!/^\d{12}$/.test(input)) return [];

    const candidates: CorrectionCandidate[] = [];

    for (let position = 0; position < input.length; position += 1) {
        const originalChar = input[position];

        for (let digit = 0; digit <= 9; digit += 1) {
            const replacement = String(digit);
            if (replacement === originalChar) continue;

            const corrected = (
                input.slice(0, position)
                + replacement
                + input.slice(position + 1)
            );

            if (!validateVerhoeff(corrected)) continue;

            candidates.push({
                corrected,
                changedPosition: position + 1,
                changedFrom: originalChar,
                changedTo: replacement,
                verificationAlgorithm: 'verhoeff',
            });
        }
    }

    return candidates.sort((a, b) => (
        b.changedPosition - a.changedPosition || a.corrected.localeCompare(b.corrected)
    ));
};

const isStructurallyValidGSTINBase = (base: string): boolean => (
    /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z$/.test(base)
);

const recoverGSTINCheckDigit = (input: string): CorrectionCandidate | null => {
    const normalized = input.toUpperCase();
    if (normalized.length !== 14 && normalized.length !== 15) return null;

    const base = normalized.slice(0, 14);
    if (!isStructurallyValidGSTINBase(base)) return null;

    const checkDigitIndex = generateGSTCheckDigit(base);
    if (checkDigitIndex < 0) return null;

    const expected = GST_CHARSET[checkDigitIndex];
    const existing = normalized.length === 15 ? normalized.charAt(14) : '';
    if (existing === expected) return null;

    return {
        corrected: `${base}${expected}`,
        changedPosition: 15,
        changedFrom: existing,
        changedTo: expected,
        verificationAlgorithm: 'mod36',
    };
};

const firstInvalidPosition = (value: string, predicate: (char: string) => boolean): number => {
    for (let i = 0; i < value.length; i += 1) {
        if (!predicate(value.charAt(i))) return i + 1;
    }
    return -1;
};

const getStructuralHint = (documentType: string, input: string): string => {
    const normalizedDocType = (documentType || '').toLowerCase();

    if (normalizedDocType === 'aadhaar') {
        const value = input.replace(/\D/g, '');
        if (value.length !== 12) return `Aadhaar must be exactly 12 digits; received length ${value.length}.`;

        const nonDigitPosition = firstInvalidPosition(value, (char) => /[0-9]/.test(char));
        if (nonDigitPosition !== -1) {
            return `Position ${nonDigitPosition} must be a digit, received '${value.charAt(nonDigitPosition - 1)}'.`;
        }

        if (!/^[2-9]/.test(value)) {
            return `Position 1 must be a digit from 2 to 9, received '${value.charAt(0)}'.`;
        }

        if (!validateVerhoeff(value)) {
            return 'Aadhaar checksum validation failed (Verhoeff).';
        }

        return 'Aadhaar appears structurally valid; no deterministic correction could be inferred.';
    }

    if (normalizedDocType === 'gstin') {
        const value = input.toUpperCase().replace(/[\s-]/g, '');
        if (value.length !== 15) return `GSTIN must be exactly 15 characters; received length ${value.length}.`;

        const statePos = firstInvalidPosition(value.slice(0, 2), (char) => /[0-9]/.test(char));
        if (statePos !== -1) {
            return `Position ${statePos} must be a digit for GST state code, received '${value.charAt(statePos - 1)}'.`;
        }

        const panAlphaPos = firstInvalidPosition(value.slice(2, 7), (char) => /[A-Z]/.test(char));
        if (panAlphaPos !== -1) {
            const position = panAlphaPos + 2;
            return `Position ${position} must be an uppercase letter, received '${value.charAt(position - 1)}'.`;
        }

        const panDigitPos = firstInvalidPosition(value.slice(7, 11), (char) => /[0-9]/.test(char));
        if (panDigitPos !== -1) {
            const position = panDigitPos + 7;
            return `Position ${position} must be a digit, received '${value.charAt(position - 1)}'.`;
        }

        if (!/[A-Z]/.test(value.charAt(11))) {
            return `Position 12 must be an uppercase letter, received '${value.charAt(11)}'.`;
        }

        if (!/[1-9A-Z]/.test(value.charAt(12))) {
            return `Position 13 must be alphanumeric (1-9/A-Z), received '${value.charAt(12)}'.`;
        }

        if (value.charAt(13) !== 'Z') {
            return `Position 14 must be 'Z', received '${value.charAt(13)}'.`;
        }

        if (!/[0-9A-Z]/.test(value.charAt(14))) {
            return `Position 15 must be an alphanumeric checksum character, received '${value.charAt(14)}'.`;
        }

        if (!validateGSTCheckDigit(value)) {
            return 'GSTIN checksum mismatch; recompute the 15th character using Mod-36.';
        }

        return 'GSTIN appears structurally valid; no deterministic correction could be inferred.';
    }

    if (normalizedDocType === 'pan') {
        const value = input.toUpperCase().replace(/[\s-]/g, '');
        if (value.length !== 10) return `PAN must be exactly 10 characters; received length ${value.length}.`;

        const alphaPrefixPosition = firstInvalidPosition(value.slice(0, 5), (char) => /[A-Z]/.test(char));
        if (alphaPrefixPosition !== -1) {
            return `Position ${alphaPrefixPosition} must be an uppercase letter, received '${value.charAt(alphaPrefixPosition - 1)}'.`;
        }

        if (!PAN_ENTITY_TYPES.has(value.charAt(3))) {
            return `Position 4 must be one of C,P,H,F,A,T,B,L,J,G; received '${value.charAt(3)}'.`;
        }

        const numericPosition = firstInvalidPosition(value.slice(5, 9), (char) => /[0-9]/.test(char));
        if (numericPosition !== -1) {
            const position = numericPosition + 5;
            return `Position ${position} must be a digit, received '${value.charAt(position - 1)}'.`;
        }

        if (!/[A-Z]/.test(value.charAt(9))) {
            return `Position 10 must be an uppercase letter, received '${value.charAt(9)}'.`;
        }

        return 'PAN structure appears valid; no checksum-driven correction is available.';
    }

    if (normalizedDocType === 'ifsc') {
        const value = input.toUpperCase().replace(/[\s-]/g, '');
        if (value.length !== 11) return `IFSC must be exactly 11 characters; received length ${value.length}.`;

        const bankCodePosition = firstInvalidPosition(value.slice(0, 4), (char) => /[A-Z]/.test(char));
        if (bankCodePosition !== -1) {
            return `Position ${bankCodePosition} must be an uppercase letter, received '${value.charAt(bankCodePosition - 1)}'.`;
        }

        if (value.charAt(4) !== '0') {
            return `Position 5 must be '0', received '${value.charAt(4)}'.`;
        }

        const branchPosition = firstInvalidPosition(value.slice(5), (char) => /[A-Z0-9]/.test(char));
        if (branchPosition !== -1) {
            const position = branchPosition + 5;
            return `Position ${position} must be uppercase alphanumeric, received '${value.charAt(position - 1)}'.`;
        }

        const bankCode = value.slice(0, 4);
        if (!BANK_CODES.has(bankCode)) {
            return `Bank code '${bankCode}' is not present in the supported IFSC bank-code set.`;
        }

        return 'IFSC appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'pincode') {
        const value = input.replace(/\D/g, '');
        if (value.length !== 6) return `Pincode must be exactly 6 digits; received length ${value.length}.`;

        if (!/^\d{6}$/.test(value)) {
            return 'Pincode must contain only digits 0-9.';
        }

        if (!/^[1-9]/.test(value)) {
            return `Position 1 must be between 1 and 9, received '${value.charAt(0)}'.`;
        }

        const regionKey = value.slice(0, 2);
        if (!Object.prototype.hasOwnProperty.call(PINCODE_REGIONS, regionKey)) {
            return `Pincode prefix '${regionKey}' is not mapped to a known postal region.`;
        }

        return 'Pincode appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'tan') {
        const value = input.toUpperCase().replace(/[\s-]/g, '');
        if (value.length !== 10) return `TAN must be exactly 10 characters; received length ${value.length}.`;

        const alphaPrefixPosition = firstInvalidPosition(value.slice(0, 4), (char) => /[A-Z]/.test(char));
        if (alphaPrefixPosition !== -1) {
            return `Position ${alphaPrefixPosition} must be an uppercase letter, received '${value.charAt(alphaPrefixPosition - 1)}'.`;
        }

        const numericPosition = firstInvalidPosition(value.slice(4, 9), (char) => /[0-9]/.test(char));
        if (numericPosition !== -1) {
            const position = numericPosition + 4;
            return `Position ${position} must be a digit, received '${value.charAt(position - 1)}'.`;
        }

        if (!/[A-Z]/.test(value.charAt(9))) {
            return `Position 10 must be an uppercase letter, received '${value.charAt(9)}'.`;
        }

        return 'TAN appears structurally valid; no checksum-driven correction is available.';
    }

    if (normalizedDocType === 'uan') {
        const value = input.replace(/[\s-]/g, '');
        if (value.length !== 12) return `UAN must be exactly 12 digits; received length ${value.length}.`;
        if (!/^\d{12}$/.test(value)) return 'UAN must contain only digits 0-9.';
        if (/^0{12}$/.test(value)) return 'UAN cannot be all zeros.';
        if (/^(\d)\1{11}$/.test(value)) return 'UAN cannot repeat the same digit for all 12 positions.';

        if (getAllocatedUANRange(value) == null) {
            return 'UAN prefix is outside known allocated EPFO ranges in this library.';
        }

        return 'UAN appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'phone') {
        const trimmed = input.trim();
        if (trimmed.length === 0) return 'Phone input is empty.';
        if (/[^0-9+\s\-().]/.test(trimmed)) {
            return 'Phone number contains unsupported characters; allowed: digits, +, space, -, (, ).';
        }

        const normalized = normalisePhone(trimmed);
        if (normalized == null) {
            return 'Phone number could not be normalized to a 10-digit Indian mobile number.';
        }

        if (/^(\d)\1{9}$/.test(normalized)) {
            return 'Phone number cannot contain the same digit repeated 10 times.';
        }

        if (normalized === '0123456789' || normalized === '1234567890') {
            return 'Phone number matches a known synthetic/test pattern.';
        }

        const series = normalized.charAt(0);
        if (!VALID_MOBILE_PREFIXES.has(series)) {
            return `Phone number must start with one of ${Array.from(VALID_MOBILE_PREFIXES).join(', ')}, received '${series}'.`;
        }

        if (series === '6' && INVALID_6_SERIES_PREFIXES.has(normalized.substring(0, 4))) {
            return `Phone prefix '${normalized.substring(0, 4)}' is blocked in the current allocation map.`;
        }

        if (!isValidIndianPhone(normalized)) {
            return 'Phone number failed validation after normalization.';
        }

        return 'Phone number appears valid after normalization; no deterministic correction is available.';
    }

    if (normalizedDocType === 'upi') {
        const value = input.trim().toLowerCase();
        if (value.length === 0) return 'UPI ID is empty.';

        const firstAt = value.indexOf('@');
        const lastAt = value.lastIndexOf('@');
        if (firstAt === -1 || firstAt !== lastAt) {
            return 'UPI ID must contain exactly one @ symbol.';
        }

        const [handle, provider] = value.split('@');
        if (!handle || !provider) return 'UPI ID must have both handle and provider in handle@provider form.';

        if (handle.length < 3 || handle.length > 256) {
            return `UPI handle length must be between 3 and 256 characters; received ${handle.length}.`;
        }

        if (!/^[a-z0-9._-]+$/.test(handle)) {
            return 'UPI handle may only contain lowercase letters, digits, dot, underscore, or hyphen.';
        }

        if (!/^[a-z0-9].*[a-z0-9]$/.test(handle)) {
            return 'UPI handle must start and end with an alphanumeric character.';
        }

        if (/[._-][._-]/.test(handle)) {
            return 'UPI handle cannot contain consecutive special characters.';
        }

        if (!VALID_UPI_HANDLES.has(provider)) {
            return `UPI provider '${provider}' is not in the supported handle whitelist.`;
        }

        return 'UPI ID appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'msme') {
        const value = input.toUpperCase().replace(/\s+/g, '');
        if (isValidMSME(value)) return 'MSME (Udyam) appears valid; no correction needed.';
        if (isValidUAM(value)) return 'Input matches legacy UAM format. Use UAM validator for this identifier.';

        if (!value.startsWith('UDYAM-')) {
            return "MSME (Udyam) must start with 'UDYAM-' and follow UDYAM-XX-00-0000000.";
        }

        const parts = value.split('-');
        if (parts.length !== 4) {
            return 'MSME Udyam format must be UDYAM-XX-00-0000000.';
        }

        const [, stateCode, districtCode, serial] = parts;

        if (!/^[A-Z]{2}$/.test(stateCode)) {
            return `State code must be two uppercase letters, received '${stateCode}'.`;
        }

        if (!UDYAM_STATE_CODES.has(stateCode)) {
            return `State code '${stateCode}' is not recognized in Udyam state codes.`;
        }

        if (!/^\d{2}$/.test(districtCode)) {
            return `District code must be exactly 2 digits, received '${districtCode}'.`;
        }

        const districtNum = Number.parseInt(districtCode, 10);
        if (districtNum < 1 || districtNum > 99) {
            return `District code must be between 01 and 99, received '${districtCode}'.`;
        }

        if (!/^\d{7}$/.test(serial)) {
            return `Serial number must be exactly 7 digits, received '${serial}'.`;
        }

        if (serial === '0000000') {
            return 'Serial number cannot be all zeros.';
        }

        return 'MSME appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'voterid') {
        const value = input.toUpperCase().replace(/[\s-]/g, '');
        if (value.length !== 10) return `Voter ID must be exactly 10 characters; received length ${value.length}.`;

        const prefixPosition = firstInvalidPosition(value.slice(0, 3), (char) => /[A-Z]/.test(char));
        if (prefixPosition !== -1) {
            return `Position ${prefixPosition} must be an uppercase letter, received '${value.charAt(prefixPosition - 1)}'.`;
        }

        const sequencePosition = firstInvalidPosition(value.slice(3), (char) => /[0-9]/.test(char));
        if (sequencePosition !== -1) {
            const position = sequencePosition + 3;
            return `Position ${position} must be a digit, received '${value.charAt(position - 1)}'.`;
        }

        if (value.slice(3) === '0000000') {
            return 'Voter ID sequence (positions 4-10) cannot be all zeros.';
        }

        return 'Voter ID appears structurally valid; no deterministic correction is available.';
    }

    if (normalizedDocType === 'passport') {
        const value = input.toUpperCase().replace(/\s+/g, '');
        if (value.length !== 8) return `Passport must be exactly 8 characters; received length ${value.length}.`;

        const series = value.charAt(0);
        if (!/[A-Z]/.test(series)) {
            return `Position 1 must be an uppercase letter, received '${series}'.`;
        }

        if (!isValidPassport(`${series}1234567`)) {
            return `Passport series '${series}' is not in the supported series set.`;
        }

        const sequencePosition = firstInvalidPosition(value.slice(1), (char) => /[0-9]/.test(char));
        if (sequencePosition !== -1) {
            const position = sequencePosition + 1;
            return `Position ${position} must be a digit, received '${value.charAt(position - 1)}'.`;
        }

        if (value.slice(1) === '0000000') {
            return 'Passport sequence (positions 2-8) cannot be all zeros.';
        }

        return 'Passport appears structurally valid; no deterministic correction is available.';
    }

    return `No correction rules are configured for document type '${documentType}'.`;
};

const buildNoCorrectionResult = (
    original: string,
    normalizedInput: string,
    documentType: string,
    confidence: CorrectionConfidence,
    note: string
): CorrectionResult => ({
    original,
    normalizedInput,
    documentType,
    isAlreadyValid: false,
    confidence,
    candidates: [],
    primarySuggestion: null,
    note,
});

/**
 * Suggests corrections for invalid document numbers using checksum recovery.
 *
 * PRIVACY NOTE: This function processes potentially real identity document
 * numbers. Never log or persist the input, corrections, or results.
 * Results are returned to the caller - no data leaves this function.
 */
export const suggestCorrection = (documentType: string, input: string): CorrectionResult => {
    const safeInput = typeof input === 'string' ? input : String(input ?? '');
    const normalizedDocTypeInput = normalizeDocumentType(documentType);
    const normalizedDocType = DOCUMENT_TYPE_ALIASES[normalizedDocTypeInput];

    if (!normalizedDocType || !isSupportedDocumentType(normalizedDocType)) {
        return buildNoCorrectionResult(
            safeInput,
            safeInput.trim(),
            normalizedDocTypeInput || documentType,
            'NONE',
            `Unsupported document type '${documentType}'.`
        );
    }

    const normalizedInput = normalizeInput(normalizedDocType, safeInput);
    const isAlreadyValid = isDocumentValid(normalizedDocType, normalizedInput);

    if (isAlreadyValid) {
        return {
            original: safeInput,
            normalizedInput,
            documentType: normalizedDocType,
            isAlreadyValid: true,
            confidence: 'NONE',
            candidates: [],
            primarySuggestion: null,
            note: 'Input is already valid for this document type; no correction suggested.',
        };
    }

    if (normalizedDocType === 'aadhaar') {
        const candidates = recoverAadhaarByVerhoeff(normalizedInput);
        if (candidates.length === 0) {
            const hint = getStructuralHint(normalizedDocType, safeInput);
            return buildNoCorrectionResult(safeInput, normalizedInput, normalizedDocType, 'NONE', hint);
        }

        const confidence: CorrectionConfidence = candidates.length === 1 ? 'HIGH' : 'MEDIUM';
        return {
            original: safeInput,
            normalizedInput,
            documentType: normalizedDocType,
            isAlreadyValid: false,
            confidence,
            candidates,
            primarySuggestion: candidates[0].corrected,
            note: candidates.length === 1
                ? 'Single checksum-valid Aadhaar correction found.'
                : `Multiple checksum-valid Aadhaar corrections found (${candidates.length}).`,
        };
    }

    if (normalizedDocType === 'gstin') {
        const candidate = recoverGSTINCheckDigit(normalizedInput);
        if (candidate != null) {
            return {
                original: safeInput,
                normalizedInput,
                documentType: normalizedDocType,
                isAlreadyValid: false,
                confidence: 'EXACT',
                candidates: [candidate],
                primarySuggestion: candidate.corrected,
                note: 'GSTIN check digit can be corrected deterministically using Mod-36.',
            };
        }

        const hint = getStructuralHint(normalizedDocType, safeInput);
        return buildNoCorrectionResult(safeInput, normalizedInput, normalizedDocType, 'NONE', hint);
    }

    const hint = getStructuralHint(normalizedDocType, safeInput);
    return buildNoCorrectionResult(safeInput, normalizedInput, normalizedDocType, 'NONE', hint);
};
