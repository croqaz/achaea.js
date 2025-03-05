// deno-lint-ignore-file no-explicit-any
import * as net from 'net';
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
    | { type: 'string'; text: string }
    | { type: 'unknown' };

/**
 * Convert a byte to a known option, or leave it as byte.
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
 * Convert a string option to a byte.
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
        // GMCP sent to the main event stream
        ee.emit('game:gmcp', payload);
        return { module, data };
    } catch (err: any) {
        console.warn('GMCP parse error:', err.message);
        return { module };
    }
}

/**
 * Transform binary data into actionable terms and return leftover data.
 */
function transform(binary: Buffer): [Option[], Buffer] {
    const options: Option[] = [];
    let currentString: number[] = [];
    let pos = 0;

    while (pos < binary.length) {
        // Check for IAC command
        if (binary[pos] === Command.IAC) {
            // Add any accumulated characters as a string option
            if (currentString.length > 0) {
                options.push({
                    type: 'string',
                    text: Buffer.from(currentString).toString(),
                });
                currentString = [];
            }

            const cmd = pos + 1 < binary.length ? binary[pos + 1] : 0;

            // Handle IAC SB (Sub-negotiation)
            if (cmd === Command.SB) {
                const subNeg = parseSubNegotiation(binary.subarray(pos));
                if (subNeg) {
                    let option: Option;
                    let [name, data] = subNeg;
                    if (name === 'gmcp') {
                        option = {
                            type: 'sub',
                            name,
                            data: parseGMCP(data),
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
                if (
                    cmd === Command.WILL ||
                    cmd === Command.WONT ||
                    cmd === Command.DOIT ||
                    cmd === Command.DONT
                ) {
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
            currentString.push(binary[pos]);
            pos++;
        }
    }

    // Add any remaining characters as a string
    if (currentString.length > 0) {
        options.push({
            type: 'string',
            text: Buffer.from(currentString).toString(),
        });
    }

    return [options, Buffer.alloc(0)];
}

/**
 * Parse long binary data from a MUD into Telnet options and leftovers.
 * This returns the known options, the text, and the leftover binary data.
 */
export function parse(input: Buffer | string): [Option[], string, Buffer] {
    // Convert string to buffer if needed
    const binary = typeof input === 'string' ? Buffer.from(input) : input;

    // Transform the binary data into options and leftover data
    const [opts, leftover] = transform(binary);

    // Extract text strings and filter out unknown options
    let text = '';
    const options = opts.filter((opt) => {
        if (opt.type === 'string') {
            text += opt.text;
            return false;
        }
        return opt.type !== 'unknown';
    });

    // Return options, text and leftover data
    return [options, text, leftover];
}

/**
 * Prepare responses for different Telnet options.
 */
export function prepareResponse(opts: Option[]): Buffer {
    const responses: Buffer[] = [];
    for (const opt of opts) {
        if (
            opt.type === 'string' ||
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

function connect(host: string, port: number) {
    const socket = new net.Socket();
    socket.setTimeout(60_000);
    socket.setKeepAlive(true);
    socket.setNoDelay(true);

    socket.on('data', (data: Buffer) => {
        const mudOutput = data.toString();
        // Send to terminal
        console.log(mudOutput);
        // Emit text to the main event stream
        // ee.emit('tel:text', ...
    });

    socket.on('connect', () => {
        console.log(`Connected to ${host}:${port}`);
        // ee.emit('connected');
    });

    socket.on('error', (err) => {
        console.error('Connection error:', err);
        // ee.emit('error', err);
    });

    socket.on('close', () => {
        console.log('Disconnected from server');
        // ee.emit('disconnected');
        socket.destroy();
    });

    // Start the connection!
    console.log(`Connecting to ${host}:${port}...`);
    // socket.connect(port, host);

    // Cleanup the socket
    // socket.destroy();

    // public sendCommand(command: string) {
    //     socket.write(command + '\r\n');
    // }
    // public sendGMCP(cmd: string): boolean {
    //     return socket.write(Buffer.from([
    //     Command.IAC, Command.SB, Command.GMCP
    //     ]) + cmd + Buffer.from([Command.IAC, Command.SE]));
    // }
}
