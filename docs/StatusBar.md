# Status Bar

The "status bar" is an optional GUI feature, that can show up at the bottom of the page, just on top of the health & mana bar.

You can customize it to show lots of different things like: your weapons & armour, your gold or credits, different defences or afflictions, your runes, the state of your loyal pets and pretty much every state of the game you can think of.

## How to

You can find some presets to get you started, in [extra/statBarPresets.ts](../achaea/extra/statBarPresets.ts).

All you need to do is define an object that represents cells/icons in the bar and call `updateStatBar(...)` with your object everytime the relevant state changes.

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

If you play multiple characters, you can define different bars for each one, just return different cells based on `STATE.Me.name`.

## Custom cells

A custom cell, or icon in the status bar is just an object. At minimum, you can just return a text, eg:

```ts
def boringIcon() {
  return { text: 'a' }
}
```

The following properties are supported:

* text -- very short emoji, SVG, or plain text for this cell
* label -- a tooltip that will show up on hover (only when you use text)
* cmd -- a command that is sent to the game, when you click the icon (only when you use text)
* html -- custom HTML which can include pretty much anything. Use this INSTEAD of text!

## Icons

There are 2 icon packs already included:

- Font-Awesome v6 : https://fontawesome.com/v6/search?m=free
- RPG-Awesome : https://nagoshiashumari.github.io/Rpg-Awesome

So, for example if you want to use the icon "Home" from Font-Awesome, you could return:

```ts
def homeIcon() {
  return { html: '<i class="fa-solid fa-house"></i>' }
}
```

Or, if you would want a "Spear" icon from RPG-Awesome, you could return:

```ts
def spearIcon() {
  return { html: '<i class="ra ra-spear-head"></i>' }
}
```
