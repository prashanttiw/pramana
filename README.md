# Pramana (प्रमाण)

**Pramana** is a high-performance, zero-dependency, algorithmic validation library designed specifically for the Indian context. Unlike libraries that rely solely on Regex, Pramana implements the actual mathematical checksums and logic verification for IDs to ensure 100% accuracy.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Size](https://img.shields.io/badge/size-tree--shakable-blue)

## 🚀 Features

- **Zero Dependencies**: Pure TypeScript/JavaScript with no runtime bloat.
- **Algorithmic Verification**:
  - **Aadhaar**: Implements **Verhoeff** algorithm (not just Regex).
  - **GSTIN**: Implements **Mod-36** Checksum algorithm.
  - **PAN**: Validates Entity Type (4th Character).
- **Knowledge-Lite Layer**:
  - **IFSC**: Offline validation of major Bank Codes (whitelist).
  - **Pincode**: Offline validation of Postal Circles (first 2 digits).
- **Modular**: Tree-shakable. Import only what you need.

## 📦 Installation
(Coming soon to npm)
```bash
npm install pramana
```

## 💻 Usage

```typescript
import { isValidAadhaar, isValidPAN, isValidGSTIN } from 'pramana';

// Aadhaar Validation (Verhoeff Checksum)
console.log(isValidAadhaar('999999990019')); // true

// PAN Validation (Structure + Entity Type)
console.log(isValidPAN('ABCPE1234F')); // true (P = Person)

// GSTIN Validation (Mod-36 Checksum)
console.log(isValidGSTIN('29ABCDE1234F1Z5')); // true
```

## 🧠 Deep Dive: Validation Logic

Pramana goes beyond simple pattern matching. Here is how we validate each ID:

### 1. Aadhaar (UIDAI)
- **Logic**: **Verhoeff Algorithm**.
- **Why**: Aadhaar numbers are not random; they end with a checksum digit calculated using the Verhoeff algorithm, which detects all single-digit errors and illegal adjacent transpositions.
- **Source**: [Verhoeff Algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Verhoeff_algorithm).

### 2. PAN (Permanent Account Number)
- **Logic**: **Regex + Structural Logic**.
- **Details**:
  - Structure: `[A-Z]{5}[0-9]{4}[A-Z]{1}`
  - **Entity Validation**: The 4th character represents the status.
    - `P`: Person
    - `C`: Company
    - `H`: HUF
    - `F`: Firm
    - `A`: AOP
    - `T`: Trust
    - `B`: BOI
    - `L`: Local Authority
    - `J`: Artificial Juridical Person
    - `G`: Government

### 3. GSTIN (Goods and Services Tax ID)
- **Logic**: **Mod-36 Checksum**.
- **Details**: 
  - The 15th character is a check digit derived from the previous 14 characters using a Modulo-36 algorithm.
  - State Code (First 2 digits) must match valid census codes (checked via Regex structure mostly).
- **Source**: [GST API Standards](https://tutorial.gst.gov.in/).

### 4. IFSC (Indian Financial System Code)
- **Logic**: **Knowledge-Lite Whitelist**.
- **Details**: 
  - Instead of just checking `^[A-Z]{4}`, we check if the first 4 characters belong to a known list of valid Bank Codes (e.g., `SBIN`, `HDFC`, `ICIC`).
  - This prevents users from entering typos like `SBII` which might pass a generic regex.

### 5. Pincode (Postal Index Number)
- **Logic**: **Postal Circle Mapping**.
- **Details**: 
  - Validates that the first 2 digits correspond to a real Postal Circle (e.g., `11` for Delhi, `40` for Maharashtra).
  - Prevents inputs like `990000` which are structurally valid but geographically impossible (99 is restricted/APS).

## 🛠️ Development

### Project Structure
```
src/
├── data/           # Compressed datasets (Bank Codes, Pincode Regions)
├── utils/          # Mathematical Algorithms (Verhoeff, Mod36)
├── validators/     # Business Logic (Aadhaar, PAN, etc.)
└── index.ts        # Entry point
```

### Commands
- **Build**: `npm run build` (Generates CJS/ESM via `tsup`)
- **Test**: `npm run test` (Runs `vitest`)
- **Lint**: `npm run lint`

## 🔮 Future Roadmap

To make Pramana the definitive validation suite for India, the following features are planned:

### 1. Metadata Extraction
Instead of just returning `true/false`, validators will optionally return metadata:
- **GSTIN**: Extract State Name (`29` -> `Karnataka`) and Entity Type.
- **PAN**: Extract Card Holder Category (`P` -> `Individual`, `C` -> `Company`).
- **Pincode**: Return District/Circle name.

### 2. Expanded ID Support
- **EPIC (Voter ID)**: Validation logic.
- **Driving License**: State-wise logic verification.
- **UAN (Universal Account Number)**: Luhn algorithm verification.
- **CIN (Corporate Identity Number)**: Validate Company Type, Year, and State.

### 3. Framework Integrations
- **Zod / Yup Schemas**: Plug-and-play wrappers for modern form validation.
- **React Hooks**: `usePramana` for real-time form feedback.

## 📜 License
ISC

---
*Built with ❤️ by Pramana Team*
