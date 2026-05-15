/**
 * Convert .addField() calls in functions.js to .addFields({}) using a proper
 * template-literal-aware, paren-depth-tracking parser.
 */
const fs = require('fs');

// Restore from git first
const { execSync } = require('child_process');
execSync('git checkout HEAD -- handlers/functions.js');
console.log('Restored from git HEAD');

let content = fs.readFileSync('handlers/functions.js', 'utf8');

// ---- Apply simple regex fixes ----
const simpleReplacements = [
    [/new Discord\.MessageEmbed\(\)/g, 'new EmbedBuilder()'],
    [/guild\.me\.voice\.channel\b/g, 'guild.members.me?.voice?.channel'],
    [/guild\.me\.voice\.disconnect\b/g, 'guild.members.me?.voice?.disconnect'],
    [/guild\.me\.permissions\b/g, 'guild.members.me?.permissions'],
    [/guild\.me\.roles\b/g, 'guild.members.me?.roles'],
    [/guild\.me\.permissionsIn\b/g, 'guild.members.me?.permissionsIn'],
    [/\bguild\.me\b(?!\.)/g, 'guild.members.me'],
    [/Permissions\.FLAGS\.MANAGE_CHANNELS/g, 'PermissionFlagsBits.ManageChannels'],
    [/Permissions\.FLAGS\.MANAGE_MESSAGES/g, 'PermissionFlagsBits.ManageMessages'],
    [/Permissions\.FLAGS\.SEND_MESSAGES/g, 'PermissionFlagsBits.SendMessages'],
    [/Permissions\.FLAGS\.MOVE_MEMBERS/g, 'PermissionFlagsBits.MoveMembers'],
    [/Permissions\.FLAGS\.ADMINISTRATOR/g, 'PermissionFlagsBits.Administrator'],
    [/\.has\("ADMINISTRATOR"\)/g, '.has(PermissionFlagsBits.Administrator)'],
    [/channel\.type\s*===?\s*"GUILD_TEXT"/g, 'channel.type === ChannelType.GuildText'],
    [/channel\.type\s*===?\s*"GUILD_VOICE"/g, 'channel.type === ChannelType.GuildVoice'],
    [/type:\s*"GUILD_VOICE"/g, 'type: ChannelType.GuildVoice'],
    [/new Discord\.MessageAttachment\b/g, 'new AttachmentBuilder'],
    [/new MessageAttachment\b/g, 'new AttachmentBuilder'],
    [/new MessageButton\b/g, 'new ButtonBuilder'],
    [/new MessageActionRow\b/g, 'new ActionRowBuilder'],
    [/new MessageSelectMenu\b/g, 'new StringSelectMenuBuilder'],
];
for (const [re, repl] of simpleReplacements) content = content.replace(re, repl);

