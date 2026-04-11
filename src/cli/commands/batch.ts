import boxen from 'boxen';
import type { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import {
    detectFraudSignals,
    isValidAadhaar,
    isValidDrivingLicense,
    isValidGSTIN,
    isValidIFSC,
    isValidIndianPhone,
    isValidMSME,
    isValidPAN,
    isValidPassport,
    isValidPincode,
    isValidTAN,
    isValidUAN,
    isValidUPI,
    isValidVoterID,
    normalisePhone,
    suggestCorrection,
} from '../../index';
import { colors } from '../ui/colors';
import { renderError, renderSuccess, renderTableOutput } from '../ui/renderer';
import { parseBatchValuesFile, type BatchValueRecord } from '../utils/fileParser';
import { resolveDocumentType, type SupportedDocumentType } from './validate';

type ValidatorFn = (value: string) => boolean;

type CorrectionType =
    | 'aadhaar'
    | 'pan'
    | 'gstin'
    | 'ifsc'
    | 'pincode'
    | 'tan'
    | 'uan'
    | 'phone'
    | 'upi'
    | 'msme'
    | 'voterid'
    | 'passport';

interface BatchCommandOptions {
    file: string;
    type: string;
    column?: string;
    output?: string;
    fraud: boolean;
    quiet?: boolean;
}

interface InvalidBatchRecord {
    row: number;
    value: string;
    error: string;
    suggestion?: string;
}

interface FraudAlertRecord {
    row: number;
    value: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    signals: string[];
}

interface BatchReport {
    meta: {
        file: string;
        type: string;
        total: number;
        valid: number;
        invalid: number;
        fraudSignals: number;
        elapsedMs: number;
        timestamp: string;
    };
    invalid: InvalidBatchRecord[];
    fraudAlerts: FraudAlertRecord[];
}

interface BatchTypeConfig {
    displayType: string;
    fraudType: string;
    correctionType: CorrectionType | null;
    validate: ValidatorFn;
    normalize: (value: string) => string;
    defaultFailureReason: string;
}

const normalizeDigits = (value: string): string => value.trim().replace(/\D/g, '');
const normalizeUpperCompact = (value: string): string => value.trim().toUpperCase().replace(/[\s-]/g, '');
const normalizeDrivingLicense = (value: string): string => value.trim().toUpperCase().replace(/[\s\-/]/g, '');
const normalizeUPI = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '');
const normalizeMSME = (value: string): string => value.trim().toUpperCase().replace(/\s+/g, '');
const normalizePhone = (value: string): string => normalisePhone(value) ?? value.trim();

const BATCH_TYPE_CONFIG: Record<SupportedDocumentType, BatchTypeConfig> = {
    aadhaar: {
        displayType: 'aadhaar',
        fraudType: 'aadhaar',
        correctionType: 'aadhaar',
        validate: isValidAadhaar,
        normalize: normalizeDigits,
        defaultFailureReason: 'Verhoeff checksum failed',
    },
    pan: {
        displayType: 'pan',
        fraudType: 'pan',
        correctionType: 'pan',
        validate: isValidPAN,
        normalize: normalizeUpperCompact,
        defaultFailureReason: 'PAN format validation failed',
    },
    gstin: {
        displayType: 'gstin',
        fraudType: 'gstin',
        correctionType: 'gstin',
        validate: isValidGSTIN,
        normalize: normalizeUpperCompact,
        defaultFailureReason: 'GSTIN Mod-36 checksum failed',
    },
    ifsc: {
        displayType: 'ifsc',
        fraudType: 'ifsc',
        correctionType: 'ifsc',
        validate: isValidIFSC,
        normalize: normalizeUpperCompact,
        defaultFailureReason: 'IFSC structure/bank-code check failed',
    },
    pincode: {
        displayType: 'pincode',
        fraudType: 'pincode',
        correctionType: 'pincode',
        validate: isValidPincode,
        normalize: normalizeDigits,
        defaultFailureReason: 'Pincode validation failed',
    },
    tan: {
        displayType: 'tan',
        fraudType: 'tan',
        correctionType: 'tan',
        validate: isValidTAN,
        normalize: normalizeUpperCompact,
        defaultFailureReason: 'TAN structure check failed',
    },
    uan: {
        displayType: 'uan',
        fraudType: 'uan',
        correctionType: 'uan',
        validate: isValidUAN,
        normalize: normalizeDigits,
        defaultFailureReason: 'UAN allocation/structure check failed',
    },
    voterid: {
        displayType: 'voter-id',
        fraudType: 'voterid',
        correctionType: 'voterid',
        validate: isValidVoterID,
        normalize: normalizeUpperCompact,
        defaultFailureReason: 'Voter ID structure check failed',
    },
    drivinglicense: {
        displayType: 'dl',
        fraudType: 'drivinglicense',
        correctionType: null,
        validate: isValidDrivingLicense,
        normalize: normalizeDrivingLicense,
        defaultFailureReason: 'Driving license structure check failed',
    },
    passport: {
        displayType: 'passport',
        fraudType: 'passport',
        correctionType: 'passport',
        validate: isValidPassport,
        normalize: (value) => value.trim().toUpperCase().replace(/\s+/g, ''),
        defaultFailureReason: 'Passport format check failed',
    },
    upi: {
        displayType: 'upi',
        fraudType: 'upi',
        correctionType: 'upi',
        validate: isValidUPI,
        normalize: normalizeUPI,
        defaultFailureReason: 'UPI handle/provider check failed',
    },
    phone: {
        displayType: 'phone',
        fraudType: 'phone',
        correctionType: 'phone',
        validate: isValidIndianPhone,
        normalize: normalizePhone,
        defaultFailureReason: 'Indian mobile allocation check failed',
    },
    msme: {
        displayType: 'msme',
        fraudType: 'msme',
        correctionType: 'msme',
        validate: isValidMSME,
        normalize: normalizeMSME,
        defaultFailureReason: 'MSME structure check failed',
    },
};

