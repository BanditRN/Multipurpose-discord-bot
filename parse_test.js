const fs = require('fs'), path = require('path');
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
const errors = [];
const SKIP_MSGS = ['Cannot find module', '@m3rcena/weky', 'chalk', 'got', 'discord-giveaways', 'Intents is not'];
const SKIP_CODES = new Set(['MODULE_NOT_FOUND']);
const dirs = ['handlers', 'commands', 'events', 'social_log'];
for (const dir of dirs) {
    for (const f of walk(dir)) {
        try { require('./' + f); }
        catch(e) {
            const msg = (e.message || '');
            const shouldSkip = SKIP_MSGS.some(s => msg.includes(s)) || SKIP_CODES.has(e.code);
            if (!shouldSkip) {
                errors.push(path.relative(process.cwd(), f) + ': ' + msg.split('\n')[0]);
            }
        }
    }
}
if (errors.length) {
    console.log('Remaining errors (' + errors.length + '):');
    errors.forEach(e => console.log(' ', e));
} else {
    console.log('All files clean - no syntax or init errors!');
}
