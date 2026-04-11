import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

export interface BatchValueRecord {
    row: number;
    value: string;
}

export interface ParsedBatchValues {
    format: 'csv' | 'json';
    records: BatchValueRecord[];
}

const HEADER_HINTS = new Set([
    'value',
    'values',
    'number',
    'numbers',
    'input',
    'id',
    'identifier',
    'document',
    'document_number',
    'aadhaar',
    'aadhaar_number',
    'pan',
    'gstin',
    'ifsc',
    'pincode',
    'tan',
    'uan',
    'passport',
    'voter_id',
    'dl',
    'phone',
    'upi',
    'msme',
]);

const normalizeColumnName = (value: string): string => value.trim().toLowerCase();

const cleanCell = (value: string): string => value.trim();

const parseCsvLine = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            cells.push(cleanCell(current));
            current = '';
            continue;
        }

        current += char;
    }

    cells.push(cleanCell(current));
    return cells;
};

const findColumnIndex = (headers: string[], columnName: string): number => {
    const needle = normalizeColumnName(columnName);

    for (let i = 0; i < headers.length; i += 1) {
        if (normalizeColumnName(headers[i]) === needle) {
            return i;
        }
    }

    return -1;
};

const shouldTreatFirstRowAsHeader = (firstRow: string[], columnName?: string): boolean => {
    if (columnName != null && columnName.trim().length > 0) {
        return true;
    }

    if (firstRow.length === 0) return false;
    if (firstRow.length === 1) {
        return HEADER_HINTS.has(normalizeColumnName(firstRow[0]));
    }

    let hintCount = 0;
    for (const cell of firstRow) {
        if (HEADER_HINTS.has(normalizeColumnName(cell))) {
            hintCount += 1;
        }
    }

    return hintCount > 0;
};

const parseCsvValues = (rawContent: string, columnName?: string): BatchValueRecord[] => {
    const lines = rawContent
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return [];
    }

    const firstRow = parseCsvLine(lines[0]);
    const hasHeader = shouldTreatFirstRowAsHeader(firstRow, columnName);

    let columnIndex = 0;
    let startLine = 0;

    if (hasHeader) {
        if (columnName != null && columnName.trim().length > 0) {
            columnIndex = findColumnIndex(firstRow, columnName);
            if (columnIndex < 0) {
                throw new Error(`Column "${columnName}" not found in CSV headers.`);
            }
        } else {
            columnIndex = 0;
        }

        startLine = 1;
    }

    const records: BatchValueRecord[] = [];

    for (let i = startLine; i < lines.length; i += 1) {
        const cells = parseCsvLine(lines[i]);
        const value = cells[columnIndex] ?? '';
        records.push({
            row: i + 1,
            value: value.trim(),
        });
    }

    return records;
};

const parseJsonValues = (rawContent: string, columnName?: string): BatchValueRecord[] => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error('Invalid JSON input file.');
    }

    let source: unknown = parsed;
    if (source != null && typeof source === 'object' && !Array.isArray(source) && 'records' in source) {
        source = (source as { records: unknown }).records;
    }

    if (!Array.isArray(source)) {
        throw new Error('JSON must be an array of values or an array of objects.');
    }

    if (source.length === 0) return [];

    const first = source[0];

    if (typeof first === 'string' || typeof first === 'number') {
        return source.map((item, index) => {
            if (typeof item !== 'string' && typeof item !== 'number') {
                throw new Error('JSON array with primitive values must contain only strings/numbers.');
            }

            return {
                row: index + 1,
                value: String(item).trim(),
            };
        });
    }

    if (first != null && typeof first === 'object' && !Array.isArray(first)) {
        if (columnName == null || columnName.trim().length === 0) {
            throw new Error('`--column <name>` is required when JSON is an array of objects.');
        }

        return source.map((item, index) => {
            if (item == null || typeof item !== 'object' || Array.isArray(item)) {
                throw new Error('JSON object-array must contain only objects.');
            }

            const row = item as Record<string, unknown>;
            const key = Object.keys(row).find((k) => normalizeColumnName(k) === normalizeColumnName(columnName));
            const rawValue = key == null ? '' : row[key];
            const value = rawValue == null ? '' : String(rawValue).trim();

            return {
                row: index + 1,
                value,
            };
        });
    }

    throw new Error('Unsupported JSON value type for batch parsing.');
};

export const parseBatchValuesFile = async (filePath: string, columnName?: string): Promise<ParsedBatchValues> => {
    const extension = extname(filePath).toLowerCase();
    const rawContent = await readFile(filePath, 'utf8');

    if (extension === '.csv') {
        return {
            format: 'csv',
            records: parseCsvValues(rawContent, columnName),
        };
    }

    if (extension === '.json') {
        return {
            format: 'json',
            records: parseJsonValues(rawContent, columnName),
        };
    }

    throw new Error(`Unsupported file extension "${extension}". Use .csv or .json.`);
};
