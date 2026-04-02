export interface UANPrefixRange {
    start: number;
    end: number;
    note: string;
}

/**
 * Known EPFO UAN allocation prefix windows (first 3 digits).
 *
 * Note: EPFO does not publish a full public prefix-allocation matrix.
 * These ranges are conservative known-issued series used for validation.
 */
export const UAN_ALLOCATED_PREFIX_RANGES: readonly UANPrefixRange[] = [
    {
        start: 100,
        end: 199,
        note: 'EPFO series 1xx - allocated post-2014',
    },
];

/**
 * Returns allocation range details for a normalized UAN, or null if unknown.
 * @param normalizedUAN The normalized 12-digit UAN candidate.
 * @returns Matching allocation range info when available.
 */
export const getAllocatedUANRange = (normalizedUAN: string): UANPrefixRange | null => {
    const prefix = Number.parseInt(normalizedUAN.substring(0, 3), 10);
    if (Number.isNaN(prefix)) return null;

    const matchedRange = UAN_ALLOCATED_PREFIX_RANGES.find((range) => (
        prefix >= range.start && prefix <= range.end
    ));

    return matchedRange ?? null;
};
