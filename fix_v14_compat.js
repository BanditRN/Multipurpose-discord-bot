#!/usr/bin/env node
/**
 * fix_v14_compat.js
 * Comprehensive Discord.js v13 → v14 compatibility fixer.
 * Run once from the repo root: node fix_v14_compat.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIRS = ['commands', 'slashCommands', 'handlers', 'social_log', 'events'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAllJsFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...getAllJsFiles(full));
        else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
    }
    return out;
}

/** Return the index of the closing paren matching the '(' at openPos. */
function findClosingParen(str, openPos) {
    let depth = 0, inStr = false, strChar = '', i = openPos;
    while (i < str.length) {
        const ch = str[i];
        if (inStr) {
            if (ch === '\\') { i += 2; continue; }
            if (ch === strChar) inStr = false;
        } else {
            if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; }
            else if (ch === '(') depth++;
            else if (ch === ')') { if (--depth === 0) return i; }
        }
        i++;
    }
    return -1;
}

/** Split the inside of a paren block into top-level comma-separated arguments. */
function splitArgs(inner) {
    const args = [];
    let depth = 0, inStr = false, strChar = '', cur = '', i = 0;
    while (i < inner.length) {
        const ch = inner[i];
        if (inStr) {
            if (ch === '\\') { cur += ch + inner[i + 1]; i += 2; continue; }
            if (ch === strChar) inStr = false;
            cur += ch;
        } else {
            if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; cur += ch; }
            else if (ch === '(' || ch === '[' || ch === '{') { depth++; cur += ch; }
            else if (ch === ')' || ch === ']' || ch === '}') { depth--; cur += ch; }
            else if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; i++; continue; }
            else cur += ch;
        }
        i++;
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
}

// ─── Individual fixers ───────────────────────────────────────────────────────

/** Replace old v13 class names with v14 equivalents (imports + usages). */
function fixClassNames(content) {
    const map = [
        ['MessageEmbed', 'EmbedBuilder'],
        ['MessageButton', 'ButtonBuilder'],
        ['MessageActionRow', 'ActionRowBuilder'],
        ['MessageSelectMenu', 'StringSelectMenuBuilder'],
    ];
    for (const [old, next] of map) {
        content = content.replace(new RegExp(`\\b${old}\\b`, 'g'), next);
    }
    return content;
}

