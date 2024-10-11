import { pathToFileURL } from 'url';
import fs from 'node:fs';

import mri from 'mri';
import * as sass from 'sass';

const options = {
  default: {
    fonts: 'mono',
    theme: 'nord',
    output: 'style.css',
  },
};

String.prototype.toTitle = function () {
  return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

(() => {
  // Compile style.css using a theme:
  // bun themes.ts <OUTPUT>
  const args = mri(process.argv.slice(2), options);

  const DIR = import.meta.dirname;
  const file1 = `font${args.fonts.toTitle()}.scss`;
  const file2 = `theme${args.theme.toTitle()}.scss`;

  console.log('Loading:', file1, '...');
  const fontsScss = fs.readFileSync(`${DIR}/${file1}`);
  console.log('Loading:', file2, '...');
  const themeScss = fs.readFileSync(`${DIR}/${file2}`);
  console.log('Loading: style.scss ...');
  const styleScss = fs.readFileSync(DIR + '/style.scss');

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

  fs.writeFileSync(args.output, result.css);
  console.log('Final style saved to:', args.output);
})();
