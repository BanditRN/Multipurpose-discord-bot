/**
 * Fix remaining Permissions.FLAGS patterns not caught by fix_all_handlers.js
 * - Permissions.FLAGS.X (without Discord. prefix)
 * - Multiline Discord.Permissions.FLAGS\n.X
 */
const fs = require('fs');
const path = require('path');

const flagMap = {
    MANAGE_MESSAGES: 'ManageMessages',
    MANAGE_CHANNELS: 'ManageChannels',
    SEND_MESSAGES: 'SendMessages',
    EMBED_LINKS: 'EmbedLinks',
    CREATE_INSTANT_INVITE: 'CreateInstantInvite',
    MANAGE_ROLES: 'ManageRoles',
    KICK_MEMBERS: 'KickMembers',
    BAN_MEMBERS: 'BanMembers',
    ADMINISTRATOR: 'Administrator',
    VIEW_CHANNEL: 'ViewChannel',
    ATTACH_FILES: 'AttachFiles',
    READ_MESSAGE_HISTORY: 'ReadMessageHistory',
    ADD_REACTIONS: 'AddReactions',
    CONNECT: 'Connect',
    SPEAK: 'Speak',
    MOVE_MEMBERS: 'MoveMembers',
    MUTE_MEMBERS: 'MuteMembers',
    DEAFEN_MEMBERS: 'DeafenMembers',
    MANAGE_NICKNAMES: 'ManageNicknames',
    MENTION_EVERYONE: 'MentionEveryone',
    CHANGE_NICKNAME: 'ChangeNickname',
    USE_EXTERNAL_EMOJIS: 'UseExternalEmojis',
    MANAGE_GUILD: 'ManageGuild',
    MANAGE_WEBHOOKS: 'ManageWebhooks',
    MANAGE_EMOJIS_AND_STICKERS: 'ManageEmojisAndStickers',
};

const files = [
    'handlers/aichat.js',
    'handlers/anticaps.js',
    'handlers/anti_nuke.js',
    'handlers/apply.js',
    'handlers/counter.js',
    'handlers/functions.js',
    'handlers/jointocreate.js',
    'handlers/ticket.js',
    'handlers/ticketevent.js',
    'handlers/welcome.js',
];

let totalFixed = 0;

for (const relPath of files) {
    const fpath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fpath)) continue;

    let content = fs.readFileSync(fpath, 'utf8');
    const orig = content;

    // Fix multiline: Discord.Permissions.FLAGS\n   .FLAGNAME  or Permissions.FLAGS\n   .FLAGNAME
    for (const [flag, v14] of Object.entries(flagMap)) {
        // Multiline form: (Discord.)Permissions.FLAGS\n<whitespace>.FLAG_NAME
        content = content.replace(
            new RegExp(`(?:Discord\\.)?Permissions\\.FLAGS\\s*\\n(\\s*)\\.${flag}\\b`, 'g'),
            `PermissionFlagsBits.${v14}`
        );
        // Single-line: Permissions.FLAGS.FLAG_NAME (without Discord. prefix)
        content = content.replace(
            new RegExp(`Permissions\\.FLAGS\\.${flag}\\b`, 'g'),
            `PermissionFlagsBits.${v14}`
        );
        // Single-line: Discord.Permissions.FLAGS.FLAG_NAME (safety, should already be done)
        content = content.replace(
            new RegExp(`Discord\\.Permissions\\.FLAGS\\.${flag}\\b`, 'g'),
            `PermissionFlagsBits.${v14}`
        );
    }

    // Ensure PermissionFlagsBits is imported if we added it
    if (content !== orig && content.includes('PermissionFlagsBits')) {
        const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\(["']discord\.js["']\);/;
        const m = content.match(destructRe);
        if (m) {
            if (!m[1].includes('PermissionFlagsBits')) {
                const existing = m[1].split(',').map(s => s.trim()).filter(Boolean);
                const merged = [...new Set([...existing, 'PermissionFlagsBits'])].sort();
                content = content.replace(destructRe, `const { ${merged.join(', ')} } = require('discord.js');`);
            }
        } else if (!content.includes('PermissionFlagsBits')) {
            // inject after first discord.js require
            content = content.replace(
                /((?:const|var|let)\s+\w+\s*=\s*require\(["']discord\.js["']\);)/,
                `$1\nconst { PermissionFlagsBits } = require('discord.js');`
            );
        }
    }

    if (content !== orig) {
        fs.writeFileSync(fpath, content, 'utf8');
        console.log('Fixed:', relPath);
        totalFixed++;
    }
}

console.log('\nTotal files fixed:', totalFixed);
