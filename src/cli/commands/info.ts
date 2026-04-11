import boxen from 'boxen';
import type { Command } from 'commander';
import { colors } from '../ui/colors';
import { renderError, renderMutedLine, renderTableOutput } from '../ui/renderer';
import { renderTable } from '../ui/table';
import {
    resolveDocumentType,
    SUPPORTED_DOCUMENT_TYPES,
    type SupportedDocumentType,
} from './validate';

interface InfoCommandOptions {
    list?: boolean;
}

interface DocumentInfo {
    listName: string;
    listLength: string;
    listAlgorithm: string;
    heading: string;
    issuedBy: string[];
    format: string;
    algorithm: string;
    validationSteps: string[];
    testRanges?: string[];
}

const VALID_TYPES_DISPLAY = [
    'aadhaar',
    'pan',
    'gstin',
    'ifsc',
    'pincode',
    'tan',
    'uan',
    'voter-id',
    'dl',
    'passport',
    'upi',
    'phone',
    'msme',
] as const;

const SECTION_DIVIDER = colors.border('\u2500'.repeat(57));

const DOCUMENT_INFO: Record<SupportedDocumentType, DocumentInfo> = {
    aadhaar: {
        listName: 'Aadhaar',
        listLength: '12 digits',
        listAlgorithm: 'Verhoeff (dihedral group D5)',
        heading: 'AADHAAR',
        issuedBy: ['UIDAI (Unique Identification Authority of India)'],
        format: '12 digits',
        algorithm: 'Verhoeff checksum (dihedral group D5)',
        validationSteps: [
            'The last digit is a check digit computed using Verhoeff.',
            'Three tables are used: d[][] (multiply), p[][] (permute), inv[] (inverse).',
            'Detects all single-digit errors and adjacent transpositions (12 -> 21).',
            'Regex-only checks are insufficient without checksum verification.',
        ],
        testRanges: [
            '9999-prefixed values are reserved/synthetic UIDAI test ranges.',
            'They may pass checksum but are still raised as high-risk fraud signals.',
        ],
    },
    pan: {
        listName: 'PAN',
        listLength: '10 chars',
        listAlgorithm: 'Structural + entity type',
        heading: 'PAN',
        issuedBy: ['Income Tax Department (CBDT)'],
        format: 'AAAAA9999A',
        algorithm: 'Structural pattern + entity code check',
        validationSteps: [
            'Verifies strict 5 letters + 4 digits + 1 letter structure.',
            'Checks the 4th character against valid entity classes (P/C/H/F/A/T/B/L/J/G).',
            'Fails fast on malformed length, casing, and non-alphanumeric symbols.',
        ],
    },
    gstin: {
        listName: 'GSTIN',
        listLength: '15 chars',
        listAlgorithm: 'Mod-36 weighted checksum',
        heading: 'GSTIN',
        issuedBy: ['GSTN (under Central and State GST administrations)'],
        format: '15 chars (SS + PAN + entity + Z + checksum)',
        algorithm: 'Mod-36 weighted checksum',
        validationSteps: [
            'Validates structure: 2-digit state code + PAN core + entity digit + Z + check digit.',
            'On first 14 chars, applies alternating weights 1,2 and folds product by quotient+remainder in base-36.',
            'Computes check index as (36 - (sum % 36)) % 36 and matches final character.',
            'Cross-checks state-code mapping and embedded PAN shape for consistency.',
        ],
        testRanges: [
            'Known sandbox/synthetic prefixes are flagged by fraud detection.',
            'Example calculation context: 27ABCDE1234F1Z5 (final char is checksum).',
        ],
    },
    ifsc: {
        listName: 'IFSC',
        listLength: '11 chars',
        listAlgorithm: 'Bank code whitelist',
        heading: 'IFSC',
        issuedBy: ['RBI + participating banks'],
        format: 'AAAA0######',
        algorithm: 'Structural validation + bank-code whitelist',
        validationSteps: [
            'Enforces 4-letter bank code + fixed 0 + 6 alphanumeric branch chars.',
            'Rejects unknown bank-code prefixes not present in curated bank list.',
            'Protects against fake but regex-valid IFSC permutations.',
        ],
    },
    pincode: {
        listName: 'Pincode',
        listLength: '6 digits',
        listAlgorithm: 'Postal circle mapping',
        heading: 'PINCODE',
        issuedBy: ['India Post'],
        format: '6 digits',
        algorithm: 'Postal-circle mapping validation',
        validationSteps: [
            'Checks numeric length and disallows 0 as the first digit.',
            'Uses first two digits to map against known postal regions/circles.',
            'Rejects structurally valid but unallocated circle prefixes.',
        ],
    },
    tan: {
        listName: 'TAN',
        listLength: '10 chars',
        listAlgorithm: 'Structural + positional',
        heading: 'TAN',
        issuedBy: ['Income Tax Department (TDS/TCS)'],
        format: 'AAAA99999A',
        algorithm: 'Structural and positional semantics',
        validationSteps: [
            'Checks 4 letters + 5 digits + 1 letter shape.',
            'Keeps TAN semantics separate from PAN entity logic.',
            'Parses city code and sequence segment for downstream verification flows.',
        ],
    },
    uan: {
        listName: 'UAN',
        listLength: '12 digits',
        listAlgorithm: 'EPFO range validation',
        heading: 'UAN',
        issuedBy: ['EPFO (Employees Provident Fund Organisation)'],
        format: '12 digits',
        algorithm: 'Allocated-range verification + synthetic pattern checks',
        validationSteps: [
            'Validates exact 12-digit structure.',
            'Rejects trivial synthetic patterns (all zeros / same repeated digit).',
            'Confirms prefix belongs to known EPFO-issued allocation ranges.',
        ],
    },
    voterid: {
        listName: 'Voter ID',
        listLength: '10 chars',
        listAlgorithm: 'ECI structural rules',
        heading: 'VOTER ID',
        issuedBy: ['Election Commission of India (ECI)'],
        format: 'AAA9999999',
        algorithm: 'EPIC structure + sequence checks',
        validationSteps: [
            'Requires 3 uppercase letters followed by 7 digits.',
            'Disallows all-zero numeric suffix.',
            'Returns prefix and sequence metadata for manual electoral verification.',
        ],
    },
    drivinglicense: {
        listName: 'Driving Lic.',
        listLength: '15-16 chars',
        listAlgorithm: 'State + RTO code validation',
        heading: 'DRIVING LICENSE',
        issuedBy: ['State RTO / Transport Department'],
        format: 'Post-2021: SSRRYYYYNNNNNNN, Legacy: SSRRXYYYYNNNNNNN',
        algorithm: 'State code + RTO range + issue-year plausibility',
        validationSteps: [
            'Normalizes spaces, slashes and dashes, then detects 15/16-char format.',
            'Verifies 2-letter state code and 2-digit RTO code against state-specific ranges.',
            'Checks plausible issue year window and numeric serial format.',
        ],
    },
    passport: {
        listName: 'Passport',
        listLength: '8 chars',
        listAlgorithm: 'Active series whitelist',
        heading: 'PASSPORT',
        issuedBy: ['Ministry of External Affairs (Passport Seva)'],
        format: '1 letter + 7 digits',
        algorithm: 'Series whitelist + numeric sequence checks',
        validationSteps: [
            'Allows only active/observed series prefixes and rejects ambiguous letters.',
            'Requires exactly 7 numeric digits after series letter.',
            'Rejects all-zero sequence payloads.',
        ],
    },
    upi: {
        listName: 'UPI ID',
        listLength: 'variable',
        listAlgorithm: 'NPCI PSP handle whitelist',
        heading: 'UPI ID',
        issuedBy: ['NPCI + PSP banks/apps'],
        format: 'handle@provider',
        algorithm: 'VPA syntax + PSP handle whitelist',
        validationSteps: [
            'Requires exactly one @ separator and valid handle character policy.',
            'Rejects invalid edge patterns (special-char starts/ends, double specials).',
            'Validates provider handle against researched NPCI PSP allowlist.',
        ],
    },
    phone: {
        listName: 'Phone',
        listLength: '10 digits',
        listAlgorithm: 'TRAI series allocation',
        heading: 'PHONE',
        issuedBy: ['TRAI + telecom operators'],
        format: '10-digit NSN (supports +91/0091/0 normalization)',
        algorithm: 'Series-allocation validation',
        validationSteps: [
            'Normalizes separators and strips supported India country-code prefixes.',
            'Rejects fake/trivial patterns (all same digit, known synthetic sequences).',
            'Checks first digit/prefix against allocated Indian mobile ranges.',
        ],
    },
    msme: {
        listName: 'MSME',
        listLength: 'variable',
        listAlgorithm: 'Udyam format + state codes',
        heading: 'MSME / UDYAM',
        issuedBy: ['Ministry of MSME (Udyam Registration Portal)'],
        format: 'UDYAM-XX-00-0000000 (also parses legacy UAM)',
        algorithm: 'Udyam/UAM structure + state/district code checks',
        validationSteps: [
            'Validates canonical Udyam format with explicit separators and token lengths.',
            'Checks state and district codes against curated code maps.',
            'Rejects zeroed serial blocks and malformed legacy UAM identifiers.',
        ],
    },
};

