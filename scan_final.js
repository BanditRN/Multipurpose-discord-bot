const fs = require('fs'), path = require('path');
// True-positive patterns only (setFooter/setAuthor excluded - client.getFooter() is valid v14)
const patternList = [
    { re: /Discord\.Permissions|Permissions\.FLAGS|\.Intents\.|Intents\.FLAGS/, label: 'Permissions/Intents v13' },
    { re: /new\s+(?:Discord\.)?MessageEmbed\b/, label: 'MessageEmbed' },
    { re: /new\s+(?:Discord\.)?MessageButton\b/, label: 'MessageButton' },
    { re: /new\s+(?:Discord\.)?MessageActionRow\b/, label: 'MessageActionRow' },
    { re: /\.addField\(/, label: '.addField(' },
    { re: /\.guild\.me\./, label: 'guild.me (direct property access)' },
];
const dirs = ['handlers', 'events', 'social_log', 'commands'];
let out = [];
function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) { walk(full); continue; }
        if (!f.endsWith('.js')) continue;
        const content = fs.readFileSync(full, 'utf8');
        for (const { re, label } of patternList) {
            const m = content.match(new RegExp(re.source, 'g'));
            if (m) out.push(path.relative(process.cwd(), full) + ': ' + label + ' (' + m.length + ')');
        }
    }
}
for (const d of dirs) walk(d);
out.forEach(l => console.log(l));
console.log('\nTotal:', out.length, 'true-positive issues');