const formatCount = (value: number): string => value.toLocaleString('en-IN');

const formatPercent = (part: number, total: number): string => {
    if (total <= 0) return '0.0%';
    return `${((part / total) * 100).toFixed(1)}%`;
};

const timestampSlug = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const makeDefaultOutputPath = (): string => `pramana-batch-report-${timestampSlug()}.json`;

const getFailureReason = (
    documentType: SupportedDocumentType,
    rawValue: string,
    normalized: string,
    defaultReason: string
): string => {
    if (rawValue.trim().length === 0) return 'Empty value';

    if (documentType === 'aadhaar') {
        if (!/^\d+$/.test(normalized)) return 'Contains non-numeric characters';
        if (normalized.length < 12) return 'Too short';
        if (normalized.length > 12) return 'Too long';
        if (/^[01]/.test(normalized)) return 'Invalid starting digit';
        return 'Verhoeff checksum failed';
    }

    if (documentType === 'pan' && normalized.length !== 10) {
        return normalized.length < 10 ? 'Too short' : 'Too long';
    }

    if (documentType === 'gstin' && normalized.length !== 15) {
        return normalized.length < 15 ? 'Too short' : 'Too long';
    }

    if (documentType === 'ifsc' && normalized.length !== 11) {
        return normalized.length < 11 ? 'Too short' : 'Too long';
    }

    if (documentType === 'pincode' && normalized.length !== 6) {
        return normalized.length < 6 ? 'Too short' : 'Too long';
    }

    return defaultReason;
};

const buildSuggestion = (documentType: SupportedDocumentType, normalized: string): string | undefined => {
    const correctionType = BATCH_TYPE_CONFIG[documentType].correctionType;
    if (correctionType == null) return undefined;

    try {
        const correction = suggestCorrection(correctionType, normalized);
        if (correction.primarySuggestion == null || correction.primarySuggestion.length === 0) {
            return undefined;
        }
        if (correction.primarySuggestion === normalized) {
            return undefined;
        }
        return correction.primarySuggestion;
    } catch {
        return undefined;
    }
};

const renderStartCard = (
    filePath: string,
    displayType: string,
    totalRecords: number
): void => {
    const content = [
        colors.label('Pramana Batch Validator'),
        `${colors.label('File:')} ${basename(filePath)}`,
        `${colors.label('Type:')} ${displayType}`,
        `${colors.label('Records:')} ${formatCount(totalRecords)}`,
    ].join('\n');

    renderTableOutput(boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
};

const renderProgressBar = (current: number, total: number): string => {
    const width = 36;
    const ratio = total <= 0 ? 0 : current / total;
    const filled = Math.round(ratio * width);
    const empty = Math.max(0, width - filled);
    const percent = Math.round(ratio * 100);

    return `${'?'.repeat(filled)}${' '.repeat(empty)}  ${percent}%  ${current}/${total}`;
};

const updateProgress = (current: number, total: number, quiet: boolean): void => {
    if (quiet || total <= 0) return;

    const line = renderProgressBar(current, total);
    if (process.stdout.isTTY) {
        process.stdout.write(`\r${line}`);
        if (current === total) {
            process.stdout.write('\n');
        }
        return;
    }

    if (current === total) {
        renderTableOutput(line);
    }
};

const renderSummary = (
    total: number,
    valid: number,
    invalid: number,
    fraudCount: number,
    elapsedMs: number,
    invalidRecords: InvalidBatchRecord[]
): void => {
    const preview = invalidRecords.slice(0, 5);
    const previewLines = preview.length === 0
        ? ['  None']
        : preview.map((item) => `  Row ${item.row}  \u2192 ${item.value || '[empty]'}  (${item.error})`);

    if (invalidRecords.length > 5) {
        previewLines.push('  ...');
    }

    const content = [
        colors.label('BATCH RESULTS'),
        '',
        `${colors.label('Total records')}     ${formatCount(total)}`,
        `${colors.success('\u2713 Valid')}           ${formatCount(valid)}    (${formatPercent(valid, total)})`,
        `${colors.error('\u2717 Invalid')}         ${formatCount(invalid)}    (${formatPercent(invalid, total)})`,
        `${colors.warning('\u26a0 Fraud signals')}    ${formatCount(fraudCount)}    (${formatPercent(fraudCount, total)})`,
        `${colors.label('Time elapsed')}      ${elapsedMs}ms`,
        '',
        `${colors.label('Invalid records (first 5):')}`,
        ...previewLines,
    ].join('\n');

    renderTableOutput(boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
    }));
};

