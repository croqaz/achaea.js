/*
 * RAW Telnet traffic tracer.
 *
 * Enabled with: bun main.ts --trace debug.log <NAME>
 *
 * It writes 2 files:
 * - <file>     : human readable, annotated dump of every packet
 * - <file>.bin : the exact raw bytes, in a replayable format, for tests
 *
 * ALL writes are synchronous, on purpose!
 * If the client crashes on an unknown Telnet option,
 * the bytes that caused the crash MUST be on disk.
 */
import fs from 'node:fs';
import { Buffer } from 'node:buffer';

let txtFd = 0;
let binFd = 0;

/*
 * IANA Telnet options + the MUD specific ones.
 * This is only used for the readable dump,
 * so it can (and should) contain options
 * that the client doesn't implement yet.
 * https://iana.org/assignments/telnet-options/telnet-options.xhtml
 */
// prettier-ignore
const OPTION_NAMES: Record<number, string> = {
  0: 'BINARY', 1: 'ECHO', 2: 'RCP', 3: 'SGA', 5: 'STATUS', 6: 'TIMING-MARK',
  10: 'NAOCRD', 17: 'EXTEND-ASCII', 18: 'LOGOUT', 19: 'BM', 20: 'DET',
  23: 'SEND-LOCATION', 24: 'TTYPE', 25: 'EOR', 26: 'TUID', 27: 'OUTMRK',
  28: 'TTYLOC', 29: 'TELNET-3270', 30: 'X.3-PAD', 31: 'NAWS', 32: 'TSPEED',
  33: 'LFLOW', 34: 'LINEMODE', 35: 'XDISPLOC', 36: 'ENVIRON', 37: 'AUTH',
  38: 'ENCRYPT', 39: 'NEW-ENVIRON', 40: 'TN3270E', 42: 'CHARSET',
  44: 'COM-PORT', 47: 'KERMIT',
  69: 'MSDP', 70: 'MSSP', 85: 'MCCP1', 86: 'MCCP2', 90: 'MXP', 91: 'ZMP',
  93: 'ZMP2', 102: 'AARDWOLF', 200: 'ATCP', 201: 'GMCP',
};

// prettier-ignore
const CMD_NAMES: Record<number, string> = {
  236: 'EOF', 237: 'SUSP', 238: 'ABORT', 239: 'EOR', 240: 'SE', 241: 'NOP',
  242: 'DM', 243: 'BRK', 244: 'IP', 245: 'AO', 246: 'AYT', 247: 'EC',
  248: 'EL', 249: 'GA', 250: 'SB', 251: 'WILL', 252: 'WONT', 253: 'DO',
  254: 'DONT', 255: 'IAC',
};

const IAC = 255;
const SB = 250;
const SE = 240;

export function isTracing(): boolean {
  return !!txtFd;
}

export function traceSetup(fname: string) {
  txtFd = fs.openSync(fname, 'w');
  binFd = fs.openSync(fname + '.bin', 'w');
  fs.writeSync(txtFd, `# Telnet trace started ${new Date().toISOString()}\n`);
  console.log(`Tracing RAW telnet traffic in: ${fname} and ${fname}.bin`);
}

export function traceDestroy() {
  if (!txtFd) return;
  fs.writeSync(txtFd, `\n# Telnet trace stopped ${new Date().toISOString()}\n`);
  fs.closeSync(txtFd);
  fs.closeSync(binFd);
  txtFd = 0;
  binFd = 0;
}

/*
 * Write a note (eg: a parse error) in the readable trace.
 */
export function traceNote(note: string) {
  if (!txtFd) return;
  fs.writeSync(txtFd, `\n!! ${note}\n`);
}

/*
 * Dump one packet; dir is '<<' for server->client, '>>' for client->server.
 */
export function traceData(dir: '<<' | '>>', buff: Buffer) {
  if (!txtFd) return;
  const when = new Date().toISOString();
  // The exact bytes, one packet per line, as base64, so it can be
  // replayed byte by byte in tests, exactly as the server sent it
  fs.writeSync(binFd, `${dir} ${when} ${buff.toString('base64')}\n`);
  // The readable version
  fs.writeSync(txtFd, `\n${dir} ${when} (${buff.length} bytes)\n${hexDump(buff)}${annotate(buff)}`);
}

/*
 * Classic hex + ASCII dump, 16 bytes per line.
 */
function hexDump(buff: Buffer): string {
  const lines: string[] = [];
  for (let i = 0; i < buff.length; i += 16) {
    const chunk = buff.subarray(i, i + 16);
    const hex = [...chunk].map((b) => b.toString(16).padStart(2, '0')).join(' ');
    const txt = [...chunk].map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('');
    lines.push(`  ${i.toString(16).padStart(6, '0')}  ${hex.padEnd(47)}  |${txt}|`);
  }
  return lines.join('\n') + '\n';
}

function optName(byte: number): string {
  return OPTION_NAMES[byte] ? `${byte}(${OPTION_NAMES[byte]})` : `${byte}(UNKNOWN)`;
}

/*
 * Decode the Telnet commands inside a packet.
 * This never throws and never skips an unknown option,
 * that's the whole point of the trace.
 */
function annotate(buff: Buffer): string {
  const out: string[] = [];
  let text: number[] = [];
  let pos = 0;

  const flushText = () => {
    if (!text.length) return;
    const s = Buffer.from(text).toString('binary');
    out.push(`  TEXT ${JSON.stringify(s.length > 120 ? s.slice(0, 120) + '…' : s)}`);
    text = [];
  };

  while (pos < buff.length) {
    if (buff[pos] !== IAC) {
      text.push(buff[pos]);
      pos++;
      continue;
    }
    flushText();
    const cmd = buff[pos + 1];
    if (cmd === undefined) {
      out.push('  IAC <truncated>');
      break;
    }
    if (cmd === IAC) {
      // escaped 0xFF inside text
      text.push(IAC);
      pos += 2;
      continue;
    }
    if (cmd === SB) {
      const opt = buff[pos + 2];
      // find IAC SE
      let end = -1;
      for (let i = pos + 3; i + 1 < buff.length; i++) {
        if (buff[i] === IAC && buff[i + 1] === SE) {
          end = i;
          break;
        }
      }
      if (end === -1) {
        out.push(`  IAC SB ${optName(opt)} <unterminated, ${buff.length - pos - 3} bytes>`);
        break;
      }
      const payload = buff.subarray(pos + 3, end);
      out.push(`  IAC SB ${optName(opt)} ${JSON.stringify(payload.toString('binary'))} IAC SE`);
      pos = end + 2;
      continue;
    }
    if (cmd >= 251 && cmd <= 254) {
      out.push(`  IAC ${CMD_NAMES[cmd]} ${optName(buff[pos + 2])}`);
      pos += 3;
      continue;
    }
    out.push(`  IAC ${CMD_NAMES[cmd] || `${cmd}(UNKNOWN)`}`);
    pos += 2;
  }

  flushText();
  return out.length ? out.join('\n') + '\n' : '';
}

/*
 * Load back a <file>.bin trace, to replay it in tests.
 * WE NEVER connect to the real game for testing!
 */
export function loadTrace(fname: string): { dir: string; when: string; data: Buffer }[] {
  return fs
    .readFileSync(fname, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const [dir, when, b64] = line.split(' ');
      return { dir, when, data: Buffer.from(b64, 'base64') };
    });
}
