const fs = require('fs');
const path = require('path');
const patterns = [
    { re: /Discord\.Permissions|Permissions\.FLAGS|\.Intents\.|Intents\.FLAGS/, label: 'Permissions/Intents v13' },
    { re: /guild\.me\b/, label: 'guild.me' },
    { re: /new MessageEmbed\b/, label: 'MessageEmbed' },
    { re: /new MessageButton\b/, label: 'MessageButton' },
    { re: /new MessageActionRow\b/, label: 'MessageActionRow' },
    { re: /\.addField\(/, label: '.addField(' },
    { re: /channel\.type\s*===?\s*['"]GUILD_/, label: 'channel.type string' },
];
const dirs = ['handlers', 'events', 'social_log'];
let out = [];
for (const d of dirs) {
    const p = path.join(process.cwd(), d);
    if (!fs.existsSync(p)) continue;
    const walk = dir => {
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) { walk(full); continue; }
            if (!f.endsWith('.js')) continue;
            const content = fs.readFileSync(full, 'utf8');
            for (const { re, label } of patterns) {
                const m = content.match(new RegExp(re.source, 'g'));
                if (m) out.push(path.relative(process.cwd(), full) + ': ' + label + ' (' + m.length + ')');
            }
        }
    };
    walk(p);
}
out.forEach(l => console.log(l));
console.log('Total:', out.length, 'issues');