/** Remove splitMessage from discord.js destructured imports. */
function fixSplitMessage(content) {
    // Only remove it from destructured require('discord.js') — not from local definitions
    // Pattern: within a { ... } = require("discord.js") block
    content = content.replace(
        /(const\s*\{[^}]*),?\s*splitMessage\s*,?([^}]*\}\s*=\s*require\(["']discord\.js["']\))/g,
        (match, before, after) => {
            // Clean up trailing/leading commas
            const cleaned = (before + after)
                .replace(/,\s*,/g, ',')
                .replace(/\{\s*,/, '{')
                .replace(/,\s*\}/, '}');
            return cleaned;
        }
    );
    return content;
}

/** guild.me → guild.members.me */
function fixGuildMe(content) {
    return content.replace(/\bguild\.me\b/g, 'guild.members.me');
}

/** Channel type string comparisons → ChannelType enum */
function fixChannelTypes(content) {
    const map = [
        ['GUILD_TEXT', 'GuildText'],
        ['GUILD_VOICE', 'GuildVoice'],
        ['GUILD_CATEGORY', 'GuildCategory'],
        ['GUILD_ANNOUNCEMENT', 'GuildAnnouncement'],
        ['GUILD_NEWS', 'GuildAnnouncement'],
        ['GUILD_STAGE_VOICE', 'GuildStageVoice'],
        ['GUILD_FORUM', 'GuildForum'],
        ['DM', 'DM'],
        ['GROUP_DM', 'GroupDM'],
    ];
    for (const [old, next] of map) {
        content = content.replace(
            new RegExp(`(\\.type\\s*===?\\s*)["']${old}["']`, 'g'),
            `$1ChannelType.${next}`
        );
    }
    return content;
}

/** .addField(name, value) → .addFields({ name, value }) */
function fixAddField(content) {
    let result = '', i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.addField(', i);
        if (idx === -1) { result += content.slice(i); break; }
        result += content.slice(i, idx);
        const openParen = idx + '.addField('.length - 1;
        const closeParen = findClosingParen(content, openParen);
        if (closeParen === -1) { result += content.slice(idx); i = content.length; break; }
        const inner = content.slice(openParen + 1, closeParen);
        const args = splitArgs(inner);
        if (args.length >= 2) {
            const [name, value, inline] = args;
            if (inline !== undefined) {
                result += `.addFields({ name: ${name}, value: ${value}, inline: ${inline} })`;
            } else {
                result += `.addFields({ name: ${name}, value: ${value} })`;
            }
        } else {
            result += content.slice(idx, closeParen + 1);
        }
        i = closeParen + 1;
    }
    return result;
}

/** .setFooter(text, icon) → .setFooter({ text, iconURL: icon }) */
function fixSetFooter(content) {
    let result = '', i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.setFooter(', i);
        if (idx === -1) { result += content.slice(i); break; }
        result += content.slice(i, idx);
        const openParen = idx + '.setFooter('.length - 1;
        const closeParen = findClosingParen(content, openParen);
        if (closeParen === -1) { result += content.slice(idx); i = content.length; break; }
        const inner = content.slice(openParen + 1, closeParen);
        const args = splitArgs(inner);
        const first = (args[0] || '').trimStart();
        if (args.length === 2 && !first.startsWith('{')) {
            // Two positional args — broken
            result += `.setFooter({ text: ${args[0]}, iconURL: ${args[1]} })`;
        } else if (args.length === 1 && !first.startsWith('{') &&
                   (first.startsWith('"') || first.startsWith("'") || first.startsWith('`'))) {
            // Single string literal — wrap in object
            result += `.setFooter({ text: ${args[0]} })`;
        } else {
            result += `.setFooter(${inner})`;
        }
        i = closeParen + 1;
    }
    return result;
}

/** .setAuthor(name, icon, url) → .setAuthor({ name, iconURL: icon, url }) */
function fixSetAuthor(content) {
    let result = '', i = 0;
    while (i < content.length) {
        const idx = content.indexOf('.setAuthor(', i);
        if (idx === -1) { result += content.slice(i); break; }
        result += content.slice(i, idx);
        const openParen = idx + '.setAuthor('.length - 1;
        const closeParen = findClosingParen(content, openParen);
        if (closeParen === -1) { result += content.slice(idx); i = content.length; break; }
        const inner = content.slice(openParen + 1, closeParen);
        const args = splitArgs(inner);
        const first = (args[0] || '').trimStart();
        if (first.startsWith('{') || args.length <= 0) {
            // Already an object or empty
            result += `.setAuthor(${inner})`;
        } else if (args.length === 1) {
            // Single non-object arg — wrap as name only
            result += `.setAuthor({ name: ${args[0]} })`;
        } else if (args.length === 2) {
            result += `.setAuthor({ name: ${args[0]}, iconURL: ${args[1]} || undefined })`;
        } else {
            result += `.setAuthor({ name: ${args[0]}, iconURL: ${args[1]} || undefined, url: ${args[2]} || undefined })`;
        }
        i = closeParen + 1;
    }
    return result;
}

/** Fix ButtonStyle string values in .setStyle() calls and color config assignments. */
function fixButtonStyles(content) {
    const styleMap = {
        'PRIMARY': 'ButtonStyle.Primary',
        'SECONDARY': 'ButtonStyle.Secondary',
        'SUCCESS': 'ButtonStyle.Success',
        'DANGER': 'ButtonStyle.Danger',
        'LINK': 'ButtonStyle.Link',
        'BLURPLE': 'ButtonStyle.Primary',
    };
    for (const [old, next] of Object.entries(styleMap)) {
        // .setStyle("PRIMARY") or .setStyle('PRIMARY')
        content = content.replace(
            new RegExp(`\\.setStyle\\(["'\`]${old}["'\`]\\)`, 'g'),
            `.setStyle(${next})`
        );
        // In button color config: xColor: "DANGER", oColor: "SUCCESS", etc.
        content = content.replace(
            new RegExp(`((?:x|o)Color:\\s*)["']${old}["']`, 'g'),
            `$1${next}`
        );
        // Default color assignments: this.xColor = "BLURPLE"
        content = content.replace(
            new RegExp(`(this\\.(?:x|o)Color\\s*=\\s*)["']${old}["']`, 'g'),
            `$1${next}`
        );
    }
    // .setStyle(`${gameData[player].color}`) → .setStyle(gameData[player].color)
    // because color is now already a ButtonStyle enum value
    content = content.replace(/\.setStyle\(`\$\{([^}]+)\}`\)/g, '.setStyle($1)');
    return content;
}

/** Ensure ChannelType is imported from discord.js if used. */
function ensureImport(content, identifier) {
    if (!content.includes(identifier)) return content;
    // Already in a destructured require
    const djiRe = /const\s*\{([^}]*)\}\s*=\s*require\(["']discord\.js["']\)/;
    const match = content.match(djiRe);
    if (match && match[1].includes(identifier)) return content; // already imported
    if (match) {
        // Add to existing destructure
        return content.replace(djiRe, `const {${match[1]}, ${identifier} } = require("discord.js")`);
    }
    // No discord.js destructure — add a new one at the top
    if (content.includes('require("discord.js")') || content.includes("require('discord.js')")) {
        // There's a non-destructured require — add import at top
        return `const { ${identifier} } = require("discord.js");\n` + content;
    }
    return content;
}

// ─── Process one file ────────────────────────────────────────────────────────

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');
    const original = content;

    content = fixClassNames(content);
    content = fixSplitMessage(content);
    content = fixGuildMe(content);
    content = fixChannelTypes(content);
    content = fixAddField(content);
    content = fixSetFooter(content);
    content = fixSetAuthor(content);
    content = fixButtonStyles(content);
    // Ensure imports for anything newly referenced
    content = ensureImport(content, 'ChannelType');
    content = ensureImport(content, 'ButtonStyle');

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        return true;
    }
    return false;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
    const allFiles = [];
    for (const d of DIRS) {
        allFiles.push(...getAllJsFiles(path.join(ROOT, d)));
    }

    let changed = 0, unchanged = 0, errors = 0;
    for (const f of allFiles) {
        try {
            if (processFile(f)) {
                console.log('Fixed:', path.relative(ROOT, f));
                changed++;
            } else {
                unchanged++;
            }
        } catch (e) {
            console.error('ERROR:', path.relative(ROOT, f), '-', e.message);
            errors++;
        }
    }
    console.log(`\n=== Done ===`);
    console.log(`Modified:  ${changed}`);
    console.log(`Unchanged: ${unchanged}`);
    console.log(`Errors:    ${errors}`);
}

main();
