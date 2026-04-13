# Pramana (प्रमाण)

Pramana is a **high-performance, zero-dependency, production-ready Data Integrity Suite** for Indian identity and financial documents. It validates not just the format but the actual **mathematical checksums** to ensure 100% accuracy.

Now upgraded to **Pramana 2.0**, it features a **Research & AI Suite** designed for NLP preprocessing, PII redaction, and fuzzy matching for Indic data.

> **Pramana** means "evidence" or "proof" in Sanskrit—because validation should be based on actual algorithms, not just pattern matching.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Size](https://img.shields.io/badge/size-tree--shakable-blue)
![License](https://img.shields.io/badge/license-ISC-blue)

---

## 🚀 Features

- **Indic Research & AI Suite** (New in v2.0):
  - **Text Normalization**: Unicode normalization (NFC) for Devanagari and Indic scripts.
  - **Privacy Guard**: DPDP-compliant redaction of Aadhaar, PAN, and GSTIN.
  - **Phonetic Matching**: Soundex-like fuzzy matching tuned for Indian names (e.g., "Aditya" vs "Adithya").
  - **Address Parsing**: Extract Pincode, State, and Landmarks from messy addresses.

- **Zero Dependencies**: No external runtime dependencies. Pure TypeScript/JavaScript.
- **Algorithm-Based Validation**: Not just regex patterns—implements actual mathematical verification.
  - **Aadhaar**: Verhoeff algorithm (detects all single-digit errors)
  - **GSTIN**: Mod-36 checksum algorithm
  - **PAN**: Structural validation + entity type verification
  - **TAN**: Structural validation (`AAAA99999A`)
  - **IFSC**: Bank code whitelist validation
  - **Pincode**: Postal circle validation
- **Production-Ready**: Comprehensive tests (729+ passing), 0 vulnerabilities
- **Modular & Tree-Shakable**: Import only what you need
- **TypeScript Support**: Full type definitions included
- **Zod Integration**: Optional pre-built Zod schemas available

## 📦 Installation

```bash
npm install @prashanttiw/pramana
```

### Optional: Zod Support

If you want to use Zod schemas for form validation:

```bash
npm install zod
```

Zod is an optional peer dependency—use it only if you need schema validation.

## 💻 Quick Start

### Basic Validation

```typescript
import { 
  isValidAadhaar, 
  isValidPAN, 
  isValidTAN,
  isValidGSTIN,
  isValidIFSC,
  isValidPincode 
} from '@prashanttiw/pramana';

// Aadhaar (12 digits with Verhoeff checksum)
isValidAadhaar('999999990019');  // true
isValidAadhaar('12345678901');   // false (invalid checksum)

// PAN (10 chars: structure + entity type validation)
isValidPAN('ABCPE1234F');        // true (P = Person)
isValidPAN('ABCCD1234F');        // true (C = Company)
isValidPAN('ABC1234567');        // false (invalid structure)

// TAN (10 chars: AAAA99999A, structural validation)
isValidTAN('DELA12345B');        // true
isValidTAN('dela12345b');        // true (normalized to uppercase)
isValidTAN('ABCD-12345-E');      // false (invalid structure)

// GSTIN (15 chars with Mod-36 checksum)
isValidGSTIN('29ABCDE1234F1Z5'); // true
isValidGSTIN('29ABCDE1234F1Z0'); // false (invalid checksum)

// IFSC (11 chars with valid bank code)
isValidIFSC('SBIN0012345');      // true
isValidIFSC('XXXX0012345');      // false (invalid bank code)

// Pincode (6 digits with valid postal circle)
isValidPincode('110001');        // true (Delhi)
isValidPincode('990000');        // false (invalid postal circle)
```

### 🧠 Research & AI Suite (New)

Pre-process data for training LLMs or cleaning datasets.

```typescript
import { 
  normalizeIndic, 
  phoneticMatch, 
  parseAddress, 
  scrubPII 
} from '@prashanttiw/pramana/core';

// 1. Text Normalization (Unicode + ZWNJ removal)
const text = "नमस्ते\u200C दुनिया"; 
console.log(normalizeIndic(text)); // "नमस्ते दुनिया"

// 2. Phonetic Matching (Indian Context)
// Handles 'sh'/'s', 'v'/'b' confusion
const score = phoneticMatch('Vikram', 'Bikram');
console.log(score); // > 0.9 (Match!)

// 3. Privacy Guard (DPDP Compliance)
// Scrubs valid Aadhaar/PAN/GSTIN from text
const raw = "My ID is 999999990019";
console.log(scrubPII(raw)); // "My ID is [AADHAAR_MASKED]"

// 4. Address Parsing
const addr = parseAddress("Office 101, Near City Mall, Bangalore 560001");
console.log(addr);
// { 
//   pincode: '560001', 
//   state: 'Karnataka', 
//   city: 'Bangalore', 
//   landmarks: ['Near City Mall'] 
// }
```

### Get Information

Some validators can extract additional information:

```typescript
import { 
  getGSTINInfo,
  getPANInfo,
  getPincodeInfo 
} from '@prashanttiw/pramana/validators';

// Extract state from GSTIN
const gstin = getGSTINInfo('29ABCDE1234F1Z5');
console.log(gstin.state);  // "Karnataka"

// Extract entity type from PAN
const pan = getPANInfo('ABCPE1234F');
console.log(pan.category); // "Person"

// Extract region from Pincode
const pincode = getPincodeInfo('110001');
console.log(pincode.region); // "Delhi"
```

### With Zod (Form Validation)

```typescript
import { z } from 'zod';
import { aadhaarSchema, panSchema, gstinSchema } from '@prashanttiw/pramana/zod';
// TAN/UAN only:
import { tanSchema, uanSchema } from '@prashanttiw/pramana/zod';

// Create a schema combining Pramana validators with other fields
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  aadhaar: aadhaarSchema,
  pan: panSchema.optional(),
  tan: tanSchema.optional(),
  uan: uanSchema.optional(),
  gstin: gstinSchema.optional()
});

// Use it in your form
try {
  const result = UserSchema.parse({
    name: 'Aditya',
    email: 'aditya@example.com',
    aadhaar: '999999990019'
  });
  console.log('Valid user:', result);
} catch (error) {
  console.error('Validation errors:', error.errors);
}
```

## CLI

Pramana includes a full-featured CLI for terminal-based document validation.

```bash
# One-off validation (no install required)
npx @prashanttiw/pramana validate aadhaar 999999990019

# Or install globally
npm install -g @prashanttiw/pramana
pramana validate gstin 29ABCDE1234F1Z5
```

### Commands

#### `validate` - Single document
```bash
pramana validate <type> <value>

# Examples
pramana validate aadhaar 999999990019
pramana validate pan ABCPE1234F
pramana validate gstin 29ABCDE1234F1Z5 --json    # JSON output for piping
pramana validate aadhaar 999999990018            # shows correction suggestion
```

#### `check-kyc` - Interactive KYC bundle
```bash
pramana check-kyc
# Interactive multi-select: choose documents, enter values,
# get full KYC report with cross-consistency checks
```

#### `batch` - Bulk file validation
```bash
pramana batch --file records.csv --type aadhaar
pramana batch --file kyc.json --type pan --column pan_number
```

#### `info` - Algorithm reference
```bash
pramana info aadhaar          # shows Verhoeff algorithm details
pramana info gstin            # shows Mod-36 explanation
pramana info --list           # all supported document types
```

> 💡 *Screenshot: `pramana check-kyc` interactive mode*  
> [screenshot placeholder - add after first demo run]

### Record CLI Demo (asciinema)

After building, record a real terminal session and embed it as a GIF in this README for maximum visual impact.

```bash
# 1) Build
npm run build

# 2) Record
asciinema rec pramana-cli.cast
# Run your best demo flow here:
# pramana validate aadhaar 999999990019
# pramana check-kyc
# pramana info --list
# Press Ctrl+D to stop recording

# 3) Convert cast to GIF (using agg)
agg pramana-cli.cast pramana-cli.gif
```

Then commit `pramana-cli.gif` (or hosted media link) and place it below the CLI section.

## Integrations

Pramana provides optional adapters for popular frameworks and validation
libraries. Each is a separate subpath - install only what you use.

### Express middleware

```bash
npm install express @prashanttiw/pramana
```

```typescript
import { pramanaMiddleware } from '@prashanttiw/pramana/express'

app.post('/api/kyc',
  pramanaMiddleware([
    { field: 'aadhaar', type: 'aadhaar' },
    { field: 'pan', type: 'pan' },
    { field: 'gstin', type: 'gstin', optional: true },
  ]),
  (req, res) => res.json({ success: true })
)
// Returns 422 with structured errors if validation fails
```

### Yup

```bash
npm install yup @prashanttiw/pramana
```

```typescript
import * as yup from 'yup'
import { setupPramanaYup } from '@prashanttiw/pramana/yup'
setupPramanaYup()

const schema = yup.object({
  aadhaar: yup.string().required().aadhaar(),
  pan: yup.string().required().pan(),
})
```

### Valibot

```bash
npm install valibot @prashanttiw/pramana
```

```typescript
import * as v from 'valibot'
import { aadhaar, pan } from '@prashanttiw/pramana/valibot'

const schema = v.object({
  aadhaarNumber: v.pipe(v.string(), aadhaar()),
  panNumber: v.pipe(v.string(), pan()),
})
```

### React hook

```bash
npm install react @prashanttiw/pramana
```

```typescript
import { useValidator } from '@prashanttiw/pramana/react'

function AadhaarInput() {
  const { isValid, error, inputProps } = useValidator('aadhaar')
  return (
    <div>
      <input {...inputProps} placeholder="Aadhaar number" />
      {error && <span>{error}</span>}
    </div>
  )
}
```

### React Hook Form

```bash
npm install react-hook-form @prashanttiw/pramana
```

```typescript
import { useForm } from 'react-hook-form'
import { pramanaResolver } from '@prashanttiw/pramana/rhf'

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: pramanaResolver({ aadhaar: 'aadhaar', pan: 'pan' })
})
```

## 📚 API Reference

### Validators

| Document | Function | Description |
|----------|----------|-------------|
| **Aadhaar** | `isValidAadhaar(input)` | Validates 12-digit UID using Verhoeff algorithm |
| **Driving License** | `isValidDrivingLicense(input)` | Validates Indian DL - state code + RTO code + serial. Handles both pre-2021 and post-2021 standardised formats |
| **GSTIN** | `isValidGSTIN(input)` | Validates 15-char format + Mod-36 checksum |
| **IFSC** | `isValidIFSC(input)` | Validates 11-char + bank code whitelist |
| **PAN** | `isValidPAN(input)` | Validates 10-char format + 4th char entity type |
| **Passport** | `isValidPassport(input)` | Validates Indian passport number - 8-char format (1 letter + 7 digits) with active series verification |
| **Pincode** | `isValidPincode(input)` | Validates 6-digit + postal circle mapping |
| **TAN** | `isValidTAN(input)` | Validates 10-character Tax Deduction Account Number - city/AO code + sequence + suffix |
| **UAN** | `isValidUAN(input)` | Validates 12-digit EPFO Universal Account Number with allocated range verification |
| **Indian Phone** | `isValidIndianPhone(input)` | Validates Indian mobile numbers with TRAI series allocation check — not just regex |
| **MSME / Udyam** | `isValidMSME(input)` | Validates Udyam registration format: UDYAM-XX-00-0000000 with state/district codes |
| **UPI ID** | `isValidUPI(input)` | Validates Virtual Payment Address against full NPCI PSP handle whitelist |
| **Voter ID** | `isValidVoterID(input)` | Validates EPIC card number - 3-char ECI state prefix + 7-digit sequence |

### Research Suite (Core)

| Feature | Function | Description |
|---|---|---|
| **Normalization** | `normalizeIndic(text)` | Unicode NFC + ZWNJ removal for Indic scripts |
| **Phonetics** | `phoneticMatch(s1, s2)` | Fuzzy matching optimized for Indian names |
| **Privacy** | `scrubPII(text, opts)` | Redacts Aadhaar/PAN but preserves other numbers |
| **Address** | `parseAddress(str)` | Extracts components from unstructured addresses |
| **Deep Verify** | `deepVerify(id, type)` | Checksum verification for VoterID, RC, UDID |

### Info Extractors

```typescript
// Extract metadata from documents
getGSTINInfo(gstin)    // { state: string }
getPANInfo(pan)        // { category: string }
getPincodeInfo(pincode)// { region: string }
getTANInfo(tan)        // { cityCode, sequenceNumber, lastChar, deductorType }
getUANInfo(uan)        // { isAllocated, rangeNote }
getDrivingLicenseInfo(dl)  // { stateName, rtoCode, format, yearHint }
getPassportInfo(passport)  // { series, seriesType, sequenceNumber }
getVoterIDInfo(voterId)    // { stateName, sequenceNumber }
getUPIInfo(upi)            // { handle, provider, bank, type }
getPhoneInfo(phone)        // { normalized, withCountryCode, series }
getMSMEInfo(msme)          // { format, stateName, districtCode, serialNumber }
```

### Input Validation

All validators:
- ✅ Accept only strings
- ✅ Reject null/undefined
- ✅ Reject empty strings
- ✅ Reject whitespace-containing inputs
- ✅ Return `false` for invalid inputs (no exceptions thrown)
---

## Intelligence layer

Pramana goes beyond format validation. The intelligence layer detects
synthetically generated numbers, recovers from single-digit typos, and
validates entire KYC document sets for cross-document consistency.

### `detectFraudSignals(documentType, input)`

Detects mathematically valid but synthetically generated document numbers.
Returns a suspicion score (`0.0-1.0`), risk level, and named signal types.

```typescript
import { detectFraudSignals } from '@prashanttiw/pramana';

const fraud = detectFraudSignals('aadhaar', '999999990019');

console.log(fraud.suspicionScore); // 1
console.log(fraud.risk); // 'CRITICAL' (high-severity; current policy can classify as HIGH/CRITICAL)
console.log(fraud.signals.map((s) => s.type));
// ['known_test_range', 'majority_same_digit']
```

### `suggestCorrection(documentType, input)`

When a document number fails validation, Pramana attempts algorithmic recovery:
- Aadhaar: iterates Verhoeff checksum candidates for single-digit typos
- GSTIN: directly calculates the correct check digit via inverse Mod-36
- Other documents: returns a structural hint pointing to the first failing rule

```typescript
import { suggestCorrection } from '@prashanttiw/pramana';

const correction = suggestCorrection('aadhaar', '999999990018');

console.log(correction.isAlreadyValid); // false
console.log(correction.primarySuggestion); // '999999990019'
console.log(correction.confidence); // 'MEDIUM'
```

### `validateKYCBundle(input)`

Validates a complete set of Indian identity documents in one call.
Performs individual validation, cross-document consistency checks
(GSTIN/PAN entity matching, state consistency), fraud signal detection,
and returns a unified KYC score (`0-100`) with pass/fail/manual-review verdict.

```typescript
import { validateKYCBundle } from '@prashanttiw/pramana';

const report = validateKYCBundle({
  aadhaar: '284739105826',
  pan: 'AAPFR5055K',
  gstin: '27AAPFR5055K1ZM',
  drivingLicense: 'MH0120110169971',
  phone: '9128047356',
});

console.log(report.overallResult); // 'PASS' | 'MANUAL_REVIEW' | 'FAIL'
console.log(report.kycScore); // e.g., 90
console.log(report.crossChecks);
console.log(report.summary);
```

## 📚 Documentation Roadmap

Not sure where to start? This table maps your needs to the right documentation. Extended docs are consolidated in HANDBOOK.md:

| I want to... | Resource | Description |
|---|---|---|
| **Get started quickly** | [README.md](./README.md) (this file) | Installation, quick-start examples, basic usage |
| **Learn how validators work** | [README.md - How It Works](./README.md#-how-it-works-technical-deep-dive) | Algorithm explanations for each validator |
| **Use in my project** | [README.md - Quick Start](./README.md#-quick-start) | Copy-paste code examples and usage patterns |
| **Integrate with Zod** | [README.md - Quick Start](./README.md#-quick-start) | Form validation with Zod schemas |
| **Understand the architecture** | [HANDBOOK.md](./HANDBOOK.md) | Full project structure, validators, algorithms, and design |
| **See all validators & info extractors** | [HANDBOOK.md - API Reference](./HANDBOOK.md#-api-reference) | Complete function documentation with examples |
| **Contribute code** | [CONTRIBUTING.md](./CONTRIBUTING.md) | Development setup, PR process, testing requirements |
| **Report a bug** | [CONTRIBUTING.md - Report Bugs](./CONTRIBUTING.md#1-report-bugs-) | Structured bug report template and guidelines |
| **Request a new validator** | [CONTRIBUTING.md - Feature Requests](./CONTRIBUTING.md#2-suggest-features-or-new-validators-) | How to propose new Indian document validators |
| **Report security issues** | [CONTRIBUTING.md - Security](./CONTRIBUTING.md#security-vulnerabilities) | Responsible disclosure process (hook.crook1@gmail.com) |
| **Understand the code style** | [CONTRIBUTING.md - Style Guide](./CONTRIBUTING.md#style-guide) | TypeScript standards, naming conventions, documentation |
| **Learn git workflow** | [CONTRIBUTING.md - Commit Guidelines](./CONTRIBUTING.md#commit-guidelines) | Conventional Commits, SemVer, branch naming |
| **Set up development environment** | [CONTRIBUTING.md - Development Setup](./CONTRIBUTING.md#development-setup) | Step-by-step local setup with npm link testing |
| **See what changed in latest version** | [HANDBOOK.md](./HANDBOOK.md) | Audit history, refactoring details, test coverage growth |
| **Understand the audit process** | [HANDBOOK.md](./HANDBOOK.md) | Pre-deployment findings, quality metrics, security checklist |
| **View test coverage & metrics** | [HANDBOOK.md - Quality Metrics](./HANDBOOK.md#quality-metrics) | 729+ tests (100% pass), 0 vulnerabilities, full type safety |
| **Get inspired by contributors** | [HANDBOOK.md](./HANDBOOK.md) | Recognition of all community members who helped |
| **Join the community** | [CONTRIBUTING.md - Community](./CONTRIBUTING.md#community) | Discord, GitHub Discussions, Twitter, and more |
| **Troubleshoot issues** | [CONTRIBUTING.md - Troubleshooting](./CONTRIBUTING.md#troubleshooting-guide) | Common problems and their solutions |
| **Learn about validators in detail** | [CONTRIBUTING.md - Learning Resources](./CONTRIBUTING.md#learning-resources) | References to algorithms, government specs, and tutorials |

### Quick Navigation by Role

**👤 User/Developer**
→ Start with [README.md](./README.md) and [Quick Start](./README.md#-quick-start)

**🔧 Contributor**
→ Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [Development Setup](./CONTRIBUTING.md#development-setup)

**📋 Bug Reporter**
→ Check [CONTRIBUTING.md - Report Bugs](./CONTRIBUTING.md#1-report-bugs-) and use [bug_report.md template](./.github/ISSUE_TEMPLATE/bug_report.md)

**✨ Feature Proposer**
→ See [CONTRIBUTING.md - Feature Requests](./CONTRIBUTING.md#2-suggest-features-or-new-validators-) and [feature_request.md template](./.github/ISSUE_TEMPLATE/feature_request.md)

**🏗️ Architect/Deep Diver**
→ Explore [HANDBOOK.md](./HANDBOOK.md) for full architecture

**🔐 Security Researcher**
→ Read [CONTRIBUTING.md - Security](./CONTRIBUTING.md#security-vulnerabilities) for responsible disclosure

---

## 🤝 Can't Find What You Need?

If you can't find the answer in our documentation:

1. **Check [GitHub Discussions](https://github.com/prashanttiw/pramana/discussions)** - Ask your question or start a conversation with the community
2. **Review [Troubleshooting Guide](./CONTRIBUTING.md#troubleshooting-guide)** - Common issues and solutions
3. **Search [GitHub Issues](https://github.com/prashanttiw/pramana/issues)** - Your question might have been answered already
4. **Report a [Bug](./CONTRIBUTING.md#1-report-bugs-) or [Request a Feature](./CONTRIBUTING.md#2-suggest-features-or-new-validators-)** - We're here to help!

We're committed to making Pramana accessible to everyone. Don't hesitate to reach out! 💬

---
##  How It Works (Technical Deep Dive)

Unlike naive libraries that just use regex patterns, Pramana implements actual mathematical algorithms:

### Aadhaar Validation
- **Algorithm**: Verhoeff Checksum
- **What it does**: The last digit of an Aadhaar is a check digit. The Verhoeff algorithm can detect:
  - All single-digit errors
  - All transposition errors (e.g., `123` ↔ `132`)
- **Why it matters**: A fake number like `123456789012` might look valid but fails the checksum
- **Reference**: [Verhoeff Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Verhoeff_algorithm)

### PAN Validation
- **Algorithm**: Structural + Entity Type Validation
- **Format**: `AABCP9999A` where:
  - 1-5: Letters (PAN holder surname or first two letters of name)
  - 6-8: Digits (birth year of individual or registration year)
  - 9: Entity type (P=Person, C=Company, H=HUF, F=Firm, etc.)
  - 10: Check digit (letter)
- **What we validate**: Format structure + valid entity type in 9th position

### TAN Validation
- **Algorithm**: Structural + positional character validation
- **Format**: `AAAA99999A` — 4-char city/AO code, 5-digit sequence, 1-char suffix
- **What we validate**: Length, character types per position, valid TAN-specific character at position 4 (differs from PAN entity code)
- **Why it matters**: Distinguishes TAN from PAN at the structural level — a common developer mistake is treating them as interchangeable

### UAN Validation
- **Algorithm**: Numeric range validation + synthetic pattern detection
- **Format**: 12-digit purely numeric identifier
- **What we validate**: Length, numeric purity, EPFO-allocated range, rejection of known synthetic patterns (all-zeros, all-same-digit)
- **Why it matters**: UAN is lifetime-unique per employee — a fake or malformed UAN will silently fail EPFO API calls in payroll integrations

### GSTIN Validation
- **Algorithm**: Mod-36 Checksum
- **What it does**: The 15th character is a check digit calculated from the first 14 characters
- **Formula**: Character at position 15 = mod(36 - (sum of weighted values), 36)
- **Why it matters**: Prevents typos and ensures authenticity
- **Reference**: [GST India Official](https://tutorial.gst.gov.in/)

### IFSC Validation
- **Algorithm**: Bank Code Whitelist
- **What it does**: Validates against a curated list of major Indian bank codes
- **Why it matters**: Catches typos (e.g., `SBII` instead of `SBIN`)
- **Coverage**: 100+ major bank codes

### Pincode Validation
- **Algorithm**: Postal Circle Mapping
- **What it does**: Validates first 2 digits against real postal circles
- **Example**: `11****` = Delhi, `40****` = Maharashtra
- **Why it matters**: Prevents invalid geographic codes like `99****`

### Voter ID Validation
- **Algorithm**: Format validation + ECI state prefix whitelist
- **Format**: 3 alpha (state code) + 7 digits (sequence)
- **What we validate**: Exact format, valid ECI-assigned state prefix
- **Why it matters**: First Indian library to validate against actual ECI prefix list

### Driving License Validation
- **Algorithm**: Format validation + state code whitelist + RTO range check
- **Formats supported**: Pre-2021 regional format AND post-2021 MoRTH standard
- **What we validate**: State code, RTO code validity, length per format era
- **Why it matters**: Handles both legacy and standardised DLs - critical for
  background-check and mobility apps that see both formats in the wild

### Passport Validation
- **Algorithm**: Active series whitelist + format structure validation
- **Format**: 1 series letter + 7 sequential digits
- **What we validate**: Valid Indian passport series (not all 26 letters are issued),
  digit-only portion, structural integrity
- **Why it matters**: Rejects syntactically valid but never-issued series letters

### UPI ID Validation
- **Algorithm**: Format validation + NPCI PSP handle whitelist
- **What we validate**: VPA format (`handle@provider`), valid provider from NPCI-registered PSP list, handle character rules (no consecutive special chars)
- **Why it matters**: Validates against real PSP handles, not just `@` presence. Catches fake handles that pass simple regex.

### Indian Phone Validation
- **Algorithm**: TRAI series allocation validation
- **What we validate**: 10-digit format, TRAI-allocated series (`6-9`), sub-range check for 6-series (not fully allocated), known synthetic patterns
- **Why it matters**: Standard regex only checks 10 digits starting with 6-9. Pramana validates against actual TRAI allocation — catches real invalid numbers that pass naive regex.

### MSME / Udyam Validation
- **Algorithm**: Structural segment validation + state code whitelist
- **Format**: `UDYAM-XX-00-0000000`
- **What we validate**: Fixed prefix, state code, district range (`01-99`), 7-digit serial not all-zeros
- **Why it matters**: Every B2B fintech and MSME lending platform needs this. No other npm library validates Udyam numbers.

---

## 🛠️ Development

### Project Structure
```
src/
├── validators/      # Business logic (Aadhaar, PAN, GSTIN, etc.)
├── core/            # Research Suite (Normalization, PII, Phonetics)
├── utils/           # Core algorithms (Verhoeff, Mod-36, Checksum)
├── data/            # Reference data (Bank codes, Postal circles, GST states)
├── zod/             # Zod schema integration (optional)
└── index.ts         # Main entry point
```

### Build & Test

```bash
# Install dependencies
npm install

# Run tests (729+ tests, 100% pass rate)
npm test

# Build for production (CJS + ESM)
npm run build

# Type check
npm run lint
```

### Build Output

```
dist/
├── index.js         # CommonJS build
├── index.mjs        # ES Module build
├── index.d.ts       # TypeScript declarations
├── core/            # Research Suite build
└── zod/             # Zod integration build
```

##  Documentation

For more information, see:
- [**HANDBOOK.md**](./HANDBOOK.md) - Full project architecture, API details, context, and audit history

## ❓ FAQ

**Q: What if validation fails?**  
A: Validators return `false` for invalid input. No exceptions thrown. It's safe to use without try-catch.

```typescript
const result = isValidAadhaar(userInput);
if (!result) {
  // Show error message to user
}
```

**Q: How do I use this with React?**  
A: Combine with Zod for real-time validation:

```typescript
import { aadhaarSchema } from '@prashanttiw/pramana/zod';

// In your form handler
const validationResult = aadhaarSchema.safeParse(userInput);
if (!validationResult.success) {
  setError(validationResult.error.message);
}
```

**Q: Can I validate partially?**  
A: No. All validators require complete, valid input. This ensures accuracy.

**Q: What about performance?**  
A: All validations are O(n) where n is input length. No external API calls. Validation completes in <1ms.

**Q: Do you store data?**  
A: No. Pramana is client-side only. No data is sent anywhere.

**Q: Are test documents (999999990019) always valid?**  
A: No. Test documents are valid IDs that pass all checks but are reserved for testing purposes. Don't use them in production.

## 🤝 Contributing

Contributions welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Submit a pull request

**Development Guidelines:**
- All code must be TypeScript
- Tests must cover 100% of new code
- Follow existing code style
- Update README if adding new validators

## 📊 Quality Metrics

- **729+ total tests** (100% passing)
- ✅ **0 vulnerabilities** (npm audit clean)
- ✅ **0 dependencies** (zero runtime dependencies)
- ✅ **100% tree-shakable** (only import what you need)
- **6 framework integrations**: Zod, Yup, Valibot, Express, React, React Hook Form
- ✅ **Full TypeScript support** (strict mode)
- ✅ **Cross-platform** (Node.js, browsers, Edge functions)
- **Intelligence layer milestone**: "Intelligence layer features are the first implementation of algorithmic fraud detection and checksum recovery in an Indian npm library"

## ⚡ Performance Benchmarks

All performance metrics measured on Node.js 18+ with V8:

| Function | Complexity | Typical Latency | Memory |
|---|---|---|---|
| `isValidAadhaar` | O(n) | < 0.1ms | Constant |
| `isValidPAN` | O(1) | < 0.1ms | Constant |
| `phoneticMatch` | O(m×n) time, O(min(m,n)) space | < 0.5ms | ~200 bytes |
| `scrubPII` | O(n) | < 1ms per KB | Linear |
| `parseAddress` | O(n × states) | < 2ms | Linear |

**Batch Processing**: Tested with 10,000 records without memory leaks.

## 🔐 Security Guarantees

Pramana implements defense-in-depth for PII handling:

1. **Checksum Verification**: Aadhaar uses Verhoeff algorithm (catches 100% of single-digit errors and all transpositions). GSTIN uses Mod-36.

2. **Obfuscation Resistance**: `scrubPII` strips invisible Unicode characters (ZWNJ, ZWJ, Zero-Width Space) before pattern matching, preventing attackers from hiding PII with invisible characters.

3. **No False Positives**: Random 12-digit numbers that don't pass Verhoeff are preserved, preventing over-redaction.

4. **DPDP Act Compliance**: Designed for India's Digital Personal Data Protection Act requirements.


## 🔮 Roadmap

### Phase 2 (Completed)
- [x] Research & AI Suite
- [x] Voter ID (EPIC) verification
- [x] Driving License (DL) validation
- [x] Passport validation
- [x] PII Scrubbing
- [x] Phonetic Matching
- [x] TAN (Tax Deduction and Collection Account Number) validation
- [x] UAN (Universal Account Number) validation

### Phase 3 (Completed - Batch 03)
- [x] UPI ID validation with NPCI PSP handle whitelist
- [x] Indian phone validation with TRAI series-aware rules
- [x] MSME / Udyam registration validation

### Phase 4
- [ ] CIN (Corporate Identity Number) validation
- [ ] Vehicle Registration Number validation

### Phase 5
- [ ] Benchmarks & CLI tool

## 📜 License

ISC License - See LICENSE file for details

## ❤️ Authors

Pramana is maintained by the community. Contributions from developers across The World are welcome!

---

**Made with ❤️ for India** 🇮🇳




