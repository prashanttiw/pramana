/**
 * Official vehicle-registration state/UT codes used by MoRTH.
 *
 * Notes:
 * - Includes all current 36 State/UT codes.
 * - Includes legacy aliases (`TS`, `OR`) for backward compatibility with
 *   historical driving licence records.
 */
export const INDIA_STATE_CODES: Record<string, string> = {
    AN: 'Andaman and Nicobar Islands',
    AP: 'Andhra Pradesh',
    AR: 'Arunachal Pradesh',
    AS: 'Assam',
    BR: 'Bihar',
    CH: 'Chandigarh',
    CG: 'Chhattisgarh',
    DD: 'Daman and Diu',
    DL: 'Delhi',
    DN: 'Dadra and Nagar Haveli',
    GA: 'Goa',
    GJ: 'Gujarat',
    HR: 'Haryana',
    HP: 'Himachal Pradesh',
    JK: 'Jammu and Kashmir',
    JH: 'Jharkhand',
    KA: 'Karnataka',
    KL: 'Kerala',
    LA: 'Ladakh',
    LD: 'Lakshadweep',
    MH: 'Maharashtra',
    ML: 'Meghalaya',
    MN: 'Manipur',
    MP: 'Madhya Pradesh',
    MZ: 'Mizoram',
    NL: 'Nagaland',
    OD: 'Odisha',
    PB: 'Punjab',
    PY: 'Puducherry',
    RJ: 'Rajasthan',
    SK: 'Sikkim',
    TN: 'Tamil Nadu',
    TG: 'Telangana',
    TR: 'Tripura',
    UP: 'Uttar Pradesh',
    UK: 'Uttarakhand',
    WB: 'West Bengal',
    // Legacy aliases
    TS: 'Telangana (legacy code)',
    OR: 'Odisha (legacy code)',
};

type RTOCodeRange = readonly [number, number];

/**
 * Valid RTO numeric code ranges by state code.
 *
 * This validator uses a conservative nationally accepted range (01-99) and
 * enforces state presence + range bounds. Exact per-state allotments are
 * dynamic at RTO level and vary over time.
 */
export const INDIA_RTO_CODE_RANGES: Record<string, readonly RTOCodeRange[]> = (
    Object.keys(INDIA_STATE_CODES).reduce<Record<string, readonly RTOCodeRange[]>>((acc, stateCode) => {
        acc[stateCode] = [[1, 99]] as const;
        return acc;
    }, {})
);
