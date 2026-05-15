/**
 * 1. Fix imports: add PermissionFlagsBits/EmbedBuilder where used but missing; remove old v13 names
 * 2. Fix .setAuthor(name, iconURL, url) -> .setAuthor({ name, iconURL, url })
 */
const fs = require('fs');
const path = require('path');

const S_NORMAL = 0, S_SINGLE = 1, S_DOUBLE = 2, S_TEMPLATE = 3, S_LINE_CMT = 4, S_BLOCK_CMT = 5;

function findClose(content, start) {
    let state = S_NORMAL;
    let depth = 0;
    let tmplDepth = 0;
    let tmplBraceStack = [];

    for (let i = start; i < content.length; i++) {
        const ch = content[i];
        const next = content[i + 1];

        if (state === S_LINE_CMT) { if (ch === '\n') state = S_NORMAL; continue; }
        if (state === S_BLOCK_CMT) { if (ch === '*' && next === '/') { i++; state = S_NORMAL; } continue; }
        if (state === S_SINGLE) { if (ch === '\\') i++; else if (ch === "'") state = S_NORMAL; continue; }
        if (state === S_DOUBLE) { if (ch === '\\') i++; else if (ch === '"') state = S_NORMAL; continue; }
        if (state === S_TEMPLATE) {
            if (ch === '\\') { i++; continue; }
            if (ch === '`') { state = S_NORMAL; continue; }
            if (ch === '$' && next === '{') { i++; tmplBraceStack.push(0); tmplDepth++; state = S_NORMAL; }
            continue;
        }

        if (tmplDepth > 0) {
            if (ch === '/' && next === '/') { state = S_LINE_CMT; continue; }
            if (ch === '/' && next === '*') { state = S_BLOCK_CMT; continue; }
            if (ch === "'") { state = S_SINGLE; continue; }
            if (ch === '"') { state = S_DOUBLE; continue; }
            if (ch === '`') { state = S_TEMPLATE; continue; }
            if (ch === '{') tmplBraceStack[tmplBraceStack.length - 1]++;
            else if (ch === '}') {
                if (tmplBraceStack[tmplBraceStack.length - 1] > 0) tmplBraceStack[tmplBraceStack.length - 1]--;
                else { tmplBraceStack.pop(); tmplDepth--; state = S_TEMPLATE; }
            }
            continue;
        }

        if (ch === '/' && next === '/') { state = S_LINE_CMT; continue; }
        if (ch === '/' && next === '*') { state = S_BLOCK_CMT; continue; }
        if (ch === "'") { state = S_SINGLE; continue; }
        if (ch === '"') { state = S_DOUBLE; continue; }
        if (ch === '`') { state = S_TEMPLATE; continue; }
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (depth === 0) return i; }
    }
    return -1;
}

function splitArgs(str) {
    const parts = [];
    let current = '';
    let state = S_NORMAL;
    let depth = 0;
    let tmplDepth = 0;
    let tmplBraceStack = [];

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const next = str[i + 1];

        if (state === S_LINE_CMT) { current += ch; if (ch === '\n') state = S_NORMAL; continue; }
        if (state === S_BLOCK_CMT) { current += ch; if (ch === '*' && next === '/') { current += str[++i]; state = S_NORMAL; } continue; }
        if (state === S_SINGLE) { current += ch; if (ch === '\\') { current += str[++i]; } else if (ch === "'") { state = S_NORMAL; } continue; }
        if (state === S_DOUBLE) { current += ch; if (ch === '\\') { current += str[++i]; } else if (ch === '"') { state = S_NORMAL; } continue; }
        if (state === S_TEMPLATE) {
            current += ch;
            if (ch === '\\') { current += str[++i]; continue; }
            if (ch === '`') { state = S_NORMAL; continue; }
            if (ch === '$' && next === '{') { current += str[++i]; tmplBraceStack.push(0); tmplDepth++; state = S_NORMAL; }
            continue;
        }

        if (tmplDepth > 0) {
            current += ch;
            if (ch === '/' && next === '/') { state = S_LINE_CMT; continue; }
            if (ch === '/' && next === '*') { state = S_BLOCK_CMT; continue; }
            if (ch === "'") { state = S_SINGLE; continue; }
            if (ch === '"') { state = S_DOUBLE; continue; }
            if (ch === '`') { state = S_TEMPLATE; continue; }
            if (ch === '{') { tmplBraceStack[tmplBraceStack.length - 1]++; }
            else if (ch === '}') {
                const top = tmplBraceStack[tmplBraceStack.length - 1];
                if (top > 0) { tmplBraceStack[tmplBraceStack.length - 1]--; }
                else { tmplBraceStack.pop(); tmplDepth--; state = S_TEMPLATE; }
            }
            continue;
        }

        if (ch === '/' && next === '/') { state = S_LINE_CMT; current += ch; continue; }
        if (ch === '/' && next === '*') { state = S_BLOCK_CMT; current += ch; continue; }
        if (ch === "'") { state = S_SINGLE; current += ch; continue; }
        if (ch === '"') { state = S_DOUBLE; current += ch; continue; }
        if (ch === '`') { state = S_TEMPLATE; current += ch; continue; }
        if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch; continue; }
        if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch; continue; }
        if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
        current += ch;
    }
    if (current.trim()) parts.push(current);
    return parts;
}

