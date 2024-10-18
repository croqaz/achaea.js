import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'url';

import mri from 'mri';
import * as sass from 'sass';

const options = {
  default: {
    style: 'style',
    fonts: 'mono',
    theme: 'nord',
    output: null,
  },
};

String.prototype.toTitle = function (): string {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

(() => {
  // Compile style.css using a theme:
  // bun themes.ts <OUTPUT>
  const args = mri(process.argv.slice(2), options);

  const DIR = import.meta.dirname;
  const STATIC = path.normalize(DIR + '/../static/');
  const CUSTOM = path.normalize(DIR + '/../../custom/static/');
  const file0 = `${args.style.toLowerCase()}.scss`;
  const file1 = `font${args.fonts.toTitle()}.scss`;
  const file2 = `theme${args.theme.toTitle()}.scss`;

  function loadStyle(fname: string): Buffer {
    let fpath = path.join(DIR, fname);
    if (fs.existsSync(path.join(CUSTOM, fname))) {
      fpath = path.join(CUSTOM, fname);
    }
    console.log('Loading:', path.relative(process.cwd(), fpath), '...');
    return fs.readFileSync(fpath);
  }

  const styleScss = loadStyle(file0);
  const fontsScss = loadStyle(file1);
  const themeScss = loadStyle(file2);

  const scss = "@use 'sass:color'; @use 'sass:math';\n" + fontsScss + '\n' + themeScss + '\n' + styleScss;
  const result = sass.compileString(scss, {
    importers: [
      {
        findFileUrl(url) {
          if (!url.startsWith('~')) return null;
          return new URL(url.substring(1), pathToFileURL('node_modules'));
        },
      },
    ],
  });

  if (!args.output && fs.existsSync(CUSTOM)) {
    args.output = path.join(CUSTOM, 'style.css');
  } else if (!args.output) {
    args.output = path.join(STATIC, 'style.css');
  }

  fs.writeFileSync(args.output, result.css);
  console.log(`Final style saved to: ${path.relative(process.cwd(), args.output)}.`);
})();
