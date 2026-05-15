/**
 * Merge multiple discord.js destructure imports into one per file.
 * Handles const/var/let, any quote style, multiline.
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

const REMOVE_NAMES = new Set([
    'MessageEmbed', 'MessageAttachment', 'Permissions',
    'MessageButton', 'MessageActionRow', 'MessageSelectMenu', 'MessageSelectOption',
]);

// Find all discord.js destructure imports in content
// Returns array of { start, end, names }
function findImports(content) {
    // Match: (const|var|let) \s* { [^}]* } \s* = \s* require( ['"`] discord.js ['"`] );
    // Using a loop since we need to handle multiline
    const results = [];
    // We match the entire line sequence for a destructure import
    const re = /^(const|var|let)\s*\{([^}]*)\}\s*=\s*require\([`'"']discord\.js[`'"']\);$/gm;
    let m;
    while ((m = re.exec(content)) !== null) {
        const names = m[2].split(',').map(s => s.trim()).filter(Boolean);
        results.push({ start: m.index, end: m.index + m[0].length, names });
    }
    return results;
}

const dirs = ['handlers', 'commands', 'events', 'social_log', 'slashCommands'];
let totalFixed = 0;

for (const dir of dirs) {
    for (const fpath of walk(dir)) {
        let content = fs.readFileSync(fpath, 'utf8');
        const orig = content;

        const imports = findImports(content);
        if (imports.length < 2) continue;

        // Merge all names
        const allNames = new Set();
        for (const imp of imports) {
            for (const name of imp.names) {
                if (name && !REMOVE_NAMES.has(name)) allNames.add(name);
            }
        }

        const sorted = [...allNames].sort();

        // Remove all imports (in reverse order to preserve positions)
        let result = content;
        for (let j = imports.length - 1; j >= 0; j--) {
            const { start, end } = imports[j];
            // Also eat the newline after if present
            const endAdj = result[end] === '\n' ? end + 1 : end;
            result = result.slice(0, start) + result.slice(endAdj);
        }

        // Insert merged import at position of first import (adjusted after removals)
        // Since we removed all imports, we insert at the position of the first one
        // But the position shifted. Let's insert right before the content that was after the first import.
        // Simpler: find where to insert. The first import's content is now gone.
        // We need to find a good insertion point: after the first non-import require line.
        // Actually, let's just insert at the original start of the first import.
        // After all removals, the content at `imports[0].start` is what was after the last import.
        // Let's just insert the merged import at position 0 or find require lines.

        if (sorted.length > 0) {
            const merged = 'const {\n    ' + sorted.join(',\n    ') + ',\n} = require("discord.js");\n';
            // Insert at position of first original import (but content has shifted)
            // Find the first require line to insert after
            const insertAt = imports[0].start;
            result = result.slice(0, insertAt) + merged + result.slice(insertAt);
        }

        if (result !== orig) {
            fs.writeFileSync(fpath, result, 'utf8');
            console.log('Merged:', path.relative(process.cwd(), fpath));
            totalFixed++;
        }
    }
}

console.log('\nTotal files fixed:', totalFixed);
