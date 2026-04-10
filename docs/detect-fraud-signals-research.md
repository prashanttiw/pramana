# detectFraudSignals() Research Notes

Date: 2026-04-09  
Package: `@prashanttiw/pramana`  
Objective: detect identifiers that are structurally/checksum valid but likely synthetic, test, or placeholder values.

## 1) UIDAI test Aadhaar ranges

### Evidence
- UIDAI publishes official sandbox "Testing Data and License Keys" with explicit **test UIDs**:
  - `999941057058`
  - `999971658847`
  - `999933119405`
  - `999955183433`
  - `999990501894`
- All listed UIDAI test UIDs begin with prefix `9999`.
- UIDAI separately states Aadhaar is a **random 12-digit number** and that **not all 12-digit numbers are Aadhaar**.

### Research conclusion
- `9999xxxxxxxx` is a strong synthetic/test signal in UIDAI developer context.
- Public UIDAI docs reviewed here do **not** publish any additional "reserved test prefix" list beyond those documented test UIDs.
- Because UIDAI does not publicly guarantee permanent reservation semantics in the pages above, treat `9999` prefix as:
  - `HIGH` suspicion in production KYC
  - default action: `MANUAL_REVIEW` (or `REJECT` only when policy explicitly opts into strict sandbox/test blocking)

### Recommended rules
- `KNOWN_UIDAI_TEST_UID_EXACT_MATCH` (very high confidence): exact match against published test UID set.
- `UIDAI_TEST_PREFIX_9999` (high confidence): Aadhaar starts with `9999`.

## 2) Synthetic number patterns (general)

These apply to numeric identifiers after they already pass structure/checksum.

### Pattern taxonomy
- `SEQUENTIAL_ASCENDING`: e.g., `123456789012`
- `SEQUENTIAL_DESCENDING`: e.g., `987654321098`
- `ALL_SAME_DIGIT`: e.g., `999999999999`
- `REPEATED_BLOCK`: e.g., `123123123123` (small block repeated to fill full length)
- `ARITHMETIC_PROGRESSION`: e.g., `246810121416` (equal-size chunks increasing by constant step)
- `MIRROR_SYMMETRY`: e.g., `123456654321`
- `MAJORITY_SAME_DIGIT`: e.g., `999999990019` (one digit dominates positions)
- `ROUND_NUMBER_TRAILING_ZEROS`: e.g., `100000000000`, `120000000000`

### Detection guidance
- Use normalized candidate with only significant chars for that document type.
- Keep chunk-based checks bounded (`chunkSize` 1..4) to avoid expensive combinatorics.
- Assign stronger weight to deterministic generators (`ALL_SAME_DIGIT`, `SEQUENTIAL_*`, `REPEATED_BLOCK`) than to weak aesthetic patterns (`ROUND_NUMBER_TRAILING_ZEROS`).

## 3) Document-specific synthetic patterns

## PAN
- Candidate synthetic:
  - `AAAAA0000A`
  - repeated-char variants (`ZZZZZ9999Z`, etc.)
  - first 5 letters all same + 4 digits all same
- Why suspicious:
  - PAN format allows these combinations, so they pass structural checks.
  - Frequently used as placeholders in QA/test fixtures.
- Suggested signals:
  - `PAN_ALL_SAME_PREFIX_LETTERS`
  - `PAN_ALL_SAME_NUMERIC_BLOCK`
  - `PAN_COMMON_PLACEHOLDER_PATTERN`

## GSTIN
- Candidate synthetic:
  - `99AAAAA0000A1Z5`-style placeholders
  - PAN component (`positions 3-12`) matching known placeholder PAN patterns
- Important nuance:
  - State-code semantics are context-sensitive in GST systems; some workflows use special state/PIN conventions (for example, export handling in e-invoice validation flows references special codes and `999999` PIN handling).
  - Therefore, `99...` should be treated as **suspicious/test-like in many datasets**, but not a universal hard reject by itself.
- Suggested signals:
  - `GSTIN_PLACEHOLDER_PAN_COMPONENT`
  - `GSTIN_SUSPICIOUS_STATE_PREFIX_99`
  - `GSTIN_ROUND_OR_REPEATED_ENTITY_SEGMENTS`

## IFSC
- Candidate synthetic:
  - `SBIN0000000` (bank code valid, branch component all zeros)
- Important nuance:
  - RBI defines IFSC as 11 chars: 4-letter bank, 5th `0`, last 6 branch chars.
  - This does not imply all-zero branch suffix is universally impossible.
- Suggested signal:
  - `IFSC_ZERO_BRANCH_SUFFIX` as medium suspicion, not auto-reject.

## Pincode
- Candidate synthetic:
  - `110000`, `120000`, repeated/round values ending with many zeros.