function fixSetAuthor(content) {
    let result = '';
    let i = 0;
    let fixed = 0;

    while (i < content.length) {
        const idx = content.indexOf('.setAuthor(', i);
        if (idx === -1) { result += content.slice(i); break; }

        const openParen = idx + '.setAuthor('.length - 1;
        const closeParen = findClose(content, openParen);
        if (closeParen === -1) { result += content.slice(i); break; }

        const innerRaw = content.slice(openParen + 1, closeParen);
        const inner = innerRaw.trimStart();

        // Already object form or getAuthor/null/undefined - skip
        if (inner.startsWith('{') || inner.includes('getAuthor') ||
            inner.trim() === 'null' || inner.trim() === 'undefined') {
            result += content.slice(i, closeParen + 1);
            i = closeParen + 1;
            continue;
        }

        result += content.slice(i, idx);
        const args = splitArgs(innerRaw);

        if (args.length === 1) {
            result += `.setAuthor({ name: ${args[0].trim()} })`;
        } else if (args.length === 2) {
            result += `.setAuthor({ name: ${args[0].trim()}, iconURL: ${args[1].trim()} })`;
        } else if (args.length >= 3) {
            result += `.setAuthor({ name: ${args[0].trim()}, iconURL: ${args[1].trim()}, url: ${args[2].trim()} })`;
        } else {
            result += content.slice(idx, closeParen + 1);
        }

        fixed++;
        i = closeParen + 1;
    }
    return { result, fixed };
}

// Old v13 names to remove from any destructured discord.js import
const REMOVE_NAMES = new Set([
    'MessageEmbed', 'MessageAttachment', 'Permissions',
    'MessageButton', 'MessageActionRow', 'MessageSelectMenu',
    'MessageSelectOption',
]);

// Names to add if used in the file content
const NEEDED_NAMES = [
    'EmbedBuilder',
    'PermissionFlagsBits',
    'ButtonBuilder',
    'ActionRowBuilder',
    'StringSelectMenuBuilder',
    'AttachmentBuilder',
    'ButtonStyle',
    'ChannelType',
    'ModalBuilder',
    'TextInputBuilder',
    'TextInputStyle',
];

// Matches any destructured require('discord.js') regardless of quote style or keyword
// [^}]+ matches multi-line content (including newlines) since it's "not }"
const IMPORT_RE = /((?:const|var|let)\s*\{)([^}]+)(\}\s*=\s*require\([`'"']discord\.js[`'"']\);)/g;

function fixImports(content) {
    let hasDestructure = false;
    let insertNames = [];

    // Fix existing destructured imports: remove old names
    content = content.replace(IMPORT_RE, (match, open, inner, close) => {
        hasDestructure = true;
        let parts = inner.split(',').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean);
        // Remove old names
        parts = parts.filter(p => !REMOVE_NAMES.has(p));
        // Add v14 names if they appear in the file
        for (const name of NEEDED_NAMES) {
            const re = new RegExp(`\\b${name}\\b`);
            if (!parts.includes(name) && re.test(content)) {
                parts.push(name);
            }
        }
        parts.sort();
        // Use double quotes for consistency
        return 'const {\n    ' + parts.join(',\n    ') + ',\n} = require("discord.js");';
    });

    // If no destructure existed, but file uses PermissionFlagsBits/EmbedBuilder, add one
    if (!hasDestructure) {
        for (const name of NEEDED_NAMES) {
            const re = new RegExp(`\\b${name}\\b`);
            if (re.test(content)) insertNames.push(name);
        }
        if (insertNames.length > 0) {
            insertNames.sort();
            // Insert after the first `require("discord.js")` line (any style)
            const discordRequireRe = /((?:const|var|let)\s+\w+\s*=\s*require\([`'"']discord\.js[`'"']\);)/;
            if (discordRequireRe.test(content)) {
                content = content.replace(discordRequireRe, (m) =>
                    m + '\nconst {\n    ' + insertNames.join(',\n    ') + ',\n} = require("discord.js");');
            }
        }
    }

    return content;
}

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

const dirs = ['handlers', 'commands', 'events', 'social_log'];
let totalFixed = 0;

for (const dir of dirs) {
    for (const fpath of walk(dir)) {
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;

        // Fix setAuthor
        const { result: afterAuthor, fixed: authorFixed } = fixSetAuthor(content);
        content = afterAuthor;

        // Fix imports
        content = fixImports(content);

        if (content !== orig) {
            fs.writeFileSync(fpath, content, 'utf8');
            const rel = path.relative(process.cwd(), fpath);
            console.log(`Fixed: ${rel}${authorFixed ? ` (setAuthor: ${authorFixed})` : ''}`);
            totalFixed++;
        }
    }
}

console.log(`\nTotal files modified: ${totalFixed}`);
