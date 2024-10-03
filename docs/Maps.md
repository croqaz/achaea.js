# Maps

The game maps are using the official Achaea data.

The map widget similar to the Mudlet & Nexus maps, but written from scratch using [Paper.js](http://paperjs.org).

You can find a standalone version of the maps at: https://github.com/croqaz/achaea-map ; This was later integrated in the MUD client.

## Walker

If you double click on a room from the map, the walker algorithm will try to take you in that room, if there's a path and if you can actually walk there.

The walking function is *currently* really dumb, it doesn't swim, it doesn't open doors, it doesn't retry if you slip & fall on ice, etc.

## Geeky boy say 🤓

The walker uses the Dijkstra algorithm to find the shortest distance between where you are now, and where you want to go.

The map area is a graph and the distance is calculated by assigning slowness/distance values to the game rooms based on environment, eg: road, path, urban environments have a distance=1, flames, lava have a distance=3, while water, river, oceans have a distance=4. This will make the algorithm try to avoid the slow environments if possible.
