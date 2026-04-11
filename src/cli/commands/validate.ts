import type { Command } from 'commander';
import {
    detectFraudSignals,
    getDrivingLicenseInfo,
    getGSTINInfo,
    getMSMEInfo,
    getPANInfo,
    getPassportInfo,
    getPhoneInfo,
    getPincodeInfo,
    getTANInfo,
    getUANInfo,
    getUPIInfo,
    getVoterIDInfo,
    isValidAadhaar,
    isValidDrivingLicense,
    isValidGSTIN,
    isValidIFSC,
    isValidIndianPhone,
    isValidMSME,
    isValidPAN,
    isValidPassport,
    isValidPincode,
    isValidTAN,
    isValidUAN,
    isValidUPI,
    isValidVoterID,
    normalisePhone,
    suggestCorrection,
} from '../../index';
import { showBanner } from '../ui/banner';
import {
    renderError,
    renderJson,
    renderMutedLine,
    renderQuietResult,
    renderValidationResult,
    type ValidationDisplayData,
} from '../ui/renderer';

type ValidatorFn = (value: string) => boolean;

type SupportedCorrectionType =
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

interface ValidateTypeConfig {
    displayType: string;
    algorithm: string;
    failureReason: string;
    fraudType: string;
    correctionType: SupportedCorrectionType | null;
    normalize: (value: string) => string;
    validate: ValidatorFn;
    infoLines?: (normalized: string) => Array<{ label: string; value: string }>;
}

export type SupportedDocumentType =
    | 'aadhaar'
    | 'pan'
    | 'gstin'
    | 'ifsc'
    | 'pincode'
    | 'tan'
    | 'uan'
    | 'voterid'
    | 'drivinglicense'
    | 'passport'
    | 'upi'
    | 'phone'
    | 'msme';

const normalizeDigits = (value: string): string => value.trim().replace(/\D/g, '');
const normalizeUpperCompact = (value: string): string => value.trim().toUpperCase().replace(/[\s-]/g, '');
const normalizeDrivingLicense = (value: string): string => value.trim().toUpperCase().replace(/[\s\-/]/g, '');
const normalizeUPI = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '');
const normalizeMSME = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '');
const normalizePhone = (value: string): string => normalisePhone(value) ?? value.trim();

