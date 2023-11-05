import fs from 'node:fs';
import ansiColor from 'ansicolor';

import ee from './events/index.ts';
import ansiToHtml from './core/ansi.ts';
import { isoDate } from './core/common.ts';
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

const PROMPT = /(^\d{1,6}h, \d{1,6}m(?:, \d{1,7}e, \d{1,7}w)?(?:, \d{1,6}R)?[ ]+?[a-z]*?-$)/m;

function replacePrompt(text) {
  const dt = isoDate().replace('T', ' ');
  return text.replace(PROMPT, `\n(${dt}) :: $1`);
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
    if (option === telOpts.TELNET_GMCP) {
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
    // TODO :::: process HTML first, and move to server
    const viewText = escapeHtml(processDisplayText(rawText));
    ee.emit('game:html', ansiToHtml(viewText));
    const cleanText = ansiColor.strip(rawText);
    ee.emit('game:text', cleanText);
    log.write('\n' + replacePrompt(cleanText) + '\n\n');
    // log.write(rawText + '\n\n');
  });

  // handle the response of our SUB commands
  telnet.on('sub', (_option, buffer) => {
    if (buffer.length) {
      const subText = buffer.toString('utf8');
      ee.emit('game:gmcp', subText);
      log.write('GMCP: ' + subText + '\n\n');
    }
  });

  // setup logging
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
  const log = fs.createWriteStream('./logs/' + isoDate() + '.log');

  // TODO :: move this to logs.ts
  ee.on('log:write', (line) => {
    line = '$ ' + line;
    console.log(line);
    log.write(line + '\n');
  });

  // if the socket closes, terminate the program
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    telnet.destroy();
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
