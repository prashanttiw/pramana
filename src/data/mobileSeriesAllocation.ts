/**
 * Source: TRAI National Numbering consultation/recommendation material and
 * DoT mobile numbering allocation practice, researched 2026-04-05.
 *
 * Notes:
 * - Indian mobile NSN currently uses leading levels 6/7/8/9.
 * - DoT remains the custodian and allocates at MSC/prefix granularity.
 * - A complete, machine-readable, always-current public 6xxx allocation list
 *   is not published as a single stable dataset; keep this list conservative.
 */
export const VALID_MOBILE_PREFIXES: ReadonlySet<string> = new Set([
    '6',
    '7',
    '8',
    '9',
]);

/**
 * Explicit 6xxx prefixes that should be rejected in strict validation mode.
 *
 * Keep intentionally narrow to avoid rejecting legitimate allocations as
 * numbering updates evolve. Extend this set as validated DoT allocation data
 * is curated.
 */
export const INVALID_6_SERIES_PREFIXES: ReadonlySet<string> = new Set([
    '6000',
]);
