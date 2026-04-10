import { describe, expect, it } from 'vitest';
import {
    detectAadhaarFraud,
    detectFraudSignals,
    detectGSTINFraud,
    detectIFSCFraud,
    detectMSMEFraud,
    detectPANFraud,
    detectPhoneFraud,
    detectPincodeFraud,
    detectTANFraud,
    detectUANFraud,
    detectUPIFraud,
} from '../src/intelligence/fraudSignals';

const hasSignal = (
    result: { signals: Array<{ type: string }> },
    signalType: string
): boolean => result.signals.some((signal) => signal.type === signalType);

type FraudWrapper = (input: string) => ReturnType<typeof detectFraudSignals>;

const WRAPPER_CASES: Array<{ docType: string; wrapper: FraudWrapper; sample: string }> = [
    { docType: 'aadhaar', wrapper: detectAadhaarFraud, sample: '284739105826' },
    { docType: 'pan', wrapper: detectPANFraud, sample: 'ABCPK4837L' },
    { docType: 'gstin', wrapper: detectGSTINFraud, sample: '29ABCDE4826F1Z5' },
    { docType: 'ifsc', wrapper: detectIFSCFraud, sample: 'SBIN0012345' },
    { docType: 'pincode', wrapper: detectPincodeFraud, sample: '560001' },
    { docType: 'tan', wrapper: detectTANFraud, sample: 'DELA48260F' },
    { docType: 'uan', wrapper: detectUANFraud, sample: '284739105826' },
    { docType: 'phone', wrapper: detectPhoneFraud, sample: '9128047356' },
    { docType: 'upi', wrapper: detectUPIFraud, sample: 'john.doe@okaxis' },
    { docType: 'msme', wrapper: detectMSMEFraud, sample: 'UDYAM-DL-10-1234567' },
];

