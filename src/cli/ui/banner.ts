import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';
import slantFont from 'figlet/importable-fonts/Slant.js';
import smallFont from 'figlet/importable-fonts/Small.js';
import { colors } from './colors';

export function showBanner(): void {
    const ascii = getAsciiTitle();
    const branded = gradient(['#7F77DD', '#378ADD']).multiline(ascii);

    const subtitle = colors.muted(`Indian Identity Document Validator  \u00b7  v${getVersion()}`);
    const badge = colors.dim(`@prashanttiw/pramana  \u00b7  zero dependencies`);
    const meta = boxen(`${subtitle}\n${badge}`, {
        borderStyle: 'round',
        borderColor: 'gray',
        padding: {
            left: 1,
            right: 1,
            top: 0,
            bottom: 0,
        },
        margin: 0,
    });

    console.log();
    console.log(branded);
    console.log(meta);
    console.log(colors.divider);
    console.log();
}

function getAsciiTitle(): string {
    try {
        figlet.parseFont('Slant', slantFont as string);
        return figlet.textSync('PRAMANA', { font: 'Slant' });
    } catch {
        try {
            figlet.parseFont('Small', smallFont as string);
            return figlet.textSync('PRAMANA', { font: 'Small' });
        } catch {
            return 'PRAMANA';
        }
    }
}

function getVersion(): string {
    const candidates = ['../../package.json', '../package.json', './package.json'];

    for (const candidate of candidates) {
        try {
            return require(candidate).version;
        } catch {
            // Try next candidate path.
        }
    }

    return '0.0.0';
}
