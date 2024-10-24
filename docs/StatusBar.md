# Status Bar

The "status bar" is an optional GUI feature, that can show up at the bottom of the page, just on top of the health & mana bar.

You can customize it to show lots of different things like: your weapons & armour, your gold or credits, different defences or afflictions, your runes, the state of your loyal pets and pretty much every state of the game you can think of.

## How to

You can find some presets to get you started, in [extra/statBarPresets.ts](achaea/extra/statBarPresets.ts).

All you need to do is define some cells/icons in an object and call `updateStatBar(...)` with your cells, everytime the state changes, so you need to listen the relevant events.

For example, create a file: `custom/statBar.ts` and don't forget to import it from `custom/index.ts`. In this file, enable a few cells/icons:

```ts
import ee from '../achaea/events/index.ts';
import * as bar from '../achaea/extra/statBarPresets.ts';
import { updateStatBar } from '../achaea/core/state.ts';

ee.on('myself:update', () => {
  updateStatBar({
    wieldedL: bar.wieldedIcon('left'),
    wieldedR: bar.wieldedIcon('right'),
    armour: bar.wornArmour(),
    ping: bar.pingIcon(),
  });
});
```

In this example, you'll see 4 cells: one for the weapon wielded left and another for the weapon wielded right, your current armour and the Achaea server response time (ping). The refresh of the status bar will happen everytime the player data changes.

If you want to refresh the status bar based on different events, for example room items or players, you'll have to listen on "items:update", or "players:update" events and call `updateStatBar(...)` in those functions.
