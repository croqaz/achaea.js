// deno-lint-ignore-file no-explicit-any
import { Buffer } from 'node:buffer';
import ee from './events/index.ts';

/*
 * Telnet options ref:
 * https://iana.org/assignments/telnet-options/telnet-options.xhtml
 * ATCP / GMCP protocols:
 * https://gammon.com.au/gmcp
 * https://tintin.mudhalla.net/protocols/gmcp
 */
// prettier-ignore
export const enum Command {
    ECHO = 1,      // # 0x01
    TTYPE = 24,    // # 0x18 ; Terminal type
    OEOR = 25,     // # 0x19 ; Option end of record
    //LINEMOD = 34, // # 0x22 ; Linemode
    //CHARSET = 42, // # 0x2A ; Character set
    //MSDP = 69,   // # 0x45 ; MSDP (Mud Server Data Protocol)
    MSSP = 70,     // # 0x46 ; MSSP (Mud Server Status Protocol)
    COMPRESS = 86, // # 0x56 ; MCCP Version 2
    MXP = 90,      // # 0x5B ; MXP sequence
    ATCP = 200,    // # 0xC8 ; ATCP sequence
    GMCP = 201,    // # 0xC9 ; GMCP sequence (ATCP2)
    EOR = 239,     // # 0xEF ; End of record
    SE = 240,      // # 0xF0 ; End of subnegotiation
    NOP = 241,     // # 0xF1 ; No operation
    GA = 249,      // # 0xF9 ; Go ahead
    SB = 250,      // # 0xFA ; Start of subnegotiation will follow
    WILL = 251,    // # 0xFB
    WONT = 252,    // # 0xFC
    DOIT = 253,    // # 0xFD
    DONT = 254,    // # 0xFE
    IAC = 255,     // # 0xFF ; Interpret as Command
}

type SubNegotiation = 'gmcp' | 'atcp' | 'mxp' | 'mssp';

// MSSP sub-negotiation markers
// https://tintin.mudhalla.net/protocols/mssp
const MSSP_VAR = 1;
const MSSP_VAL = 2;

// A parsed option
type Option =
  | { type: 'will' | 'wont' | 'doit' | 'dont'; option: string | number }
  | { type: 'eor' | 'nop' | 'ga' }
  | { type: 'sub'; name: SubNegotiation; data: any }
  | { type: 'String'; text: string } // a complete string
  | { type: 'string'; text: string } // incomplete string
  | { type: 'unknown' };

/**
 * Convert a byte to a known option.
 */
function byteToOption(byte: number): string {
  switch (byte) {
    case Command.ECHO:
      return 'echo';
    case Command.ATCP:
      return 'atcp';
    case Command.EOR:
      return 'eor';
    case Command.GMCP:
      return 'gmcp';
    case Command.COMPRESS:
      return 'compress';
    case Command.MXP:
      return 'mxp';
    case Command.MSSP:
      return 'mssp';
    case Command.OEOR:
      return 'opt_eor';
    case Command.TTYPE:
      return 'term_type';
    case Command.WILL:
      return 'will';
    case Command.WONT:
      return 'wont';
    case Command.DOIT:
      return 'doit';
    case Command.DONT:
      return 'dont';
    case Command.GA:
      return 'ga';
    case Command.NOP:
      return 'nop';
    default:
      throw new Error(`Unknown Telnet option: ${byte}`);
  }
}

/**
 * Convert a known string option to a Command.
 */
function optionToByte(option: string): Command {
  switch (option) {
    case 'echo':
      return Command.ECHO;
    case 'atcp':
      return Command.ATCP;
    case 'eor':
      return Command.EOR;
    case 'gmcp':
      return Command.GMCP;
    case 'compress':
      return Command.COMPRESS;
    case 'mxp':
      return Command.MXP;
    case 'mssp':
      return Command.MSSP;
    case 'opt_eor':
      return Command.OEOR;
    case 'term_type':
      return Command.TTYPE;
    case 'will':
      return Command.WILL;
    case 'wont':
      return Command.WONT;
    case 'doit':
      return Command.DOIT;
    case 'dont':
      return Command.DONT;
    case 'ga':
      return Command.GA;
    case 'nop':
      return Command.NOP;
    default:
      throw new Error(`Unknown Telnet option: ${option}`);
  }
}

