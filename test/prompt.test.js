import { expect, test } from 'bun:test';
import { PROMPT } from '../achaea/core/output.ts';

test('test prompt matching', () => {
  let p = `<span class="ansi-green">2036h, </span><span class="ansi-green">2341m </span><span class="ansi-lightGray">ex-</span>`;
  let m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="ansi-green">2036h, </span><span class="ansi-yellow ansi-bright">739m </span><span class="ansi-lightGray">x-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="ansi-green">2036h, </span><span class="ansi-red ansi-bright">239m </span><span class="ansi-lightGray">e-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="ansi-red ansi-bright">200h, </span>
<span class="ansi-green">2341m </span><span class="ansi-lightGray">-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="ansi-green">2036h, </span><span class="ansi-green">2341m, </span><span class="ansi-green">7065e, </span><span class="ansi-green">7530w </span><span class="ansi-lightGray">ex-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p =
    `<span class="ansi-green">1745h, </span><span class="ansi-green">2239m, </span>` +
    `<span class="ansi-green">7065e, </span><span class="ansi-green">7530w, </span>` +
    `<span class="ansi-green">47R</span><span class="ansi-lightGray"> e-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p =
    `</span><span class="ansi-green">1938h, </span><span class="ansi-green">2239m, </span>` +
    `<span class="ansi-green">7065e, </span><span class="ansi-green">7530w, </span>` +
    `<span class="ansi-red ansi-bright">47R</span><span class="ansi-lightGray"> ex-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect('</span>' + m[0]).toBe(p);
});
