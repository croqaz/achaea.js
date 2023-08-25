import { Transform } from 'node:stream';

import telOpts from './telOpts.js';

const TELNET_COMMAND = 'TELNET_COMMAND';
const TELNET_DATA = 'TELNET_DATA';
const TELNET_OPTION = 'TELNET_OPTION';
const TELNET_SUBNEG = 'TELNET_SUBNEG';
const TELNET_SUBNEG_CMD = 'TELNET_SUBNEG_CMD';

/*
 * Inspired from telnet-stream by Patrick Meade (blinkdog)
 * https://github.com/blinkdog/telnet-stream , telnetInput.coffee
 */
export default class TelnetInput extends Transform {
  constructor(opt) {
    const options = opt || {};
    super(options);
    this.state = TELNET_DATA;
    this.subBufSize = options.bufferSize || 8192;
    this.errorPolicy = options.errorPolicy || 'keepBoth';
    this.subBuf = Buffer.alloc(this.subBufSize);
  }

  _transform(chunk, encoding, callback) {
    this.dataBuf = Buffer.alloc(chunk.length * 2);
    this.dataBufIndex = 0;
    for (let i = 0, len = chunk.length; i < len; i++) {
      const byte = chunk[i];
      this._handle(byte);
    }
    if (this.dataBufIndex > 0) {
      this.push(this.dataBuf.slice(0, this.dataBufIndex));
    }
    return callback();
  }

  _handle(chunkData) {
    switch (this.state) {
      case TELNET_DATA:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            return (this.state = TELNET_COMMAND);
          default:
            this.dataBuf[this.dataBufIndex] = chunkData;
            return this.dataBufIndex++;
        }
        break;

      case TELNET_COMMAND:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            this.state = TELNET_DATA;
            this.dataBuf[this.dataBufIndex] = telOpts.TELNET_IAC;
            return this.dataBufIndex++;
          case telOpts.TELNET_DO:
          case telOpts.TELNET_DONT:
          case telOpts.TELNET_WILL:
          case telOpts.TELNET_WONT:
          case telOpts.TELNET_SB:
            this.state = TELNET_OPTION;
            return (this.command = chunkData);
          default:
            this.state = TELNET_DATA;
            return this.emit('command', chunkData);
        }
        break;

      case TELNET_OPTION:
        switch (this.command) {
          case telOpts.TELNET_DO:
            this.state = TELNET_DATA;
            return this.emit('do', chunkData);
          case telOpts.TELNET_DONT:
            this.state = TELNET_DATA;
            return this.emit('dont', chunkData);
          case telOpts.TELNET_WILL:
            this.state = TELNET_DATA;
            return this.emit('will', chunkData);
          case telOpts.TELNET_WONT:
            this.state = TELNET_DATA;
            return this.emit('wont', chunkData);
          case telOpts.TELNET_SB:
            this.state = TELNET_SUBNEG;
            this.option = chunkData;
            this.subBufIndex = 0;
            return (this.subOverflowEmit = false);
        }
        break;

      case TELNET_SUBNEG:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            return (this.state = TELNET_SUBNEG_CMD);
          default:
            return this._handleSub(chunkData);
        }
        break;

      case TELNET_SUBNEG_CMD:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            this.state = TELNET_SUBNEG;
            return this._handleSub(telOpts.TELNET_IAC);
          case telOpts.TELNET_SE:
            this.state = TELNET_DATA;
            return this.emit('sub', this.option, this.subBuf.slice(0, this.subBufIndex));
          default:
            this.state = TELNET_SUBNEG;
            this.emit('error', new Error('Expected IAC or SE'));
            switch (this.errorPolicy) {
              case 'discardBoth':
                break;
              case 'keepData':
                return this._handleSub(chunkData);
              default:
                // "keepBoth"
                this._handleSub(telOpts.TELNET_IAC);
                return this._handleSub(chunkData);
            }
        }
    }
  }

  _handleSub(subByte) {
    if (this.subBufIndex >= this.subBufSize) {
      if (!this.subOverflowEmit) {
        this.subOverflowEmit = true;
        this.emit('error', new Error('SubNegotiation buffer overflow'));
      }
      return;
    }
    this.subBuf[this.subBufIndex] = subByte;
    return this.subBufIndex++;
  }
}