/**
 * Parse one sub-negotiation (IAC SB <option> ...payload... IAC SE) from the start of the data.
 * Returns the option name, the payload (with IAC IAC un-escaped to a single 0xFF)
 * and the number of bytes consumed; or null if the IAC SE didn't arrive yet.
 * An empty payload (IAC SB opt IAC SE) is valid.
 */
function parseSubNegotiation(data: Buffer): [SubNegotiation, Buffer, number] | null {
  // Must start with IAC SB <option>
  if (data.length < 3 || data[0] !== Command.IAC || data[1] !== Command.SB) {
    return null;
  }

  const sub = byteToOption(data[2]) as SubNegotiation;
  const payload: number[] = [];
  let pos = 3;

  while (pos + 1 < data.length) {
    if (data[pos] === Command.IAC) {
      if (data[pos + 1] === Command.SE) {
        return [sub, Buffer.from(payload), pos + 2];
      }
      if (data[pos + 1] === Command.IAC) {
        // escaped 0xFF byte inside the payload
        payload.push(Command.IAC);
        pos += 2;
        continue;
      }
    }
    payload.push(data[pos]);
    pos++;
  }

  return null; // incomplete: the end of the sub-negotiation is in the next packet
}

/**
 * Parse GMCP sub-negotiation.
 */
export function parseGMCP(binary: Buffer | string): { module: string; data?: any } {
  // Convert buffer to string if needed
  if (Buffer.isBuffer(binary)) {
    binary = binary.toString();
  }

  const spaceIndex = binary.indexOf(' ');
  let module: string, payload: string;

  if (spaceIndex === -1) {
    module = binary.toLowerCase();
    return { module };
  } else {
    module = binary.substring(0, spaceIndex).toLowerCase();
    payload = binary.substring(spaceIndex + 1);
  }

  try {
    const data = JSON.parse(payload);
    return { module, data };
  } catch (err: any) {
    console.warn('GMCP parse error:', err.message);
    return { module };
  }
}

/**
 * Parse MSSP sub-negotiation.
 * The format is: MSSP_VAR name MSSP_VAL value [MSSP_VAL value ...]
 * Multiple values for the same variable are returned as an array.
 * Achaea offers MSSP on connect (IAC WILL MSSP) and we refuse it,
 * but if the server sends the data anyway, this won't choke on it.
 */
export function parseMSSP(binary: Buffer): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  let name = '';
  let chunk: number[] = [];
  let mode: number = 0;

  const flush = () => {
    const text = Buffer.from(chunk).toString();
    chunk = [];
    if (mode === MSSP_VAR) {
      name = text;
    } else if (mode === MSSP_VAL && name) {
      const prev = result[name];
      if (prev === undefined) result[name] = text;
      else if (Array.isArray(prev)) prev.push(text);
      else result[name] = [prev, text];
    }
  };

  for (const byte of binary) {
    if (byte === MSSP_VAR || byte === MSSP_VAL) {
      flush();
      mode = byte;
    } else {
      chunk.push(byte);
    }
  }
  flush();
  return result;
}

// Text from the previous packet(s), not terminated by a Telnet command yet.
// A game line can span many TCP packets (eg: a long room description),
// so the text is only "complete" when a Telnet command (GA, EOR, SB, ...) follows it.
let completeString: number[] = [];

/**
 * Transform binary data into actionable terms and return leftover data.
 * The leftover is an incomplete Telnet command (eg: a GMCP sub-negotiation
 * that continues in the next packet), never text.
 * Unknown Telnet commands and options throw: this client is only for Achaea,
 * so anything new must be captured (--trace) and dissected, not silently skipped.
 */
