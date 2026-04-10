import {
    KNOWN_TEST_AADHAAR_NUMBERS,
    KNOWN_TEST_AADHAAR_PREFIXES,
    KNOWN_TEST_GSTIN_PATTERNS,
    KNOWN_TEST_GSTIN_PREFIXES,
    KNOWN_TEST_PAN_PATTERNS,
} from '../data/syntheticPatterns';

export type FraudSignalType =
    | 'sequential_ascending'
    | 'sequential_descending'
    | 'repeated_digit'
    | 'repeated_block'
    | 'known_test_range'
    | 'known_test_number'
    | 'round_number'
    | 'mirror_pattern'
    | 'arithmetic_progression'
    | 'majority_same_digit';

export type FraudRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudSignal {
    type: FraudSignalType;
    description: string;
    weight: number;
}

export interface FraudDetectionResult {
    input: string;
    normalized: string;
    documentType: string;
    suspicionScore: number;
    risk: FraudRisk;
    signals: FraudSignal[];
    isKnownTestNumber: boolean;
    recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
    note: string;
}

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
    | 'msme';

const SIGNAL_WEIGHTS: Record<FraudSignalType, number> = {
    sequential_ascending: 0.40,
    sequential_descending: 0.40,
    repeated_digit: 0.45,
    repeated_block: 0.35,
    known_test_range: 0.75,
    known_test_number: 0.95,
    round_number: 0.20,
    mirror_pattern: 0.30,
    arithmetic_progression: 0.30,
    majority_same_digit: 0.25,
};

const KNOWN_DOC_TYPES: ReadonlySet<SupportedDocumentType> = new Set([
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
]);

const isSupportedDocumentType = (documentType: string): documentType is SupportedDocumentType => (
    KNOWN_DOC_TYPES.has(documentType as SupportedDocumentType)
);

const clampScore = (score: number): number => Math.max(0, Math.min(1, score));

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
        default:
            return base.toUpperCase().replace(/[\s-]/g, '');
    }
};

const getDigitSequence = (normalized: string): string => normalized.replace(/\D/g, '');

const isSequentialAscending = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;

    for (let i = 1; i < digits.length; i += 1) {
        const prev = Number(digits[i - 1]);
        const current = Number(digits[i]);
        if (current !== ((prev + 1) % 10)) return false;
    }

    return true;
};

const isSequentialDescending = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;

    for (let i = 1; i < digits.length; i += 1) {
        const prev = Number(digits[i - 1]);
        const current = Number(digits[i]);
        if (current !== ((prev + 9) % 10)) return false;
    }

    return true;
};

const isRepeatedSingleDigit = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 2) return false;

    return /^(\d)\1+$/.test(digits);
};

const isRepeatedBlock = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;

    for (let blockSize = 2; blockSize <= Math.floor(digits.length / 2); blockSize += 1) {
        if (digits.length % blockSize !== 0) continue;
        const block = digits.slice(0, blockSize);
        const repeated = block.repeat(digits.length / blockSize);
        if (repeated === digits) return true;
    }

    return false;
};

const isMirrorPattern = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 6) return false;

    const middle = Math.floor(digits.length / 2);
    const left = digits.slice(0, middle);
    const right = digits.slice(digits.length % 2 === 0 ? middle : middle + 1);

    return right === left.split('').reverse().join('');
};

const isMajoritySameDigit = (digits: string, threshold: number): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;
    if (threshold <= 0 || threshold > 1) return false;

    const counts: Record<string, number> = {};
    for (const digit of digits) {
        counts[digit] = (counts[digit] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(counts));
    return (maxCount / digits.length) >= threshold;
};

const isArithmeticProgression = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;

    const step = ((Number(digits[1]) - Number(digits[0])) + 10) % 10;
    if (step === 0) return false;

    for (let i = 2; i < digits.length; i += 1) {
        const prev = Number(digits[i - 1]);
        const current = Number(digits[i]);
        if (current !== ((prev + step) % 10)) return false;
    }

    return true;
};

const isRoundNumber = (digits: string): boolean => {
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 4) return false;

    const trailingZeros = digits.match(/0+$/)?.[0].length || 0;
    const minTrailingZeros = Math.max(3, Math.floor(digits.length / 2));
    const prefixLength = digits.length - trailingZeros;

    if (trailingZeros < minTrailingZeros) return false;
    if (prefixLength <= 0) return false;

    return Number(digits.slice(0, prefixLength)) > 0;
};

const buildSignal = (type: FraudSignalType, description: string): FraudSignal => ({
    type,
    description,
    weight: SIGNAL_WEIGHTS[type],
});

const getRisk = (score: number): FraudRisk => {
    if (score <= 0.25) return 'LOW';
    if (score <= 0.60) return 'MEDIUM';
    if (score <= 0.85) return 'HIGH';
    return 'CRITICAL';
};

const getRecommendation = (risk: FraudRisk): 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT' => {
    switch (risk) {
        case 'LOW':
        case 'MEDIUM':
            return 'ACCEPT';
        case 'HIGH':
            return 'MANUAL_REVIEW';
        case 'CRITICAL':
            return 'REJECT';
        default:
            return 'ACCEPT';
    }
};

const getSummaryNote = (
    risk: FraudRisk,
    recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT',
    signals: FraudSignal[],
    unknownDocType: boolean
): string => {
    if (unknownDocType) {
        return 'Document type not recognized; only generic synthetic pattern checks were applied.';
    }
    if (signals.length === 0) {
        return 'No synthetic or known test-pattern fraud signals were detected.';
    }
    if (risk === 'MEDIUM') {
        return `Detected ${signals.length} low-to-moderate synthetic signal(s); accepted with caution.`;
    }
    return `Detected ${signals.length} fraud signal(s); recommendation is ${recommendation}.`;
};

