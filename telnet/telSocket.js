import net from 'node:net';

import TelnetInput from './telInput.js';
import TelnetOutput from './telOutput.js';

/*
 * Inspired from telnet-stream by Patrick Meade (blinkdog)
 * https://github.com/blinkdog/telnet-stream , telnetSocket.coffee
 */
export default class TelnetSocket {
  constructor(opts) {
    const options = opts || {};
    this._socket = net.createConnection(options);
    this._in = new TelnetInput(options);
    this._out = new TelnetOutput(options);
    this._socket.pipe(this._in);
    this._out.pipe(this._socket);
  }

  connect() {
    return this._socket.connect.apply(this._socket, arguments);
  }

  end() {
    // Half-closes the socket. i.e., it sends a FIN packet.
    // It is possible the server will still send some data.
    return this._socket.end.apply(this._socket, arguments);
  }

  destroy() {
    // Ensures that no more I/O activity happens on this socket.
    // Destroys the stream and closes the connection.
    return this._socket.destroy.apply(this._socket, arguments);
  }

  on(name, callback) {
    switch (name) {
      case 'command':
      case 'data':
      case 'do':
      case 'dont':
      case 'sub':
      case 'will':
      case 'wont':
        return this._in.on(name, callback);
      default:
        return this._socket.on(name, callback);
    }
  }

  pause() {
    return this._socket.pause.apply(this._socket, arguments);
  }

  ref() {
    return this._socket.ref.apply(this._socket, arguments);
  }

  resume() {
    return this._socket.resume.apply(this._socket, arguments);
  }

  setEncoding() {
    return this._socket.setEncoding.apply(this._socket, arguments);
  }

  setKeepAlive() {
    return this._socket.setKeepAlive.apply(this._socket, arguments);
  }

  setNoDelay() {
    return this._socket.setNoDelay.apply(this._socket, arguments);
  }

  setTimeout() {
    return this._socket.setTimeout.apply(this._socket, arguments);
  }

  unref() {
    return this._socket.unref.apply(this._socket, arguments);
  }

  write() {
    return this._out.write.apply(this._out, arguments);
  }

  writeCommand(command) {
    return this._out.writeCommand(command);
  }

  writeDo(option) {
    return this._out.writeDo(option);
  }

  writeDont(option) {
    return this._out.writeDont(option);
  }

  writeSub(option, buffer) {
    return this._out.writeSub(option, buffer);
  }

  writeWill(option) {
    return this._out.writeWill(option);
  }

  writeWont(option) {
    return this._out.writeWont(option);
  }
}
