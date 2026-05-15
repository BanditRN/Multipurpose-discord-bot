/**
 * Fix 7 restored command files + functions.js MessageEmbed:
 * - Simple regex replacements (MessageEmbed, MessageButton, PermissionFlagsBits, etc.)
 * - addField -> addFields using proper state machine parser
 * - Import block update
 */
const fs = require('fs');

const S_NORMAL = 0, S_SINGLE = 1, S_DOUBLE = 2, S_TEMPLATE = 3, S_LINE_CMT = 4, S_BLOCK_CMT = 5;

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

        // S_NORMAL
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
        else if (ch === ')') { depth--; if (depth === 0) return i; }
    }
    return -1;
}

function fixAddFields(content) {
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
    return { result, fixed };
}

const simpleReplacements = [
    [/new Discord\.MessageEmbed\(\)/g, 'new EmbedBuilder()'],
    [/new MessageEmbed\(\)/g, 'new EmbedBuilder()'],
    [/new\s+Discord\.MessageEmbed\b/g, 'new EmbedBuilder'],
    [/new\s+MessageEmbed\b/g, 'new EmbedBuilder'],
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
    [/Permissions\.FLAGS\.BAN_MEMBERS/g, 'PermissionFlagsBits.BanMembers'],
    [/Permissions\.FLAGS\.KICK_MEMBERS/g, 'PermissionFlagsBits.KickMembers'],
    [/Permissions\.FLAGS\.MANAGE_GUILD/g, 'PermissionFlagsBits.ManageGuild'],
    [/Permissions\.FLAGS\.MANAGE_ROLES/g, 'PermissionFlagsBits.ManageRoles'],
    [/Permissions\.FLAGS\.MANAGE_NICKNAMES/g, 'PermissionFlagsBits.ManageNicknames'],
    [/Permissions\.FLAGS\.MUTE_MEMBERS/g, 'PermissionFlagsBits.MuteMembers'],
    [/Permissions\.FLAGS\.DEAFEN_MEMBERS/g, 'PermissionFlagsBits.DeafenMembers'],
    [/Permissions\.FLAGS\.VIEW_CHANNEL/g, 'PermissionFlagsBits.ViewChannel'],
    [/Permissions\.FLAGS\.CONNECT/g, 'PermissionFlagsBits.Connect'],
    [/Permissions\.FLAGS\.SPEAK/g, 'PermissionFlagsBits.Speak'],
    [/Permissions\.FLAGS\.EMBED_LINKS/g, 'PermissionFlagsBits.EmbedLinks'],
    [/Permissions\.FLAGS\.ATTACH_FILES/g, 'PermissionFlagsBits.AttachFiles'],
    [/Permissions\.FLAGS\.READ_MESSAGE_HISTORY/g, 'PermissionFlagsBits.ReadMessageHistory'],
    [/Permissions\.FLAGS\.USE_EXTERNAL_EMOJIS/g, 'PermissionFlagsBits.UseExternalEmojis'],
    [/Permissions\.FLAGS\.ADD_REACTIONS/g, 'PermissionFlagsBits.AddReactions'],
    [/Permissions\.FLAGS\.PRIORITY_SPEAKER/g, 'PermissionFlagsBits.PrioritySpeaker'],
    [/Permissions\.FLAGS\.STREAM/g, 'PermissionFlagsBits.Stream'],
    [/\.has\("ADMINISTRATOR"\)/g, '.has(PermissionFlagsBits.Administrator)'],
    [/channel\.type\s*===?\s*"GUILD_TEXT"/g, 'channel.type === ChannelType.GuildText'],
    [/channel\.type\s*===?\s*"GUILD_VOICE"/g, 'channel.type === ChannelType.GuildVoice'],
    [/type:\s*"GUILD_VOICE"/g, 'type: ChannelType.GuildVoice'],
    [/new Discord\.MessageAttachment\b/g, 'new AttachmentBuilder'],
    [/new MessageAttachment\b/g, 'new AttachmentBuilder'],
    [/new MessageButton\b/g, 'new ButtonBuilder'],
    [/new MessageActionRow\b/g, 'new ActionRowBuilder'],
    [/new MessageSelectMenu\b/g, 'new StringSelectMenuBuilder'],
    // memberpermissions string → array of PermissionFlagsBits
    [/"ADMINISTRATOR"/g, 'PermissionFlagsBits.Administrator'],
];