describe('Fraud Signals Intelligence', () => {
    describe('1) Known test numbers and ranges', () => {
        const uidaiTestAadhaars = [
            '999941057058',
            '999971658847',
            '999933119405',
            '999955183433',
            '999990501894',
        ];

        uidaiTestAadhaars.forEach((aadhaar) => {
            it(`marks UIDAI test Aadhaar ${aadhaar} as CRITICAL`, () => {
                const result = detectAadhaarFraud(aadhaar);

                expect(result.isKnownTestNumber).toBe(true);
                expect(result.risk).toBe('CRITICAL');
                expect(result.recommendation).toBe('REJECT');
                expect(hasSignal(result, 'known_test_number')).toBe(true);
            });
        });

        it('marks unknown 9999-prefix Aadhaar as known test range and HIGH/CRITICAL', () => {
            const result = detectAadhaarFraud('999912341234');

            expect(result.isKnownTestNumber).toBe(true);
            expect(hasSignal(result, 'known_test_range')).toBe(true);
            expect(['HIGH', 'CRITICAL']).toContain(result.risk);
        });

        it('marks PAN placeholder AAAAA0000A as HIGH/CRITICAL', () => {
            const result = detectPANFraud('AAAAA0000A');

            expect(result.isKnownTestNumber).toBe(true);
            expect(hasSignal(result, 'known_test_number')).toBe(true);
            expect(['HIGH', 'CRITICAL']).toContain(result.risk);
        });

        it('marks PAN repeated-letter placeholder as known test number', () => {
            const result = detectPANFraud('ZZZZZ9999Z');

            expect(result.isKnownTestNumber).toBe(true);
            expect(hasSignal(result, 'known_test_number')).toBe(true);
            expect(['HIGH', 'CRITICAL']).toContain(result.risk);
        });

        it('marks short 99-prefix GSTIN candidate as HIGH via known_test_range', () => {
            const result = detectGSTINFraud('99AB12');

            expect(result.isKnownTestNumber).toBe(true);
            expect(hasSignal(result, 'known_test_range')).toBe(true);
            expect(result.risk).toBe('HIGH');
        });

        it('marks placeholder GSTIN pattern as known test and CRITICAL', () => {
            const result = detectGSTINFraud('99AAAAA0000A1Z5');

            expect(result.isKnownTestNumber).toBe(true);
            expect(hasSignal(result, 'known_test_number')).toBe(true);
            expect(result.risk).toBe('CRITICAL');
            expect(result.recommendation).toBe('REJECT');
        });
    });

    describe('2) Sequential and progression patterns', () => {
        it('detects sequential_ascending for Aadhaar-like number', () => {
            const result = detectFraudSignals('aadhaar', '123456789012');
            expect(hasSignal(result, 'sequential_ascending')).toBe(true);
        });

        it('detects sequential_descending for Aadhaar-like number', () => {
            const result = detectFraudSignals('aadhaar', '987654321098');
            expect(hasSignal(result, 'sequential_descending')).toBe(true);
        });

        it('detects arithmetic_progression for 135791357913', () => {
            const result = detectFraudSignals('aadhaar', '135791357913');
            expect(hasSignal(result, 'arithmetic_progression')).toBe(true);
        });

        it('detects cyclic ascending wrap sequence', () => {
            const result = detectFraudSignals('phone', '789012345678');
            expect(hasSignal(result, 'sequential_ascending')).toBe(true);
        });

        it('detects cyclic descending wrap sequence', () => {
            const result = detectFraudSignals('phone', '210987654321');
            expect(hasSignal(result, 'sequential_descending')).toBe(true);
        });

        it('does not mark noisy number as sequential', () => {
            const result = detectFraudSignals('aadhaar', '192837465564');
            expect(hasSignal(result, 'sequential_ascending')).toBe(false);
            expect(hasSignal(result, 'sequential_descending')).toBe(false);
        });
    });

    describe('3) Repeated digit patterns', () => {
        it('flags 999999999999 as repeated_digit and CRITICAL', () => {
            const result = detectFraudSignals('aadhaar', '999999999999');
            expect(hasSignal(result, 'repeated_digit')).toBe(true);
            expect(result.risk).toBe('CRITICAL');
        });

        it('flags 111111111111 as repeated_digit and CRITICAL', () => {
            const result = detectFraudSignals('aadhaar', '111111111111');
            expect(hasSignal(result, 'repeated_digit')).toBe(true);
            expect(result.risk).toBe('CRITICAL');
        });

        it('flags 000000000000 as repeated_digit and CRITICAL', () => {
            const result = detectFraudSignals('aadhaar', '000000000000');
            expect(hasSignal(result, 'repeated_digit')).toBe(true);
            expect(result.risk).toBe('CRITICAL');
        });
    });

    describe('4) Repeated block patterns', () => {
        it('detects repeated_block for 123123123123', () => {
            const result = detectFraudSignals('aadhaar', '123123123123');
            expect(hasSignal(result, 'repeated_block')).toBe(true);
        });

        it('detects repeated_block for ABAB98989898 (PAN-adapted input)', () => {
            const result = detectFraudSignals('pan', 'ABAB98989898');
            expect(hasSignal(result, 'repeated_block')).toBe(true);
        });

        it('detects repeated_block for 121212 pincode candidate', () => {
            const result = detectFraudSignals('pincode', '121212');
            expect(hasSignal(result, 'repeated_block')).toBe(true);
        });

        it('does not detect repeated_block for mixed random digits', () => {
            const result = detectFraudSignals('aadhaar', '239485710264');
            expect(hasSignal(result, 'repeated_block')).toBe(false);
        });
    });

    describe('5) Majority same digit patterns', () => {
        it('detects majority_same_digit for 999999990019', () => {
            const result = detectFraudSignals('aadhaar', '999999990019');
            expect(hasSignal(result, 'majority_same_digit')).toBe(true);
        });

        it('detects majority_same_digit at exact 75% ratio', () => {
            const result = detectFraudSignals('phone', '77777712');
            expect(hasSignal(result, 'majority_same_digit')).toBe(true);
        });

        it('does not detect majority_same_digit below threshold', () => {
            const result = detectFraudSignals('phone', '77777123');
            expect(hasSignal(result, 'majority_same_digit')).toBe(false);
        });
    });

    describe('6) Low-risk real-looking numbers', () => {
        it('returns LOW risk, no signals, ACCEPT for plausible Aadhaar-like number', () => {
            const result = detectAadhaarFraud('284739105826');

            expect(result.risk).toBe('LOW');
            expect(result.recommendation).toBe('ACCEPT');
            expect(result.signals).toHaveLength(0);
        });

        it('returns LOW risk, ACCEPT for plausible PAN', () => {
            const result = detectPANFraud('ABCPK4837L');

            expect(result.risk).toBe('LOW');
            expect(result.recommendation).toBe('ACCEPT');
            expect(result.signals).toHaveLength(0);
        });

        it('returns LOW risk for plausible IFSC-like value', () => {
            const result = detectIFSCFraud('SBIN0012345');

            expect(result.risk).toBe('LOW');
            expect(result.recommendation).toBe('ACCEPT');
        });
    });

    describe('7) Multi-signal compound behavior', () => {
        it('caps suspicionScore at 1.0 for strong compounded signals', () => {
            const result = detectFraudSignals('aadhaar', '999999999999');

            expect(result.suspicionScore).toBe(1);
            expect(result.risk).toBe('CRITICAL');
            expect(result.recommendation).toBe('REJECT');
        });

        it('triggers 3+ signals and CRITICAL for PAN placeholder', () => {
            const result = detectFraudSignals('pan', 'AAAAA0000A');

            expect(result.signals.length).toBeGreaterThanOrEqual(3);
            expect(result.suspicionScore).toBeGreaterThan(0.85);
            expect(result.risk).toBe('CRITICAL');
        });
    });

    describe('8) Document type routing and wrapper correctness', () => {
        it('produces different results for the same input across doc types', () => {
            const input = '999941057058';
            const aadhaarResult = detectFraudSignals('aadhaar', input);
            const pincodeResult = detectFraudSignals('pincode', input);

            expect(aadhaarResult.risk).toBe('CRITICAL');
            expect(aadhaarResult.isKnownTestNumber).toBe(true);
            expect(pincodeResult.isKnownTestNumber).toBe(false);
            expect(pincodeResult.risk).not.toBe('CRITICAL');
        });

        it('routes same PAN placeholder differently for pan vs aadhaar detectors', () => {
            const input = 'AAAAA0000A';
            const panResult = detectFraudSignals('pan', input);
            const aadhaarResult = detectFraudSignals('aadhaar', input);

            expect(panResult.isKnownTestNumber).toBe(true);
            expect(aadhaarResult.isKnownTestNumber).toBe(false);
            expect(panResult.risk).not.toBe(aadhaarResult.risk);
        });

        WRAPPER_CASES.forEach(({ docType, wrapper, sample }) => {
            it(`wrapper ${docType} matches detectFraudSignals routing`, () => {
                const viaWrapper = wrapper(sample);
                const viaCore = detectFraudSignals(docType, sample);

                expect(viaWrapper.documentType).toBe(docType);
                expect(viaWrapper).toEqual(viaCore);
            });
        });
    });

    describe('9) Null safety on wrappers', () => {
        const invalidInputs: unknown[] = [null, undefined, '', '   '];

        WRAPPER_CASES.forEach(({ docType, wrapper }) => {
            invalidInputs.forEach((invalidInput) => {
                it(`wrapper ${docType} handles ${String(invalidInput)} gracefully`, () => {
                    const invoke = (): ReturnType<typeof detectFraudSignals> => (
                        wrapper(invalidInput as string)
                    );

                    expect(invoke).not.toThrow();

                    const result = invoke();
                    expect(result.risk).toBe('LOW');
                    expect(result.recommendation).toBe('ACCEPT');
                    expect(result.signals).toHaveLength(0);
                });
            });
        });
    });
});
