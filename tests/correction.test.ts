import { describe, expect, it } from 'vitest';
import { suggestCorrection } from '../src/intelligence/correction';
import { isValidAadhaar } from '../src/validators/aadhaar';
import { isValidGSTIN } from '../src/validators/gstin';

describe('suggestCorrection', () => {
    describe('1) Aadhaar valid input (no correction needed)', () => {
        it('marks an already valid Aadhaar as already valid', () => {
            const result = suggestCorrection('aadhaar', '999999990019');

            expect(result.isAlreadyValid).toBe(true);
            expect(result.confidence).toBe('NONE');
            expect(result.primarySuggestion).toBeNull();
        });

        it('returns no candidates for an already valid Aadhaar', () => {
            const result = suggestCorrection('aadhaar', '999999990019');
            expect(result.candidates).toHaveLength(0);
        });

        it('normalizes formatted Aadhaar input and still treats it as valid', () => {
            const result = suggestCorrection('aadhaar', '9999 9999 0019');
            expect(result.normalizedInput).toBe('999999990019');
            expect(result.isAlreadyValid).toBe(true);
        });

        it('uses aadhaar as the normalized documentType', () => {
            const result = suggestCorrection('aadhaar', '999999990019');
            expect(result.documentType).toBe('aadhaar');
        });
    });

    describe('2) Aadhaar single last-digit typo', () => {
        it('finds the canonical correction candidate 999999990019', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            expect(result.candidates.some((candidate) => candidate.corrected === '999999990019')).toBe(true);
        });

        it('keeps the top-ranked candidate at position 12', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            expect(result.candidates[0].changedPosition).toBe(12);
        });

        it('marks Aadhaar typo recovery as verhoeff based', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            expect(result.candidates[0].verificationAlgorithm).toBe('verhoeff');
        });

        it('recommends the corrected Aadhaar as primary suggestion', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            expect(result.primarySuggestion).toBe('999999990019');
        });

        it('produces at least one position-12 correction candidate', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            const position12Candidates = result.candidates.filter((candidate) => candidate.changedPosition === 12);
            expect(position12Candidates.length).toBeGreaterThan(0);
        });

        it('returns a candidate changedTo digit accepted by Aadhaar validator', () => {
            const result = suggestCorrection('aadhaar', '999999990018');
            const corrected = result.candidates.find((candidate) => candidate.corrected === '999999990019');
            expect(corrected).toBeDefined();
            expect(isValidAadhaar(corrected?.corrected ?? '')).toBe(true);
        });
    });

    describe('3) Aadhaar multiple possible corrections', () => {
        it('returns multiple candidates for ambiguous single-position typo search', () => {
            const result = suggestCorrection('aadhaar', '999949990019');
            expect(result.candidates.length).toBeGreaterThan(1);
        });

        it('reports MEDIUM confidence when multiple Aadhaar candidates are found', () => {
            const result = suggestCorrection('aadhaar', '999949990019');
            expect(result.confidence).toBe('MEDIUM');
        });

        it('includes the known position-5 fix among candidates', () => {
            const result = suggestCorrection('aadhaar', '999949990019');
            const position5Fix = result.candidates.find((candidate) => (
                candidate.changedPosition === 5
                && candidate.changedFrom === '4'
                && candidate.changedTo === '9'
                && candidate.corrected === '999999990019'
            ));
            expect(position5Fix).toBeDefined();
        });

        it('uses the first candidate as primary suggestion', () => {
            const result = suggestCorrection('aadhaar', '999949990019');
            expect(result.primarySuggestion).toBe(result.candidates[0]?.corrected ?? null);
        });

        it('keeps candidate order sorted by changedPosition descending', () => {
            const result = suggestCorrection('aadhaar', '999949990019');
            for (let i = 1; i < result.candidates.length; i += 1) {
                expect(result.candidates[i - 1].changedPosition).toBeGreaterThanOrEqual(result.candidates[i].changedPosition);
            }
        });
    });

    describe('4) GSTIN wrong check digit (exact correction)', () => {
        it('returns EXACT confidence for check-digit mismatch', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(result.confidence).toBe('EXACT');
        });

        it('returns one and only one correction candidate', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(result.candidates).toHaveLength(1);
        });

        it('returns the expected corrected GSTIN', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(result.primarySuggestion).toBe('27AAPFR5055K1ZM');
        });

        it('sets changedPosition to 15 for GSTIN check-digit recovery', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(result.candidates[0].changedPosition).toBe(15);
        });

        it('marks GSTIN correction algorithm as mod36', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(result.candidates[0].verificationAlgorithm).toBe('mod36');
        });

        it('produces a corrected GSTIN that passes validation', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            expect(isValidGSTIN(result.candidates[0].corrected)).toBe(true);
        });
    });

    describe('5) GSTIN already valid', () => {
        it('returns isAlreadyValid=true for a valid GSTIN', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1ZM');
            expect(result.isAlreadyValid).toBe(true);
        });

        it('returns no candidates for a valid GSTIN', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1ZM');
            expect(result.candidates).toHaveLength(0);
        });
    });

    describe('6) Structural hint cases (non-checksum docs)', () => {
        it('returns first-rule hint for invalid Voter ID format', () => {
            const result = suggestCorrection('voterid', 'AB12345678');
            expect(result.note).toContain('Position 3');
        });

        it('flags all-zero voter sequence with explicit hint', () => {
            const result = suggestCorrection('voterid', 'ABC0000000');
            expect(result.note).toContain('cannot be all zeros');
        });

        it('returns passport series hint when prefix is unsupported', () => {
            const result = suggestCorrection('passport', 'Q1234567');
            expect(result.note).toContain('series');
            expect(result.note).toContain('supported');
        });

        it('returns passport position hint when first character is not a letter', () => {
            const result = suggestCorrection('passport', '11234567');
            expect(result.note).toContain('Position 1');
        });
    });

    describe('7) Edge cases', () => {
        it('handles empty string input gracefully for Aadhaar', () => {
            const invoke = (): ReturnType<typeof suggestCorrection> => suggestCorrection('aadhaar', '');
            expect(invoke).not.toThrow();
            const result = invoke();
            expect(result.confidence).toBe('NONE');
        });

        it('handles empty string input gracefully for GSTIN', () => {
            const result = suggestCorrection('gstin', '');
            expect(result.confidence).toBe('NONE');
            expect(result.candidates).toHaveLength(0);
        });

        it('returns NONE confidence when GSTIN has more than one error in critical suffix', () => {
            const result = suggestCorrection('gstin', '27AAPFR5055K1Y0');
            expect(result.confidence).toBe('NONE');
            expect(result.candidates).toHaveLength(0);
            expect(result.note).toContain('Position 14');
        });

        it('returns NONE confidence for completely random Aadhaar input', () => {
            const result = suggestCorrection('aadhaar', 'a!#7x');
            expect(result.confidence).toBe('NONE');
            expect(result.candidates).toHaveLength(0);
        });

        it('returns NONE for unsupported document type', () => {
            const result = suggestCorrection('drivinglicense', 'DL0100012345678');
            expect(result.confidence).toBe('NONE');
            expect(result.note).toContain('Unsupported document type');
        });

        it('handles non-string input without throwing', () => {
            const invoke = (): ReturnType<typeof suggestCorrection> => (
                suggestCorrection('aadhaar', null as unknown as string)
            );
            expect(invoke).not.toThrow();
            expect(invoke().confidence).toBe('NONE');
        });
    });

    describe('8) Privacy and side-effect behavior', () => {
        it('is idempotent for repeated calls with same input', () => {
            const first = suggestCorrection('aadhaar', '999999990018');
            const second = suggestCorrection('aadhaar', '999999990018');
            expect(first).toEqual(second);
        });

        it('does not share mutable result state across calls', () => {
            const first = suggestCorrection('aadhaar', '999999990018');
            const originalPrimary = first.primarySuggestion;

            first.primarySuggestion = 'tampered';
            if (first.candidates.length > 0) {
                first.candidates[0].corrected = 'tampered';
            }

            const second = suggestCorrection('aadhaar', '999999990018');
            expect(second.primarySuggestion).toBe(originalPrimary);
            expect(second.candidates[0].corrected).not.toBe('tampered');
        });

        it('keeps candidate order deterministic across multiple calls', () => {
            const first = suggestCorrection('aadhaar', '999949990019');
            const second = suggestCorrection('aadhaar', '999949990019');

            const firstOrder = first.candidates.map((candidate) => `${candidate.changedPosition}-${candidate.corrected}`);
            const secondOrder = second.candidates.map((candidate) => `${candidate.changedPosition}-${candidate.corrected}`);

            expect(firstOrder).toEqual(secondOrder);
        });

        it('does not leak correction state across document types', () => {
            const aadhaarResult = suggestCorrection('aadhaar', '999999990018');
            const gstinResult = suggestCorrection('gstin', '27AAPFR5055K1Z0');
            const aadhaarResultAgain = suggestCorrection('aadhaar', '999999990018');

            expect(gstinResult.candidates).toHaveLength(1);
            expect(aadhaarResultAgain).toEqual(aadhaarResult);
        });
    });
});
