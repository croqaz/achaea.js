import { expect, test } from 'bun:test';
import ee from '../achaea/events/index.ts';
import o from '../achaea/telnet/telOpts.ts';
import TelnetInput from '../achaea/telnet/telInput.ts';

const TELNET_FAKE_OPTION = 70;

test('should be an instance of TelnetInput', function () {
  const testStream = new TelnetInput();
  expect(testStream).toBeInstanceOf(TelnetInput);
  expect(testStream).toHaveProperty('_transform');
});

test('should pass normal text through', (done) => {
  const testData = 'Hello, TelnetInput!';
  let finalData = '';
  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('end', () => {
    expect(finalData).toBe(testData);
    done();
  });
  testStream.end(testData);
});

test('emit a command event', (done) => {
  const testBuffer = Buffer.from([o.TELNET_IAC, o.TELNET_GA]);
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('command', (option) => {
    if (option !== o.TELNET_GA) {
      done(new Error(option));
    }
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer);
});

test('emit a sub event', (done) => {
  const testBuffer = Buffer.from([
    o.TELNET_IAC,
    o.TELNET_SB,
    TELNET_FAKE_OPTION,
    1,
    2,
    3,
    4,
    5,
    o.TELNET_IAC,
    o.TELNET_SE,
  ]);
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('sub', (option, buffer) => {
    expect(option).toBe(TELNET_FAKE_OPTION);
    expect(buffer).toEqual(Buffer.from([1, 2, 3, 4, 5]));
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer);
});

test('mixed text and commands', (done) => {
  const buf1 = Buffer.from('Hello-');
  const buf2 = Buffer.from([
    o.TELNET_IAC,
    o.TELNET_SB,
    o.TELNET_GMCP,
    1,
    2,
    3,
    o.TELNET_IAC,
    o.TELNET_SE,
    97, // a
  ]);
  const buf3 = Buffer.from('nd bye');
  const buf4 = Buffer.from([o.TELNET_IAC, o.TELNET_SE]);
  let finalData = '';
  ee.on('tel:text', (chunk) => {
    finalData += chunk;
  });
  ee.on('game:gmcp', (gmcp) => {
    expect(gmcp).toEqual('\x01\x02\x03');
  });

  const testStream = new TelnetInput();
  testStream.on('data', () => {});
  testStream.on('end', () => {
    expect(finalData).toBe('Hello-and bye');
    ee.off('game:gmcp');
    ee.off('tel:text');
    done();
  });

  testStream.write(buf1);
  testStream.write(buf2);
  testStream.write(buf3);
  testStream.end(buf4);
});

test('emit a WILL event', (done) => {
  const testBuffer = Buffer.alloc(1024);
  testBuffer[0] = o.TELNET_IAC;
  testBuffer[1] = o.TELNET_WILL;
  testBuffer[2] = o.TELNET_ATCP;
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('will', (option) => {
    if (option !== o.TELNET_ATCP) {
      done(new Error(option));
    }
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer.slice(0, 3));
});

test('emit a WONT event', (done) => {
  const testBuffer = Buffer.alloc(64);
  testBuffer[0] = o.TELNET_IAC;
  testBuffer[1] = o.TELNET_WONT;
  testBuffer[2] = TELNET_FAKE_OPTION;
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('wont', (option) => {
    if (option !== TELNET_FAKE_OPTION) {
      done(new Error(option));
    }
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer.slice(0, 3));
});

test('emit a DO event', (done) => {
  const testBuffer = Buffer.alloc(64);
  testBuffer[0] = o.TELNET_IAC;
  testBuffer[1] = o.TELNET_DO;
  testBuffer[2] = TELNET_FAKE_OPTION;
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('do', (option) => {
    if (option !== TELNET_FAKE_OPTION) {
      done(new Error(option));
    }
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer.slice(0, 3));
});

test('emit a DONT event', (done) => {
  const testBuffer = Buffer.alloc(64);
  testBuffer[0] = o.TELNET_IAC;
  testBuffer[1] = o.TELNET_DONT;
  testBuffer[2] = TELNET_FAKE_OPTION;
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('dont', (option) => {
    if (option !== TELNET_FAKE_OPTION) {
      done(new Error(option));
    }
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer.slice(0, 3));
});

test('IAC bytes', (done) => {
  const testBuffer = Buffer.alloc(64);
  for (let i = 0; i <= 7; i++) {
    testBuffer[i] = o.TELNET_IAC;
  }
  let finalData = '';

  const testStream = new TelnetInput();
  testStream.on('data', (chunk) => {
    finalData += chunk;
  });
  testStream.on('end', () => {
    expect(finalData).toBe('');
    done();
  });
  testStream.end(testBuffer.slice(0, 8));
});