const TYPE_CONFIG: Record<SupportedDocumentType, ValidateTypeConfig> = {
    aadhaar: {
        displayType: 'aadhaar',
        algorithm: 'Verhoeff checksum',
        failureReason: 'Check digit mismatch',
        fraudType: 'aadhaar',
        correctionType: 'aadhaar',
        normalize: normalizeDigits,
        validate: isValidAadhaar,
    },
    pan: {
        displayType: 'pan',
        algorithm: 'PAN structure and entity checks',
        failureReason: 'Format or entity code invalid',
        fraudType: 'pan',
        correctionType: 'pan',
        normalize: normalizeUpperCompact,
        validate: isValidPAN,
        infoLines: (normalized) => {
            const info = getPANInfo(normalized);
            if (!info.valid) return [];

            return [
                { label: 'Category', value: info.category ?? 'Unknown' },
                { label: 'Entity', value: info.categoryDesc ?? 'Unknown' },
            ];
        },
    },
    gstin: {
        displayType: 'gstin',
        algorithm: 'Mod-36 checksum',
        failureReason: 'Check digit mismatch',
        fraudType: 'gstin',
        correctionType: 'gstin',
        normalize: normalizeUpperCompact,
        validate: isValidGSTIN,
        infoLines: (normalized) => {
            const gstinInfo = getGSTINInfo(normalized);
            const panInfo = getPANInfo(normalized.slice(2, 12));

            const lines: Array<{ label: string; value: string }> = [];
            if (gstinInfo.valid) {
                lines.push({ label: 'State', value: gstinInfo.state ?? 'Unknown' });
                lines.push({ label: 'State Code', value: gstinInfo.stateCode ?? '--' });
            }
            if (panInfo.valid) {
                lines.push({ label: 'Entity', value: panInfo.categoryDesc ?? 'Unknown' });
            }

            return lines;
        },
    },
    ifsc: {
        displayType: 'ifsc',
        algorithm: 'Format and bank-code validation',
        failureReason: 'Unknown bank code or malformed IFSC',
        fraudType: 'ifsc',
        correctionType: 'ifsc',
        normalize: normalizeUpperCompact,
        validate: isValidIFSC,
        infoLines: (normalized) => [
            { label: 'Bank Code', value: normalized.slice(0, 4) || '--' },
        ],
    },
    pincode: {
        displayType: 'pincode',
        algorithm: 'Postal circle mapping',
        failureReason: 'Postal circle or structure invalid',
        fraudType: 'pincode',
        correctionType: 'pincode',
        normalize: normalizeDigits,
        validate: isValidPincode,
        infoLines: (normalized) => {
            const info = getPincodeInfo(normalized);
            if (!info.valid) return [];
            return [{ label: 'Region', value: info.region ?? 'Unknown' }];
        },
    },
    tan: {
        displayType: 'tan',
        algorithm: 'TAN structural validation',
        failureReason: 'Structure invalid',
        fraudType: 'tan',
        correctionType: 'tan',
        normalize: normalizeUpperCompact,
        validate: isValidTAN,
        infoLines: (normalized) => {
            const info = getTANInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'City Code', value: info.cityCode },
                { label: 'Sequence', value: info.sequenceNumber },
            ];
        },
    },
    uan: {
        displayType: 'uan',
        algorithm: 'EPFO allocated-range verification',
        failureReason: 'Unallocated or malformed UAN',
        fraudType: 'uan',
        correctionType: 'uan',
        normalize: normalizeDigits,
        validate: isValidUAN,
        infoLines: (normalized) => {
            const info = getUANInfo(normalized);
            if (info == null) return [];
            return [{ label: 'Range', value: info.rangeNote }];
        },
    },
    voterid: {
        displayType: 'voter-id',
        algorithm: 'EPIC structure validation',
        failureReason: 'Prefix/sequence invalid',
        fraudType: 'voterid',
        correctionType: 'voterid',
        normalize: normalizeUpperCompact,
        validate: isValidVoterID,
        infoLines: (normalized) => {
            const info = getVoterIDInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'Prefix', value: info.stateCode },
                { label: 'Sequence', value: info.sequenceNumber },
            ];
        },
    },
    drivinglicense: {
        displayType: 'dl',
        algorithm: 'RTO/state structural validation',
        failureReason: 'State, RTO, year or serial invalid',
        fraudType: 'drivinglicense',
        correctionType: null,
        normalize: normalizeDrivingLicense,
        validate: isValidDrivingLicense,
        infoLines: (normalized) => {
            const info = getDrivingLicenseInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'State', value: info.stateName },
                { label: 'Format', value: info.format },
            ];
        },
    },
    passport: {
        displayType: 'passport',
        algorithm: 'Series and sequence validation',
        failureReason: 'Series/number invalid',
        fraudType: 'passport',
        correctionType: 'passport',
        normalize: (value) => value.trim().toUpperCase().replace(/\s+/g, ''),
        validate: isValidPassport,
        infoLines: (normalized) => {
            const info = getPassportInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'Series', value: info.series },
                { label: 'Type', value: info.seriesType },
            ];
        },
    },
    upi: {
        displayType: 'upi',
        algorithm: 'VPA format and PSP handle checks',
        failureReason: 'Handle or provider invalid',
        fraudType: 'upi',
        correctionType: 'upi',
        normalize: normalizeUPI,
        validate: isValidUPI,
        infoLines: (normalized) => {
            const info = getUPIInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'Provider', value: info.provider },
                { label: 'Bank', value: info.bank },
                { label: 'Type', value: info.type },
            ];
        },
    },
    phone: {
        displayType: 'phone',
        algorithm: 'TRAI mobile series allocation checks',
        failureReason: 'Series/allocation invalid',
        fraudType: 'phone',
        correctionType: 'phone',
        normalize: normalizePhone,
        validate: isValidIndianPhone,
        infoLines: (normalized) => {
            const info = getPhoneInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'Normalized', value: info.normalized },
                { label: 'With CC', value: info.withCountryCode },
            ];
        },
    },
    msme: {
        displayType: 'msme',
        algorithm: 'Udyam/UAM structural code checks',
        failureReason: 'State/district/format invalid',
        fraudType: 'msme',
        correctionType: 'msme',
        normalize: normalizeMSME,
        validate: isValidMSME,
        infoLines: (normalized) => {
            const info = getMSMEInfo(normalized);
            if (info == null) return [];
            return [
                { label: 'Format', value: info.format },
                { label: 'State', value: info.stateName },
            ];
        },
    },
};

export const SUPPORTED_DOCUMENT_TYPES = Object.freeze(
    Object.keys(TYPE_CONFIG) as SupportedDocumentType[]
);

const VALID_TYPES_DISPLAY = [
    'aadhaar',
    'pan',
    'gstin',
    'ifsc',
    'pincode',
    'tan',
    'uan',
    'voter-id',
    'dl',
    'passport',
    'upi',
    'phone',
    'msme',
] as const;

const TYPE_ALIASES: Record<string, SupportedDocumentType> = {
    aadhaar: 'aadhaar',
    uid: 'aadhaar',
    pan: 'pan',
    gstin: 'gstin',
    ifsc: 'ifsc',
    pincode: 'pincode',
    pin: 'pincode',
    tan: 'tan',
    uan: 'uan',
    voterid: 'voterid',
    voter: 'voterid',
    epic: 'voterid',
    dl: 'drivinglicense',
    drivinglicense: 'drivinglicense',
    drivinglicence: 'drivinglicense',
    passport: 'passport',
    upi: 'upi',
    phone: 'phone',
    mobile: 'phone',
    msme: 'msme',
    udyam: 'msme',
};

interface ValidateCommandOptions {
    banner?: boolean;
    fraud: boolean;
    suggest: boolean;
    json?: boolean;
    quiet?: boolean;
}

