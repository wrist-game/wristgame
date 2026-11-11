// Part of `npm run check` — makes sure no secret has slipped into the public website.
// Everything under src/, public/ and index.html, and every VITE_ variable, ends up in files
// that any visitor can download. Payment credentials belong only in server/.env.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const TEXT_FILES = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.html', '.css', '.txt', '.webmanifest', '.svg']);
const SECRET_WORD = '(?:secret|passwd|password|private[_-]?key|store[_-]?pass(?:wd|word)?|signature[_-]?key|api[_-]?key|access[_-]?token|auth[_-]?token|merchant[_-]?key)';

const RULES = [
  { name: 'a secret-looking setting with a value', pattern: new RegExp(`\\b[A-Za-z0-9_]*${SECRET_WORD}[A-Za-z0-9_]*\\b["']?\\s*[:=]\\s*(['"\`])[^'"\`\\n]{4,}\\1`, 'i') },
  { name: 'a VITE_ variable holding a secret (Vite publishes every VITE_ variable)', pattern: /\bVITE_[A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|PRIVATE|SIGNATURE|TOKEN)[A-Z0-9_]*/ },
  { name: 'a live or test secret key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/ },
  { name: 'a private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (TEXT_FILES.has(extname(entry))) yield path;
  }
}

const files = [...['src', 'public'].filter(existsSync).flatMap((dir) => [...walk(dir)]), 'index.html'].filter(existsSync);
// Root .env files: only VITE_ lines reach the browser, so only those are checked.
const envFiles = readdirSync('.').filter((name) => name === '.env' || name.startsWith('.env.'));

const findings = [];
for (const file of files) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      for (const rule of RULES) if (rule.pattern.test(line)) findings.push(`${file}:${index + 1} — looks like ${rule.name}`);
    });
}
for (const file of envFiles) {
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (/^\s*VITE_/.test(line) && RULES[1].pattern.test(line)) findings.push(`${file}:${index + 1} — ${RULES[1].name}`);
    });
}

if (findings.length > 0) {
  console.error(`\n✖ Possible secret in the public website (${findings.length}):\n`);
  for (const finding of findings) console.error(`  • ${finding}`);
  console.error('\n  Anything in these files can be read by every visitor. Move payment credentials to server/.env');
  console.error('  and, if a real secret was ever saved here, ask the payment provider for a new one.\n');
  process.exit(1);
}
console.log(`✔ No secrets found in the public website code (${files.length} files checked).`);
