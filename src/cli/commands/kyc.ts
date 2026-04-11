import * as clack from '@clack/prompts';
import type { Command } from 'commander';
import { readFile, writeFile } from 'node:fs/promises';
import ora from 'ora';
import { validateKYCBundle, type KYCBundleInput, type KYCBundleResult } from '../../index';
import { showBanner } from '../ui/banner';
import { renderError, renderJson, renderKYCResult, renderSuccess } from '../ui/renderer';

type KycField = keyof KYCBundleInput;
type ExportChoice = 'json' | 'csv' | 'none';

interface KycCommandOptions {
    json?: boolean;
    input?: string;
}

interface KycFieldConfig {
    key: KycField;
    label: string;
    placeholder: string;
}

const FIELD_CONFIGS: KycFieldConfig[] = [
    { key: 'aadhaar', label: 'Aadhaar', placeholder: '9999 9999 9999' },
    { key: 'pan', label: 'PAN', placeholder: 'ABCPE1234F' },
    { key: 'gstin', label: 'GSTIN', placeholder: '27ABCDE1234F1Z5' },
    { key: 'tan', label: 'TAN', placeholder: 'DELA12345B' },
    { key: 'uan', label: 'UAN', placeholder: '100000000001' },
    { key: 'passport', label: 'Passport', placeholder: 'A1234567' },
    { key: 'voterId', label: 'Voter ID', placeholder: 'ABC1234567' },
    { key: 'drivingLicense', label: 'Driving License', placeholder: 'MH0120100012345' },
    { key: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
    { key: 'upi', label: 'UPI ID', placeholder: 'name@okhdfcbank' },
];

const FIELD_LOOKUP = new Map<KycField, KycFieldConfig>(FIELD_CONFIGS.map((entry) => [entry.key, entry]));

const toIsoStamp = (): string => new Date().toISOString().replace(/[:.]/g, '-');

const normalizeOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeBundleInput = (raw: unknown): KYCBundleInput => {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Input JSON must be an object containing KYC fields.');
    }

    const source = raw as Record<string, unknown>;

    return {
        aadhaar: normalizeOptionalString(source.aadhaar),
        pan: normalizeOptionalString(source.pan),
        gstin: normalizeOptionalString(source.gstin),
        tan: normalizeOptionalString(source.tan),
        uan: normalizeOptionalString(source.uan),
        passport: normalizeOptionalString(source.passport),
        voterId: normalizeOptionalString(source.voterId ?? source.voter_id ?? source['voter-id']),
        drivingLicense: normalizeOptionalString(
            source.drivingLicense ?? source.driving_license ?? source['driving-license']
        ),
        phone: normalizeOptionalString(source.phone),
        upi: normalizeOptionalString(source.upi ?? source.upiId ?? source.upi_id),
    };
};

const parseInputFile = async (inputPath: string): Promise<KYCBundleInput> => {
    const rawContent = await readFile(inputPath, 'utf8');

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error(`Invalid JSON file: ${inputPath}`);
    }

    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed) && 'bundle' in parsed) {
        return normalizeBundleInput((parsed as Record<string, unknown>).bundle);
    }

    return normalizeBundleInput(parsed);
};

const validateWithSpinner = (input: KYCBundleInput): KYCBundleResult => {
    const spinner = ora('Validating documents...').start();

    try {
        const result = validateKYCBundle(input);
        spinner.succeed('Validation complete');
        return result;
    } catch (error: unknown) {
        spinner.fail('Validation failed');
        throw error;
    }
};

const promptDocumentSelection = async (): Promise<KycField[] | null> => {
    const selected = await clack.multiselect({
        message: 'Which documents do you want to validate?',
        options: FIELD_CONFIGS.map((field) => ({
            value: field.key,
            label: field.label,
        })),
        required: true,
    });

    if (clack.isCancel(selected)) {
        clack.cancel('KYC input cancelled by user.');
        return null;
    }

    return selected as KycField[];
};

const promptSelectedValues = async (fields: KycField[]): Promise<KYCBundleInput | null> => {
    const input: KYCBundleInput = {};

    for (const fieldKey of fields) {
        const field = FIELD_LOOKUP.get(fieldKey);
        if (field == null) continue;

        const answer = await clack.text({
            message: `Enter ${field.label} number:`,
            placeholder: field.placeholder,
        });

        if (clack.isCancel(answer)) {
            clack.cancel('KYC input cancelled by user.');
            return null;
        }

        const normalized = answer.trim();
        if (normalized.length > 0) {
            input[field.key] = normalized;
        }
    }

    return input;
};

const escapeCsvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const buildCsvSummary = (result: KYCBundleResult): string => {
    const rows = [
        ['document', 'provided', 'status', 'normalized', 'errors'],
        ...Object.entries(result.documents).map(([document, detail]) => [
            document,
            detail.provided ? 'yes' : 'no',
            detail.valid ? 'VALID' : 'INVALID',
            detail.normalized ?? '',
            detail.errors.join(' | '),
        ]),
    ];

    return rows
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
        .join('\n');
};

const exportReport = async (input: KYCBundleInput, result: KYCBundleResult): Promise<void> => {
    const choice = await clack.select({
        message: 'Export report?',
        options: [
            { value: 'json', label: 'JSON file' },
            { value: 'csv', label: 'CSV summary' },
            { value: 'none', label: 'No' },
        ],
    });

    if (clack.isCancel(choice)) {
        clack.cancel('Export skipped.');
        return;
    }

    const exportChoice = choice as ExportChoice;
    if (exportChoice === 'none') return;

    const stamp = toIsoStamp();

    if (exportChoice === 'json') {
        const fileName = `pramana-kyc-report-${stamp}.json`;
        const payload = {
            generatedAt: new Date().toISOString(),
            input,
            result,
        };

        await writeFile(fileName, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        renderSuccess(`JSON report exported: ${fileName}`);
        return;
    }

    const fileName = `pramana-kyc-summary-${stamp}.csv`;
    await writeFile(fileName, `${buildCsvSummary(result)}\n`, 'utf8');
    renderSuccess(`CSV summary exported: ${fileName}`);
};

const runInteractiveKyc = async (): Promise<void> => {
    if (process.env.PRAMANA_BANNER_SHOWN !== '1') {
        showBanner();
    }
    clack.intro('Pramana KYC Validator');

    const selectedFields = await promptDocumentSelection();
    if (selectedFields == null) return;

    const input = await promptSelectedValues(selectedFields);
    if (input == null) return;

    const result = validateWithSpinner(input);
    renderKYCResult(result);
    await exportReport(input, result);

    clack.outro('KYC flow complete.');
};

const runJsonMode = async (options: KycCommandOptions): Promise<void> => {
    if (options.input == null || options.input.trim().length === 0) {
        throw new Error('`--input <file>` is required with `--json`.');
    }

    const input = await parseInputFile(options.input);
    const result = validateKYCBundle(input);
    renderJson(result);
};

export const kycCommand = async (options: KycCommandOptions): Promise<void> => {
    try {
        if (options.json) {
            await runJsonMode(options);
            return;
        }

        await runInteractiveKyc();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'KYC check failed.';
        renderError(message);
        process.exitCode = 1;
    }
};

export const registerKycCommand = (program: Command): void => {
    program
        .command('check-kyc')
        .description('Interactive guided KYC validation command.')
        .option('--json', 'Non-interactive mode: read bundle JSON and output JSON')
        .option('--input <file>', 'Input JSON file path for --json mode')
        .action(kycCommand);
};
