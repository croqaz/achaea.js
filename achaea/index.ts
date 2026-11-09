// deno-lint-ignore-file no-node-globals no-process-global
import * as net from 'net';

import ee from './events/index.ts';
import { Command } from './telnet.ts';
import { PROMPT } from './core/output.ts';
import { ansi2Html, ansiStrip } from './ansi.ts';
import processDisplayText from './core/output.ts';
import { parse as parseTelnet, prepareResponse } from './telnet.ts';
import { logDestroy, logSetup, logWrite } from './logs/index.ts';
import { traceData, traceDestroy, traceNote, traceSetup } from './logs/trace.ts';
import { escapeHtml, isoDate, normText } from './core/util.ts';
import { Config } from './config.ts';

// import core stuff
import './core/queue.ts';
import './core/triggers.ts';

export function connect(player: string) {
  //
  // Telnet socket to Achaea
  const telnet = new net.Socket();
  telnet.setTimeout(60_000);
  telnet.setKeepAlive(true);
  telnet.setNoDelay(true);

  logSetup();
  // Capture every single byte of the live traffic? (--trace debug.log)
  if (Config.TRACE) traceSetup(Config.TRACE);

  // Send bytes to the game, tracing them first.
  // (NOT a telnet.write wrapper: Bun replaces socket.write on connect)
  // secret=true means the bytes are NEVER written in the trace (eg: the password)
  // Strings are encoded as UTF-8 here (what socket.write does by default),
  // so the trace has exactly the bytes that go on the wire.
  const send = (data: Buffer | string, secret = false) => {
    const buff = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    if (Config.TRACE) {
      if (secret) traceNote('>> (secret, not traced)');
      else traceData('>>', buff);
    }
    telnet.write(buff);
  };

  // On any Telnet command or text
  telnet.on('data', (buff: Buffer) => {
    if (!buff.length) return;
    // Trace everything the game sends, BEFORE parsing it
    traceData('<<', buff);

    let opts: any[] = [];
    try {
      [opts] = parseTelnet(buff, true);
    } catch (err: any) {
      // While tracing, don't die on unknown Telnet options;
      // we want to capture the whole session, to dissect it later
      if (!Config.TRACE) throw err;
      traceNote(`PARSE ERROR: ${err.message}`);
      console.error('Telnet parse error:', err.message);
      return;
    }

    // auto-respond to DO and WILL commands
    const response = prepareResponse(opts);
    if (response.length) send(response);

    for (const opt of opts) {
      if (opt.type === 'String') {
        let { text } = opt;
        if (!text.trim()) continue;
        process.stdout.write(text);
        // Log the processed text at the end
        // ...because every milisecond counts
        logWrite('\n' + processGameText(text) + '\n');
      }
    }
  });

  telnet.on('connect', () => {
    console.log(`Connected to ${Config.ACHAEA}`);
    setTimeout(function () {
      // Auto-type the user name
      ee.emit('user:text', player);
      // Auto-type the password from ENVIRON
      const e = `${player.toUpperCase()}_PASSWD`;
      if (process.env[e]) {
        ee.emit('user:text', process.env[e], false);
      }
    }, 500);
  });

  telnet.on('error', (err) => {
    console.error('Telnet error:', err);
  });

  // on socket closed, terminate the program
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    telnet.destroy();
    logDestroy();
    traceDestroy();
    process.exit();
  });

  // Setup global events
  ee.on('user:gmcp', (cmd: Buffer) => {
    if (cmd.length < 1) return;
    const buff = [Buffer.from([Command.IAC, Command.SB, Command.GMCP]), cmd, Buffer.from([Command.IAC, Command.SE])];
    send(Buffer.concat(buff));
  });

  ee.on('user:text', (text: string, log = true) => {
    if (text === '\n') {
      send('\r\n\xF9');
      return;
    }
    text = text.trim();
    if (!text) return;
    // log=false means secret (eg: the password): keep it out of ALL logs & traces
    send(text + '\r\n\xF9', !log);
    if (log) logWrite('\n$ ' + text + '\n');
  });

  //
  // Connect now!
  telnet.connect(23, Config.ACHAEA);
}

/*
 * Process one block of text from the game, exactly like the live client does:
 * the triggers get the plain text (game:text), the GUI gets the HTML (game:html)
 * and the HTML for the log is returned.
 * This is also used to replay a trace offline: scripts/debug2log.ts
 */
export function processGameText(text: string): string {
  text = globalFixtures(text);
  const plainText = ansiStrip(text);
  // Plain text + normalized text for triggers
  ee.emit('game:text', plainText, normText(plainText));
  // Processed out text for GUI and logs
  let viewText = ansi2Html(escapeHtml(text));
  viewText = processDisplayText(viewText.trim(), plainText);
  ee.emit('game:html', viewText);
  return logFixtures(viewText);
}

//
// Text fixtures

function globalFixtures(txt: string): string {
  // Global text replace; Affects all outputs, including triggers.
  // Don't overuse!!
  txt = txt.replace(/\s*?(\r?\n)\s*You have recovered /, '$1You have recovered ');
  txt = txt.replace(
    /\s*?(\r?\n)\s*You see a sign indicating there are WARES/,
    '$1You see a sign indicating there are WARES',
  );
  return txt;
}

function logFixtures(txt: string): string {
  // Text replace for logs only.
  const dt = isoDate().replace('T', ' ');
  return txt.replace(PROMPT, `\n(${dt}) :: $1\n`);
}
