import { INDIA_STATE_CODES } from './rtoCodes';

const LEGACY_UAM_ONLY_CODES = new Set([
    'OR',
    'TS',
]);

const buildCodeNameMap = (includeLegacy: boolean): Readonly<Record<string, string>> => {
    const entries = Object.entries(INDIA_STATE_CODES).filter(([code]) => (
        includeLegacy || !LEGACY_UAM_ONLY_CODES.has(code)
    ));
    return Object.freeze(Object.fromEntries(entries));
};

/**
 * Udyam state/UT code map for current format `UDYAM-XX-00-0000000`.
 *
 * Uses 2-letter Indian state/UT abbreviations and excludes legacy aliases that
 * were historically seen in UAM-era records.
 */
export const UDYAM_STATE_CODE_NAME_MAP = buildCodeNameMap(false);

export const UDYAM_STATE_CODES: ReadonlySet<string> = new Set(
    Object.keys(UDYAM_STATE_CODE_NAME_MAP)
);

/**
 * UAM accepts legacy state aliases in historical records.
 */
export const UAM_STATE_CODE_NAME_MAP = buildCodeNameMap(true);

export const UAM_STATE_CODES: ReadonlySet<string> = new Set(
    Object.keys(UAM_STATE_CODE_NAME_MAP)
);
