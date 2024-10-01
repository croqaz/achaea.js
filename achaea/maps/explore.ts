import * as m from './maps.ts';

/*
 * Helper to convert explore IDs to map directions.
 */
export function exploreDirections(map, startNode: string) {
  let index = 1;
  let prev = null;
  const directions = [];
  const walk = exploreMap(map.vertices, startNode);
  for (const uid of walk) {
    const nextID = walk[index];
    // Auto walking over
    if (!nextID) {
      directions.push({ uid, next: null, prev });
      break;
    }
    let found = null;
    const thisRoom = m.MAP.rooms[uid];
    for (const exit of thisRoom.exits) {
      const dir = exit.direction;
      if (exit.target === nextID) {
        found = { uid, next: m.EXITS[dir] || dir, prev };
        break;
      }
    }
    directions.push(found);
    if (found) prev = found.next;
    index++;
  }
  return directions;
}

/*
 * A function to explore all the nodes in the graph in a loop, starting and ending at the same node,
 * without teleporting. The Edges and Nodes can both be repeated.
 */
export function exploreMap(graph, startNode: number | string) {
  const visited = new Set(); // To keep track of visited nodes
  const path = []; // To store the path

  function dfs(node: number | string) {
    visited.add(node);
    if (!graph.get(node)) return;

    const lastNode = path[path.length - 1];
    if (graph.get(lastNode) === undefined || graph.get(lastNode).has(node)) {
      path.push(node);
    } else {
      path.push(...shortestPath(graph, lastNode, node));
    }

    for (const neighbor of graph.get(node).keys()) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  dfs(startNode);

  const lastNode = path[path.length - 1];
  if (lastNode !== startNode) {
    if (graph.get(lastNode).has(startNode)) {
      path.push(startNode);
    } else {
      path.push(...shortestPath(graph, lastNode, startNode));
    }
  }

  return path;
}

/*
 * Helper function to find the shortest path between 2 nodes in a directed graph.
 * Checked and re-checked for speed, this is the fastest!
 */
function shortestPath(graph, startNode: number | string, targetNode: number | string) {
  const queue = [[startNode]]; // Queue to store the paths to explore
  const visited = new Set(); // To keep track of visited nodes

  while (queue.length > 0) {
    const path = queue.shift(); // Get the first path from the queue
    const node = path[path.length - 1]; // Get the last node in the path

    if (node === targetNode) {
      visited.clear();
      return path?.slice(1);
    }

    // If not visited, explore the neighbors
    if (!visited.has(node)) {
      visited.add(node);
      if (!graph.get(node)) continue;
      for (const neighbor of graph.get(node).keys()) {
        const newPath = [...path, neighbor]; // Create a new path including the neighbor
        queue.push(newPath); // Add this new path to the queue
      }
    }
  }

  visited.clear();
  return [];
}
