# Achaea.js

An [Achaea.com](https://achaea.com/) MUD client.

## Why?

Because it's an interesting programming project.
Because all the other MUD clients are not flexible enough for my needs.

## Features

* capture lots of **GMCP states** in a big state tree
* **persistent logging** of the game text, all GMCP events and your input commands
* one **persistent DB** for each character
* when you run WARES, all the prices are saved in DB; you can find them in the game with `//find wares <item>`
* when you run QWHO, all the players are saved in DB; you can find them with `//find whois <name>`
* when you HONOURS (or WHOIS) somebody, the info is also saved in the DB
* when you walk around, the room info, all items and NPCs are saved in the DB; you can find items with `//find item <name>` and NPCs with `//find npc <name>`
* the official Achaea map is included and you can search for rooms and areas with `//map room <name>` or `//map area <name>`
* you can auto-walk to any room on the map, *if there is a path* in the official Achaea map
* auto attack target until the end; auto rage attacks for Runewarden (I will make this more general)
* auto selfishness, using the `//greed` command; if a thief is making you generous, the selfishness is triggered immediately

Has a cute browser GUI. *I think* it's cute. GUI features:

* you can see the live map, if the room exists in the official Achaea map
* you can double click on any room to try to auto-walk, if there is a path
* you can see the room NPCs, items and players; when a player or NPC is entering or leaving the room, the list is instantly updated
* click on a player or NPC to trigger a probe, or honours command
* you can see your defences and afflictions
* tells, says and other communications are visible on the right side
* you can expand the map with Ctrl+M and expand the communications with Ctrl+,
* of course you can see the game log!
* your input command history is kept in memory; you can go up or down in the history

## Missing features

* local curing
* defence keepup
* limb tracker
* enemy tracker
* many others

## Usage

This is a [Bun](https://bun.sh) project.
Git clone, Bun install, then run:

$ bun main.ts &lt;NAME>

The *name* is your Achaea character and it's used to create the local DB with your name.
Type your password and start playing Achaea.

## Alternatives

* https://play.achaea.com/
* https://mudlet.org/
* https://github.com/Blightmud/Blightmud
* https://tintin.mudhalla.net/
* https://gammon.com.au/mushclient/mushclient.htm -- Old, Windows only

## License

[MIT](LICENSE) © Cristi Constantin.
