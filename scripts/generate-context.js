const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'CONTEXT.md';
const TARGET_DIRS = ['src'];
const IGNORE_PATTERNS = ['.test.ts', '.spec.ts', 'node_modules', 'dist'];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + '/' + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

function generateContext() {
    let output = '# Pramana Codebase Context\n\n';
    output += '> Generated on ' + new Date().toISOString() + '\n\n';

    // Add Project Root Files
    const rootFiles = ['package.json', 'tsconfig.json', 'tsup.config.ts', 'ARCHITECTURE.md'];
    rootFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            output += `## File: ${file}\n\`\`\`${path.extname(file).substring(1) || 'json'}\n`;
            output += fs.readFileSync(filePath, 'utf8');
            output += '\n\`\`\`\n\n';
        }
    });

    // Add Source Files
    let files = [];
    TARGET_DIRS.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (fs.existsSync(fullPath)) {
            files = files.concat(getAllFiles(fullPath));
        }
    });

    files.forEach(file => {
        const relativePath = path.relative(process.cwd(), file);
        const isIgnored = IGNORE_PATTERNS.some(pattern => relativePath.includes(pattern));

        if (!isIgnored) {
            output += `## File: ${relativePath}\n\`\`\`typescript\n`;
            output += fs.readFileSync(file, 'utf8');
            output += '\n\`\`\`\n\n';
        }
    });

    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`Context generated at ${OUTPUT_FILE}`);
}

generateContext();
