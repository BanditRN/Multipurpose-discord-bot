const fs = require('fs'), path = require('path');
const patternList = [
    { re: /Discord\.Permissions|Permissions\.FLAGS|\.Intents\.|Intents\.FLAGS/, label: 'Permissions/Intents v13' },
    { re: /guild\.me(?!mbers)/, label: 'guild.me' },
    { re: /new\s+(?:Discord\.)?MessageEmbed\b/, label: 'MessageEmbed' },
    { re: /new\s+(?:Discord\.)?MessageButton\b/, label: 'MessageButton' },
    { re: /new\s+(?:Discord\.)?MessageActionRow\b/, label: 'MessageActionRow' },
    { re: /\.addField\(/, label: '.addField(' },
    { re: /\.setFooter\([^{(]/, label: '.setFooter(non-object)' },
    { re: /\.setAuthor\([^{(]/, label: '.setAuthor(non-object)' },
];
const dirs = ['handlers', 'events', 'social_log', 'commands'];
let out = [];
function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!f.endsWith('.js')) continue;
        const content = fs.readFileSync(full, 'utf8');
        for (const { re, label } of patternList) {
            const m = content.match(new RegExp(re.source, 'g'));
            if (m) out.push(path.relative(process.cwd(), full) + ': ' + label + ' (' + m.length + ')');
        }
    }
}
for (const d of dirs) {
    if (fs.existsSync(d)) walk(d);
}
out.forEach(l => console.log(l));
console.log('\nTotal:', out.length, 'issues');
