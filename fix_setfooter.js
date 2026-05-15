/**
 * Fix 2-arg .setFooter(text, iconURL) -> .setFooter({ text, iconURL })
 * Skips calls that already use object form or client.getFooter()
 */
const fs = require('fs');
const path = require('path');

const dirs = ['handlers', 'events', 'social_log', 'commands'];

function walk(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) out.push(...walk(full));
        else if (f.endsWith('.js')) out.push(full);
    }
    return out;
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

// Find the index of the closing paren matching the open paren at content[start]
// start should point at the '(' character
function findMatchingParen(content, start) {
    let depth = 0;
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
            if (depth === 0) return j;
        }
    }
    return -1;
}

function fixSetFooterInContent(content) {
    let result = '';
    let i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.setFooter(', i);
        if (idx === -1) {
            result += content.slice(i);
            break;
        }

        const openParen = idx + '.setFooter('.length - 1; // index of '('
        const closeParen = findMatchingParen(content, openParen);
        if (closeParen === -1) {
            // malformed, skip
            result += content.slice(i);
            break;
        }

        // Check what's inside (trimmed)
        const innerRaw = content.slice(openParen + 1, closeParen);
        const inner = innerRaw.trimStart();

        // Already uses object form or getFooter - pass through unchanged
        if (inner.startsWith('{') || inner.includes('getFooter')) {
            result += content.slice(i, closeParen + 1);
            i = closeParen + 1;
            continue;
        }

        result += content.slice(i, idx);

        const args = splitTopLevelArgs(innerRaw);

        if (args.length === 1) {
            const val = args[0].trim();
            result += `.setFooter({ text: ${val} })`;
        } else if (args.length >= 2) {
            result += `.setFooter({ text: ${args[0].trim()}, iconURL: ${args[1].trim()} })`;
        } else {
            result += content.slice(idx, closeParen + 1);
        }
        i = closeParen + 1;
    }
    return result;
}

let totalFixed = 0;
const seen = new Set();

for (const dir of dirs) {
    for (const fpath of walk(dir)) {
        if (seen.has(fpath)) continue;
        seen.add(fpath);
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;
        content = fixSetFooterInContent(content);
        if (content !== orig) {
            fs.writeFileSync(fpath, content, 'utf8');
            console.log('Fixed:', path.relative(process.cwd(), fpath));
            totalFixed++;
        }
    }
}

console.log('\nTotal files fixed:', totalFixed);
