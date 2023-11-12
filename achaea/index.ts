import fs from 'node:fs';
import ansiColor from 'ansicolor';

import ee from './events/index.ts';
import ansiToHtml from './core/ansi.ts';
import { isoDate } from './core/common.ts';
import { PROMPT } from './core/output.ts';
import processDisplayText from './core/output.ts';
import { TelnetSocket, telOpts } from './telnet/index.js';
// import { teloptFmt } from './telnet/util.js';

// import core stuff
import './core/queue.ts';
import './core/triggers.ts';
import './extra/index.ts';

let telnet;

function escapeHtml(txt) {
  return txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function replacePrompt(text) {
  const dt = isoDate().replace('T', ' ');
  return text.replace(PROMPT, `\n\n(${dt}) :: $1\n`);
}

export function connect(player: string) {
  //
  // Telnet socket to Achaea
  telnet = new TelnetSocket({
    host: 'achaea.com',
    port: 23,
    noDelay: true,
    keepAlive: true,
  });

  setTimeout(function () {
    // Auto-type the user name
    ee.emit('user:text', player);
    // Auto-type the password from ENVIRON
    const e = `${player.toUpperCase()}_PASSWD`;
    if (process.env[e]) {
      ee.emit('user:text', process.env[e]);
    }
  }, 1000);

  // negociate connection options
  telnet.on('will', (option) => {
    if (option === telOpts.TELNET_GMCP || option === telOpts.TELNET_EOR) {
      // console.log('IAC WILL do:', teloptFmt(option));
      telnet.writeDo(option);
    } else {
      // tell remote we DONT do whatever they WILL offer
      // console.log('IAC WILL dont:', teloptFmt(option));
      telnet.writeDont(option);
    }
  });

  telnet.on('do', (option) => {
    // tell remote we WONT do anything we're asked to DO
    // console.log('IAC DO:', teloptFmt(option));
    telnet.writeWont(option);
  });

  // on any data/ text, display on STDOUT
  telnet.on('data', (buffer) => {
    const rawText = buffer.toString('utf8').trim();
    process.stdout.write(rawText);
    // normalize text for triggers ??
    ee.emit('game:text', ansiColor.strip(rawText));
    const viewText = ansiToHtml(escapeHtml(rawText));
    ee.emit('game:html', processDisplayText(viewText));
    log.write('\n' + replacePrompt(viewText.trim()) + '\n');
  });

  // handle the response of our SUB commands
  telnet.on('sub', (_option, buffer) => {
    if (buffer.length) {
      const subText = buffer.toString('utf8');
      ee.emit('game:gmcp', subText);
      log.write('GMCP: ' + subText.trim() + '\n');
    }
  });

  // setup logging
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
  const log = fs.createWriteStream('./logs/' + isoDate() + '.htm');
  log.write('<body><pre>');

  // TODO :: move this to logs.ts
  ee.on('log:write', (line) => {
    line = '$ ' + line;
    console.log(line);
    log.write('\n' + line + '\n');
  });

  // if the socket closes, terminate the program
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    telnet.destroy();
    log.write('\n\n</pre></body>');
    log.destroy();
    process.exit();
  });
}

/*
 * Start listening to events
 */
ee.on('user:gmcp', (buff) => {
  if (!telnet) return;
  // CMD MUST be a GMCP buffer
  telnet.writeSub(telOpts.TELNET_GMCP, buff);
});

ee.on('user:text', (text: string) => {
  if (!telnet) return;
  text = text.trim() + '\n';
  ee.emit('log:write', text);
  telnet.write(text);
});
