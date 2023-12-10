import { parse } from 'ansicolor';

export default function ansiToHtml(text: string): string {
  const parts = [];
  for (const el of parse(text).spans) {
    if (!el.text) {
      continue;
    }
    const cls = [];
    if (el.color) {
      if (el.color.name) {
        cls.push(`ansi-${el.color.name}`);
      }
      if (el.color.bright) {
        cls.push('ansi-bright');
      }
      if (el.color.dim) {
        cls.push('ansi-dim');
      }
      if (el.italic) {
        cls.push('italic');
      }
      // @ts-ignore: Types
      if (el.underline) {
        cls.push('underline');
      }
      // @ts-ignore: Types
      if (el.inverse) {
        cls.push('inverse');
      }
    }
    parts.push(el.color ? `<span class="${cls.join(' ')}">${el.text}</span>` : el.text);
  }
  return parts.join('');
}