export function transform(binary: Buffer, concat = false): [Option[], Buffer] {
  const options: Option[] = [];
  let incompleteString: number[] = [];
  if (concat) {
    incompleteString = completeString;
    completeString = [];
  }
  let pos = 0;

  while (pos < binary.length) {
    if (binary[pos] !== Command.IAC) {
      // Regular character, add to current string
      incompleteString.push(binary[pos]);
      pos++;
      continue;
    }

    // Just an IAC at the end: the command is in the next packet
    if (pos + 1 >= binary.length) break;
    const cmd = binary[pos + 1];

    // IAC IAC is an escaped 0xFF byte, part of the text
    if (cmd === Command.IAC) {
      incompleteString.push(Command.IAC);
      pos += 2;
      continue;
    }

    // Any other command terminates the accumulated text: a complete string
    if (incompleteString.length > 0) {
      options.push({
        type: 'String',
        text: Buffer.from(incompleteString).toString(),
      });
      incompleteString = [];
    }

    // Handle IAC SB (Sub-negotiation)
    if (cmd === Command.SB) {
      const subNeg = parseSubNegotiation(binary.subarray(pos));
      if (!subNeg) break; // incomplete sub-negotiation, wait for the next packet
      const [name, data, consumed] = subNeg;
      let option: Option;
      if (name === 'gmcp') {
        const gmcp = data.toString();
        // GMCP on the main event stream
        ee.emit('game:gmcp', gmcp);
        option = {
          type: 'sub',
          name,
          data: parseGMCP(gmcp),
        };
      } else if (name === 'mssp') {
        option = {
          type: 'sub',
          name,
          data: parseMSSP(data),
        };
      } else {
        option = {
          type: 'sub',
          name,
          data,
        };
      }
      options.push(option);
      pos += consumed;
      continue;
    }

    // Handle negotiation commands: IAC WILL/WONT/DO/DONT <option>
    if (cmd === Command.WILL || cmd === Command.WONT || cmd === Command.DOIT || cmd === Command.DONT) {
      if (pos + 2 >= binary.length) break; // the option byte is in the next packet
      options.push({
        type: byteToOption(cmd) as 'will' | 'wont' | 'doit' | 'dont',
        option: byteToOption(binary[pos + 2]),
      });
      pos += 3;
      continue;
    }

    // Handle the rest of known commands
    if (cmd === Command.EOR || cmd === Command.NOP || cmd === Command.GA) {
      options.push({ type: byteToOption(cmd) as 'eor' | 'nop' | 'ga' });
      pos += 2;
      continue;
    }

    // Skipping it would de-sync the stream, ignoring it would stall the stream forever
    throw new Error(`Unknown Telnet command: ${cmd}`);
  }

  // Add any remaining characters as an (incomplete) string
  if (incompleteString.length > 0) {
    options.push({
      type: 'string',
      text: Buffer.from(incompleteString).toString(),
    });
    if (concat) {
      completeString = incompleteString;
    }
  }

  return [options, binary.subarray(pos)];
}

let leftOver: Buffer = Buffer.alloc(0);

/**
 * Parse long binary data from a MUD into Telnet options and leftovers.
 * This returns the known options, the text, and the leftover binary data.
 */
export function parse(input: Buffer | string, concat = false): [Option[], Buffer] {
  // Convert string to buffer if needed
  let binary = typeof input === 'string' ? Buffer.from(input, 'binary') : input;

  // concat leftover text from last packet
  if (concat && leftOver) {
    binary = Buffer.concat([leftOver, binary]);
    leftOver = Buffer.alloc(0);
  }

  // Transform the binary data into options and leftover data
  const [opts, leftover] = transform(binary, concat);

  if (concat && leftover.length > 0) {
    leftOver = leftover;
  }

  // Return known options and leftover data
  return [opts.filter((opt) => opt.type !== 'unknown'), leftover];
}

/**
 * Prepare responses for different Telnet options.
 */
export function prepareResponse(opts: Option[]): Buffer {
  const responses: Buffer[] = [];
  for (const opt of opts) {
    // Text, sub-negotiations, GA/EOR/NOP and WONT/DONT acknowledgements need no answer
    if (opt.type === 'doit') {
      // We never DO anything the server asks for (eg: TTYPE)
      responses.push(Buffer.from([Command.IAC, Command.WONT, optionToByte(opt.option as string)]));
    } else if (opt.type === 'will') {
      if (opt.option === 'echo') {
        // ignore echo: the server toggles it around the password prompt
        continue;
      } else if (opt.option === 'opt_eor') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.OEOR]));
      } else if (opt.option === 'atcp') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.ATCP]));
      } else if (opt.option === 'gmcp') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.GMCP]));
      } else {
        // Refuse everything else, eg: TTYPE, MCCP2, MXP;
        // MSSP: server status (player count, uptime, etc) is useless for playing, and
        // Achaea advertises WILL MSSP, but never sends the data, even after DO MSSP.
        // Leaving a WILL unanswered is not an option: the server may wait for it.
        responses.push(Buffer.from([Command.IAC, Command.DONT, optionToByte(opt.option as string)]));
      }
    }
  }
  return Buffer.concat(responses);
}