let bannerShown = false;

const normalizeTypeKey = (rawType: string): string => rawType.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const resolveDocumentType = (rawType: string): SupportedDocumentType => {
    const alias = TYPE_ALIASES[normalizeTypeKey(rawType)];

    if (alias == null) {
        throw new Error(`Unknown document type: ${rawType}`);
    }

    return alias;
};

const normalizeInputForType = (documentType: SupportedDocumentType, value: string): string => (
    TYPE_CONFIG[documentType].normalize(value)
);

export const validateDocument = (documentType: string, value: string): boolean => {
    const resolvedType = resolveDocumentType(documentType);
    const normalizedValue = normalizeInputForType(resolvedType, value);

    return TYPE_CONFIG[resolvedType].validate(normalizedValue);
};

const maybeShowBanner = (options: ValidateCommandOptions): void => {
    if (options.quiet || options.json) return;
    if (process.env.PRAMANA_BANNER_SHOWN === '1') return;

    if (!bannerShown || options.banner) {
        showBanner();
        bannerShown = true;
    }
};

const buildSuggestion = (
    documentType: SupportedDocumentType,
    normalizedValue: string
): ValidationDisplayData['suggestion'] | undefined => {
    const correctionType = TYPE_CONFIG[documentType].correctionType;
    if (correctionType == null) return undefined;

    const correction = suggestCorrection(correctionType, normalizedValue);
    if (correction.primarySuggestion == null || correction.primarySuggestion.length === 0) {
        return undefined;
    }
    if (correction.primarySuggestion === normalizedValue) {
        return undefined;
    }

    const candidate = correction.candidates.find((item) => item.corrected === correction.primarySuggestion)
        ?? correction.candidates[0];

    return {
        value: correction.primarySuggestion,
        confidence: correction.confidence,
        change: candidate == null
            ? undefined
            : `Position ${candidate.changedPosition}: ${candidate.changedFrom} \u2192 ${candidate.changedTo}`,
    };
};

export const validateCommand = (
    rawType: string,
    rawValue: string,
    options: ValidateCommandOptions
): void => {
    try {
        const documentType = resolveDocumentType(rawType);
        const config = TYPE_CONFIG[documentType];
        const normalizedValue = normalizeInputForType(documentType, rawValue);
        const isValid = config.validate(normalizedValue);

        const infoLines = config.infoLines?.(normalizedValue) ?? [];
        const fraudResult = options.fraud
            ? detectFraudSignals(config.fraudType, normalizedValue)
            : null;
        const suggestion = !isValid && options.suggest
            ? buildSuggestion(documentType, normalizedValue)
            : undefined;

        const jsonOutput = {
            command: 'validate',
            documentType: config.displayType,
            canonicalType: documentType,
            input: rawValue,
            normalized: normalizedValue,
            valid: isValid,
            algorithm: config.algorithm,
            check: isValid ? 'Passed' : 'Failed',
            error: isValid ? null : config.failureReason,
            info: infoLines,
            fraud: fraudResult == null
                ? null
                : {
                    risk: fraudResult.risk,
                    recommendation: fraudResult.recommendation,
                    score: fraudResult.suspicionScore,
                    signal: fraudResult.signals[0]?.type ?? null,
                    signals: fraudResult.signals,
                    note: fraudResult.note,
                },
            suggestion: suggestion ?? null,
        };

        if (options.json) {
            renderJson(jsonOutput);
        } else if (options.quiet) {
            renderQuietResult(isValid);
        } else {
            maybeShowBanner(options);

            renderValidationResult({
                documentType: config.displayType,
                status: isValid ? 'VALID' : 'INVALID',
                input: rawValue,
                normalized: normalizedValue,
                algorithm: config.algorithm,
                check: isValid ? 'Passed' : 'Failed',
                error: isValid ? undefined : config.failureReason,
                infoLines,
                fraud: fraudResult == null
                    ? undefined
                    : {
                        recommendation: fraudResult.recommendation,
                        signal: fraudResult.signals[0]?.type,
                        note: fraudResult.note,
                    },
                suggestion,
            });
        }

        process.exitCode = isValid ? 0 : 1;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Validation command failed.';

        if (message.startsWith('Unknown document type:')) {
            renderError(message);
            renderMutedLine(`Valid types: ${VALID_TYPES_DISPLAY.join(', ')}`);
            process.exitCode = 2;
            return;
        }

        renderError(message);
        process.exitCode = 2;
    }
};

export const registerValidateCommand = (program: Command): void => {
    program
        .command('validate')
        .description('Validate one document identifier.')
        .argument('<type>', `Type (${VALID_TYPES_DISPLAY.join(', ')})`)
        .argument('<value>', 'Document value')
        .option('--banner', 'Show banner before output')
        .option('--no-fraud', 'Skip fraud signal check (faster)')
        .option('--no-suggest', 'Skip correction suggestion')
        .option('--json', 'Output raw JSON for piping')
        .option('--quiet', 'Only output validation result')
        .action(validateCommand);
};
