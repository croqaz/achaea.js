import { Transform } from 'node:stream';

import telOpts from './telOpts.js';

/*
 * Inspired from telnet-stream by Patrick Meade (blinkdog)
 * https://github.com/blinkdog/telnet-stream , telnetOutput.coffee
 */
export default class TelnetOutput extends Transform {
  _transform(chunk, encoding, done) {
    this.push(this._duplicateIAC(chunk));
    return done();
  }

  _duplicateIAC(buffer) {
    let xlateIndex = 0;
    const xlateBuf = Buffer.alloc(buffer.length * 2);
    for (let i = 0, len = buffer.length; i < len; i++) {
      const byte = buffer[i];
      xlateBuf[xlateIndex] = byte;
      xlateIndex++;
      if (byte === telOpts.TELNET_IAC) {
        xlateBuf[xlateIndex] = byte;
        xlateIndex++;
      }
    }
    return xlateBuf.slice(0, xlateIndex);
  }

  _writeOption(command, option) {
    const cmdBuf = Buffer.alloc(3);
    cmdBuf[0] = telOpts.TELNET_IAC;
    cmdBuf[1] = command;
    cmdBuf[2] = option;
    return this.push(cmdBuf);
  }

  writeCommand(command) {
    const cmdBuf = Buffer.alloc(2);
    cmdBuf[0] = telOpts.TELNET_IAC;
    cmdBuf[1] = command;
    return this.push(cmdBuf);
  }

  writeDo(option) {
    return this._writeOption(telOpts.TELNET_DO, option);
  }

  writeDont(option) {
    return this._writeOption(telOpts.TELNET_DONT, option);
  }

  writeSub(option, buffer) {
    const negBuf = this._duplicateIAC(buffer);
    const subBegin = Buffer.alloc(3);
    subBegin[0] = telOpts.TELNET_IAC;
    subBegin[1] = telOpts.TELNET_SB;
    subBegin[2] = option;
    const subEnd = Buffer.alloc(2);
    subEnd[0] = telOpts.TELNET_IAC;
    subEnd[1] = telOpts.TELNET_SE;
    const subBuf = Buffer.concat([subBegin, negBuf, subEnd], negBuf.length + 5);
    return this.push(subBuf);
  }

  writeWill(option) {
    return this._writeOption(telOpts.TELNET_WILL, option);
  }

  writeWont(option) {
    return this._writeOption(telOpts.TELNET_WONT, option);
  }
}
