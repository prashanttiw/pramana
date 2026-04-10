export const KNOWN_TEST_AADHAAR_PREFIXES: ReadonlySet<string> = new Set(['9999']);

export const KNOWN_TEST_AADHAAR_NUMBERS: ReadonlySet<string> = new Set([
    '999941057058',
    '999971658847',
    '999933119405',
    '999955183433',
    '999990501894',
]);

export const KNOWN_TEST_PAN_PATTERNS: RegExp[] = [
    /^AAAAA\d{4}A$/,
    /^([A-Z])\1{4}\d{4}[A-Z]$/,
    /^[A-Z]{5}0{4}[A-Z]$/,
];

export const KNOWN_TEST_GSTIN_PREFIXES: ReadonlySet<string> = new Set(['99']);

export const KNOWN_TEST_GSTIN_PATTERNS: RegExp[] = [
    /^99[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    /^\d{2}AAAAA0{4}A[1-9A-Z]Z[0-9A-Z]$/,
];
