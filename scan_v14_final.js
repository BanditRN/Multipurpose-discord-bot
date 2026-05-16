const path = require('path');
const fs = require('fs');

function getAllJsFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) out.push(...getAllJsFiles(full));
        else if (e.isFile() && e.name.endsWith('.js')) out.push(full);
    }
    return out;
}

const DIRS = ['commands', 'slashCommands', 'handlers', 'social_log', 'events'];
const files = [];
for (const d of DIRS) files.push(...getAllJsFiles(d));

const checks = [
    { label: 'MessageEmbed/Button/ActionRow/SelectMenu', re: /\b(MessageEmbed|MessageButton|MessageActionRow|MessageSelectMenu)\b/ },
    { label: '.addField( (old API)',  re: /\.addField\s*\(/ },
    { label: 'guild.me (not .members)', re: /guild\.me(?!mber)/ },
    { label: 'ChannelType string comparison', re: /\.type\s*===?\s*["'](GUILD_|DM)/ },
    { label: 'message/channel .deleted prop', re: /(?:message|channel|thinkMsg)\.deleted/ },
    { label: 'activity.type string compare', re: /activity\.type\s*===?\s*["']/ },
    { label: 'Permissions.FLAGS.', re: /Permissions\.FLAGS\./ },
    { label: 'setStyle with string style', re: /\.setStyle\(["'`](PRIMARY|SECONDARY|SUCCESS|DANGER|LINK|BLURPLE)/ },
    { label: 'splitMessage (discord.js import)', re: /splitMessage[,\s]+[^}]*\}\s*=\s*require\(["']discord/ },
];

let issues = 0;
for (const { label, re } of checks) {
    const hits = [];
    for (const f of files) {
        const c = fs.readFileSync(f, 'utf8');
        if (re.test(c)) hits.push(path.relative('.', f));
    }
    if (hits.length) {
        console.log('\n[ISSUE] ' + label + ' (' + hits.length + ' files):');
        hits.slice(0, 5).forEach(h => console.log('  ' + h));
        if (hits.length > 5) console.log('  ...and ' + (hits.length - 5) + ' more');
        issues += hits.length;
    }
}
if (!issues) console.log('\nAll checks passed — no remaining v13 incompatibilities!');
else console.log('\nTotal files with remaining issues: ' + issues);
