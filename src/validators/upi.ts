import { UPI_PROVIDER_BANK_LOOKUP, VALID_UPI_HANDLES } from '../data/upiHandles';

export interface UPIInfo {
    raw: string;
    normalized: string;
    handle: string;
    provider: string;
    bank: string;
    type: 'personal' | 'merchant' | 'unknown';
}

const MIN_UPI_HANDLE_LENGTH = 3;
const MAX_UPI_HANDLE_LENGTH = 256;
const HANDLE_ALLOWED_REGEX = /^[a-z0-9._-]+$/;
const HANDLE_EDGE_ALPHANUMERIC_REGEX = /^[a-z0-9].*[a-z0-9]$/;
const CONSECUTIVE_SPECIAL_REGEX = /[._-][._-]/;
const PERSONAL_UPI_NUMBER_HANDLE_REGEX = /^\d{7,10}$/;
const HANDLE_TOKEN_SPLIT_REGEX = /[._-]+/;
const MERCHANT_HINT_TOKENS = new Set([
    'biz',
    'business',
    'corp',
    'enterprise',
    'enterprises',
    'fastag',
    'fuel',
    'gas',
    'hotel',
    'mart',
    'merchant',
    'netc',
    'petrol',
    'pharma',
    'pharmacy',
    'pay',
    'services',
    'shop',
    'store',
    'traders',
]);

const normalizeUPI = (input: string): string => input.trim().toLowerCase();

const hasExactlyOneAtSymbol = (value: string): boolean => {
    const firstAt = value.indexOf('@');
    if (firstAt === -1) return false;
    return firstAt === value.lastIndexOf('@');
};

const isValidUPIHandle = (handle: string): boolean => {
    if (handle.length < MIN_UPI_HANDLE_LENGTH || handle.length > MAX_UPI_HANDLE_LENGTH) {
        return false;
    }

    if (!HANDLE_ALLOWED_REGEX.test(handle)) return false;
    if (!HANDLE_EDGE_ALPHANUMERIC_REGEX.test(handle)) return false;
    if (CONSECUTIVE_SPECIAL_REGEX.test(handle)) return false;

    return true;
};

const detectUPIHandleType = (handle: string): UPIInfo['type'] => {
    if (PERSONAL_UPI_NUMBER_HANDLE_REGEX.test(handle)) return 'personal';

    const tokens = handle.split(HANDLE_TOKEN_SPLIT_REGEX).filter(Boolean);
    if (tokens.some((token) => MERCHANT_HINT_TOKENS.has(token))) return 'merchant';

    return 'unknown';
};

/**
 * Validates UPI ID in format: handle@provider.
 *
 * Rules:
 * - Accepts unknown input and never throws.
 * - Normalizes by trim + lowercase.
 * - Exactly one @ is required.
 * - Handle must be 3..256 chars, alphanumeric/dot/underscore/hyphen,
 *   cannot start/end with special chars, and cannot have consecutive special chars.
 * - Provider must match researched NPCI handle whitelist.
 */
export const isValidUPI = (input: unknown): boolean => {
    if (input == null) return false;
    if (typeof input !== 'string') return false;
    if (input.trim().length === 0) return false;

    const normalized = normalizeUPI(input);
    if (!hasExactlyOneAtSymbol(normalized)) return false;

    const [handle, provider] = normalized.split('@');
    if (!handle || !provider) return false;
    if (!isValidUPIHandle(handle)) return false;
    if (!VALID_UPI_HANDLES.has(provider)) return false;

    return true;
};

/**
 * Returns normalized UPI metadata for valid input.
 */
export const getUPIInfo = (input: string): UPIInfo | null => {
    if (!isValidUPI(input)) return null;

    const normalized = normalizeUPI(input);
    const [handle, provider] = normalized.split('@');
    const bank = UPI_PROVIDER_BANK_LOOKUP[provider] ?? 'Unknown';

    return {
        raw: input,
        normalized,
        handle,
        provider,
        bank,
        type: detectUPIHandleType(handle),
    };
};
