# Achaea.js

An [Achaea.com](https://achaea.com/) MUD client.

## What is Achaea?

- https://mud.fandom.com/wiki/Achaea,_Dreams_of_Divine_Lands
- https://iloveit.net/game/achaea -- I love It: Achaea

## Why Achaea.js?

Because it's an interesting programming project and a good challenge.
This is the only Achaea client made "from scratch", starting from Telnet, all the way up.
Obviously, there are some third party JavaScript libraries, but it's a completely new client.

## Features

* captures lots of **GMCP states** in a big state tree
* **persistent logging** of the game text, all GMCP events and your input commands
* one **persistent DB** for each character, which records rooms, items, players, etc.
* when you run WARES, all the prices are saved in DB; you can find them in the game with `//find wares <item>`
* when you run QWHO, all the players are saved in DB; you can find them with `//find whois <name>`
* when you HONOURS (or WHOIS) somebody, the info is also saved in the DB
* when you walk around, the room info, all items and NPCs are saved in the DB; you can find items with `//find item <name>` and NPCs with `//find npc <name>`
* the official Achaea map is included and you can search for rooms and areas with `//map room <name>` or `//map area <name>`
* you can auto-walk to any room on the map, *if there is a path* in the official Achaea map
* auto selfishness, using the `//greed` command; if a thief is making you generous, the selfishness is triggered immediately

Has a cute browser GUI. *I think* it's cute. GUI features:

* you can see the live map, if the room exists in the official Achaea map. Most of the areas are mapped.
* you can double click on any room to try to auto-walk, if there is a path
* you can see the room NPCs, items and players; when a player or NPC is entering or leaving the room, the list is instantly updated
* click on a player or NPC to trigger a "probe item", or "honours player" command
* you can see your level, experience, defences and afflictions
* tells, says and other communications are visible on the right side
* you can expand the map with `Ctrl+M` and expand the communications with `Ctrl+,`
* of course you can see the game log right in the middle!
* your input command history is kept in the browser storage; you can go up or down in the history

## Missing features

* local curing
* defence keepup
* limb tracker
* enemy tracker
* many, many others

## Base aliases

* wares -- run WARES and collect prices in DB
* qwho -- run quick WHO and collect users in DB
* honours -- run HONOURS and update player in DB

* ll - look at all denizens in the room
* la - look at all players in the room

* //stress ITEM - run all kinds of actions on an item, to see what works (twist, turn, push, pull...)
* //quest NPC - say all kinds of questy things to an NPC

* //find wares ITEM - find and list all matching items from the DB
* //find whois NAME - find and list all matching players from the DB
* //find room NAME - find and list all matching room names from the DB
* //find item NAME - find and list all matching items from the DB
* //find npc|deniz NAME - find and list all matching NPCs from the DB
* //find plant NAME - find and list all plants matching
* //find mineral NAME - find and list all minerals matching
* //find venom NAME - find and list all venoms matching
* //find rune NAME - find and list all runes matching

* //map room WHATEVER - try to find the room ID using the MAP data, so you can walk to it
* //map area WHATEVER - try to find the area ID using the MAP data
* //map mid UID - try to find the middle room of the area ID, so you can walk to it

* //goto UID -- try to walk to a room ID, in the local area
* //goto UID global -- try to walk to a global room ID, anywhere on the map
* NOTE: if you can use the server side WALK TO command, you should use it, it's faster and more reliable;
  After getting close to the place you want to be, you can //goto a room.
* //goto stop -- stop/pause walking. You can resume with //goto start
* //goto start -- continue walking on the same path, ONLY IF you are in the same room where you stopped;
  If you have gone off-course, just call //goto UID again, to calculate a new path
* //goto next -- take one step towards the room ID, after stop
* //goto prev -- take one step back to the starting room, after stop

* //explore area -- try to explore all the rooms in one area; this can get stuck
* //explore stop, start, next, prev -- they work just like the //GOTO command

* www - writhe forever, to keep yourself off balance
* wxx - writhe stop, or just STOP

## Usage

This is a [Bun](https://bun.sh) project.
Git clone this repository, Bun install, then run:

$ bun main.ts &lt;NAME>

The *name* is your Achaea character and it's used to create the local DB with your name.
You need to open a browser on http://127.0.0.1:18888/ ; type your password and start playing Achaea.
You can skip typing your password if you setup an ENV variable with the name if your character, like: "*NAME*_PASSWD". Eg: if your character is called "Sarapis", you can define the password for this character with `export SARAPIS_PASSWD=...`. When you play "Sarapis", the password will be typed for you.

Testing/ simulation mode:

$ NODE_ENV=test bun main.ts --fake 1 --telnet 0 &lt;NAME>

Fake mode allows you to launch the GUI without connecting to the live game. This is used for development of the interface.

## Alternative clients

* https://play.achaea.com/
* https://mudlet.org/
* https://github.com/Blightmud/Blightmud
* https://tintin.mudhalla.net/
* https://gammon.com.au/mushclient/mushclient.htm -- Old, Windows only
* https://wikipedia.org/wiki/List_of_MUD_clients

## Mudlet add‐ons

* https://github.com/Legacy-System/Legacy -- Legacy
* https://github.com/svof/svof/tree/in-client-svof -- Svof
* https://github.com/demonnic/MDK -- MDK
* https://github.com/tynil/WunderSys -- WunderSys
* https://github.com/DigitalWarzone/zGUI -- zGUI

## License

[MIT](LICENSE) © Cristi Constantin.
