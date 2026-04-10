# suggestCorrection() Research and Algorithm Decisions

Date: 2026-04-09  
Package: `@prashanttiw/pramana`  
Goal: provide safe, deterministic correction suggestions for likely single-typo inputs, with calibrated confidence.

## Scope

This function is **not** a validator replacement. It runs when validation fails and should:

- return exact correction when mathematically determinable,
- return bounded candidate sets when ambiguous,
- otherwise return structural guidance (first failing rule).

---

## 1) Verhoeff Recovery for Aadhaar

### A. Can we recover the correct last digit from `999999990018`?

Yes. For a 12-digit Aadhaar candidate, if only the check digit is wrong, the correct 12th digit is directly derivable by applying Verhoeff generation to the first 11 digits.

- Input: `999999990018` (invalid)
- Base: `99999999001`
- Generated check digit: `9`
- Corrected candidate: `999999990019`

### B. If `999999990019` has a typo at position 5, can we recover it?

If typo position is known (position 5), yes: iterate 10 digits only at that position and test Verhoeff.  
For example typo input `999949990019`:

- Position-5-only search gives exactly one fix: `999999990019`.

### C. Can Verhoeff identify the wrong position by itself?

No. Verhoeff detects checksum failure, but does not uniquely localize the error position.

Empirical result using current library implementation:

- Full one-edit search on invalid `999949990019` (all 12 positions, all digit substitutions) produced **12 valid candidates**, one per position.

### D. Single-position recovery method

Use exhaustive one-edit search:

- positions: `1..12`
- each position: try `0..9` except original digit
- retain candidates passing `isValidAadhaar`

Complexity is constant and small:

- `12 * 9 = 108` checks max.

### E. How many one-digit correction candidates exist?

For generic invalid 12-digit Verhoeff strings, one-edit search yields one valid replacement per position (typically 12).  
With Aadhaar-specific constraints (first digit `2-9` in this repo), this can be fewer for malformed first-digit inputs.

---

## 2) Mod-36 Recovery for GSTIN

GSTIN check character (position 15) is deterministic from positions 1..14.

Given base `B = gstin.slice(0,14)`, current library algorithm computes:

- weighted folded sum over base-36 values,
- `checkIndex = (36 - (sum % 36)) % 36`,
- `checkChar = CHARSET[checkIndex]`.

So if structure is valid and only check digit mismatches, correction is exact (no brute-force needed).

Example:

- Invalid: `27AAPFR5055K1Z0`
- Base: `27AAPFR5055K1Z`
- Computed check char: `M`
- Correct: `27AAPFR5055K1ZM`

This is the strongest confidence class (`EXACT`).

---

## 3) Non-checksum Documents: Edit Distance vs Rule-guided Hints

### A. Levenshtein against full valid space

Not practical as a primary strategy, because valid-string space is huge and unconstrained lexically for many docs.

Approximate search spaces from current formats:

- PAN (`[A-Z]{5}[0-9]{4}[A-Z]`): ~`3.089e12`
- TAN (`[A-Z]{4}[0-9]{5}[A-Z]`): ~`1.188e12`
- IFSC (`[A-Z]{4}0[A-Z0-9]{6}`): ~`9.947e14`
- GSTIN structural space: ~`3.892e17`

Even though Wagner-Fischer computes pairwise distance in `O(m*n)`, nearest-neighbor search over these spaces is not feasible without a constrained candidate dictionary.

### B. Preferred approach

Use **first-failing-rule diagnostics**:

- "Position 4 must be one of `C,P,H,F,A,T,B,L,J,G` for PAN."
- "IFSC character 5 must be `0`."
- "Pincode must be 6 digits and first digit cannot be 0."

Then optionally add **small bounded suggestions** only where finite trusted dictionaries exist (e.g., IFSC bank code set, UPI handle set).

---

## 4) Confidence Scoring Model

Use explicit correction confidence independent of document validity score:

- `EXACT`: one mathematically forced correction
  - GSTIN wrong check char with valid first 14 chars
  - Aadhaar 11-digit base completion with generated Verhoeff digit
- `HIGH`: single candidate from constrained one-edit recovery
  - e.g., known typo position on Aadhaar
- `MEDIUM`: multiple one-edit candidates returned
  - e.g., Aadhaar full 12-position recovery (often 12 candidates)
- `LOW`: no concrete correction; structural/rule hint only

Recommended response shape for implementation:

- `confidence: 'EXACT' | 'HIGH' | 'MEDIUM' | 'LOW'`
- `suggestions: string[]` (ordered best-first, capped, e.g. top 5)
- `explanation: string[]` (machine-readable or user-readable rules)

---

## 5) Privacy Requirement

This feature processes sensitive real identifiers. Correction attempts must be in-memory only.

Policy decision:

- Do not log raw input.
- Do not persist computed candidates.
- Do not include full identifiers in error telemetry.

Recommended JSDoc warning:

