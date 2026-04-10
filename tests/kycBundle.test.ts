import { describe, expect, it } from 'vitest';
import { generateVerhoeff } from '../src/utils/verhoeff';
import { generateGSTCheckDigit } from '../src/utils/mod36';
import { validateKYCBundle } from '../src/intelligence/kycBundle';

const GST_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;

const buildPAN = (
    entityCode: 'P' | 'C' | 'H' | 'F' | 'T' | 'G',
    nameInitial = 'K',
    serial = '4837',
    prefix = 'ABC',
    suffix = 'L'
): string => `${prefix}${entityCode}${nameInitial}${serial}${suffix}`;

const buildGSTIN = (stateCode: string, pan: string, registrationCode = '1'): string => {
    const base = `${stateCode}${pan}${registrationCode}Z`;
    const checkIndex = generateGSTCheckDigit(base);
    if (checkIndex < 0) {
        throw new Error(`Unable to generate GSTIN check digit for base '${base}'`);
    }
    return `${base}${GST_CHARSET[checkIndex]}`;
};

const BASE_VALID_AADHAAR = buildAadhaar('28473910582');
const BASE_VALID_PAN = buildPAN('P');
const BASE_VALID_GSTIN = buildGSTIN('27', BASE_VALID_PAN);
const BASE_VALID_PHONE = '9128047356';