function fixImports(content, filePath) {
    // Fix `const { ... } = require("discord.js")` style imports
    const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\([\"']discord\.js[\"']\);/;
    const m = content.match(destructRe);
    if (m) {
        let parts = m[1].split(',').map(s => s.trim()).filter(Boolean);
        const toRemove = ['MessageEmbed','MessageAttachment','Permissions','MessageButton','MessageActionRow','MessageSelectMenu','MessageSelectOption'];
        parts = parts.filter(p => !toRemove.includes(p));
        const needed = ['EmbedBuilder','PermissionFlagsBits'];
        for (const n of needed) if (!parts.includes(n)) parts.push(n);
        // Add others if used in file
        const optNeeded = [
            ['AttachmentBuilder', /new AttachmentBuilder/],
            ['ButtonBuilder', /new ButtonBuilder/],
            ['ActionRowBuilder', /new ActionRowBuilder/],
            ['StringSelectMenuBuilder', /new StringSelectMenuBuilder/],
            ['ButtonStyle', /ButtonStyle\./],
            ['ChannelType', /ChannelType\./],
        ];
        for (const [name, re] of optNeeded) {
            if (re.test(content) && !parts.includes(name)) parts.push(name);
        }
        parts.sort();
        content = content.replace(destructRe, 'const {\n    ' + parts.join(',\n    ') + ',\n} = require("discord.js");');
    }

    // Fix `var { MessageEmbed } = require('discord.js')` style
    const varDestructRe = /var\s*\{([^}]+)\}\s*=\s*require\([\"']discord\.js[\"']\);/;
    const vm = content.match(varDestructRe);
    if (vm) {
        let parts = vm[1].split(',').map(s => s.trim()).filter(Boolean);
        const toRemove = ['MessageEmbed','MessageAttachment','Permissions','MessageButton','MessageActionRow','MessageSelectMenu'];
        parts = parts.filter(p => !toRemove.includes(p));
        const needed = ['EmbedBuilder','PermissionFlagsBits'];
        for (const n of needed) if (!parts.includes(n)) parts.push(n);
        const optNeeded = [
            ['AttachmentBuilder', /new AttachmentBuilder/],
            ['ButtonBuilder', /new ButtonBuilder/],
            ['ActionRowBuilder', /new ActionRowBuilder/],
            ['StringSelectMenuBuilder', /new StringSelectMenuBuilder/],
            ['ButtonStyle', /ButtonStyle\./],
            ['ChannelType', /ChannelType\./],
        ];
        for (const [name, re] of optNeeded) {
            if (re.test(content) && !parts.includes(name)) parts.push(name);
        }
        parts.sort();
        content = content.replace(varDestructRe, 'const {\n    ' + parts.join(',\n    ') + ',\n} = require("discord.js");');
    }

    return content;
}

// Files to process
const targets = [
    'handlers/functions.js',  // only needs MessageEmbed fix (addField already done)
    'commands/\uD83D\uDCAA Setup/setup-antinewaccount.js',
    'commands/\uD83D\uDCAA Setup/setup-embed.js',
    'commands/\uD83D\uDCAA Setup/setup-joinlist.js',
    'commands/\uD83D\uDD30 Info/help.js',
    'commands/\uD83D\uDD30 Info/permissions.js',
    'commands/\uD83D\uDD30 Info/roleinfo.js',
    'commands/\uD83D\uDD30 Info/userinfo.js',
];

for (const fpath of targets) {
    let content = fs.readFileSync(fpath, 'utf8');
    const orig = content;

    // Apply simple regex replacements
    for (const [re, repl] of simpleReplacements) {
        content = content.replace(re, repl);
    }

    // Fix addFields (skip functions.js since it's already done)
    let addFixed = 0;
    if (fpath !== 'handlers/functions.js') {
        const { result, fixed } = fixAddFields(content);
        content = result;
        addFixed = fixed;
    }

    // Fix imports
    content = fixImports(content, fpath);

    if (content !== orig) {
        fs.writeFileSync(fpath, content, 'utf8');
        console.log(`Fixed: ${fpath} (addField: ${addFixed})`);
    } else {
        console.log(`No changes: ${fpath}`);
    }
}
console.log('\nDone.');
