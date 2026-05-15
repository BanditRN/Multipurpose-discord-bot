/**
 * Batch-fix Discord.js v13 -> v14 patterns across all handler/event files.
 */
const fs = require('fs');
const path = require('path');

const targets = ['handlers', 'events', 'social_log', 'commands'];

const simpleReplacements = [
    [/new Discord\.MessageEmbed\(\)/g, 'new EmbedBuilder()'],
    [/new MessageEmbed\(\)/g, 'new EmbedBuilder()'],
    [/new Discord\.MessageButton\(\)/g, 'new ButtonBuilder()'],
    [/new MessageButton\(\)/g, 'new ButtonBuilder()'],
    [/new Discord\.MessageActionRow\(\)/g, 'new ActionRowBuilder()'],
    [/new MessageActionRow\(\)/g, 'new ActionRowBuilder()'],
    // guild.me specific patterns
    [/guild\.me\.voice\.channel\b/g, 'guild.members.me?.voice?.channel'],
    [/guild\.me\.voice\.disconnect\b/g, 'guild.members.me?.voice?.disconnect'],
    [/guild\.me\.voice\.suppress\b/g, 'guild.members.me?.voice?.suppress'],
    [/guild\.me\.permissions\b/g, 'guild.members.me?.permissions'],
    [/guild\.me\.roles\b/g, 'guild.members.me?.roles'],
    [/guild\.me\.permissionsIn\b/g, 'guild.members.me?.permissionsIn'],
    [/\bguild\.me\b(?!\.)/g, 'guild.members.me'],
    // Permissions.FLAGS
    [/Discord\.Permissions\.FLAGS\.MANAGE_CHANNELS/g, 'PermissionFlagsBits.ManageChannels'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_ROLES/g, 'PermissionFlagsBits.ManageRoles'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_MESSAGES/g, 'PermissionFlagsBits.ManageMessages'],
    [/Discord\.Permissions\.FLAGS\.KICK_MEMBERS/g, 'PermissionFlagsBits.KickMembers'],
    [/Discord\.Permissions\.FLAGS\.BAN_MEMBERS/g, 'PermissionFlagsBits.BanMembers'],
    [/Discord\.Permissions\.FLAGS\.ADMINISTRATOR/g, 'PermissionFlagsBits.Administrator'],
    [/Discord\.Permissions\.FLAGS\.SEND_MESSAGES/g, 'PermissionFlagsBits.SendMessages'],
    [/Discord\.Permissions\.FLAGS\.VIEW_CHANNEL/g, 'PermissionFlagsBits.ViewChannel'],
    [/Discord\.Permissions\.FLAGS\.EMBED_LINKS/g, 'PermissionFlagsBits.EmbedLinks'],
    [/Discord\.Permissions\.FLAGS\.ATTACH_FILES/g, 'PermissionFlagsBits.AttachFiles'],
    [/Discord\.Permissions\.FLAGS\.READ_MESSAGE_HISTORY/g, 'PermissionFlagsBits.ReadMessageHistory'],
    [/Discord\.Permissions\.FLAGS\.ADD_REACTIONS/g, 'PermissionFlagsBits.AddReactions'],
    [/Discord\.Permissions\.FLAGS\.CONNECT/g, 'PermissionFlagsBits.Connect'],
    [/Discord\.Permissions\.FLAGS\.SPEAK/g, 'PermissionFlagsBits.Speak'],
    [/Discord\.Permissions\.FLAGS\.MOVE_MEMBERS/g, 'PermissionFlagsBits.MoveMembers'],
    [/Discord\.Permissions\.FLAGS\.MUTE_MEMBERS/g, 'PermissionFlagsBits.MuteMembers'],
    [/Discord\.Permissions\.FLAGS\.DEAFEN_MEMBERS/g, 'PermissionFlagsBits.DeafenMembers'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_NICKNAMES/g, 'PermissionFlagsBits.ManageNicknames'],
    [/Discord\.Permissions\.FLAGS\.MENTION_EVERYONE/g, 'PermissionFlagsBits.MentionEveryone'],
    [/Discord\.Permissions\.FLAGS\.CHANGE_NICKNAME/g, 'PermissionFlagsBits.ChangeNickname'],
    [/Discord\.Permissions\.FLAGS\.USE_EXTERNAL_EMOJIS/g, 'PermissionFlagsBits.UseExternalEmojis'],
    [/Discord\.Permissions\.FLAGS\.CREATE_INSTANT_INVITE/g, 'PermissionFlagsBits.CreateInstantInvite'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_GUILD/g, 'PermissionFlagsBits.ManageGuild'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_WEBHOOKS/g, 'PermissionFlagsBits.ManageWebhooks'],
    [/Discord\.Permissions\.FLAGS\.MANAGE_EMOJIS_AND_STICKERS/g, 'PermissionFlagsBits.ManageEmojisAndStickers'],
    // String permission checks inside .has()
    [/\.has\("ADMINISTRATOR"\)/g, '.has(PermissionFlagsBits.Administrator)'],
    [/\.has\("MANAGE_CHANNELS"\)/g, '.has(PermissionFlagsBits.ManageChannels)'],
    [/\.has\("MANAGE_ROLES"\)/g, '.has(PermissionFlagsBits.ManageRoles)'],
    [/\.has\("MANAGE_MESSAGES"\)/g, '.has(PermissionFlagsBits.ManageMessages)'],
    [/\.has\("KICK_MEMBERS"\)/g, '.has(PermissionFlagsBits.KickMembers)'],
    [/\.has\("BAN_MEMBERS"\)/g, '.has(PermissionFlagsBits.BanMembers)'],
    [/\.has\("SEND_MESSAGES"\)/g, '.has(PermissionFlagsBits.SendMessages)'],
    [/\.has\("VIEW_CHANNEL"\)/g, '.has(PermissionFlagsBits.ViewChannel)'],
    [/\.has\("EMBED_LINKS"\)/g, '.has(PermissionFlagsBits.EmbedLinks)'],
    [/\.has\("ATTACH_FILES"\)/g, '.has(PermissionFlagsBits.AttachFiles)'],
    [/\.has\("MOVE_MEMBERS"\)/g, '.has(PermissionFlagsBits.MoveMembers)'],
    [/\.has\("CONNECT"\)/g, '.has(PermissionFlagsBits.Connect)'],
    [/\.has\("SPEAK"\)/g, '.has(PermissionFlagsBits.Speak)'],
    [/\.has\("MANAGE_GUILD"\)/g, '.has(PermissionFlagsBits.ManageGuild)'],
    [/\.has\("MANAGE_WEBHOOKS"\)/g, '.has(PermissionFlagsBits.ManageWebhooks)'],
    // Channel type strings
    [/channel\.type\s*===?\s*"GUILD_TEXT"/g, 'channel.type === ChannelType.GuildText'],
    [/channel\.type\s*===?\s*"GUILD_VOICE"/g, 'channel.type === ChannelType.GuildVoice'],
    [/channel\.type\s*===?\s*"GUILD_NEWS"/g, 'channel.type === ChannelType.GuildNews'],
    [/channel\.type\s*===?\s*"GUILD_CATEGORY"/g, 'channel.type === ChannelType.GuildCategory'],
    [/channel\.type\s*===?\s*"DM"/g, 'channel.type === ChannelType.DM'],
    [/channel\.type\s*===?\s*'GUILD_TEXT'/g, 'channel.type === ChannelType.GuildText'],
    [/channel\.type\s*===?\s*'GUILD_VOICE'/g, 'channel.type === ChannelType.GuildVoice'],
    [/channel\.type\s*===?\s*'GUILD_NEWS'/g, 'channel.type === ChannelType.GuildNews'],
];

