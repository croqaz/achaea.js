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
    //MSSP = 70,   // # 0x46 ; MSSP (Mud Server Status Protocol)
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

type SubNegotiation = 'gmcp' | 'atcp' | 'mxp';

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
    default:
      throw new Error(`Unknown Telnet option: ${option}`);
  }
}

/**
 * Parse sub-negotiation options out of a stream
 */
function parseSubNegotiation(data: Buffer): [SubNegotiation, Buffer] | null {
  // Must start with IAC SB
  if (data.length < 5 || data[0] !== Command.IAC || data[1] !== Command.SB) {
    return null;
  }

  const sub = byteToOption(data[2]) as SubNegotiation;
  const stack: number[] = [];
  let pos = 3;

  while (pos < data.length) {
    if (pos + 2 < data.length && data[pos + 1] === Command.IAC && data[pos + 2] === Command.SE) {
      stack.push(data[pos]);
      return [sub, Buffer.from(stack)];
    }

    // Add the current byte to the stack
    stack.push(data[pos]);
    pos++;
  }

  return null; // Error - couldn't find the end of sub-negotiation
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

let completeString: number[] = [];

/**
 * Transform binary data into actionable terms and return leftover data.
 */
export function transform(binary: Buffer, concat = false): [Option[], Buffer] {
  const options: Option[] = [];
  let incompleteString: number[] = [];
  let pos = 0;

  while (pos < binary.length) {
    // Check for IAC command
    if (binary[pos] === Command.IAC) {
      // Add any accumulated characters as a string option
      // A IAC String is a complete string
      if (concat && completeString.length > 0) {
        incompleteString = completeString.concat(incompleteString);
        completeString = [];
      }
      if (incompleteString.length > 0) {
        options.push({
          type: 'String',
          text: Buffer.from(incompleteString).toString(),
        });
        incompleteString = [];
      }

      const cmd = pos + 1 < binary.length ? binary[pos + 1] : 0;

      // Handle IAC SB (Sub-negotiation)
      if (cmd === Command.SB) {
        const subNeg = parseSubNegotiation(binary.subarray(pos));
        if (subNeg) {
          let option: Option;
          const [name, data] = subNeg;
          if (name === 'gmcp') {
            const gmcp = data.toString();
            // GMCP on the main event stream
            ee.emit('game:gmcp', gmcp);
            option = {
              type: 'sub',
              name,
              data: parseGMCP(gmcp),
            };
          } else {
            option = {
              type: 'sub',
              name,
              data,
            };
          }
          options.push(option);
          pos += data.length + 5; // 4 = IAC SB + opt + IAC SE
          continue;
        } else {
          // Incomplete sub-negotiation
          return [options, binary.subarray(pos)];
        }
      }

      // Handle negotiation commands
      if (pos + 2 < binary.length) {
        if (cmd === Command.WILL || cmd === Command.WONT || cmd === Command.DOIT || cmd === Command.DONT) {
          const cmd2 = binary[pos + 2];
          options.push({
            type: byteToOption(cmd) as 'will' | 'wont' | 'doit' | 'dont',
            option: byteToOption(cmd2),
          });
          pos += 3;
          continue;
        }
      }

      // Handle the rest of known commands
      if (cmd === Command.EOR || cmd === Command.NOP || cmd === Command.GA) {
        options.push({ type: byteToOption(cmd) as 'eor' | 'nop' | 'ga' });
        pos += 2;
        continue;
      }

      // If we have just an IAC or incomplete command, return what we have so far
      return [options, binary.subarray(pos)];
    } else {
      // Regular character, add to current string
      incompleteString.push(binary[pos]);
      pos++;
    }
  }

  // Add any remaining characters as a string
  if (incompleteString.length > 0) {
    options.push({
      type: 'string',
      text: Buffer.from(incompleteString).toString(),
    });
    if (concat) {
      completeString = incompleteString;
    }
  }

  return [options, Buffer.alloc(0)];
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
    if (
      opt.type === 'String' ||
      opt.type === 'string' ||
      opt.type === 'sub' ||
      opt.type === 'eor' ||
      opt.type === 'ga' ||
      opt.type === 'wont' ||
      opt.type === 'unknown'
    ) {
      continue;
    }
    if (opt.type === 'doit') {
      responses.push(Buffer.from([Command.IAC, Command.WONT, optionToByte(opt.option as string)]));
      continue;
    }
    if (opt.type === 'will') {
      if (opt.option === 'echo') {
        continue; // ignore echo
      } else if (opt.option === 'opt_eor') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.OEOR]));
      } else if (opt.option === 'term_type') {
        responses.push(Buffer.from([Command.IAC, Command.DONT, Command.TTYPE]));
      } else if (opt.option === 'compress') {
        responses.push(Buffer.from([Command.IAC, Command.DONT, Command.COMPRESS]));
      } else if (opt.option === 'atcp') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.ATCP]));
      } else if (opt.option === 'gmcp') {
        responses.push(Buffer.from([Command.IAC, Command.DOIT, Command.GMCP]));
      }
    } else {
      console.warn('Undefined response for Telnet opt:', opt);
    }
  }
  return Buffer.concat(responses);
}
