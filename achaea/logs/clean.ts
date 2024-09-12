import fs from 'node:fs';
import mri from 'mri';

export function cleanLogs(text: string): string {
  // Remove multiple spaces
  text = text.replace(/[ \t]+/g, ' ');
  // Remove multiple newlines
  text = text.replace(/[\n\r]{2,}/g, '\n\n');
  // GMCP squeezed together
  text = text.replace(/(GMCP: .+)\n+/g, '$1\n');
  // Newline after a block of GMCPs
  text = text.replace(/((?:GMCP: .+\n)+)/g, '$1\n');
  // Fix the newline before balances
  text = text.replace(/>[\n\r]+(You have recovered .+?\.)[\n\r]+</g, '>$1<');
  return text;
}

(function main() {
  const args = mri(process.argv.slice(2), {});
  if (args._ && args._[0]) {
    const out = args._[0];
    console.log('Processing:', out, '...');
    const text = fs.readFileSync(out, { encoding: 'utf8' });
    fs.writeFileSync(out, cleanLogs(text), { encoding: 'utf8' });
    console.log('Processed.');
  }
})();
