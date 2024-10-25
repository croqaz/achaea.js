// deno-lint-ignore-file no-node-globals
import { Transform } from 'node:stream';

import ee from '../events/index.ts';
import telOpts from './telOpts.ts';

const TELNET_DATA = 'TELNET_DATA';
const TELNET_COMMAND = 'TELNET_COMMAND';
const TELNET_OPTION = 'TELNET_OPTION';
const TELNET_SUBNEG = 'TELNET_SUBNEG';
const TELNET_SUBNEG_CMD = 'TELNET_SUBNEG_CMD';

/*
 * Inspired from telnet-stream by Patrick Meade (blinkdog)
 * https://github.com/blinkdog/telnet-stream , telnetInput.coffee
 */
export default class TelnetInput extends Transform {
  private subBufSize: number;
  private errorPolicy: string;
  state: string;
  option: number;
  command: number;
  dataBuf: Buffer;
  dataBufIndex: number;
  subBuf: Buffer;
  subBufIndex: number;
  subOverflowEmit: boolean;
  textPoints: number[];

  constructor(opt) {
    const options = opt || {};
    super(options);
    this.subBufSize = options.bufferSize || 8192;
    this.errorPolicy = options.errorPolicy || 'keepBoth';
    this.state = TELNET_DATA;
    this.dataBuf = Buffer.alloc(this.subBufSize);
    this.dataBufIndex = 0;
    this.subBuf = Buffer.alloc(this.subBufSize);
    this.subBufIndex = 0;
    this.textPoints = [];
  }

  _flush(callback = null) {
    if (this.textPoints.length) {
      // Telnet text sent to the main event stream
      // This is faster than the regular stream
      ee.emit('tel:text', String.fromCodePoint(...this.textPoints));
      // Push to the "slow" output steam
      this.push(Buffer.from(this.textPoints));
      this.textPoints = [];
    }
    if (callback) callback();
  }

  _transform(chunk, encoding, callback) {
    this.dataBufIndex = 0;
    this.dataBuf = Buffer.alloc(chunk.length * 2);
    for (let i = 0; i < chunk.length; i++) {
      this._handle(chunk[i]);
    }
    callback();
  }

  _handle(chunkData: number) {
    switch (this.state) {
      case TELNET_DATA:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            this._flush();
            return (this.state = TELNET_COMMAND);
          default:
            this.textPoints.push(chunkData);
            this.dataBuf[this.dataBufIndex] = chunkData;
            return this.dataBufIndex++;
        }

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
            return this.emit('cmd', chunkData);
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

      case TELNET_SUBNEG_CMD:
        switch (chunkData) {
          case telOpts.TELNET_IAC:
            this.state = TELNET_SUBNEG;
            return this._handleSub(telOpts.TELNET_IAC);
          case telOpts.TELNET_SE:
            if (this.subBufIndex > 0 && this.option === telOpts.TELNET_GMCP) {
              const gmcp = this.subBuf.slice(0, this.subBufIndex).toString('latin1');
              // GMCP commands sent to the main event stream
              ee.emit('game:gmcp', gmcp.trim());
            }
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
