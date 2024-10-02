# Events

How to listen for events, from the `custom` folder:

```js
import ee from '../achaea/events/index.ts';

ee.on('game:start', function () {
  // Run some logic in game start...
});

ee.on('game:text', function (origText, normText) {
  // Do something with the game text
  // Also called: triggers/ reflexes
});

ee.on('myself:update', function (data) {
  // `data` will contain your vitals & info
});
```

You can listen to the same event MORE than once, and all your hook functions will run in order.
This is useful to separate the triggers in different files, organized by type, eg: triggers for hunting, triggers for PVP, etc.

### game:start

Emitted after a successful login, and after the initial GMCP Core.Supports.
You can use this, eg: to call your defences-up.

### game:quit

Emitted after you typed "quit" and after you "begin to silently pray for preservation of your soul".
You can use this to save some game states for next time, or stop any running background tasks.

### game:text

This is cleaned game text (no ANSI escape codes) and you can **use it for triggers/ reflexes**.
The first param is the clean game text, the second param is the normalized & cleaned game text
(all duplicate spaces and newlines are removed).
The second text is especially important if you want to capture long line of text, which can break
and span over multiple lines.

### class:update

This is called when the class is initialized, or when the class is changed.
The function receives 2 params: the old class, and the new class.
You can use it to cleanup when switching a class, eg: put items in pack, stop curing defences;
or you can use it to prepare when switching classes, eg: wear armour, enable defences.

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

### have:eb

Emitted when you have both physical balance & mental equilibrium, and you recovered either one of them.
This is considered a new round.