// Fix import block
const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\(["']discord\.js["']\);/;
const m = content.match(destructRe);
if (m) {
    let parts = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const toRemove = ['MessageEmbed','MessageAttachment','Permissions','MessageButton','MessageActionRow','MessageSelectMenu'];
    parts = parts.filter(p => !toRemove.includes(p));
    const needed = ['EmbedBuilder','AttachmentBuilder','PermissionFlagsBits','ChannelType','ButtonBuilder','ActionRowBuilder','StringSelectMenuBuilder','ButtonStyle'];
    for (const n of needed) if (!parts.includes(n)) parts.push(n);
    parts.sort();
    content = content.replace(destructRe, 'const {\n    ' + parts.join(',\n    ') + ',\n} = require("discord.js");');
}

// ---- addField -> addFields converter ----

const S_NORMAL = 0, S_SINGLE = 1, S_DOUBLE = 2, S_TEMPLATE = 3, S_LINE_CMT = 4, S_BLOCK_CMT = 5;

/**
 * Split top-level comma-separated args.
 * Tracks: string states (single/double/template), template expression nesting,
 * AND paren/bracket/brace depth for comma splitting.
 */
function splitArgs(str) {
    const parts = [];
    let current = '';
    let state = S_NORMAL;
    let depth = 0;          // paren/bracket depth at normal level
    let tmplDepth = 0;      // how many ${...} levels deep in template literals
    let tmplBraceStack = []; // stack of { depths for tracking close of ${

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        const next = str[i + 1];

        if (state === S_LINE_CMT) {
            current += ch;
            if (ch === '\n') state = S_NORMAL;
            continue;
        }
        if (state === S_BLOCK_CMT) {
            current += ch;
            if (ch === '*' && next === '/') { current += str[++i]; state = S_NORMAL; }
            continue;
        }
        if (state === S_SINGLE) {
            current += ch;
            if (ch === '\\') { current += str[++i]; }
            else if (ch === "'") { state = S_NORMAL; }
            continue;
        }
        if (state === S_DOUBLE) {
            current += ch;
            if (ch === '\\') { current += str[++i]; }
            else if (ch === '"') { state = S_NORMAL; }
            continue;
        }
        if (state === S_TEMPLATE) {
            current += ch;
            if (ch === '\\') { current += str[++i]; continue; }
            if (ch === '`') {
                // end of this template literal
                state = S_NORMAL;
                continue;
            }
            if (ch === '$' && next === '{') {
                current += str[++i]; // consume '{'
                // entering a template expression - track brace depth
                tmplBraceStack.push(0);
                tmplDepth++;
                state = S_NORMAL; // expression code inside ${}
            }
            continue;
        }

        // S_NORMAL
        // Handle template expression context
        if (tmplDepth > 0) {
            // We're inside ${...} of a template literal
            current += ch;
            if (ch === '/' && next === '/') { state = S_LINE_CMT; continue; }
            if (ch === '/' && next === '*') { state = S_BLOCK_CMT; continue; }
            if (ch === "'") { state = S_SINGLE; continue; }
            if (ch === '"') { state = S_DOUBLE; continue; }
            if (ch === '`') { state = S_TEMPLATE; continue; }
            if (ch === '{') {
                tmplBraceStack[tmplBraceStack.length - 1]++;
            } else if (ch === '}') {
                const top = tmplBraceStack[tmplBraceStack.length - 1];
                if (top > 0) {
                    tmplBraceStack[tmplBraceStack.length - 1]--;
                } else {
                    // This } closes the ${
                    tmplBraceStack.pop();
                    tmplDepth--;
                    state = S_TEMPLATE; // back to template literal
                }
            }
            // Note: don't split on comma when inside template expression
            continue;
        }

        // Top-level normal code
        if (ch === '/' && next === '/') { state = S_LINE_CMT; current += ch; continue; }
        if (ch === '/' && next === '*') { state = S_BLOCK_CMT; current += ch; continue; }
        if (ch === "'") { state = S_SINGLE; current += ch; continue; }
        if (ch === '"') { state = S_DOUBLE; current += ch; continue; }
        if (ch === '`') { state = S_TEMPLATE; current += ch; continue; }

        if (ch === '(' || ch === '[' || ch === '{') { depth++; current += ch; continue; }
        if (ch === ')' || ch === ']' || ch === '}') { depth--; current += ch; continue; }

        // Split on comma only at depth 0 in normal code outside template expressions
        if (ch === ',' && depth === 0) {
            parts.push(current);
            current = '';
            continue;
        }

        current += ch;
    }
    if (current.trim()) parts.push(current);
    return parts;
}

/**
 * Find closing ')' for '(' at position start.
 * Uses a proper state machine similar to splitArgs.
 */
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
        if (state === S_SINGLE) {
            if (ch === '\\') i++;
            else if (ch === "'") state = S_NORMAL;
            continue;
        }
        if (state === S_DOUBLE) {
            if (ch === '\\') i++;
            else if (ch === '"') state = S_NORMAL;
            continue;
        }
        if (state === S_TEMPLATE) {
            if (ch === '\\') { i++; continue; }
            if (ch === '`') { state = S_NORMAL; continue; }
            if (ch === '$' && next === '{') {
                i++; tmplBraceStack.push(0); tmplDepth++; state = S_NORMAL;
            }
            continue;
        }

        // S_NORMAL
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
        else if (ch === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

// ---- Process addField -> addFields ----
let result = '';
let i = 0;
let fixed = 0;

while (i < content.length) {
    const idx = content.indexOf('.addField(', i);
    if (idx === -1) { result += content.slice(i); break; }

    const openParen = idx + '.addField('.length - 1;
    const closeParen = findClose(content, openParen);
    if (closeParen === -1) { result += content.slice(i); break; }

    const argsStr = content.slice(openParen + 1, closeParen);
    const args = splitArgs(argsStr);

    result += content.slice(i, idx);

    if (args.length === 1) {
        result += `.addFields({ name: ${args[0].trim()}, value: '\u200b' })`;
    } else if (args.length === 2) {
        result += `.addFields({ name: ${args[0].trim()}, value: ${args[1].trim()} })`;
    } else if (args.length >= 3) {
        result += `.addFields({ name: ${args[0].trim()}, value: ${args[1].trim()}, inline: ${args[2].trim()} })`;
    } else {
        result += content.slice(idx, closeParen + 1);
    }

    fixed++;
    i = closeParen + 1;
}

fs.writeFileSync('handlers/functions.js', result, 'utf8');
console.log('Fixed', fixed, 'addField calls.');