describe('validateKYCBundle', () => {
    describe('1) Full pass scenario', () => {
        const result = validateKYCBundle({
            aadhaar: BASE_VALID_AADHAAR,
            pan: BASE_VALID_PAN,
            gstin: BASE_VALID_GSTIN,
        });

        it('returns PASS when Aadhaar, PAN, and GSTIN are valid and consistent', () => {
            expect(result.overallResult).toBe('PASS');
        });

        it('keeps kycScore >= 80', () => {
            expect(result.kycScore).toBeGreaterThanOrEqual(80);
        });

        it('passes gstin_pan_match cross-check', () => {
            const crossCheck = result.crossChecks.find((check) => check.checkName === 'gstin_pan_match');
            expect(crossCheck).toBeDefined();
            expect(crossCheck?.passed).toBe(true);
        });

        it('passes entity_type_consistency cross-check', () => {
            const crossCheck = result.crossChecks.find((check) => check.checkName === 'entity_type_consistency');
            expect(crossCheck).toBeDefined();
            expect(crossCheck?.passed).toBe(true);
        });

        it('has no failed cross-checks', () => {
            expect(result.crossChecks.every((check) => check.passed)).toBe(true);
        });

        it('identifies entityType as Individual', () => {
            expect(result.entityType).toBe('Individual');
        });

        it('decodes entityState as Maharashtra from GSTIN state code 27', () => {
            expect(result.entityState).toBe('Maharashtra');
        });

        it('lists all three documents in validDocuments', () => {
            expect(result.validDocuments).toEqual(['aadhaar', 'pan', 'gstin']);
        });

        it('has no invalid documents in this scenario', () => {
            expect(result.invalidDocuments).toEqual([]);
        });

        it('summary includes PASS and score text', () => {
            expect(result.summary).toContain('PASS');
            expect(result.summary).toContain('KYC score:');
        });
    });

    describe('2) Fail scenario - invalid documents', () => {
        const result = validateKYCBundle({
            aadhaar: '999999990019',
            pan: '12AB',
            gstin: '27AAPFR5055K1Z0',
            phone: 'bad-phone',
        });

        it('returns FAIL when three documents are invalid and risk is severe', () => {
            expect(result.overallResult).toBe('FAIL');
        });

        it('drops score below 50', () => {
            expect(result.kycScore).toBeLessThan(50);
        });

        it('lists all invalid docs (pan, gstin, phone)', () => {
            expect(result.invalidDocuments).toEqual(['pan', 'gstin', 'phone']);
        });

        it('keeps aadhaar as a valid provided document', () => {
            expect(result.documents.aadhaar.valid).toBe(true);
            expect(result.validDocuments).toContain('aadhaar');
        });

        it('records CRITICAL risk on the test-range Aadhaar', () => {
            expect(result.documents.aadhaar.fraudRisk).toBe('CRITICAL');
        });

        it('captures at least one fraud signal in the bundle', () => {
            expect(result.fraudSignals.length).toBeGreaterThan(0);
        });
    });

    describe('3) Cross-check failure scenario', () => {
        const providedPAN = buildPAN('P', 'K', '4837', 'ABC', 'L');
        const mismatchedPANInGSTIN = buildPAN('P', 'R', '4837', 'ABC', 'L');
        const mismatchedGSTIN = buildGSTIN('27', mismatchedPANInGSTIN);

        const result = validateKYCBundle({
            pan: providedPAN,
            gstin: mismatchedGSTIN,
        });

        it('returns MANUAL_REVIEW or FAIL when PAN and embedded GSTIN PAN mismatch', () => {
            expect(['MANUAL_REVIEW', 'FAIL']).toContain(result.overallResult);
        });

        it('marks gstin_pan_match as failed', () => {
            const crossCheck = result.crossChecks.find((check) => check.checkName === 'gstin_pan_match');
            expect(crossCheck).toBeDefined();
            expect(crossCheck?.passed).toBe(false);
        });

        it('includes mismatch in inconsistencies list', () => {
            expect(result.inconsistencies.some((item) => item.includes('gstin_pan_match'))).toBe(true);
        });

        it('keeps both provided documents individually valid', () => {
            expect(result.documents.pan.valid).toBe(true);
            expect(result.documents.gstin.valid).toBe(true);
            expect(result.invalidDocuments).toEqual([]);
        });

        it('reduces kycScore from perfect due to failed cross-check', () => {
            expect(result.kycScore).toBeLessThan(100);
        });

        it('still passes entity_type_consistency because both encode P', () => {
            const crossCheck = result.crossChecks.find((check) => check.checkName === 'entity_type_consistency');
            expect(crossCheck).toBeDefined();
            expect(crossCheck?.passed).toBe(true);
        });
    });

    describe('4) Partial input scenario', () => {
        const result = validateKYCBundle({
            pan: BASE_VALID_PAN,
            phone: BASE_VALID_PHONE,
        });

        it('handles partial input without throwing', () => {
            const invoke = (): ReturnType<typeof validateKYCBundle> => validateKYCBundle({
                pan: BASE_VALID_PAN,
                phone: BASE_VALID_PHONE,
            });
            expect(invoke).not.toThrow();
        });

        it('marks PAN as provided and valid', () => {
            expect(result.documents.pan.provided).toBe(true);
            expect(result.documents.pan.valid).toBe(true);
        });

        it('marks phone as provided and valid', () => {
            expect(result.documents.phone.provided).toBe(true);
            expect(result.documents.phone.valid).toBe(true);
        });

        it('returns PASS for two valid docs and no adverse checks', () => {
            expect(result.overallResult).toBe('PASS');
        });

        it('does not run cross-checks when required pairs are missing', () => {
            expect(result.crossChecks).toEqual([]);
        });

        it.each([
            'aadhaar',
            'gstin',
            'tan',
            'uan',
            'passport',
            'voterId',
            'drivingLicense',
            'upi',
        ] as const)('marks %s as not provided', (docKey) => {
            expect(result.documents[docKey].provided).toBe(false);
            expect(result.documents[docKey].value).toBeNull();
            expect(result.documents[docKey].normalized).toBeNull();
            expect(result.documents[docKey].valid).toBe(false);
        });
    });

    describe('5) Fraud signal scenario', () => {
        const baseline = validateKYCBundle({
            aadhaar: BASE_VALID_AADHAAR,
            pan: BASE_VALID_PAN,
        });

        const withTestAadhaar = validateKYCBundle({
            aadhaar: '999999990019',
            pan: BASE_VALID_PAN,
        });

        it('populates fraudSignals for valid-format test Aadhaar', () => {
            expect(withTestAadhaar.fraudSignals.length).toBeGreaterThan(0);
        });

        it('includes a known_test_range/known_test_number fraud signal type', () => {
            const types = withTestAadhaar.fraudSignals.map((signal) => signal.type);
            expect(types.includes('known_test_range') || types.includes('known_test_number')).toBe(true);
        });

        it('marks Aadhaar fraud risk as CRITICAL', () => {
            expect(withTestAadhaar.documents.aadhaar.fraudRisk).toBe('CRITICAL');
        });

        it('reduces kycScore compared to non-test Aadhaar baseline', () => {
            expect(withTestAadhaar.kycScore).toBeLessThan(baseline.kycScore);
        });

        it('fails overall because CRITICAL fraud exists', () => {
            expect(withTestAadhaar.overallResult).toBe('FAIL');
        });

        it('keeps both PAN and Aadhaar individually valid', () => {
            expect(withTestAadhaar.validDocuments).toEqual(['aadhaar', 'pan']);
            expect(withTestAadhaar.invalidDocuments).toEqual([]);
        });
    });

    describe('6) Mixed scenario', () => {
        const result = validateKYCBundle({
            aadhaar: '999900000016',
            pan: BASE_VALID_PAN,
            phone: 'invalid-phone',
        });

        it('returns MANUAL_REVIEW for 2 valid + 1 invalid + 1 HIGH fraud-risk document', () => {
            expect(result.overallResult).toBe('MANUAL_REVIEW');
        });

        it('keeps score in manual-review band (50-79)', () => {
            expect(result.kycScore).toBeGreaterThanOrEqual(50);
            expect(result.kycScore).toBeLessThan(80);
        });

        it('lists aadhaar and pan as valid documents', () => {
            expect(result.validDocuments).toEqual(['aadhaar', 'pan']);
        });

        it('lists phone as invalid document', () => {
            expect(result.invalidDocuments).toEqual(['phone']);
        });

        it('detects fraud signals in bundle result', () => {
            expect(result.fraudSignals.length).toBeGreaterThan(0);
        });

        it('marks Aadhaar fraud risk as HIGH (9999 test-prefix without additional patterns)', () => {
            expect(result.documents.aadhaar.fraudRisk).toBe('HIGH');
        });

        it('keeps inconsistencies empty when no cross-check pair is available', () => {
            expect(result.inconsistencies).toEqual([]);
        });

        it('does not produce cross-check entries when only Aadhaar/PAN/phone are present', () => {
            expect(result.crossChecks).toEqual([]);
        });
    });

    describe('7) Empty input', () => {
        const result = validateKYCBundle({});

        it('handles empty object gracefully and returns FAIL', () => {
            expect(result.overallResult).toBe('FAIL');
        });

        it('returns score 0 for empty input', () => {
            expect(result.kycScore).toBe(0);
        });

        it('has no valid or invalid documents listed', () => {
            expect(result.validDocuments).toEqual([]);
            expect(result.invalidDocuments).toEqual([]);
        });

        it.each([
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
        ] as const)('marks %s as not provided in empty-input result', (docKey) => {
            expect(result.documents[docKey].provided).toBe(false);
        });
    });

    describe('8) Entity type detection', () => {
        it('detects Individual when PAN/GSTIN both encode P', () => {
            const pan = buildPAN('P');
            const gstin = buildGSTIN('27', pan);
            const result = validateKYCBundle({ pan, gstin });
            expect(result.entityType).toBe('Individual');
        });

        it('detects Company when PAN/GSTIN encode C', () => {
            const pan = buildPAN('C');
            const gstin = buildGSTIN('27', pan);
            const result = validateKYCBundle({ pan, gstin });
            expect(result.entityType).toBe('Company');
        });

        it.each([
            { code: 'H' as const, expected: 'HUF' as const },
            { code: 'F' as const, expected: 'Firm' as const },
            { code: 'T' as const, expected: 'Trust' as const },
            { code: 'G' as const, expected: 'Govt' as const },
        ])('maps PAN entity code $code to $expected', ({ code, expected }) => {
            const pan = buildPAN(code);
            const gstin = buildGSTIN('27', pan);
            const result = validateKYCBundle({ pan, gstin });
            expect(result.entityType).toBe(expected);
        });

        it('infers Company from GSTIN even when PAN is not provided', () => {
            const companyPan = buildPAN('C');
            const gstin = buildGSTIN('27', companyPan);
            const result = validateKYCBundle({ gstin });
            expect(result.entityType).toBe('Company');
        });
    });
});
