# Events

How to listen for events:

```js
import ee from '../events/index.ts';

ee.on('game:start', function () {
  // Run some logic in game start...
});

ee.on('game:text', function (text) {
  // Do something with the game text
  // Also called: triggers/ reflexes
});

ee.on('myself:update', function (data) {
  // `data` will contain your vitals & info
});
```

You can listen to the same event MORE than once, and all your functions will run in order.
This is useful to separate the triggers in different files, organized by type, eg: triggers for hunting, triggers for PVP, etc.

### game:start

Emitted after a successful login, and after the initial GMCP Core.Supports.
You can use this, eg: to call your defences-up.

### game:quit

Emitted after you typed "quit" and after the "begin to silently pray for preservation of your soul".
You can use this to save some states for next time, or stop any running background tasks.

### game:text

This is cleaned game text (no ANSI escape codes) and you can **use it for triggers/ reflexes**.

### myself:update

Emitted after your vitals, experience, or any other player variable is updated.

You probably don't need to use it like that; it is used by the interface to display your stats.

### inv:update

Emitted when the player inventory is updated.

### rift:update

Emitted when the player rift is updated.

### room:update

Emitted when you move to another room, or when you LOOK at the room.

It is used by the interface to refresh the current map room.

### items:update

Emitted when the room items are updated, eg: someone drops or picks up something.

It is used by the interface to display the room items.

### players:update

Emitted when the room players are updated, eg: a player enters or leaves the room.

It is used by the interface to display the room players.
