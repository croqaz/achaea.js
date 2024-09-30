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
        cls.push(`c-${el.color.name}`);
      }
      if (el.color.bright) {
        cls.push('c-bright');
      }
      if (el.color.dim) {
        cls.push('c-dim');
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
    if (el.bgColor) {
      if (el.bgColor.name) {
        cls.push(`bg-${el.bgColor.name}`);
      }
      if (el.bgColor.bright) {
        cls.push('bg-bright');
      }
      if (el.bgColor.dim) {
        cls.push('bg-dim');
      }
    }
    parts.push(el.color || el.bgColor ? `<span class="${cls.join(' ')}">${el.text}</span>` : el.text);
  }
  return parts.join('');
}
