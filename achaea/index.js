import fs from 'node:fs';
import readline from 'node:readline';

import stripAnsi from 'strip-ansi';

import './auto.js';
import './triggers.js';

import ee from './events.js';

import { STATE } from './states.js';
import { processAliases } from './aliases.js';
import { TelnetSocket, telOpts } from '../telnet/index.js';

let telnet;

export function connect() {
  //
  // Telnet socket to Achaea
  telnet = new TelnetSocket({
    host: 'achaea.com',
    port: 23,
    noDelay: true,
    keepAlive: true,
  });

  // negociate connection options
  telnet.on('will', (option) => {
    if (option === telOpts.TELNET_GMCP) {
      telnet.writeDo(option);
    } else {
      telnet.writeDont(option);
    }
  });
  telnet.on('do', (option) => {
    telnet.writeWont(option);
  });
  // on any data/ text, display on STDOUT
  telnet.on('data', (buffer) => {
    const rawText = buffer.toString('utf8');
    process.stdout.write(rawText);
    const cleanText = stripAnsi(rawText);
    ee.emit('game:text', cleanText);
    log.write(cleanText + '\n\n');
    // Await user interaction
    rline.prompt(true);
  });
  // handle the response of our SUB commands
  telnet.on('sub', (option, buffer) => {
    if (buffer.length) {
      const subText = buffer.toString('utf8');
      ee.emit('game:gmcp', subText);
      log.write('GMCP: ' + subText + '\n\n');
    }
  });

  // setup interactive readline
  const rline = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // if the user types anything ...
  rline.on('line', (line) => {
    if (line.length === 0) {
      // re-use last user input
      line = STATE.MUD.input;
    } else {
      line = line.trim() + '\n';
      STATE.MUD.input = line;
    }
    if (processAliases(line)) {
      log.write('$ ' + line);
      // Await user interaction
      return rline.prompt(true);
    }
    telnet.write(line);
    log.write('$ ' + line + '\n');
    // will await for another user interaction
    // after game text response
  });

  // activate !!
  rline.setPrompt('> ');
  rline.prompt(true);

  // setup logging
  if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');
  const dt = new Date().toISOString().split('.')[0];
  const log = fs.createWriteStream('./logs/' + dt + '.log');

  const gameExit = () => {
    telnet.destroy();
    log.destroy();
    process.exit();
  };

  // if the socket closes, terminate the program
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    gameExit();
  });
  rline
    .on('SIGINT', () => {
      // console.log('Ignoring CTRL+C');
    })
    .on('close', () => {
      console.log('Exiting!');
      gameExit();
    });
}

/*
 * Start listening to events
 */
ee.on('user:gmcp', (cmd) => {
  // CMD MUST be a GMCP buffer
  telnet.writeSub(telOpts.TELNET_GMCP, cmd);
});

ee.on('user:text', (txt) => {
  txt = txt.trim() + '\n';
  telnet.write(txt);
});
