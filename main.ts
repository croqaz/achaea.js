import mri from 'mri';
import { startServer } from './achaea/server/index.ts';
import fakeEvents from './achaea/server/fake.ts';
import { setupDB } from './achaea/extra/leveldb.ts';
import { STATE } from './achaea/core/state.ts';
import * as achaea from './achaea/index.ts';

const options = {
  default: {
    telnet: 1,
    server: 1,
    port: 18888,
    fake: 0,
  },
};

(async () => {
  // Play the game:
  // bun main.ts <NAME>
  // Start in fake mode:
  // NODE_ENV=test bun main.ts --fake 1 --telnet 0 <NAME>
  const args = mri(process.argv.slice(2), options);

  if (args._.length !== 1) {
    return console.error('Must specify a player name!');
  }

  const player = args._[0].trim();
  STATE.Me.name = player;

  setupDB(player);

  // HTTP server
  if (args.server) startServer(args.port);
  // Fake events (for testing)
  if (args.fake) fakeEvents();
  // Achaea telnet
  if (args.telnet) achaea.connect(player);
})();
