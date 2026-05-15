const fs = require('fs');
const path = require('path');

const filesToFix = [
    path.join(__dirname, 'handlers', 'functions.js'),
];

const dirsToFix = [
    path.join(__dirname, 'commands', '\uD83C\uDFB6 Music'),
    path.join(__dirname, 'handlers', 'playermanagers'),
    path.join(__dirname, 'handlers'),
    path.join(__dirname, 'commands'),
    path.join(__dirname, 'events'),
    path.join(__dirname, 'social_log'),
];

// Collect all js files from a directory recursively
function collectFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) results.push(...collectFiles(full));
        else if (f.endsWith('.js')) results.push(full);
    }
    return results;
}

function splitTopLevelArgs(str) {
    const parts = [];
    let depth = 0;
    let current = '';
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (inString) {
            current += ch;
            if (ch === stringChar && str[i - 1] !== '\\') inString = false;
        } else if (ch === '"' || ch === "'" || ch === '`') {
            inString = true;
            stringChar = ch;
            current += ch;
        } else if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
            current += ch;
        } else if (ch === ')' || ch === ']' || ch === '}') {
            depth--;
            current += ch;
        } else if (ch === ',' && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) parts.push(current);
    return parts;
}

function fixAddFieldsInContent(content) {
    let result = '';
    let i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.addField(', i);
        if (idx === -1) {
            result += content.slice(i);
            break;
        }
        result += content.slice(i, idx);
        let depth = 0;
        let start = idx + '.addField('.length - 1;
        let end = start;
        let inStr = false;
        let strCh = '';
        for (let j = start; j < content.length; j++) {
            const ch = content[j];
            if (inStr) {
                if (ch === strCh && content[j - 1] !== '\\') inStr = false;
            } else if (ch === '"' || ch === "'" || ch === '`') {
                inStr = true;
                strCh = ch;
            } else if (ch === '(') {
                depth++;
            } else if (ch === ')') {
                depth--;
                if (depth === 0) {
                    end = j;
                    break;
                }
            }
        }
        const argsStr = content.slice(start + 1, end);
        const args = splitTopLevelArgs(argsStr);

        if (args.length === 1) {
            result += `.addFields({ name: ${args[0].trim()}, value: '\u200b' })`;
        } else if (args.length === 2) {
            result += `.addFields({ name: ${args[0].trim()}, value: ${args[1].trim()} })`;
        } else if (args.length >= 3) {
            result += `.addFields({ name: ${args[0].trim()}, value: ${args[1].trim()}, inline: ${args[2].trim()} })`;
        } else {
            result += content.slice(idx, end + 1);
        }
        i = end + 1;
    }
    return result;
}

function fixSetAuthorInContent(content) {
    let result = '';
    let i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.setAuthor(', i);
        if (idx === -1) {
            result += content.slice(i);
            break;
        }
        const after = content.slice(idx + '.setAuthor('.length).trimStart();
        if (after.startsWith('{')) {
            result += content.slice(i, idx + '.setAuthor({'.length);
            i = idx + '.setAuthor({'.length;
            continue;
        }
        result += content.slice(i, idx);

        let depth = 0;
        let start = idx + '.setAuthor('.length - 1;
        let end = start;
        let inStr = false;
        let strCh = '';
        for (let j = start; j < content.length; j++) {
            const ch = content[j];
            if (inStr) {
                if (ch === strCh && content[j - 1] !== '\\') inStr = false;
            } else if (ch === '"' || ch === "'" || ch === '`') {
                inStr = true;
                strCh = ch;
            } else if (ch === '(') {
                depth++;
            } else if (ch === ')') {
                depth--;
                if (depth === 0) {
                    end = j;
                    break;
                }
            }
        }
        const argsStr = content.slice(start + 1, end);
        const args = splitTopLevelArgs(argsStr);

        if (args.length === 1) {
            result += `.setAuthor({ name: ${args[0].trim()} })`;
        } else if (args.length === 2) {
            result += `.setAuthor({ name: ${args[0].trim()}, iconURL: ${args[1].trim()} })`;
        } else if (args.length >= 3) {
            result += `.setAuthor({ name: ${args[0].trim()}, iconURL: ${args[1].trim()}, url: ${args[2].trim()} })`;
        } else {
            result += content.slice(idx, end + 1);
        }
        i = end + 1;
    }
    return result;
}

let totalFixed = 0;

// Fix individual files
for (const fpath of filesToFix) {
    if (!fs.existsSync(fpath)) continue;
    let content = fs.readFileSync(fpath, 'utf8');
    const orig = content;
    content = fixAddFieldsInContent(content);
    content = fixSetAuthorInContent(content);
    if (content !== orig) {
        fs.writeFileSync(fpath, content, 'utf8');
        console.log('Fixed: ' + path.basename(fpath));
        totalFixed++;
    }
}

// Fix directories (recursively)
const seen = new Set();
for (const dir of dirsToFix) {
    for (const fpath of collectFiles(dir)) {
        if (seen.has(fpath)) continue;
        seen.add(fpath);
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;
        content = fixAddFieldsInContent(content);
        content = fixSetAuthorInContent(content);
        if (content !== orig) {
            fs.writeFileSync(fpath, content, 'utf8');
            console.log('Fixed: ' + path.relative(__dirname, fpath));
            totalFixed++;
        }
    }
}

console.log('\nTotal files fixed: ' + totalFixed);