```ts
/**
 * SECURITY/PRIVACY WARNING:
 * This function may process real government/financial identifiers.
 * Never log, persist, or export raw inputs or generated corrections.
 * Use in-memory processing only and redact values in diagnostics.
 */
```

---

## Algorithm Decision by Document Type

## Aadhaar

- Primary strategy: Verhoeff-guided recovery.
- If 11 digits and numeric: append generated check digit (`EXACT`).
- If 12 digits, fails checksum:
  - provide direct check-digit fix candidate (change pos12),
  - run full one-edit search for ambiguity disclosure (`MEDIUM` if multiple).
- If non-structural failure: `LOW` structural hints.

## GSTIN

- Primary strategy: direct Mod-36 check-char recovery.
- If first 14 chars structurally valid: compute pos15 exactly (`EXACT`).
- If non-last-char uncertainty: optional bounded one-edit search by per-position charset; typically multiple candidates (`MEDIUM`).
- Structural failure first (state code, PAN segment shape, 14th=`Z`) before checksum correction.

## PAN

- No checksum available in current validator.
- Use structural diagnostics + entity-code rule at position 4.
- Optional bounded suggestions:
  - case normalization,
  - replace invalid position with placeholder class (`A` or `0`) as hint only.
- Confidence mostly `LOW` (or `MEDIUM` if one deterministic normalization fix).

## TAN

- Same approach as PAN with TAN-specific structure (`AAAA99999A`).
- Position-wise hints; no exact typo recovery.

## IFSC

- Structural diagnostics (`[A-Z]{4}0[A-Z0-9]{6}`) + bank code whitelist.
- If bank code unknown, optionally suggest nearest bank code from in-repo `BANK_CODES` set (`MEDIUM` only if unique near match).
- Otherwise `LOW`.

## Pincode

- Structural checks (6 digits, first digit 1-9) + known region-prefix map.
- Suggest corrected formatting and first-two-digit region hint; do not guess full code without trusted directory.
- Confidence `LOW`.

## UAN

- Structural + allocated-range checks.
- Suggest normalization (remove spaces/hyphens), then range guidance.
- No checksum-based exact recovery in current implementation.

## Phone

- Use existing normalizer to suggest canonical `+91XXXXXXXXXX` when normalization is successful.
- If series invalid, hint allowed prefixes and known fake-pattern rejection.
- Confidence `MEDIUM` for normalization-only fixes; else `LOW`.

## UPI

- Normalize case and spacing, enforce single `@`, validate handle/provider rules.
- If provider unknown, suggest closest valid handle from whitelist only.
- Confidence `MEDIUM` when one clear provider replacement; else `LOW`.

## MSME (Udyam/UAM)

- Rule-guided diagnostics:
  - Udyam: `UDYAM-XX-00-0000000` with state/district/serial constraints.
  - UAM: `XX00A0000000` with state/district constraints.
- Suggest canonical normalized shape and first failing component.
- Confidence `LOW`.

## Voter ID

- Rule-guided diagnostics on `AAA9999999`, non-zero sequence.
- No checksum: structural hint only.

## Driving License

- Rule-guided diagnostics for pre/post-2021 formats, valid state+RTO ranges, plausible year.
- Suggest normalization (remove separators) and first failing segment.

## Passport

- Rule-guided diagnostics (`A1234567` pattern + allowed series + non-zero serial).
- No checksum in standalone number (MRZ check digit not part of field here), so structural hint only.

---

## Sources

1. UIDAI Data & Downloads (testing data, test UIDs, API error handling including Verhoeff requirement):
   https://www.uidai.gov.in/ml/913-common-category/11308-data-and-downloads-section.html
2. UIDAI Authentication API 2.5 Rev-1 (official Aadhaar auth technical specification):
   https://www.uidai.gov.in/images/resource/Aadhaar_Authentication_API-2.5_Revision-1_of_January_2022.pdf
3. Verhoeff original publication metadata:
   https://ir.cwi.nl/pub/13045
4. CBIC GST registration flier (GSTIN 15-digit structure and check-sum digit position):
   https://cbic-gst.gov.in/pdf/e-version-gst-fliers/regn-GST-onlineversion-07june2017.pdf
5. IRIS IRP validation rules (GSTN-powered e-invoice portal, GSTIN/state-code validation context):
   https://einvoice6.gst.gov.in/content/validation-rules/
6. Income Tax Department FAQ (official PAN structure):
   https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-
7. RBI NEFT FAQ (official IFSC structure definition):
   https://rbi.org.in/SCRIPTS/FAQView.aspx?Id=60
8. Wagner & Fischer bibliographic entry (edit distance DP complexity statement):
   https://cir.nii.ac.jp/crid/1370869855590862612
9. OWASP Logging Cheat Sheet (sensitive personal data should be excluded from logs):
   https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html

---

## Research Gap Note

Publicly indexed government documentation clearly confirms GSTIN structure and check-digit existence, but a directly indexed official public page with full step-by-step Mod-36 checksum math was not located in this run.  
For implementation decisions, checksum recovery logic is anchored to this repository's `src/utils/mod36.ts` and existing round-trip tests.

