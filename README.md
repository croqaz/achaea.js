# Achaea.js

## Base aliases

* wares -- run WARES and collect prices in DB
* qwho -- run quick WHO and collect users in DB
* honours -- run HONOURS and update player in DB

* kk TARGET -- will attack the target until dead
* kkx| kk 0 -- will reset the target and stop the attack
* kka -- will attack a random NPC in the room. Can be dangerous!!

* stop -- stops auto-attacking or auto-walking

* filla -- fill all vials with less than 190 sips

* ll - look at all denizens in the room
* la - look at all players in the room

* //ga - will gather all plants in the room
* //ha - will harvest all plants in the room
* //gh - will gather & harvest all plants in the room
* //ea - will extract all minerals in the room
* make sure to call INR ALL after harvesting and gathering

* //mill r [1-5] - mill red inks
* //mill b [1-5] - mill blue inks
* //mill y [1-5] - mill yellow inks
* //mill g [1-5] - mill green inks

* //stress ITEM - run all kinds of actions on an item, to see what works (twist, turn, push, pull...)
* //quest NPC - say all kinds of questy things to an NPC

* //map room WHATEVER - try to find the room ID using the MAP data, so you can walk to it
* //map area WHATEVER - try to find the area ID using the MAP data
* //map mid UID - try to find the middle room of the area ID, so you can walk to it

* //goto UID -- try to walk to a room ID, in the local area
* //goto UID global -- try to walk to a global room ID, anywhere on the map
* NOTE: if you can use the server side WALK TO command, you should use it;
  After getting close to the place you want to be, you can //goto a room.
* //goto stop -- stop/pause walking. You can resume with //goto start
* //goto start -- continue walking on the same path, ONLY IF you are in the same room where you stopped;
  If you have gone off-course, just call //goto UID again, to calculate a new path
* //goto next -- take one step towards the room ID, after stop
* //goto prev -- take one step back to the starting room, after stop

* //explore area -- try to explore all the rooms in one area; this can get stuck
* //explore stop, start, next, prev -- they work just like the //GOTO command

* //find wares ITEM - find and list all matching items from the DB
* //find whois NAME - find and list all matching players from the DB
* //find room NAME - find and list all matching room names from the DB
* //find item NAME - find and list all matching items from the DB
* //find npc|deniz NAME - find and list all matching NPCs from the DB
* //find plant NAME - find and list all plants matching
* //find mineral NAME - find and list all minerals matching
* //find venom NAME - find and list all venoms matching
* //find rune NAME - find and list all runes matching

* www - writhe forever, to keep yourself off balance
* wxx - writhe stop