const addGenericNumericSignals = (signals: FraudSignal[], digits: string): void => {
    if (digits.length < 4) return;

    if (isSequentialAscending(digits)) {
        signals.push(buildSignal('sequential_ascending', 'Digits follow a cyclic ascending sequence.'));
    }
    if (isSequentialDescending(digits)) {
        signals.push(buildSignal('sequential_descending', 'Digits follow a cyclic descending sequence.'));
    }
    if (isRepeatedSingleDigit(digits)) {
        signals.push(buildSignal('repeated_digit', 'All digits are the same.'));
    }
    if (!isRepeatedSingleDigit(digits) && isRepeatedBlock(digits)) {
        signals.push(buildSignal('repeated_block', 'Digit block repeats uniformly across the number.'));
    }
    if (isMirrorPattern(digits)) {
        signals.push(buildSignal('mirror_pattern', 'Digits form a mirrored pattern around the center.'));
    }
    if (isArithmeticProgression(digits)) {
        signals.push(buildSignal('arithmetic_progression', 'Digits form a constant-step arithmetic progression.'));
    }
    if (isMajoritySameDigit(digits, 0.75)) {
        signals.push(buildSignal('majority_same_digit', 'One digit dominates at least 75% of positions.'));
    }
    if (isRoundNumber(digits)) {
        signals.push(buildSignal('round_number', 'Value appears to be a rounded number with many trailing zeros.'));
    }
};

const addDocumentSpecificSignals = (
    docType: SupportedDocumentType,
    normalized: string,
    signals: FraudSignal[]
): void => {
    if (docType === 'aadhaar') {
        if (KNOWN_TEST_AADHAAR_NUMBERS.has(normalized)) {
            signals.push(buildSignal('known_test_number', 'Matches a known UIDAI sandbox test Aadhaar number.'));
        }
        const prefix = normalized.slice(0, 4);
        if (prefix.length === 4 && KNOWN_TEST_AADHAAR_PREFIXES.has(prefix)) {
            signals.push(buildSignal('known_test_range', 'Aadhaar starts with a known UIDAI test prefix.'));
        }
    }

    if (docType === 'pan') {
        for (const pattern of KNOWN_TEST_PAN_PATTERNS) {
            if (pattern.test(normalized)) {
                signals.push(buildSignal('known_test_number', 'PAN matches a known synthetic/test placeholder pattern.'));
                break;
            }
        }
    }

    if (docType === 'gstin') {
        const prefix = normalized.slice(0, 2);
        if (prefix.length === 2 && KNOWN_TEST_GSTIN_PREFIXES.has(prefix)) {
            signals.push(buildSignal('known_test_range', 'GSTIN starts with a known test/special prefix.'));
        }
        for (const pattern of KNOWN_TEST_GSTIN_PATTERNS) {
            if (pattern.test(normalized)) {
                signals.push(buildSignal('known_test_number', 'GSTIN matches a known synthetic/test placeholder pattern.'));
                break;
            }
        }
    }
};

const dedupeSignals = (signals: FraudSignal[]): FraudSignal[] => {
    const seen = new Set<FraudSignalType>();
    const deduped: FraudSignal[] = [];

    for (const signal of signals) {
        if (seen.has(signal.type)) continue;
        seen.add(signal.type);
        deduped.push(signal);
    }

    return deduped;
};

export const detectFraudSignals = (documentType: string, input: string): FraudDetectionResult => {
    const safeInput = typeof input === 'string' ? input : String(input || '');
    const normalizedDocType = (documentType || '').toLowerCase();
    const supportedType = isSupportedDocumentType(normalizedDocType) ? normalizedDocType : null;

    const normalized = supportedType
        ? normalizeInput(supportedType, safeInput)
        : safeInput.trim().replace(/\s+/g, '');
    const digits = getDigitSequence(normalized);

    const rawSignals: FraudSignal[] = [];
    addGenericNumericSignals(rawSignals, digits);

    if (supportedType) {
        addDocumentSpecificSignals(supportedType, normalized, rawSignals);
    }

    const signals = dedupeSignals(rawSignals);
    const suspicionScore = clampScore(signals.reduce((sum, signal) => sum + signal.weight, 0));
    const risk = getRisk(suspicionScore);
    const recommendation = getRecommendation(risk);
    const isKnownTestNumber = signals.some((signal) => (
        signal.type === 'known_test_number' || signal.type === 'known_test_range'
    ));

    return {
        input: safeInput,
        normalized,
        documentType: normalizedDocType || documentType,
        suspicionScore,
        risk,
        signals,
        isKnownTestNumber,
        recommendation,
        note: getSummaryNote(risk, recommendation, signals, supportedType == null),
    };
};

export const detectAadhaarFraud = (input: string): FraudDetectionResult => detectFraudSignals('aadhaar', input);
export const detectPANFraud = (input: string): FraudDetectionResult => detectFraudSignals('pan', input);
export const detectGSTINFraud = (input: string): FraudDetectionResult => detectFraudSignals('gstin', input);
export const detectIFSCFraud = (input: string): FraudDetectionResult => detectFraudSignals('ifsc', input);
export const detectPincodeFraud = (input: string): FraudDetectionResult => detectFraudSignals('pincode', input);
export const detectTANFraud = (input: string): FraudDetectionResult => detectFraudSignals('tan', input);
export const detectUANFraud = (input: string): FraudDetectionResult => detectFraudSignals('uan', input);
export const detectPhoneFraud = (input: string): FraudDetectionResult => detectFraudSignals('phone', input);
export const detectUPIFraud = (input: string): FraudDetectionResult => detectFraudSignals('upi', input);
export const detectMSMEFraud = (input: string): FraudDetectionResult => detectFraudSignals('msme', input);
