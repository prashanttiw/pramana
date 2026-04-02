# Contributing to Pramana 🇮🇳

Welcome to the Pramana project! We're exciting that you want to contribute to making validation for Indian identity and financial documents **fast, accurate, and accessible to everyone**.

> **Pramana** (प्रमाण) means "evidence" or "proof" in Sanskrit. Every contribution helps build more accurate, trustworthy validation tools for the Indian context.

---

## 🚀 Research & Indic Script Contributions (Updated for v2.0)

Pramana 2.0 introduces the **Research & AI Suite**, dealing with complex Indic data challenges (Unicode, Phonetics, Addresses). 

### Guidelines for Indic Language Support

When adding support for a new Indic script or improving normalization:

1.  **Unicode Standard**: Always follow the latest Unicode standard for the script.
2.  **Normalization Form**: All outputs must be normalized to **NFC** (Canonical Composition) unless specified otherwise.
3.  **Test Cases**:
    - Include **native script** examples (e.g., Hindi: नमस्ते, Tamil: வணக்கம்).
    - Include **edge cases** like Zero Width Joiners (ZWJ), Zero Width Non-Joiners (ZWNJ).
    - Include **transliterated** variations if applicable (e.g., "Aadhaar" vs "Aadhar").

### Phonetic Algorithms

Creating a phonetic algorithm for an Indic language is complex. Guidelines:

-   **Focus on Consonants**: Vowels are often dropped or interchangeable in anglicized Indic names.
-   **Regional Variations**: Account for regional pronunciation differences (e.g., 'V' vs 'B' in East India, 'S' vs 'Sh' in South India).
-   **Documentation**: Explain the **linguistic basis** for any character mapping rules you add.

---

## 🛠️ General Contribution Guidelines

### 1. Report Bugs 🐛

Found a bug? Help us fix it!
[... Standard Bug Report sections ...]

### 2. Suggest Features or New Validators ✨

Have an idea for a new Indian validator? We'd love to hear it!
[... Standard Feature Request sections ...]

### 3. Submit Code (Pull Requests) 🚀

[... Standard PR sections ...]

---

## Development Setup

### Prerequisites

- **Node.js** 16+
- **npm** 8+
- **Git**

### Steps

1.  **Fork & Clone**:
    ```bash
    git clone https://github.com/YOUR-USERNAME/pramana.git
    cd pramana
    ```

2.  **Install**:
    ```bash
    npm install
    ```

3.  **Test**:
    ```bash
    npm test
    ```

---

## Testing Requirements

### ✅ Critical: 100% Test Coverage Required

**No PR will be merged without test coverage for new code.**

### What Needs Tests

1.  **New Validators**: All logic paths must be tested.
2.  **Indic Normalization**: Test with raw unicode strings containing combining characters.
3.  **Phonetic Matching**: Test with pairs of names that should match and pairs that shouldn't.

---

## Style Guide

### TypeScript Standards

```typescript
// ✅ Good: Explicit types
export const normalizeIndic = (input: string): string => {
  if (!input) return '';
  return input.normalize('NFC');
};

// ❌ Bad: Implicit any
export const normalizeIndic = (input) => { 
  return input.normalize();
};
```

---

## Recognition

We value every contribution! All contributors will be listed in `HANDBOOK.md` and our README.

**Made with ❤️ for India** 🇮🇳
