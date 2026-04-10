import { detectFraudSignals, type FraudRisk, type FraudSignal } from './fraudSignals';
import { suggestCorrection } from './correction';
import { isValidAadhaar } from '../validators/aadhaar';
import { getGSTINInfo, isValidGSTIN } from '../validators/gstin';
import { getPANInfo, isValidPAN } from '../validators/pan';
import { getTANInfo, isValidTAN } from '../validators/tan';
import { getUANInfo, isValidUAN } from '../validators/uan';
import { getPassportInfo, isValidPassport } from '../validators/passport';
import { getVoterIDInfo, isValidVoterID } from '../validators/voterId';
import { getDrivingLicenseInfo, isValidDrivingLicense } from '../validators/drivingLicense';
import { getPhoneInfo, isValidIndianPhone, normalisePhone } from '../validators/phone';
import { getUPIInfo, isValidUPI } from '../validators/upi';

export interface KYCBundleInput {
    aadhaar?: string;
    pan?: string;
    gstin?: string;
    tan?: string;
    uan?: string;
    passport?: string;
    voterId?: string;
    drivingLicense?: string;
    phone?: string;
    upi?: string;
}

export interface DocumentValidationDetail {
    provided: boolean;
    value: string | null;
    normalized: string | null;
    valid: boolean;
    errors: string[];
    metadata: Record<string, unknown> | null;
    fraudRisk: FraudRisk | null;
}

export interface CrossCheckResult {
    checkName: string;
    passed: boolean;
    description: string;
    finding: string;
}

export interface KYCBundleResult {
    overallResult: 'PASS' | 'FAIL' | 'MANUAL_REVIEW';
    kycScore: number;
    documents: Record<string, DocumentValidationDetail>;
    crossChecks: CrossCheckResult[];
    fraudSignals: FraudSignal[];
    entityType: 'Individual' | 'Company' | 'LLP' | 'HUF' | 'Firm' | 'Trust' | 'Govt' | 'Unknown';
    entityState: string | null;
    summary: string;
    validDocuments: string[];
    invalidDocuments: string[];
    inconsistencies: string[];
}

type BundleDocumentKey = keyof KYCBundleInput;

type EntityType = KYCBundleResult['entityType'];

const DOCUMENT_ORDER: readonly BundleDocumentKey[] = [
    'aadhaar',
    'pan',
    'gstin',
    'tan',
    'uan',
    'passport',
    'voterId',
    'drivingLicense',
    'phone',
    'upi',
];

const DOCUMENT_LABELS: Record<BundleDocumentKey, string> = {
    aadhaar: 'Aadhaar',
    pan: 'PAN',
    gstin: 'GSTIN',
    tan: 'TAN',
    uan: 'UAN',
    passport: 'Passport',
    voterId: 'Voter ID',
    drivingLicense: 'Driving License',
    phone: 'Phone',
    upi: 'UPI',
};

const normalizeUpperAlnum = (value: string): string => value.trim().toUpperCase().replace(/[\s-]/g, '');
const normalizeDigitsOnly = (value: string): string => value.trim().replace(/\D/g, '');
const normalizeDrivingLicense = (value: string): string => value.trim().toUpperCase().replace(/[\s\-/]/g, '');
const normalizeUPI = (value: string): string => value.trim().toLowerCase();

const toRecord = (value: unknown): Record<string, unknown> | null => {
    if (value == null || typeof value !== 'object') return null;
    return value as Record<string, unknown>;
};

const getPANEntityType = (panCode: string): EntityType => {
    switch (panCode) {
        case 'P':
            return 'Individual';
        case 'C':
            return 'Company';
        case 'H':
            return 'HUF';
        case 'F':
            return 'Firm';
        case 'T':
            return 'Trust';
        case 'G':
            return 'Govt';
        default:
            return 'Unknown';
    }
};

const normalizeStateForComparison = (state: string): string => (
    state
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
);

