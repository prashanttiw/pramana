import { spawnSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { generateVerhoeff } from '../src/utils/verhoeff';

interface CLIResult {
    stdout: string;
    stderr: string;
    code: number;
}

interface BatchReport {
    meta: {
        total: number;
        valid: number;
        invalid: number;
        fraudSignals: number;
    };
    invalid: Array<{
        row: number;
        value: string;
        error: string;
        suggestion?: string;
    }>;
}

const tempFiles = new Set<string>();

// Helper: run CLI command and capture output
function runCLI(args: string): CLIResult {
    const argTokens = args.trim().length === 0 ? [] : args.split(' ');
    const result = spawnSync('node', ['dist/cli/index.js', ...argTokens], {
        encoding: 'utf8',
        timeout: 5000,
    });

    return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        code: result.status ?? 0,
    };
}

const combinedOutput = (result: CLIResult): string => `${result.stdout}${result.stderr}`;

const buildAadhaar = (base11: string): string => `${base11}${generateVerhoeff(base11)}`;

const createTempPath = (extension: string): string => {
    const path = join(
        process.cwd(),
        `.tmp-cli-test-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`
    );
    tempFiles.add(path);
    return path;
};

const parseJsonOutput = (result: CLIResult): unknown => JSON.parse(result.stdout);

beforeAll(() => {
    if (!existsSync(join(process.cwd(), 'dist', 'cli', 'index.js'))) {
        throw new Error('Missing dist/cli/index.js. Run `npm run build` before executing CLI tests.');
    }
});

afterEach(() => {
    for (const file of tempFiles) {
        if (!existsSync(file)) continue;
        try {
            unlinkSync(file);
        } catch {
            // Ignore cleanup errors to keep assertions focused on command behavior.
        }
    }
    tempFiles.clear();
});

