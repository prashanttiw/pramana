import Table from 'cli-table3';
import { colors } from './colors';

export type TableCell = string | number | boolean;

export interface TableColumn {
    header: string;
    width?: number;
    align?: 'left' | 'right' | 'center';
}

export const renderTable = (columns: TableColumn[], rows: TableCell[][]): string => {
    const hasCustomWidths = columns.some((column) => typeof column.width === 'number');
    const colWidths = hasCustomWidths
        ? columns.map((column) => column.width ?? 24)
        : undefined;

    const table = new Table({
        head: columns.map((column) => colors.label(column.header)),
        colWidths,
        colAligns: columns.map((column) => column.align ?? 'left'),
        wordWrap: true,
        style: {
            head: [],
            border: [],
        },
    });

    rows.forEach((row) => {
        table.push(row.map((cell) => String(cell)));
    });

    return table.toString();
};
