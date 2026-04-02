# Pramana API Reference

This document provides detailed technical documentation for the Pramana library, including the **Research & AI Suite** (v2.0) with **Big O complexity** for each function.

---

## 🔬 Research & AI Suite (`@prashanttiw/pramana/core`)

Functions designed for Pre-processing, NLP, and Data Cleaning of Indian context data.

---

### `normalizeIndic(text: string): string`

Normalizes Indic script text to a standard canonical form.

| Property | Value |
|---|---|
| **Time Complexity** | O(n) |
| **Space Complexity** | O(n) |

**Algorithm**:
1. **NFC Normalization**: Converts decomposed characters into precomposed.
2. **ZWNJ/ZWJ Removal**: Strips invisible joiners (`\u200C`, `\u200D`).
3. **Whitespace Collapsing**: Multiple spaces → single space.

```typescript
import { normalizeIndic } from '@prashanttiw/pramana/core';

const clean = normalizeIndic("नमस्ते\u200C दुनिया"); // "नमस्ते दुनिया"
```

---

### `safeSlice(text: string, start: number, end?: number): string`

Safely slices text respecting grapheme cluster boundaries.

| Property | Value |
|---|---|
| **Time Complexity** | O(n) where n = grapheme count |
| **Space Complexity** | O(n) |

**Use Case**: Truncating Devanagari text without breaking combined characters.

```typescript
import { safeSlice } from '@prashanttiw/pramana/core';

const hindi = "नमस्ते";
const first3 = safeSlice(hindi, 0, 3); // First 3 grapheme clusters
```

---

### `graphemeLength(text: string): number`

Returns accurate grapheme cluster count (not code point length).

| Property | Value |
|---|---|
| **Time Complexity** | O(n) |
| **Space Complexity** | O(n) |

---

### `phoneticMatch(str1: string, str2: string): number`

Calculates phonetic similarity score (0-1) between two Indian names.

| Property | Value |
|---|---|
| **Time Complexity** | O(m × n) where m, n = phonetic code lengths |
| **Space Complexity** | O(min(m, n)) — optimized two-row Levenshtein |

**Algorithm**: Indic Soundex + Levenshtein
- Consonant Mapping: `PH→F`, `BH→B`, `V→B`, `SH→S`, `Z→J`
- Vowel Removal: Internal vowels removed (keeps first char)
- Similarity: Normalized Levenshtein distance

```typescript
import { phoneticMatch } from '@prashanttiw/pramana/core';

phoneticMatch('Vikram', 'Bikram'); // > 0.9
phoneticMatch('Lakshmi', 'Laxmi'); // > 0.9
```

---

### `parseAddress(address: string): AddressObject`

Heuristically parses unstructured Indian addresses.

| Property | Value |
|---|---|
| **Time Complexity** | O(n × s) where n = address length, s = state count |
| **Space Complexity** | O(k) where k = landmark count |

**Returns**:
```typescript
interface AddressObject {
    pincode: string | null;
    city: string | null;
    state: string | null;
    landmarks: string[];
}
```

---

### `scrubPII(text: string, options?: ScrubOptions): string`

Redacts PII (Aadhaar, PAN, GSTIN) with checksum verification.

| Property | Value |
|---|---|
| **Time Complexity** | O(n) |
| **Space Complexity** | O(n) |

**Security Features**:
- Strips invisible Unicode characters before detection
- Verhoeff checksum for Aadhaar (100% single-digit error detection)
- Mod-36 checksum for GSTIN
- Zero false positives on random numbers

```typescript
import { scrubPII } from '@prashanttiw/pramana/core';

scrubPII("My Aadhaar is 999999990019"); // "My Aadhaar is [AADHAAR_MASKED]"
```

---

## 🛡️ Deep Verification

### `deepVerify(id: string, type: 'VOTER_ID' | 'RC' | 'UDID'): boolean`

Validates government IDs with state code verification.

| Property | Value |
|---|---|
| **Time Complexity** | O(1) |
| **Space Complexity** | O(1) |

---

## 📜 Core Validators

| Function | Time | Space | Algorithm |
|---|---|---|---|
| `isValidAadhaar` | O(n) | O(1) | Verhoeff checksum |
| `isValidPAN` | O(1) | O(1) | Regex + entity type |
| `isValidGSTIN` | O(n) | O(1) | Mod-36 checksum |
| `isValidIFSC` | O(1) | O(1) | Bank code whitelist |
| `isValidPincode` | O(1) | O(1) | Postal circle map |
