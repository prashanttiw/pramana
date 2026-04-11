import boxen from 'boxen';
import type { FraudDetectionResult, KYCBundleResult } from '../../index';
import { colors } from './colors';
import { renderTable } from './table';

const ICONS = {
    success: '\u2713',
    error: '\u2717',
    warning: '\u26a0',
    info: '\u2139',
    suggestion: '\u21bb',
} as const;

export interface ValidationDisplayData {
    documentType: string;
    status: 'VALID' | 'INVALID';
    input: string;
    normalized: string;
    algorithm: string;
    check: string;
    infoLines?: Array<{ label: string; value: string }>;
    error?: string;
    fraud?: {
        recommendation: 'ACCEPT' | 'MANUAL_REVIEW' | 'REJECT';
        signal?: string;
        note?: string;
    };
    suggestion?: {
        value: string;
        confidence: string;
        change?: string;
    };
}

const formatList = (values: string[]): string => (values.length > 0 ? values.join(', ') : 'None');

const renderRisk = (risk: FraudDetectionResult['risk']): string => {
    if (risk === 'LOW') return colors.safe(risk);
    if (risk === 'MEDIUM') return colors.review(risk);
    if (risk === 'HIGH' || risk === 'CRITICAL') return colors.fraud(risk);
    return colors.primary(risk);
};

export const renderValidationResult = (
    result: ValidationDisplayData
): void => {
    const isValid = result.status === 'VALID';
    const header = isValid
        ? `${colors.success(ICONS.success)}  ${colors.label(result.documentType.toUpperCase())}`
        : `${colors.error(ICONS.error)}  ${colors.label(result.documentType.toUpperCase())}`;
    const status = isValid ? colors.success(result.status) : colors.error(result.status);
    const check = isValid ? colors.success(result.check) : colors.error(result.check);

    const lines: string[] = [
        `  ${header}                  ${status}`,
        '',
        `  ${colors.label('Input')}      ${colors.primary(result.input)}`,
        `  ${colors.label('Normalized')} ${colors.primary(result.normalized)}`,
        `  ${colors.label('Algorithm')}  ${colors.primary(result.algorithm)}`,
        `  ${colors.label('Check')}      ${check}`,
    ];

    if (result.infoLines != null && result.infoLines.length > 0) {
        result.infoLines.forEach((line) => {
            lines.push(`  ${colors.label(`${line.label}`)} ${colors.primary(line.value)}`);
        });
    }

    if (!isValid && result.error != null) {
        lines.push(`  ${colors.label('Error')}      ${colors.error(result.error)}`);
    }

    if (result.fraud != null) {
        const recommendation = result.fraud.recommendation === 'ACCEPT'
            ? colors.success(result.fraud.recommendation)
            : result.fraud.recommendation === 'MANUAL_REVIEW'
                ? colors.warning(result.fraud.recommendation)
                : colors.error(result.fraud.recommendation);

        lines.push('');
        lines.push(`  ${colors.warning(ICONS.warning)} ${colors.label('Fraud Check')}   ${recommendation}`);
        if (result.fraud.signal != null) {
            lines.push(`  ${colors.label('Signal:')}    ${colors.primary(result.fraud.signal)}`);
        }
        if (result.fraud.note != null) {
            lines.push(`  ${colors.label('Note:')}      ${colors.primary(result.fraud.note)}`);
        }
    }

    if (!isValid && result.suggestion != null) {
        lines.push('');
        lines.push(`  ${colors.warning(ICONS.suggestion)} ${colors.label('Suggestion')}  ${colors.primary(result.suggestion.value)}`);
        lines.push(`  ${colors.label('Confidence')} ${colors.primary(result.suggestion.confidence)}`);
        if (result.suggestion.change != null) {
            lines.push(`  ${colors.label('Change')}     ${colors.primary(result.suggestion.change)}`);
        }
    }

    console.log(boxen(lines.join('\n'), {
        padding: 1,
        borderStyle: 'round',
        borderColor: isValid ? 'green' : 'red',
    }));
};

