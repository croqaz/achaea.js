// deno-lint-ignore-file no-node-globals no-process-global
import * as net from 'net';

import ee from './events/index.ts';
import { Command } from './telnet.ts';
import { PROMPT } from './core/output.ts';
import { ansi2Html, ansiStrip } from './ansi.ts';
import processDisplayText from './core/output.ts';
import { parse as parseTelnet, prepareResponse } from './telnet.ts';
import { logDestroy, logSetup, logWrite } from './logs/index.ts';
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

  // On any Telnet command or text
  telnet.on('data', (buff: Buffer) => {
    if (!buff.length) return;

    const [opts, _] = parseTelnet(buff, true);

    // auto-respond to DO and WILL commands
    const response = prepareResponse(opts);
    if (response) telnet.write(response);

    for (const opt of opts) {
      if (opt.type === 'String') {
        let { text } = opt;
        if (!text.trim()) continue;
        process.stdout.write(text);

        // Start processing the game text
        text = globalFixtures(text);
        const plainText = ansiStrip(text);
        // Plain text + normalized text for triggers
        ee.emit('game:text', plainText, normText(plainText));
        // Processed out text for GUI and logs
        let viewText = ansi2Html(escapeHtml(text));
        viewText = processDisplayText(viewText.trim(), plainText);
        ee.emit('game:html', viewText);
        // Log the processed text at the end
        // ...because every milisecond counts
        logWrite('\n' + logFixtures(viewText) + '\n');
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
    process.exit();
  });

  // Setup global events
  ee.on('user:gmcp', (cmd: Buffer) => {
    if (cmd.length < 1) return;
    const buff = [Buffer.from([Command.IAC, Command.SB, Command.GMCP]), cmd, Buffer.from([Command.IAC, Command.SE])];
    telnet.write(Buffer.concat(buff));
  });

  ee.on('user:text', (text: string, log = true) => {
    if (text === '\n') {
      telnet.write('\r\n\xF9');
      return;
    }
    text = text.trim();
    if (!text) return;
    telnet.write(text + '\r\n\xF9');
    if (log) logWrite('\n$ ' + text + '\n');
  });

  //
  // Connect now!
  telnet.connect(23, Config.ACHAEA);
}

//
// Text fixtures

function globalFixtures(txt: string): string {
  // Global text replace; Affects all outputs, including triggers.
  // Don't overuse!!
  txt = txt.replace(/\s+You have recovered /, 'You have recovered ');
  txt = txt.replace(/\s+You see a sign indicating there are WARES/, 'You see a sign indicating there are WARES');
  return txt;
}

function logFixtures(txt: string): string {
  // Text replace for logs only.
  const dt = isoDate().replace('T', ' ');
  return txt.replace(PROMPT, `\n(${dt}) :: $1\n`);
}