const processRecords = (
    records: BatchValueRecord[],
    type: SupportedDocumentType,
    withFraud: boolean,
    quiet: boolean
): {
    validCount: number;
    invalidRecords: InvalidBatchRecord[];
    fraudAlerts: FraudAlertRecord[];
} => {
    const config = BATCH_TYPE_CONFIG[type];
    const invalidRecords: InvalidBatchRecord[] = [];
    const fraudAlerts: FraudAlertRecord[] = [];

    let validCount = 0;
    const total = records.length;
    const progressStep = Math.max(1, Math.floor(total / 120));

    for (let i = 0; i < total; i += 1) {
        const record = records[i];
        const normalized = config.normalize(record.value);
        const isValid = config.validate(normalized);

        if (isValid) {
            validCount += 1;
        } else {
            invalidRecords.push({
                row: record.row,
                value: record.value,
                error: getFailureReason(type, record.value, normalized, config.defaultFailureReason),
                suggestion: buildSuggestion(type, normalized),
            });
        }

        if (withFraud) {
            const fraud = detectFraudSignals(config.fraudType, normalized);
            if (fraud.signals.length > 0) {
                fraudAlerts.push({
                    row: record.row,
                    value: record.value,
                    risk: fraud.risk,
                    signals: fraud.signals.map((signal) => signal.type),
                });
            }
        }

        const current = i + 1;
        if (current === total || current % progressStep === 0) {
            updateProgress(current, total, quiet);
        }
    }

    return {
        validCount,
        invalidRecords,
        fraudAlerts,
    };
};

const writeReport = async (path: string, report: BatchReport): Promise<void> => {
    await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

export const batchCommand = async (options: BatchCommandOptions): Promise<void> => {
    try {
        const resolvedType = resolveDocumentType(options.type);
        const parsed = await parseBatchValuesFile(options.file, options.column);

        if (parsed.records.length === 0) {
            throw new Error('No records found in input file.');
        }

        if (!options.quiet) {
            renderStartCard(options.file, BATCH_TYPE_CONFIG[resolvedType].displayType, parsed.records.length);
        }

        const startedAt = Date.now();
        const { validCount, invalidRecords, fraudAlerts } = processRecords(
            parsed.records,
            resolvedType,
            options.fraud,
            options.quiet === true
        );
        const elapsedMs = Date.now() - startedAt;

        const total = parsed.records.length;
        const invalidCount = invalidRecords.length;
        const report: BatchReport = {
            meta: {
                file: basename(options.file),
                type: BATCH_TYPE_CONFIG[resolvedType].displayType,
                total,
                valid: validCount,
                invalid: invalidCount,
                fraudSignals: fraudAlerts.length,
                elapsedMs,
                timestamp: new Date().toISOString(),
            },
            invalid: invalidRecords,
            fraudAlerts,
        };

        renderSummary(total, validCount, invalidCount, fraudAlerts.length, elapsedMs, invalidRecords);

        const outputPath = options.output ?? makeDefaultOutputPath();
        await writeReport(outputPath, report);
        renderSuccess(`Report saved to: ${outputPath}`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Batch validation failed.';
        renderError(message);
        process.exitCode = 1;
    }
};

export const registerBatchCommand = (program: Command): void => {
    program
        .command('batch')
        .description('Validate a CSV or JSON file of document numbers.')
        .requiredOption('--file <path>', 'Input file path (.csv or .json)')
        .requiredOption('--type <type>', 'Document type (aadhaar, pan, gstin, etc.)')
        .option('--column <name>', 'Column name in CSV/JSON object array')
        .option('--output <path>', 'Output report path (default: auto-generated)')
        .option('--no-fraud', 'Skip fraud detection for faster processing')
        .option('--quiet', 'No progress bar, only summary')
        .action(batchCommand);
};
