# The state tree

This is probably the most important feature of Achaea.js.

The State Tree represents everything we know about the game and is like "Sarapis the Logos", a source of Truth.

It is updated in a very strict order:

* the 1st source of truth is GMCP
* the 2nd source of truth, less trustworthy is from the game text via triggers
* the 3rd source of truth, is from user input or logic, to store flags & such
* most of the STATE tree is frozen (read-only), except for State.Custom

You are not allowed to change the State Tree yourself (except for State.Custom), you can only read from it.

To import it, call (something like this, depending where you import this from):

```ts
import { STATE } from '../core/state.ts';
```

## STATE.Me

This contains info about the player. YOU! It contains your name, class, house, gold, hp, rift items, inventory items, wielded weapons, afflictions, defences, skills...

## STATE.Room

This contains room info. Room ID, name, area, exits, items and players in the room...

## STATE.Time

This is the time, in game. The day, month, year, hour, moon phase...

## STATE.Battle

This is not finished.

## STATE.Stats

**Not completely finished**. This tracks the time you start playing and how much gold you have and prints the stats when you leave the game.

Also tracks the times of different balance, to get a feeling of how long each one takes.

## STATE.Queue

It's a client queue, similar to the server-side queue. You can push events that will run when you have balance, equilibrium, or both.

## STATE.Custom

This is where you can go crazy. Feel free to create your own variables and sync them between aliases & triggers.
