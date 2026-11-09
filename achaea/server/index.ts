// deno-lint-ignore-file no-explicit-any no-process-globals
import fs from 'node:fs';
import path from 'node:path';
import * as R from 'remeda';
import type { Server } from 'bun';

import * as T from '../types.ts';
import ee from '../events/index.ts';
import * as m from '../maps/index.ts';
import { ATLAS } from '../maps/atlas.ts';
import * as db from '../extra/leveldb.ts';
import { STATE } from '../core/state.ts';
import { userInput } from '../core/input.ts';

const STATIC = path.normalize(__dirname + '/../static/');
const CUSTOM = path.normalize(__dirname + '/../../custom/static/');

// URL path -> file in the static folder
// Every script, stylesheet and page that index.html, map.html, dbex.html & wild.html
// reference MUST be listed here, or the browser gets a 404
const ROUTES: Record<string, string> = Object.freeze({
  '/': 'index.html',
  '/dbex': 'dbex.html',
  '/map': 'map.html',
  '/client.js': 'client.js',
  '/map.js': 'map.js',
  '/wild': 'wild.html',
  '/wild.js': 'wild.js',
  '/sounds.js': 'sounds.js',
  '/ZzFX.js': 'ZzFX.js',
  '/mapView.js': 'mapView.js',
  '/paper.js': 'paper.js',
  '/search.js': 'search.js',
  '/style.css': 'style.css',
  '/rpg-icons.css': 'rpg-icons.css',
});
// These files can be overridden from the custom static folder
const CUSTOMIZABLE = Object.freeze(new Set(['/client.js', '/style.css']));

const OMIT_PLAYER_FIELDS = Object.seal(['rift', 'items', 'wielded', 'worn', 'skills', 'flying', 'riding', 'waterWalk']);

function mime(pth: string): string {
  const ext = pth.split('.').pop();
  switch (ext) {
    case 'html':
      return 'text/html';
    case 'js':
      return 'text/javascript';
    case 'css':
      return 'text/css';
    case 'json':
      return 'application/json';
    case 'ico':
      return 'image/x-icon';
    case 'svg':
      return 'image/svg+xml';
    case 'otf':
      return 'font/otf';
    case 'ttf':
      return 'font/ttf';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'eot':
      return 'application/vnd.ms-fontobject';
    default:
      return 'text/plain';
  }
}

async function stf(pth: string) {
  const body = await Bun.file(path.join(STATIC, pth)).bytes();
  return new Response(body, { headers: { 'Content-Type': mime(pth) } });
}

async function stf2(pth: string) {
  if (fs.existsSync(path.join(CUSTOM, pth))) {
    const body = await Bun.file(path.join(CUSTOM, pth)).bytes();
    return new Response(body, { headers: { 'Content-Type': mime(pth) } });
  }
  return stf(pth);
}

function serveRoute(route: string) {
  const file = ROUTES[route];
  return CUSTOMIZABLE.has(route) ? stf2(file) : stf(file);
}