interface DocumentProcessor {
    fraudDocType: string;
    correctionDocType: string;
    normalize: (value: string) => string | null;
    validate: (normalized: string) => boolean;
    getInfo: ((normalized: string) => unknown) | null;
}

const DOCUMENT_PROCESSORS: Record<BundleDocumentKey, DocumentProcessor> = {
    aadhaar: {
        fraudDocType: 'aadhaar',
        correctionDocType: 'aadhaar',
        normalize: normalizeDigitsOnly,
        validate: isValidAadhaar,
        getInfo: null,
    },
    pan: {
        fraudDocType: 'pan',
        correctionDocType: 'pan',
        normalize: normalizeUpperAlnum,
        validate: isValidPAN,
        getInfo: getPANInfo,
    },
    gstin: {
        fraudDocType: 'gstin',
        correctionDocType: 'gstin',
        normalize: normalizeUpperAlnum,
        validate: isValidGSTIN,
        getInfo: getGSTINInfo,
    },
    tan: {
        fraudDocType: 'tan',
        correctionDocType: 'tan',
        normalize: normalizeUpperAlnum,
        validate: isValidTAN,
        getInfo: getTANInfo,
    },
    uan: {
        fraudDocType: 'uan',
        correctionDocType: 'uan',
        normalize: normalizeDigitsOnly,
        validate: isValidUAN,
        getInfo: getUANInfo,
    },
    passport: {
        fraudDocType: 'passport',
        correctionDocType: 'passport',
        normalize: (value) => value.trim().toUpperCase().replace(/\s+/g, ''),
        validate: isValidPassport,
        getInfo: getPassportInfo,
    },
    voterId: {
        fraudDocType: 'voterid',
        correctionDocType: 'voterid',
        normalize: normalizeUpperAlnum,
        validate: isValidVoterID,
        getInfo: getVoterIDInfo,
    },
    drivingLicense: {
        fraudDocType: 'drivinglicense',
        correctionDocType: 'drivinglicense',
        normalize: normalizeDrivingLicense,
        validate: isValidDrivingLicense,
        getInfo: getDrivingLicenseInfo,
    },
    phone: {
        fraudDocType: 'phone',
        correctionDocType: 'phone',
        normalize: normalisePhone,
        validate: isValidIndianPhone,
        getInfo: getPhoneInfo,
    },
    upi: {
        fraudDocType: 'upi',
        correctionDocType: 'upi',
        normalize: normalizeUPI,
        validate: isValidUPI,
        getInfo: getUPIInfo,
    },
};

const emptyDocumentDetail = (): DocumentValidationDetail => ({
    provided: false,
    value: null,
    normalized: null,
    valid: false,
    errors: [],
    metadata: null,
    fraudRisk: null,
});

const buildValidationErrors = (
    documentKey: BundleDocumentKey,
    rawValue: string,
    normalized: string | null
): string[] => {
    const label = DOCUMENT_LABELS[documentKey];

    if (rawValue.trim().length === 0) {
        return [`${label} is empty.`];
    }

    if (normalized == null || normalized.length === 0) {
        return [`${label} could not be normalized for validation.`];
    }

    const correctionResult = suggestCorrection(DOCUMENT_PROCESSORS[documentKey].correctionDocType, rawValue);
    if (
        correctionResult.note.length > 0
        && !correctionResult.note.startsWith('Unsupported document type')
        && !correctionResult.note.startsWith('Input is already valid')
    ) {
        return [correctionResult.note];
    }

    return [`${label} failed format and checksum validation.`];
};

const inferEntityType = (documents: Record<string, DocumentValidationDetail>): EntityType => {
    const panDetail = documents.pan;
    if (panDetail.valid && panDetail.normalized != null && panDetail.normalized.length >= 4) {
        return getPANEntityType(panDetail.normalized.charAt(3));
    }

    const gstinDetail = documents.gstin;
    if (gstinDetail.valid && gstinDetail.normalized != null && gstinDetail.normalized.length >= 6) {
        return getPANEntityType(gstinDetail.normalized.charAt(5));
    }

    return 'Unknown';
};

