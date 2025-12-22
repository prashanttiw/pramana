# Pramana Architecture

## Overview
Pramana is a high-performance, zero-dependency validation library tailored for the Indian context. It adheres to a strict "no external runtime dependencies" policy to ensure lightweight integration and security.

## Directory Structure

```
d:/Pramana
├── src/
│   ├── data/           # Static datasets (Banks, GST States, Pincodes)
│   ├── utils/          # Core algorithmic utilities (Verhoeff, Mod36, Checksums)
│   ├── validators/     # Business logic validators (Aadhaar, PAN, GSTIN, IFSC)
│   ├── zod/            # Zod schema integrations (Optional peer dependency)
│   ├── index.ts        # Main entry point exporting validtor functions
│   └── index.test.ts   # Integration tests
├── dist/               # Build artifacts (CJS/ESM)
├── tests/              # (Future) End-to-end and performance tests
└── tscompig.json       # TypeScript configuration
```

## Design Principles

1.  **Zero Dependencies**: All algorithms (Verhoeff, Luhn, Modulo) are implemented locally in `src/utils`. usage of `zod` is strictly optional and isolated in `src/zod`.
2.  **Functional API**: Validators are pure functions `(input: string) => boolean`.
3.  **Hybrid Build**: Uses `tsup` to generate both CommonJS (`require`) and ESM (`import`) compatible builds.

## Key Modules

### Validators (`src/validators`)
-   **Aadhaar**: Verhoeff algorithm implementation.
-   **PAN**: Regex + Checksum validation.
-   **GSTIN**: Mod36 Checksum validation.
-   **IFSC**: Regex + Bank Code lookup.

### Utilities (`src/utils`)
-   **Verhoeff**: Dihedral group D5 based checksum.
-   **Mod36**: Custom modulo 36 implementation for alphanumeric checksums.

## Testing Strategy
-   **Unit Tests**: Colocated with source files (e.g., `aadhaar.test.ts`).
-   **Context Generation**: Use `npm run gen:context` to generate a single markdown representation of the codebase for LLM-based analysis.
