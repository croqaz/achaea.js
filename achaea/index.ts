import fs from 'node:fs';
import ansiColor from 'ansicolor';

import ee from './events/index.ts';
import ansiToHtml from './core/ansi.ts';
import processDisplayText from './core/output.ts';
import { TelnetSocket, telOpts } from './telnet/index.js';

import './core/triggers.ts';
import './extra/index.ts';

let telnet;

function escapeHtml(txt) {
  return txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
      // console.log('IAC WILL do:', teloptFmt(option))
      telnet.writeDo(option);
    } else {
      // tell remote we DONT do whatever they WILL offer
      // console.log('IAC WILL dont:', teloptFmt(option))
      telnet.writeDont(option);
    }
  });

  telnet.on('do', (option) => {
    // tell remote we WONT do anything we're asked to DO
    // console.log('IAC DO:', teloptFmt(option))
    telnet.writeWont(option);
  });

  // on any data/ text, display on STDOUT
  telnet.on('data', (buffer) => {
    const rawText = buffer.toString('utf8');
    const viewText = escapeHtml(processDisplayText(rawText));
    ee.emit('game:html', ansiToHtml(viewText));
    const cleanText = ansiColor.strip(rawText);
    ee.emit('game:text', cleanText);
    log.write(cleanText + '\n\n');
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
  const dt = new Date().toISOString().split('.')[0];
  const log = fs.createWriteStream('./logs/' + dt + '.log');

  // TODO :: move this to logs.ts
  ee.on('log:write', (line) => {
    log.write('$ ' + line + '\n');
  });

  ee.on('quit', () => {
    telnet.destroy();
    log.destroy();
    process.exit();
  })

  // if the socket closes, terminate the program
  // BUG: Bun doesn't emit this event, for some reason
  // Node.js does emit this
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    ee.emit('quit');
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