const inferEntityState = (documents: Record<string, DocumentValidationDetail>): string | null => {
    const gstinState = documents.gstin.metadata?.state;
    if (typeof gstinState === 'string' && gstinState.length > 0) {
        return gstinState;
    }

    const dlState = documents.drivingLicense.metadata?.stateName;
    if (typeof dlState === 'string' && dlState.length > 0) {
        return dlState;
    }

    return null;
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, value));

export const validateKYCBundle = (input: KYCBundleInput): KYCBundleResult => {
    const documents: Record<string, DocumentValidationDetail> = {};
    const allFraudSignals: FraudSignal[] = [];
    const seenFraudSignals = new Set<string>();

    for (const key of DOCUMENT_ORDER) {
        const raw = input[key];

        if (raw == null) {
            documents[key] = emptyDocumentDetail();
            continue;
        }

        const rawValue = typeof raw === 'string' ? raw : String(raw);
        const processor = DOCUMENT_PROCESSORS[key];
        const normalized = processor.normalize(rawValue);
        const valid = normalized != null && processor.validate(normalized);

        let metadata: Record<string, unknown> | null = null;
        let fraudRisk: FraudRisk | null = null;
        let errors: string[] = [];

        if (valid && normalized != null) {
            metadata = processor.getInfo ? toRecord(processor.getInfo(normalized)) : null;

            const fraudResult = detectFraudSignals(processor.fraudDocType, normalized);
            fraudRisk = fraudResult.risk;

            for (const signal of fraudResult.signals) {
                const keyForSet = `${signal.type}:${signal.description}`;
                if (seenFraudSignals.has(keyForSet)) continue;
                seenFraudSignals.add(keyForSet);
                allFraudSignals.push(signal);
            }
        } else {
            errors = buildValidationErrors(key, rawValue, normalized);
        }

        documents[key] = {
            provided: true,
            value: rawValue,
            normalized,
            valid,
            errors,
            metadata,
            fraudRisk,
        };
    }

    const crossChecks: CrossCheckResult[] = [];

    const panDetail = documents.pan;
    const gstinDetail = documents.gstin;
    const tanDetail = documents.tan;
    const dlDetail = documents.drivingLicense;

    if (panDetail.valid && gstinDetail.valid && panDetail.normalized != null && gstinDetail.normalized != null) {
        const embeddedPAN = gstinDetail.normalized.substring(2, 12);
        const panMatch = embeddedPAN === panDetail.normalized;

        crossChecks.push({
            checkName: 'gstin_pan_match',
            passed: panMatch,
            description: 'GSTIN positions 3-12 should match the PAN when both belong to the same entity.',
            finding: panMatch
                ? `GSTIN embeds PAN '${embeddedPAN}', matching provided PAN.`
                : `GSTIN embeds PAN '${embeddedPAN}', which does not match provided PAN '${panDetail.normalized}'.`,
        });

        const panEntityType = getPANEntityType(panDetail.normalized.charAt(3));
        const gstEntityType = getPANEntityType(gstinDetail.normalized.charAt(5));
        const entityTypeMatch = panEntityType === gstEntityType;

        crossChecks.push({
            checkName: 'entity_type_consistency',
            passed: entityTypeMatch,
            description: 'PAN entity code (position 4) should align with the PAN segment embedded in GSTIN.',
            finding: entityTypeMatch
                ? `PAN and GSTIN both indicate '${panEntityType}'.`
                : `PAN indicates '${panEntityType}' while GSTIN indicates '${gstEntityType}'.`,
        });
    }

    if (gstinDetail.valid && dlDetail.valid) {
        const gstState = typeof gstinDetail.metadata?.state === 'string' ? gstinDetail.metadata.state : null;
        const dlState = typeof dlDetail.metadata?.stateName === 'string' ? dlDetail.metadata.stateName : null;

        const stateMatch = (
            gstState != null
            && dlState != null
            && normalizeStateForComparison(gstState) === normalizeStateForComparison(dlState)
        );

        crossChecks.push({
            checkName: 'state_consistency',
            passed: stateMatch,
            description: 'GSTIN state and Driving License state should be consistent for the same subject.',
            finding: stateMatch
                ? `GSTIN state '${gstState}' matches Driving License state '${dlState}'.`
                : `GSTIN state '${gstState ?? 'Unknown'}' does not match Driving License state '${dlState ?? 'Unknown'}'.`,
        });
    }

    if (tanDetail.valid && panDetail.valid && tanDetail.normalized != null && panDetail.normalized != null) {
        const tanInitial = tanDetail.normalized.charAt(3);
        const panInitial = panDetail.normalized.charAt(4);
        const initialsMatch = tanInitial === panInitial;

        crossChecks.push({
            checkName: 'tan_pan_structure_consistency',
            passed: initialsMatch,
            description: 'TAN position 4 (deductor name initial) should typically align with PAN position 5 (name initial).',
            finding: initialsMatch
                ? `TAN initial '${tanInitial}' matches PAN initial '${panInitial}'.`
                : `TAN initial '${tanInitial}' does not match PAN initial '${panInitial}'.`,
        });
    }

    const providedDocumentKeys = DOCUMENT_ORDER.filter((key) => documents[key].provided);
    const validDocuments = providedDocumentKeys.filter((key) => documents[key].valid);
    const invalidDocuments = providedDocumentKeys.filter((key) => !documents[key].valid);

    const failedCrossChecks = crossChecks.filter((check) => !check.passed);
    const highFraudCount = providedDocumentKeys.filter((key) => documents[key].fraudRisk === 'HIGH').length;
    const criticalFraudCount = providedDocumentKeys.filter((key) => documents[key].fraudRisk === 'CRITICAL').length;

    const scoreBeforeEmptyInputOverride = clampScore(
        100
        - (invalidDocuments.length * 15)
        - (failedCrossChecks.length * 10)
        - (highFraudCount * 20)
        - (criticalFraudCount * 40)
    );
    const noDocumentsProvided = providedDocumentKeys.length === 0;
    const kycScore = noDocumentsProvided ? 0 : scoreBeforeEmptyInputOverride;

    const hasCriticalFraud = criticalFraudCount > 0;
    const overallResult: KYCBundleResult['overallResult'] = (
        noDocumentsProvided
            ? 'FAIL'
            : (
                kycScore >= 80 && failedCrossChecks.length === 0
                    ? 'PASS'
                    : (kycScore >= 50 && !hasCriticalFraud ? 'MANUAL_REVIEW' : 'FAIL')
            )
    );

    const inconsistencies = failedCrossChecks.map((check) => `${check.checkName}: ${check.finding}`);
    const entityType = inferEntityType(documents);
    const entityState = inferEntityState(documents);

    const crossCheckSentence = (
        crossChecks.length === 0
            ? 'No applicable cross-document checks were available.'
            : failedCrossChecks.length === 0
                ? 'All applicable cross-document consistency checks passed.'
                : `${failedCrossChecks.length} cross-document check(s) failed.`
    );

    const fraudSentence = (
        allFraudSignals.length === 0
            ? 'No fraud signals were detected in valid documents.'
            : `${allFraudSignals.length} fraud signal(s) were detected, including ${criticalFraudCount} CRITICAL and ${highFraudCount} HIGH risk document assessment(s).`
    );

    const summary = (
        `${validDocuments.length} of ${providedDocumentKeys.length} provided documents are valid. `
        + `${crossCheckSentence} `
        + `${fraudSentence} `
        + `Entity profile indicates '${entityType}'${entityState != null ? ` in '${entityState}'` : ''}. `
        + `KYC score: ${kycScore}/100 - ${overallResult}.`
    );

    return {
        overallResult,
        kycScore,
        documents,
        crossChecks,
        fraudSignals: allFraudSignals,
        entityType,
        entityState,
        summary,
        validDocuments,
        invalidDocuments,
        inconsistencies,
    };
};