export const renderFraudSignals = (result: FraudDetectionResult): void => {
    const signalLines = result.signals.length > 0
        ? result.signals.map((signal) => (
            `- ${colors.warning(ICONS.warning)} ${colors.primary(signal.description)} ${colors.dim(`(w=${signal.weight.toFixed(2)})`)}`
        ))
        : [`- ${colors.success(ICONS.success)} ${colors.safe('No fraud signals detected.')}`];

    const recommendation = result.recommendation === 'REJECT'
        ? colors.fraud(result.recommendation)
        : result.recommendation === 'MANUAL_REVIEW'
            ? colors.review(result.recommendation)
            : colors.safe(result.recommendation);

    const body = [
        `${colors.label('Document')} ${colors.primary(result.documentType.toUpperCase())}`,
        `${colors.label('Input')}    ${colors.code(result.input)}`,
        `${colors.label('Risk')}     ${renderRisk(result.risk)} ${colors.dim(`(score=${result.suspicionScore.toFixed(2)})`)}`,
        `${colors.label('Action')}   ${recommendation}`,
        '',
        ...signalLines,
        '',
        `${colors.label('Note')} ${colors.primary(result.note)}`,
    ].join('\n');

    console.log(boxen(body, {
        padding: 1,
        borderStyle: 'round',
        borderColor: result.risk === 'LOW' ? 'green' : result.risk === 'MEDIUM' ? 'yellow' : 'red',
    }));
};

export const renderKYCResult = (result: KYCBundleResult): void => {
    const overall = result.overallResult === 'PASS'
        ? colors.success(`${ICONS.success} ${result.overallResult}`)
        : result.overallResult === 'FAIL'
            ? colors.error(`${ICONS.error} ${result.overallResult}`)
            : colors.warning(`${ICONS.warning} ${result.overallResult}`);
    const report = [
        `${colors.label('Overall')}      ${overall}`,
        `${colors.label('KYC Score')}    ${colors.primary(String(result.kycScore))}`,
        `${colors.label('Entity Type')}  ${colors.primary(result.entityType)}`,
        `${colors.label('Entity State')} ${colors.primary(result.entityState ?? 'Unknown')}`,
        `${colors.label('Valid Docs')}   ${colors.safe(formatList(result.validDocuments))}`,
        `${colors.label('Invalid Docs')} ${colors.error(formatList(result.invalidDocuments))}`,
        `${colors.label('Summary')}      ${colors.primary(result.summary)}`,
    ].join('\n');

    console.log(boxen(report, {
        padding: 1,
        borderStyle: 'round',
        borderColor: result.overallResult === 'PASS' ? 'green' : result.overallResult === 'FAIL' ? 'red' : 'yellow',
    }));

    if (result.crossChecks.length > 0) {
        const crossChecks = renderTable(
            [
                { header: 'Check', width: 26 },
                { header: 'Status', width: 10 },
                { header: 'Finding', width: 60 },
            ],
            result.crossChecks.map((check) => [
                check.checkName,
                check.passed ? `${ICONS.success} PASS` : `${ICONS.error} FAIL`,
                check.finding || check.description,
            ])
        );
        console.log(crossChecks);
    }

    if (result.fraudSignals.length > 0) {
        const signals = result.fraudSignals.map((signal) => (
            `- ${colors.warning(ICONS.warning)} ${signal.description}`
        )).join('\n');
        console.log(signals);
    }
};

export const renderBatchSummary = (
    total: number,
    validCount: number,
    invalidCount: number,
    errorCount: number,
    format: 'csv' | 'json'
): void => {
    const content = [
        `${colors.label('Input format:')} ${colors.primary(format.toUpperCase())}`,
        `${colors.label('Total rows:')} ${colors.primary(String(total))}`,
        `${colors.label('Valid:')} ${colors.success(`${ICONS.success} ${validCount}`)}`,
        `${colors.label('Invalid:')} ${colors.error(`${ICONS.error} ${invalidCount}`)}`,
        `${colors.label('Errors:')} ${colors.warning(`${ICONS.warning} ${errorCount}`)}`,
    ].join('\n');

    console.log(boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
};

export const renderTableOutput = (table: string): void => {
    console.log(table);
};

export const renderError = (message: string): void => {
    console.error(`${colors.error(ICONS.error)} ${colors.error(message)}`);
};

export const renderSuccess = (message: string): void => {
    console.log(`${colors.success(ICONS.success)} ${colors.success(message)}`);
};

export const renderInfo = (message: string): void => {
    console.log(`${colors.info(ICONS.info)} ${colors.info(message)}`);
};

export const renderMutedLine = (message: string): void => {
    console.error(colors.muted(message));
};

export const renderJson = (data: unknown): void => {
    console.log(JSON.stringify(data, null, 2));
};

export const renderQuietResult = (isValid: boolean): void => {
    console.log(isValid ? 'VALID' : 'INVALID');
};

export const renderInfoCard = (title: string, details: Record<string, string>): void => {
    const detailLines = Object.entries(details).map(([label, value]) => (
        `${colors.label(`${label}:`)} ${value}`
    ));

    const content = [
        colors.brand(title),
        '',
        ...detailLines,
    ].join('\n');

    console.log(boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue',
    }));
};