function ensureImports(content) {
    const needs = {
        EmbedBuilder: /new EmbedBuilder\(\)/.test(content),
        ButtonBuilder: /new ButtonBuilder\(\)/.test(content),
        ActionRowBuilder: /new ActionRowBuilder\(\)/.test(content),
        PermissionFlagsBits: /PermissionFlagsBits\./.test(content),
        ChannelType: /ChannelType\./.test(content),
        ButtonStyle: content.includes('ButtonStyle.') && !content.includes('ButtonStyle ='),
    };

    const toAdd = Object.entries(needs).filter(([k, v]) => v && !content.includes(k)).map(([k]) => k);
    if (toAdd.length === 0) return content;

    // Try to add to an existing discord.js destructure import
    const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\(["']discord\.js["']\);/;
    const m = content.match(destructRe);
    if (m) {
        const existing = m[1].split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...new Set([...existing, ...toAdd])].sort();
        return content.replace(destructRe, `const { ${merged.join(', ')} } = require('discord.js');`);
    }

    // Otherwise inject after the first require('discord.js') line
    return content.replace(
        /((?:const|var|let)\s+\w+\s*=\s*require\(["']discord\.js["']\);)/,
        `$1\nconst { ${toAdd.join(', ')} } = require('discord.js');`
    );
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const orig = content;
    for (const [re, repl] of simpleReplacements) {
        content = content.replace(re, repl);
    }
    content = ensureImports(content);
    if (content !== orig) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

function walk(dir) {
    const out = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) out.push(...walk(full));
        else if (f.endsWith('.js')) out.push(full);
    }
    return out;
}

let fixed = 0;
for (const t of targets) {
    const p = path.join(process.cwd(), t);
    if (!fs.existsSync(p)) continue;
    const files = fs.statSync(p).isDirectory() ? walk(p) : [p];
    for (const file of files) {
        try {
            if (processFile(file)) {
                console.log('Fixed:', path.relative(process.cwd(), file));
                fixed++;
            }
        } catch (e) {
            console.error('Error:', file, e.message);
        }
    }
}
console.log('\nTotal files fixed:', fixed);
