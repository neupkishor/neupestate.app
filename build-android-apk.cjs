const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.chdir(__dirname);
const output = 'generated/and.version/app-release';
let temporary;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.signal}).`);
}

try {
  if (!fs.existsSync(`${output}.aab`)) {
    throw new Error('AAB missing. Run npm run build:android first.');
  }
  if (!fs.existsSync('credentials.json')) {
    throw new Error('Missing credentials.json with android.keystore signing credentials.');
  }
  const { keystore } = JSON.parse(fs.readFileSync('credentials.json', 'utf8')).android ?? {};
  for (const field of ['keystorePath', 'keystorePassword', 'keyAlias', 'keyPassword']) {
    if (typeof keystore?.[field] !== 'string' || !keystore[field]) {
      throw new Error(`Missing android.keystore.${field} in credentials.json.`);
    }
  }
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'estate-apk-'));
  const storePassword = path.join(temporary, 'store-password');
  const keyPassword = path.join(temporary, 'key-password');
  fs.writeFileSync(storePassword, keystore.keystorePassword, { mode: 0o600 });
  fs.writeFileSync(keyPassword, keystore.keyPassword, { mode: 0o600 });
  run('bundletool', [
    'build-apks', `--bundle=${output}.aab`, `--output=${output}.apks`,
    '--mode=universal', '--overwrite', `--ks=${keystore.keystorePath}`,
    `--ks-key-alias=${keystore.keyAlias}`, `--ks-pass=file:${storePassword}`,
    `--key-pass=file:${keyPassword}`,
  ]);
  const apk = `${output}.apk.tmp`;
  const descriptor = fs.openSync(apk, 'w');
  try {
    run('unzip', ['-p', `${output}.apks`, 'universal.apk'], { stdio: ['ignore', descriptor, 'inherit'] });
  } finally {
    fs.closeSync(descriptor);
  }
  fs.renameSync(apk, `${output}.apk`);
  console.log(`Created ${output}.apk`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
}