describe('CLI integration', () => {
    describe('1) validate command - valid inputs', () => {
        it('validate aadhaar returns exit code 0', () => {
            const result = runCLI('validate aadhaar 999999990019');
            expect(result.code).toBe(0);
        });

        it('validate aadhaar output contains VALID', () => {
            const result = runCLI('validate aadhaar 999999990019');
            expect(combinedOutput(result)).toContain('VALID');
        });

        it('validate pan returns exit code 0', () => {
            const result = runCLI('validate pan ABCPE1234F');
            expect(result.code).toBe(0);
        });

        it('validate pan output contains VALID', () => {
            const result = runCLI('validate pan ABCPE1234F');
            expect(combinedOutput(result)).toContain('VALID');
        });

        it('validate gstin returns exit code 0 for a checksum-valid Karnataka GSTIN', () => {
            const result = runCLI('validate gstin 29ABCDE1234F1ZW');
            expect(result.code).toBe(0);
        });

        it('validate gstin output contains Karnataka', () => {
            const result = runCLI('validate gstin 29ABCDE1234F1ZW');
            expect(combinedOutput(result)).toContain('Karnataka');
        });
    });

    describe('2) validate command - invalid inputs', () => {
        it('invalid aadhaar returns exit code 1', () => {
            const result = runCLI('validate aadhaar 999999990018');
            expect(result.code).toBe(1);
        });

        it('invalid aadhaar output contains INVALID', () => {
            const result = runCLI('validate aadhaar 999999990018');
            expect(combinedOutput(result)).toContain('INVALID');
        });

        it('invalid aadhaar output contains Suggestion', () => {
            const result = runCLI('validate aadhaar 999999990018');
            expect(combinedOutput(result)).toContain('Suggestion');
        });

        it('invalid aadhaar output contains corrected value', () => {
            const result = runCLI('validate aadhaar 999999990018');
            expect(combinedOutput(result)).toContain('999999990019');
        });
    });

    describe('3) validate command - json flag', () => {
        it('valid aadhaar json returns exit code 0', () => {
            const result = runCLI('validate aadhaar 999999990019 --json');
            expect(result.code).toBe(0);
        });

        it('valid aadhaar json is parseable and has valid=true', () => {
            const result = runCLI('validate aadhaar 999999990019 --json');
            const parsed = parseJsonOutput(result) as { valid: boolean };
            expect(parsed.valid).toBe(true);
        });

        it('valid aadhaar json suggestion is null', () => {
            const result = runCLI('validate aadhaar 999999990019 --json');
            const parsed = parseJsonOutput(result) as { suggestion: unknown };
            expect(parsed.suggestion).toBeNull();
        });

        it('invalid aadhaar json returns exit code 1', () => {
            const result = runCLI('validate aadhaar 999999990018 --json');
            expect(result.code).toBe(1);
        });

        it('invalid aadhaar json is parseable and has valid=false', () => {
            const result = runCLI('validate aadhaar 999999990018 --json');
            const parsed = parseJsonOutput(result) as { valid: boolean };
            expect(parsed.valid).toBe(false);
        });

        it('invalid aadhaar json contains suggestion object', () => {
            const result = runCLI('validate aadhaar 999999990018 --json');
            const parsed = parseJsonOutput(result) as { suggestion: { value: string } | null };
            expect(parsed.suggestion).not.toBeNull();
            expect(parsed.suggestion?.value).toBe('999999990019');
        });
    });

    describe('4) validate command - unknown type', () => {
        it('unknown type returns exit code 2', () => {
            const result = runCLI('validate xyz 12345');
            expect(result.code).toBe(2);
        });

        it('unknown type output contains error message', () => {
            const result = runCLI('validate xyz 12345');
            expect(combinedOutput(result)).toContain('Unknown document type');
        });
    });

    describe('5) batch command', () => {
        const buildBatchFixture = (): string => {
            const valid1 = buildAadhaar('28473910582');
            const valid2 = buildAadhaar('73120984567');
            const valid3 = buildAadhaar('59841230764');
            const valid4 = buildAadhaar('36789120458');
            const valid5 = buildAadhaar('94567123089');

            const invalid1 = '999999990018';
            const invalid2 = '123456789012';

            const csvPath = createTempPath('csv');
            const lines = [
                'aadhaar',
                valid1,
                valid2,
                valid3,
                valid4,
                valid5,
                invalid1,
                invalid2,
            ];

            writeFileSync(csvPath, `${lines.join('\n')}\n`, 'utf8');
            return csvPath;
        };

        const runBatch = (): { result: CLIResult; reportPath: string } => {
            const csvPath = buildBatchFixture();
            const result = runCLI(`batch --file ${csvPath} --type aadhaar --quiet`);
            const output = combinedOutput(result);

            const reportMatch = output.match(/Report saved to:\s*(.+)/);
            expect(reportMatch).not.toBeNull();

            const rawPath = reportMatch?.[1].trim() ?? '';
            const resolvedPath = resolve(process.cwd(), rawPath);
            tempFiles.add(resolvedPath);

            return { result, reportPath: resolvedPath };
        };

        it('batch command exits with code 0', () => {
            const { result } = runBatch();
            expect(result.code).toBe(0);
        });

        it('batch output contains total record count 7', () => {
            const { result } = runBatch();
            expect(combinedOutput(result)).toContain('7');
        });

        it('batch output contains invalid count 2', () => {
            const { result } = runBatch();
            expect(combinedOutput(result)).toContain('2');
        });

        it('batch output includes report saved message', () => {
            const { result } = runBatch();
            expect(combinedOutput(result)).toContain('Report saved to:');
        });

        it('batch command creates a report file', () => {
            const { reportPath } = runBatch();
            expect(existsSync(reportPath)).toBe(true);
        });

        it('batch report JSON has expected totals and invalid list size', () => {
            const { reportPath } = runBatch();
            const report = JSON.parse(readFileSync(reportPath, 'utf8')) as BatchReport;

            expect(report.meta.total).toBe(7);
            expect(report.meta.invalid).toBe(2);
            expect(report.invalid.length).toBe(2);
        });
    });

    describe('6) info command', () => {
        it('info aadhaar contains Verhoeff', () => {
            const result = runCLI('info aadhaar');
            expect(combinedOutput(result)).toContain('Verhoeff');
        });

        it('info aadhaar contains UIDAI', () => {
            const result = runCLI('info aadhaar');
            expect(combinedOutput(result)).toContain('UIDAI');
        });

        it('info gstin contains Mod-36', () => {
            const result = runCLI('info gstin');
            expect(combinedOutput(result)).toContain('Mod-36');
        });

        it('info --list returns exit code 0', () => {
            const result = runCLI('info --list');
            expect(result.code).toBe(0);
        });

        it('info --list contains all supported document labels', () => {
            const result = runCLI('info --list');
            const output = combinedOutput(result);

            const labels = [
                'Aadhaar',
                'PAN',
                'GSTIN',
                'IFSC',
                'Pincode',
                'TAN',
                'UAN',
                'Voter ID',
                'Driving Lic.',
                'Passport',
                'UPI ID',
                'Phone',
                'MSME',
            ];

            for (const label of labels) {
                expect(output).toContain(label);
            }
        });
    });

    describe('7) version flag', () => {
        it('version flag exits with code 0', () => {
            const result = runCLI('--version');
            expect(result.code).toBe(0);
        });

        it('version flag output matches package.json version', () => {
            const packageJsonPath = join(process.cwd(), 'package.json');
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string };
            const result = runCLI('--version');

            expect(result.stdout.trim()).toBe(packageJson.version);
        });
    });

    describe('8) help flag', () => {
        it('help includes validate command', () => {
            const result = runCLI('--help');
            expect(combinedOutput(result)).toContain('validate');
        });

        it('help includes batch command', () => {
            const result = runCLI('--help');
            expect(combinedOutput(result)).toContain('batch');
        });

        it('help includes check-kyc command', () => {
            const result = runCLI('--help');
            expect(combinedOutput(result)).toContain('check-kyc');
        });

        it('help includes info command', () => {
            const result = runCLI('--help');
            expect(combinedOutput(result)).toContain('info');
        });
    });
});
