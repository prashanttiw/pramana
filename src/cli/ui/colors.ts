import chalk from 'chalk';

export const colors = {
    // Brand
    brand: chalk.hex('#7F77DD'),
    brandDim: chalk.hex('#7F77DD').dim,

    // Status
    success: chalk.hex('#1D9E75').bold,
    error: chalk.hex('#E24B4A').bold,
    warning: chalk.hex('#EF9F27').bold,
    info: chalk.hex('#378ADD'),

    // Text
    primary: chalk.white,
    muted: chalk.gray,
    label: chalk.white.bold,
    code: chalk.cyan,
    dim: chalk.dim,

    // Signals
    fraud: chalk.red.bold,
    safe: chalk.green,
    review: chalk.yellow,

    // Structure
    border: chalk.gray.dim,
    divider: chalk.gray.dim('\u2500'.repeat(50)),
};
