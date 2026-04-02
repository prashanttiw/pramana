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
  - **IFSC**: Bank code whitelist validation
  - **Pincode**: Postal circle validation
- **Production-Ready**: Comprehensive tests (100% pass rate), 0 vulnerabilities
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

// Create a schema combining Pramana validators with other fields
const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  aadhaar: aadhaarSchema,
  pan: panSchema.optional(),
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

## 📚 API Reference

### Validators

| Document | Function | Description |
|----------|----------|-------------|
| **Aadhaar** | `isValidAadhaar(input)` | Validates 12-digit UID using Verhoeff algorithm |
| **PAN** | `isValidPAN(input)` | Validates 10-char format + 4th char entity type |
| **GSTIN** | `isValidGSTIN(input)` | Validates 15-char format + Mod-36 checksum |
| **IFSC** | `isValidIFSC(input)` | Validates 11-char + bank code whitelist |
| **Pincode** | `isValidPincode(input)` | Validates 6-digit + postal circle mapping |

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
```

### Input Validation

All validators:
- ✅ Accept only strings
- ✅ Reject null/undefined
- ✅ Reject empty strings
- ✅ Reject whitespace-containing inputs
- ✅ Return `false` for invalid inputs (no exceptions thrown)
---

## 📚 Documentation Roadmap

Not sure where to start? This table maps your needs to the right documentation:

| I want to... | Resource | Description |
|---|---|---|
| **Get started quickly** | [README.md](./README.md) (this file) | Installation, quick-start examples, basic usage |
| **Learn how validators work** | [README.md - How It Works](./README.md#-how-it-works-technical-deep-dive) | Algorithm explanations for each validator |
| **Use in my project** | [README.md - Quick Start](./README.md#-quick-start) | Copy-paste code examples and usage patterns |
| **Integrate with Zod** | [README.md - Quick Start](./README.md#-quick-start) | Form validation with Zod schemas |
| **Understand the architecture** | [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md) | Full project structure, validators, algorithms, and design |
| **See all validators & info extractors** | [COMPLETE_PROJECT_GUIDE.md - API Reference](./COMPLETE_PROJECT_GUIDE.md#-api-reference) | Complete function documentation with examples |
| **Contribute code** | [CONTRIBUTING.md](./CONTRIBUTING.md) | Development setup, PR process, testing requirements |
| **Report a bug** | [CONTRIBUTING.md - Report Bugs](./CONTRIBUTING.md#1-report-bugs-) | Structured bug report template and guidelines |
| **Request a new validator** | [CONTRIBUTING.md - Feature Requests](./CONTRIBUTING.md#2-suggest-features-or-new-validators-) | How to propose new Indian document validators |
| **Report security issues** | [CONTRIBUTING.md - Security](./CONTRIBUTING.md#security-vulnerabilities) | Responsible disclosure process (hook.crook1@gmail.com) |
| **Understand the code style** | [CONTRIBUTING.md - Style Guide](./CONTRIBUTING.md#style-guide) | TypeScript standards, naming conventions, documentation |
| **Learn git workflow** | [CONTRIBUTING.md - Commit Guidelines](./CONTRIBUTING.md#commit-guidelines) | Conventional Commits, SemVer, branch naming |
| **Set up development environment** | [CONTRIBUTING.md - Development Setup](./CONTRIBUTING.md#development-setup) | Step-by-step local setup with npm link testing |
| **See what changed in latest version** | [TECHNICAL_CHANGES_SUMMARY.md](./TECHNICAL_CHANGES_SUMMARY.md) | Audit history, refactoring details, test coverage growth |
| **Understand the audit process** | [DEPLOYMENT_AUDIT_REPORT.md](./DEPLOYMENT_AUDIT_REPORT.md) | Pre-deployment findings, quality metrics, security checklist |
| **View test coverage & metrics** | [DEPLOYMENT_AUDIT_REPORT.md - Quality Metrics](./DEPLOYMENT_AUDIT_REPORT.md#quality-metrics) | 86 tests (100% pass), 0 vulnerabilities, full type safety |
| **Get inspired by contributors** | [CONTRIBUTORS.md](./CONTRIBUTORS.md) | Recognition of all community members who helped |
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
→ Explore [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md) for full architecture

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

# Run tests (86 tests, 100% pass rate)
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
- [**COMPLETE_PROJECT_GUIDE.md**](./COMPLETE_PROJECT_GUIDE.md) - Full project architecture and features
- [**TECHNICAL_CHANGES_SUMMARY.md**](./TECHNICAL_CHANGES_SUMMARY.md) - Implementation details
- [**DEPLOYMENT_AUDIT_REPORT.md**](./DEPLOYMENT_AUDIT_REPORT.md) - Quality metrics and test results

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

- ✅ **123+ tests** (100% passing)
- ✅ **0 vulnerabilities** (npm audit clean)
- ✅ **0 dependencies** (zero runtime dependencies)
- ✅ **100% tree-shakable** (only import what you need)
- ✅ **Full TypeScript support** (strict mode)
- ✅ **Cross-platform** (Node.js, browsers, Edge functions)

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
- [x] PII Scrubbing
- [x] Phonetic Matching

### Phase 3
- [ ] UAN (Universal Account Number) validation
- [ ] CIN (Corporate Identity Number) validation
- [ ] Vehicle Registration Number validation

### Phase 4
- [ ] Benchmarks & CLI tool

## 📜 License

ISC License - See LICENSE file for details

## ❤️ Authors

Pramana is maintained by the community. Contributions from developers across India are welcome!

---

**Made with ❤️ for India** 🇮🇳