- Important nuance:
  - India Post semantics: first 3 digits define sorting district; last 3 identify delivery post office.
  - If full master lookup is unavailable, round-values should be soft suspicion only.
  - In GST e-invoicing contexts, `999999` can be either invalid or required depending on transaction type, so context-aware logic is mandatory.
- Suggested signals:
  - `PINCODE_ROUND_TRAILING_ZEROS`
  - `PINCODE_CONTEXTUAL_999999`

## 4) Suspicion scoring methodology

## Design goals
- Output in `[0.0, 1.0]`.
- Multiple independent signals should compound.
- Avoid linear over-penalization from overlapping rules.

## Proposed formula
- For signal weights `w_i` in `[0,1]`:
  - `score = 1 - product(1 - w_i)`
- Advantages:
  - Bounded at `1.0`
  - Strong signals dominate quickly
  - Additional weak signals still increase risk

## Suggested base weights
- Exact known test identifier (e.g., published UIDAI test UID): `0.90`
- Strong synthetic generator pattern (all same, strict sequential, repeated block): `0.45`
- Medium synthetic pattern (mirror, arithmetic progression, dominant digit): `0.25`
- Weak pattern (round/trailing zeros): `0.15`
- Context-sensitive pattern (GST `99`, IFSC zero branch, PIN `999999`): `0.20` default, adjust by context

## Risk bands
- `LOW_RISK`: `score < 0.30`
- `MANUAL_REVIEW`: `0.30 <= score < 0.70`
- `REJECT`: `score >= 0.70`

## Policy override guardrails
- Allow `strictMode`:
  - if enabled, exact known test IDs can force `REJECT`.
- Allow `context`:
  - e.g., export e-invoice flow can reduce/neutralize `PINCODE_CONTEXTUAL_999999`.

## 5) False-positive risk strategy

## Key principle
- Hard reject only on high-confidence synthetic/test evidence.
- Keep ambiguous patterns in manual review unless corroborated by multiple signals.

## Recommended controls
- Maintain explicit allowlist/denylist config:
  - `knownTestIdentifiers` (denylist)
  - `knownGoodExceptionalPatterns` (allowlist)
- Add explainability output:
  - each triggered signal should include `id`, `weight`, `reason`, `evidence`.
- Prefer contextual risk:
  - same pattern may be benign in one workflow and high-risk in another.

## Example trade-off
- Aadhaar `9999` prefix:
  - Good fraud catch for sandbox/test leakage.
  - Potential false-positive risk if allocation policy evolves.
  - Recommended default: `MANUAL_REVIEW` unless exact known test UID match or strict policy.

## Proposed function contract (implementation-ready)

```ts
export type FraudRiskBand = 'LOW_RISK' | 'MANUAL_REVIEW' | 'REJECT';

export interface FraudSignal {
  id: string;
  weight: number; // 0..1
  reason: string;
  evidence?: string;
}

export interface FraudDetectionResult {
  score: number; // 0..1
  riskBand: FraudRiskBand;
  signals: FraudSignal[];
}
```

## Sources

1. UIDAI - Testing Data and License Keys (official test UIDs):
   https://www.uidai.gov.in/en/916-developer-section/data-and-downloads-section/11350-testing-data-and-license-keys.html
2. UIDAI - Aadhaar Myth Busters:
   https://www.uidai.gov.in/en/my-aadhaar/about-your-aadhaar/aadhaar-myth-busters.html
3. UIDAI/PIB press release (Aadhaar random; not all 12-digit numbers are Aadhaar):
   https://www.uidai.gov.in/images/Press_Release-15.pdf
4. CBIC GST registration explainer (GSTIN structure):
   https://cbic-gst.gov.in/pdf/e-version-gst-fliers/regn-GST-onlineversion-07june2017.pdf
5. Income Tax Department FAQ (PAN structure and status character):
   https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-
6. RBI NEFT FAQ (IFSC structure):
   https://rbi.org.in/SCRIPTS/FAQView.aspx?Id=60
7. RBI Master Direction - KYC (risk-based categorisation low/medium/high):
   https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10292
8. India Post official PIN directory repo (PIN structure semantics):
   https://github.com/IndiaPost/pin
9. GST IRP validation references (state/PIN context including special export handling rules):
   https://einvoice6.gst.gov.in/content/validation-rules/
   https://einvoice6.gst.gov.in/content/kb/troubleshooting-common-errors/
10. Stripe Identity docs (AI + heuristics + manual review, insights levels):
    https://docs.stripe.com/identity/verification-checks
    https://docs.stripe.com/identity/review-tools
    https://docs.stripe.com/identity/insights
11. Entrust (Onfido) Document report (clear/consider/suspected + manual analyst escalation):
    https://documentation.onfido.com/guide/document-report/
12. Sumsub docs (applicant scoring/manual review workflow controls):
    https://docs.sumsub.com/docs/configure-verification-levels


