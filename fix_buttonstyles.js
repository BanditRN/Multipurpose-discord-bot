/**
 * Fix old v13 ButtonStyle string literals -> ButtonStyle.X enum values
 */
const fs = require('fs');
const path = require('path');

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

const styleMap = {
    'PRIMARY': 'Primary',
    'SECONDARY': 'Secondary',
    'SUCCESS': 'Success',
    'DANGER': 'Danger',
    'LINK': 'Link',
};

// Matches .setStyle("PRIMARY") or .setStyle('PRIMARY') or .setStyle(`PRIMARY`)
const setStyleRe = /\.setStyle\(["'`](PRIMARY|SECONDARY|SUCCESS|DANGER|LINK)["'`]\)/g;
// Matches style: "PRIMARY" etc. (in component builders)
const styleKeyRe = /\bstyle:\s*["'`](PRIMARY|SECONDARY|SUCCESS|DANGER|LINK)["'`]/g;

const dirs = ['handlers', 'commands', 'events', 'social_log', 'slashCommands'];
let total = 0;

for (const dir of dirs) {
    for (const fpath of walk(dir)) {
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;

        content = content.replace(setStyleRe, (_, style) =>
            `.setStyle(ButtonStyle.${styleMap[style]})`);
        content = content.replace(styleKeyRe, (_, style) =>
            `style: ButtonStyle.${styleMap[style]}`);

        if (content !== orig) {
            // Ensure ButtonStyle is imported if we changed anything
            const importRe = /const \{([^}]+)\} = require\("discord\.js"\);/;
            const m = content.match(importRe);
            if (m && !m[1].includes('ButtonStyle')) {
                let parts = m[1].split(',').map(s => s.trim()).filter(Boolean);
                parts.push('ButtonStyle');
                parts.sort();
                content = content.replace(importRe,
                    'const {\n    ' + parts.join(',\n    ') + ',\n} = require("discord.js");');
            }
            fs.writeFileSync(fpath, content, 'utf8');
            console.log('Fixed:', path.relative(process.cwd(), fpath));
            total++;
        }
    }
}
console.log('\nTotal files fixed:', total);
