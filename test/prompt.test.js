import { expect, test } from 'bun:test';
import { PROMPT } from '../achaea/core/output.ts';

test('test prompt matching', () => {
  let p = `<span class="c-green">2036h, </span><span class="c-green">2341m </span><span class="c-lightGray">ex-</span>`;
  let m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="c-green">2036h, </span><span class="c-yellow ansi-bright">739m </span><span class="c-lightGray">x-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="c-green">2036h, </span><span class="c-red ansi-bright">239m </span><span class="c-lightGray">e-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="c-red ansi-bright">200h, </span>
<span class="c-green">2341m </span><span class="c-lightGray">-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p = `<span class="c-green">2036h, </span><span class="c-green">2341m, </span><span class="c-green">7065e, </span><span class="c-green">7530w </span><span class="c-lightGray">ex-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p =
    `<span class="c-green">1745h, </span><span class="c-green">2239m, </span>` +
    `<span class="c-green">7065e, </span><span class="c-green">7530w, </span>` +
    `<span class="c-green">47R</span><span class="c-lightGray"> e-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect(m[0]).toBe(p);

  p =
    `</span>\n<span class="c-green">1938h, </span><span class="c-green">2239m, </span>` +
    `<span class="c-green">7065e, </span><span class="c-green">7530w, </span>` +
    `<span class="c-red ansi-bright">47R</span><span class="c-lightGray"> ex-</span>`;
  m = p.match(PROMPT);
  expect(m).toBeTruthy();
  expect('</span>\n' + m[0]).toBe(p);
});