export default async function startServer(port = 18888, hostname = '127.0.0.1') {
  // Static route responses are cached
  // for the lifetime of the server
  // So we only use them in production
  let staticRoutes: Record<string, any> = {
    '/favicon.ico': await stf('favicon.ico'),
  };
  if (process.env.NODE_ENV === 'production') {
    console.log('Starting production mode.');
    for (const route of Object.keys(ROUTES)) {
      staticRoutes[route] = await serveRoute(route);
    }
  }

  const server = Bun.serve({
    port,
    hostname,
    static: staticRoutes,

    async fetch(req: Request, srv: Server) {
      const url = new URL(req.url);
      const pth = url.pathname;
      const params = url.searchParams;
      // console.debug('Request:', pth);

      // maps API
      if (pth === '/map.json') {
        // For DEBUG only: see the whole map
        return Response.json(m.MAP, {
          headers: {
            'Cache-control': 'public, max-age=3600',
          },
        });
      }
      if (pth === '/wild-map.html') {
        // The wilderness atlas of a world, as it is in memory
        const world = parseInt(params.get('world')) || 0;
        return new Response(ATLAS.html(world), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-control': 'no-cache' },
        });
      }
      if (pth === '/room.json') {
        return Response.json(R.omit(STATE.Room, ['items', 'players']), {
          headers: {
            'Cache-control': 'public, max-age=1',
          },
        });
      }
      if (pth === '/area.json') {
        const area = await m.getArea(params.get('id'), true);
        return Response.json(area, {
          headers: {
            'Cache-control': 'public, max-age=1',
          },
        });
      }
      if (pth === '/areas.json') {
        // All the areas that have rooms: [[id, name], ...]
        const areas = Object.entries(m.MAP.areas)
          .filter(([id, a]) => a.name && m.AREAS[id])
          .map(([id, a]) => [id, a.name]);
        return Response.json(areas, {
          headers: {
            'Cache-control': 'public, max-age=3600',
          },
        });
      }
      if (pth === '/rooms.json') {
        // Find rooms by ID, or by title (for the map explorer)
        const q = (params.get('q') || '').trim();
        const rooms = q.length < 2 ? [] : m.findRooms(q).slice(0, 50);
        return Response.json(rooms);
      }

      // find API
      if (pth === '/db_wares.json') {
        return Response.json(await db.waresFind(params.get('q')));
      }
      if (pth === '/db_whois.json') {
        return Response.json(await db.whoisFind(params.get('q')));
      }
      if (pth === '/db_room.json') {
        // The rooms seen by the player, with the full room text (/room.json is the current room)
        return Response.json(await db.roomFind(params.get('q')));
      }
      if (pth === '/db_item.json') {
        return Response.json(await db.roomItemFind(params.get('q')));
      }
      if (pth === '/db_npc.json') {
        return Response.json(await db.denizenFind(params.get('q')));
      }
      if (pth === '/db_monster.json') {
        return Response.json(await db.monsterFind(params.get('q')));
      }
      if (pth === '/db_text.json') {
        // The descriptions of the players (LOOK texts), with what is known of each player
        return Response.json(await db.textFind(params.get('q')));
      }
      if (pth === '/db_browse.json') {
        // The whole of a table, sorted, one page at a time, or a random handful (the DB explorer, nothing typed)
        const table = params.get('table') as db.BrowseTable;
        if (!db.BROWSE_TABLES[table]) return new Response('Unknown table', { status: 400 });
        const int = (name: string) => (params.has(name) ? parseInt(params.get(name) || '') || 0 : undefined);
        return Response.json(
          await db.dbBrowse(table, {
            sort: params.get('sort') || undefined,
            desc: params.get('desc') === '1',
            offset: int('offset'),
            limit: int('limit'),
            random: int('random'),
          }),
        );
      }

      // /map/ -> /map, so the relative scripts resolve
      if (pth.length > 1 && pth.endsWith('/') && ROUTES[pth.slice(0, -1)]) {
        return Response.redirect(pth.slice(0, -1), 301);
      }

      // "semi-static" files
      // it's OK to touch the disk here, because
      // we don't expect players to reload the GUI
      if (process.env.NODE_ENV !== 'production' && ROUTES[pth]) {
        return await serveRoute(pth);
      }

      // The fonts of the themes
      if (pth.startsWith('/fonts/')) {
        const f = pth.split('/').slice(1).join('/');
        if (f.includes('..') || !fs.existsSync(path.join(STATIC, f))) {
          return new Response('File not found', { status: 404 });
        }
        return await stf(f);
      }

      // handle WebSockets
      if (pth === '/ws') {
        // console.log('Upgrading to WebSocket!');
        const ok = srv.upgrade(req);
        return ok ? undefined : new Response('WebSocket upgrade error', { status: 400 });
      }

      // HTTP 404
      return new Response('Page not found', { status: 404 });
    },

    websocket: {
      open(ws) {
        const ip = ws.remoteAddress;
        console.log('[WS] Client connected', ip ? `from: ${ip}` : '');

        //
        // pass game text to the client
        ee.on('game:html', (text: string) => {
          // ignore junk
          if (typeof text !== 'string' || text.length <= 1) return;
          ws.send(JSON.stringify({ type: 'game:html', text }));
        });
        // Game comm channels
        // type GmcpChannelText
        ee.on('channel:text', (data: Record<string, any>) => {
          data.type = 'channel:text';
          ws.send(JSON.stringify(data));
        });
        // GMCP Time.List or Time.Update
        // type sealed StateTime
        ee.on('time:update', (data: T.StateTime) => {
          ws.send(JSON.stringify({ ...data, type: 'time:update' }));
        });

        //
        // send CLI & auto-text (aliases, triggers)
        ee.on('user:text', (text: string) => {
          ws.send(JSON.stringify({ type: 'user:text', text }));
        });
        // Display text, not related to the Telnet output;
        ee.on('sys:text', (text: string) => {
          ws.send(JSON.stringify({ type: 'sys:text', text }));
        });
        // Display HTML, not related to the Telnet output;
        ee.on('sys:html', (html: string) => {
          ws.send(JSON.stringify({ type: 'sys:html', html }));
        });
        // Update user's icons
        ee.on('ico:update', (data: Record<string, any>) => {
          ws.send(JSON.stringify({ ...data, type: 'ico:update' }));
        });

        //
        // GMCP Room.Info
        ee.on('room:update', (data) => {
          ws.send(JSON.stringify(data));
        });
        // GMCP Char.Items.*
        ee.on('items:update', (items: T.GmcpItem[]) => {
          ws.send(JSON.stringify({ type: 'items:update', items }));
        });
        // GMCP Room.Players ...
        ee.on('players:update', (players: T.GmcpPlayer[]) => {
          ws.send(JSON.stringify({ type: 'players:update', players }));
        });
        // Wilderness map
        ee.on('wild:map', (map: string) => {
          ws.send(JSON.stringify({ type: 'wild:map', map }));
        });
        // The rows of the wilderness atlas that changed (the page /wild)
        ee.on('wild:rows', (data: { world: number; from: number; rows: string[] }) => {
          ws.send(JSON.stringify({ ...data, type: 'wild:rows' }));
        });

        //
        // Player info
        ee.on('myself:update', (player) => {
          ws.send(JSON.stringify(R.omit(player, OMIT_PLAYER_FIELDS)));
        });
        ee.on('battle:update', (battle: T.StateBattle) => {
          ws.send(JSON.stringify({ type: 'battle:update', battle }));
        });
        ee.on('battle:stop', () => {
          ws.send(JSON.stringify({ type: 'battle:stop' }));
        });
        ee.on('myself:death', (data: { killer: string }) => {
          ws.send(JSON.stringify({ ...data, type: 'myself:death' }));
        });

        //
        // Make sure to shut down cleanly
        // this is just for backup
        ee.on('game:quit', function () {
          setTimeout(async function () {
            await server.stop();
          }, 1000);
        });

        //
        // Push info from the server
        if (STATE.Me.level) ee.emit('myself:update', STATE.Me);
        if (STATE.Room.num) ee.emit('room:update', STATE.Room);
        if (STATE.Room.num) ee.emit('ico:update', STATE.StatBar);
      },
      close(ws) {
        const ip = ws.remoteAddress;
        console.log('[WS] Client disconnected', ip ? `from: ${ip}` : '');
      },
      message(_ws, line: string) {
        // input from the browser client
        // basically the user's commands
        try {
          userInput(line.toString());
        } catch (err) {
          console.error(`Error processing input! ${err}`);
        }
      },
      error(_ws, err: Error) {
        console.error('[WS] error:', err);
      },
    },
  });

  console.log('-'.repeat(80));
  console.log(`Server started on: ${server.url}`);
  console.log('-'.repeat(80));
  return server;
}
