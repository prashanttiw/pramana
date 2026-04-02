/**
 * A compressed set of popular/valid bank codes (First 4 chars of IFSC).
 * This is not exhaustive but covers major banks to demonstrate the pattern.
 * In a real scenario, this would be auto-generated from RBI master list.
 */
export const BANK_CODES = new Set([
    'SBIN', // State Bank of India
    'HDFC', // HDFC Bank
    'ICIC', // ICICI Bank
    'UTIB', // Axis Bank
    'PUNB', // Punjab National Bank
    'BKID', // Bank of India
    'BARB', // Bank of Baroda
    'CNRB', // Canara Bank
    'UBIN', // Union Bank of India
    'IOBA', // Indian Overseas Bank
    'IDIB', // Indian Bank
    'CBIN', // Central Bank of India
    'MAHB', // Bank of Maharashtra
    'ORBC', // Oriental Bank of Commerce (Merged)
    'ALLA', // Allahabad Bank (Merged)
    'ANDB', // Andhra Bank (Merged)
    'SYNB', // Syndicate Bank (Merged)
    'CORP', // Corporation Bank (Merged)
    'VYSA', // ING Vysya (Merged)
    'KKBK', // Kotak Mahindra Bank
    'YESB', // Yes Bank
    'INDB', // IndusInd Bank
    'FDRL', // Federal Bank
]);