const renderListTable = (): void => {
    const rows = SUPPORTED_DOCUMENT_TYPES.map((type) => {
        const info = DOCUMENT_INFO[type];
        return [info.listName, info.listLength, info.listAlgorithm];
    });

    renderTableOutput(
        renderTable(
            [
                { header: 'Document', width: 16 },
                { header: 'Length', width: 13 },
                { header: 'Algorithm', width: 30 },
            ],
            rows
        )
    );
};

const pushLabeledValue = (
    lines: string[],
    label: string,
    value: string | string[]
): void => {
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0) return;

    lines.push(`  ${colors.label(label.padEnd(13))} ${colors.primary(values[0])}`);
    for (let i = 1; i < values.length; i += 1) {
        lines.push(`  ${' '.repeat(13)} ${colors.primary(values[i])}`);
    }
};

const renderDocumentInfo = (type: SupportedDocumentType): void => {
    const info = DOCUMENT_INFO[type];
    const lines: string[] = [
        `  ${colors.brand(`${info.heading} - Document Information`)}`,
        `  ${SECTION_DIVIDER}`,
    ];

    pushLabeledValue(lines, 'Issued by', info.issuedBy);
    pushLabeledValue(lines, 'Format', info.format);
    pushLabeledValue(lines, 'Algorithm', info.algorithm);

    lines.push(`  ${SECTION_DIVIDER}`);
    lines.push(`  ${colors.label('HOW VALIDATION WORKS')}`);
    lines.push('');
    info.validationSteps.forEach((step, index) => {
        lines.push(`  ${colors.primary(`${index + 1}. ${step}`)}`);
    });

    if (info.testRanges != null && info.testRanges.length > 0) {
        lines.push(`  ${SECTION_DIVIDER}`);
        lines.push(`  ${colors.label('TEST RANGES')}`);
        info.testRanges.forEach((line) => {
            lines.push(`  ${colors.primary(line)}`);
        });
    }

    renderTableOutput(boxen(lines.join('\n'), {
        padding: { top: 0, bottom: 0, left: 1, right: 1 },
        borderStyle: 'round',
        borderColor: 'blue',
    }));
};

export const infoCommand = (
    documentType: string | undefined,
    options: InfoCommandOptions
): void => {
    try {
        if (options.list || documentType == null) {
            renderListTable();
            return;
        }

        const resolvedType = resolveDocumentType(documentType);
        renderDocumentInfo(resolvedType);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unable to render document info.';
        renderError(message);
        if (message.startsWith('Unknown document type:')) {
            renderMutedLine(`Valid types: ${VALID_TYPES_DISPLAY.join(', ')}`);
        }
        process.exitCode = 1;
    }
};

export const registerInfoCommand = (program: Command): void => {
    program
        .command('info [documentType]')
        .description('Show algorithm details for each supported document type.')
        .option('--list', 'List supported document types with algorithms')
        .action(infoCommand);
};
