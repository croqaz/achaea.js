import mri from 'mri';
import * as R from 'remeda';

import startServer from './achaea/server/index.ts';
import fakeEvents from './achaea/server/fake.ts';
import { setupDB } from './achaea/extra/leveldb.ts';
import { STATE } from './achaea/core/state.ts';
import { Config } from './achaea/config.ts';
import * as achaea from './achaea/index.ts';

const options = {
  default: {
    fake: 0,
    extra: 1,
    login: 1,
    telnet: 1,
    port: 18888,
    host: '127.0.0.1',
    achaea: 'achaea.com',
  },
};

(async () => {
  // Play the game:
  // bun main.ts <NAME>
  // Start in production mode:
  // NODE_ENV=production bun main.ts <NAME>
  // Start in fake mode:
  // NODE_ENV=test bun main.ts --fake 1 --telnet 0 <NAME>
  const args = mri(process.argv.slice(2), options);

  if (args._.length !== 1) {
    console.error('Must specify a player name!');
    process.exit(1);
  }
  if (args.fake && args.telnet) {
    console.error('FAKE and TELNET cannot be used together!');
    process.exit(1);
  }

  Config.ACHAEA = args.achaea;
  Config.EXTRA = !!args.extra;
  Config.LOGIN = !!args.login;

  if (!Config.EXTRA) {
    console.log('Extra aliases and triggers are disabled.');
  }
  if (!Config.LOGIN) {
    console.log('Auto-login is disabled.');
  }

  const player = args._[0].trim();
  STATE.Me.name = R.capitalize(player);

  setupDB(player);

  // HTTP server
  await startServer(args.port, args.host);
  // Fake events (for testing)
  if (args.fake) fakeEvents();
  // Achaea telnet, start with a delay
  if (args.telnet) setTimeout(() => achaea.connect(player), 2500);
})();
