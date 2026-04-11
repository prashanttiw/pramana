#!/usr/bin/env node

import { Command } from 'commander';
import { batchCommand } from './commands/batch';
import { infoCommand } from './commands/info';
import { kycCommand } from './commands/kyc';
import { validateCommand } from './commands/validate';
import { showBanner } from './ui/banner';
import { renderError } from './ui/renderer';

const program = new Command();

program
    .name('pramana')
    .description('Indian identity document validator - @prashanttiw/pramana')
    .version(require('../../package.json').version, '-v, --version')
    .addHelpText('before', '\n');

program
    .command('validate <type> <value>')
    .description('Validate a single document number')
    .option('--json', 'Output raw JSON')
    .option('--no-fraud', 'Skip fraud signal detection')
    .option('--no-suggest', 'Skip correction suggestion')
    .option('--quiet', 'Minimal output')
    .action(validateCommand);

program
    .command('batch')
    .description('Validate a CSV or JSON file of document numbers')
    .requiredOption('--file <path>', 'Input file path')
    .requiredOption('--type <type>', 'Document type to validate')
    .option('--column <name>', 'Column name (for multi-column CSV/JSON)')
    .option('--output <path>', 'Output report path')
    .option('--no-fraud', 'Skip fraud detection')
    .option('--quiet', 'No progress bar, only summary')
    .action(batchCommand);

program
    .command('check-kyc')
    .description('Interactive KYC bundle validator')
    .option('--json', 'Non-interactive mode, reads from --input file')
    .option('--input <path>', 'Input JSON file for non-interactive mode')
    .action(kycCommand);

program
    .command('info [type]')
    .description('Show algorithm details for a document type')
    .option('--list', 'List all supported document types')
    .action(infoCommand);

program.hook('preAction', () => {
    const skipBanner = ['--help', '-h', '--version', '-v', '--json', '--quiet'];
    const hasSkip = process.argv.some((arg) => skipBanner.includes(arg));
    if (!hasSkip) {
        showBanner();
        process.env.PRAMANA_BANNER_SHOWN = '1';
    }
});

if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
}

program.parseAsync(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown CLI error.';
    renderError(message);
    process.exitCode = 1;
});
