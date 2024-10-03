import { Buffer } from 'buffer';
import ansiColor from 'ansicolor';

import ee from './events/index.ts';
import ansiToHtml from './core/ansi.ts';
import { PROMPT } from './core/output.ts';
import processDisplayText from './core/output.ts';
import { TelnetSocket, telOpts } from './telnet/index.ts';
import { logSetup, logDestroy, logWrite } from './logs/index.ts';
import { isoDate, normText, escapeHtml } from './core/util.ts';
// import { teloptFmt } from './telnet/util.ts';

// import core stuff
import './core/queue.ts';
import './core/triggers.ts';
import './extra/index.ts';

let telnet;

export function connect(player: string) {
  //
  // Telnet socket to Achaea
  telnet = new TelnetSocket({
    host: 'achaea.com',
    port: 23,
    noDelay: true,
    keepAlive: true,
  });

  logSetup();

  setTimeout(function () {
    // Auto-type the user name
    ee.emit('user:text', player);
    // Auto-type the password from ENVIRON
    const e = `${player.toUpperCase()}_PASSWD`;
    if (process.env[e]) {
      ee.emit('user:text', process.env[e]);
    }
    // "config ScreenWidth 0"
    // "config ShowqueueAlerts on"
    // "config KillWarning off" ??
    // "config AutoOpenDoors on"
    // "config AdvancedCuring on"
    // "config UniversalAfflictionMessages on"
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

  // Necessary to have a stream consumer!
  telnet.on('data', (buff) => {
    if (!buff.length) return;
    const txt = buff.toString();
    if (!txt.trim()) return;
    // process.stdout.write('\n');
    process.stdout.write(txt);
  });

  // if the socket closes, terminate the program
  telnet.on('close', () => {
    console.log('Telnet closed. Bye!');
    telnet.destroy();
    logDestroy();
    process.exit();
  });
}

/*
 * Start listening to events
 */

function globalFixtures(txt: string): string {
  // Global text replace; Affects all outputs, including triggers.
  // Don't overuse!!
  txt = txt.replace(/\s+You have recovered /, 'You have recovered ');
  txt = txt.replace(
    /\s+You see a sign indicating there are WARES/,
    'You see a sign indicating there are WARES',
  );
  return txt;
}

function logFixtures(txt: string): string {
  // Text replace for logs only.
  const dt = isoDate().replace('T', ' ');
  return txt.replace(PROMPT, `\n(${dt}) :: $1\n`);
}

// On any telnet text
ee.on('tel:text', (rawText: string) => {
  rawText = globalFixtures(rawText);
  const plainText = ansiColor.strip(rawText);
  // Plain text + normalized text for triggers
  ee.emit('game:text', plainText, normText(plainText));
  // Processed out text for GUI and logs
  let viewText = ansiToHtml(escapeHtml(rawText));
  viewText = processDisplayText(viewText.trim());
  ee.emit('game:html', viewText);
  logWrite('\n' + logFixtures(viewText) + '\n');
});

// On raw GMCP text
ee.on('game:gmcp', (subText: string) => {
  logWrite('\n:GMCP: ' + subText + '\n');
});

ee.on('user:gmcp', (buff: Buffer) => {
  if (!telnet) return;
  telnet.writeSub(telOpts.TELNET_GMCP, buff);
});

ee.on('user:text', (text: string) => {
  if (!telnet) return;
  text = text.trim() + '\n';
  telnet.write(text);
  logWrite('\n$ ' + text);
});
