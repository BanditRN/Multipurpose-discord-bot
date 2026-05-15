/**
 * Fix remaining Permissions.FLAGS patterns in commands/ and other directories
 * that were not caught by fix_all_handlers.js (which only handled Discord.Permissions.FLAGS.*)
 * Also fixes Permissions import -> PermissionFlagsBits
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
    USE_APPLICATION_COMMANDS: 'UseApplicationCommands',
    REQUEST_TO_SPEAK: 'RequestToSpeak',
    MANAGE_EVENTS: 'ManageEvents',
    MANAGE_THREADS: 'ManageThreads',
    CREATE_PUBLIC_THREADS: 'CreatePublicThreads',
    CREATE_PRIVATE_THREADS: 'CreatePrivateThreads',
    USE_EXTERNAL_STICKERS: 'UseExternalStickers',
    SEND_MESSAGES_IN_THREADS: 'SendMessagesInThreads',
    START_EMBEDDED_ACTIVITIES: 'StartEmbeddedActivities',
    MODERATE_MEMBERS: 'ModerateMembers',
    PRIORITY_SPEAKER: 'PrioritySpeaker',
    STREAM: 'Stream',
    USE_VAD: 'UseVad',
    CHANGE_NICKNAME2: 'ChangeNickname',
};

const dirs = ['commands', 'handlers', 'events', 'social_log'];

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

function ensurePermFlagsBits(content) {
    if (!content.includes('PermissionFlagsBits')) return content;

    // Replace Permissions import with PermissionFlagsBits in destructure
    const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\(["']discord\.js["']\);/;
    const m = content.match(destructRe);
    if (m) {
        let existing = m[1].split(',').map(s => s.trim()).filter(Boolean);
        // Remove old Permissions if present
        existing = existing.filter(s => s !== 'Permissions' && s !== 'MessageEmbed' && s !== 'MessageButton' && s !== 'MessageActionRow');
        if (!existing.includes('PermissionFlagsBits')) existing.push('PermissionFlagsBits');
        existing.sort();
        content = content.replace(destructRe, `const { ${existing.join(', ')} } = require('discord.js');`);
    }
    return content;
}

let totalFixed = 0;

for (const dir of dirs) {
    for (const fpath of walk(dir)) {
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;

        for (const [flag, v14] of Object.entries(flagMap)) {
            // Multiline: (Discord.)Permissions.FLAGS\n<whitespace>.FLAG_NAME
            content = content.replace(
                new RegExp(`(?:Discord\\.)?Permissions\\.FLAGS\\s*\\n(\\s*)\\.${flag}\\b`, 'g'),
                `PermissionFlagsBits.${v14}`
            );
            // Single-line without Discord. prefix
            content = content.replace(
                new RegExp(`Permissions\\.FLAGS\\.${flag}\\b`, 'g'),
                `PermissionFlagsBits.${v14}`
            );
        }

        // Fix imports if we added PermissionFlagsBits
        if (content !== orig) {
            content = ensurePermFlagsBits(content);
        }

        if (content !== orig) {
            fs.writeFileSync(fpath, content, 'utf8');
            console.log('Fixed:', path.relative(process.cwd(), fpath));
            totalFixed++;
        }
    }
}

console.log('\nTotal files fixed:', totalFixed);
