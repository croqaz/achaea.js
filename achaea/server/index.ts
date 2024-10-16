import fs from 'node:fs';
import path from 'node:path';
import * as R from 'remeda';

import ee from '../events/index.ts';
import * as m from '../maps/index.ts';
import * as db from '../extra/leveldb.ts';
import { STATE } from '../core/state.ts';
import processUserInput from '../core/input.ts';

const STATIC = path.normalize(__dirname + '/../static/');
const CUSTOM = path.normalize(__dirname + '/../../custom/static/');

function mime(pth: string): string {
  const ext = pth.split('.').pop();
  switch (ext) {
    case 'html':
      return 'text/html';
    case 'js':
      return 'text/javascript';
    case 'css':
      return 'text/css';
    case 'ico':
      return 'image/x-icon';
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

export default async function startServer(port = 18888, hostname = '127.0.0.1') {
  // Static route responses are cached
  // for the lifetime of the server
  // So we only use them in production
  let staticRoutes: Record<string, any> = {
    '/favicon.ico': await stf('favicon.ico'),
  };
  if (process.env.NODE_ENV === 'production') {
    console.log('Starting production mode.');
    staticRoutes = {
      '/': await stf('index.html'),
      '/dbex': await stf('dbex.html'),
      '/map': await stf('map.html'),
      '/client.js': await stf2('client.js'),
      '/paper.js': await stf('paper.js'),
      '/map.js': await stf('map.js'),
      '/search.js': await stf('search.js'),
      '/style.css': await stf2('style.css'),
    };
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
      if (pth === '/map.json')
        // For DEBUG only: see the whole map
        return Response.json(m.MAP, {
          headers: {
            'Cache-control': 'public, max-age=3600',
          },
        });
      if (pth === '/room.json')
        return Response.json(R.omit(STATE.Room, ['items', 'players']), {
          headers: {
            'Cache-control': 'public, max-age=1',
          },
        });
      if (pth === '/area.json') {
        const area = await m.getArea(params.get('id'), true);
        return Response.json(area, {
          headers: {
            'Cache-control': 'public, max-age=1',
          },
        });
      }

      // find API
      if (pth === '/wares.json') return Response.json(await db.waresFind(params.get('q')));
      if (pth === '/whois.json') return Response.json(await db.whoisFind(params.get('q')));
      if (pth === '/item.json') return Response.json(await db.roomItemFind(params.get('q')));
      if (pth === '/npc.json') return Response.json(await db.denizenFind(params.get('q')));

      // "semi-static" files
      // it's OK to touch the disk here, because
      // we don't expect players to reload the GUI
      if (process.env.NODE_ENV !== 'production') {
        switch (pth) {
          case '/':
            return await stf('index.html');
          case '/dbex':
            return await stf('dbex.html');
          case '/map':
            return await stf('map.html');
          case '/client.js':
            return await stf2('client.js');
          case '/paper.js':
            return await stf('paper.js');
          case '/map.js':
            return await stf('map.js');
          case '/search.js':
            return await stf('search.js');
          case '/style.css':
            return await stf2('style.css');
        }
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
          ws.send(JSON.stringify({ textType: 'gameText', text }));
        });
        // Game comm channels
        // type GmcpChannelText
        ee.on('channel:text', (data: Record<string, any>) => {
          data.textType = 'channelText';
          ws.send(JSON.stringify(data));
        });
        // GMCP Time.List or Time.Update
        // type sealed StateTime
        ee.on('time:update', (data: Record<string, any>) => {
          ws.send(JSON.stringify({ ...data, textType: 'timeUpdate' }));
        });

        //
        // send CLI & auto-text (aliases, triggers)
        ee.on('user:text', (text: string) => {
          ws.send(JSON.stringify({ textType: 'userText', text }));
        });
        // Display text, not related to the Telnet output;
        ee.on('sys:text', (text: string) => {
          ws.send(JSON.stringify({ textType: 'sysText', text }));
        });
        // Display HTML, not related to the Telnet output;
        ee.on('sys:html', (text: string) => {
          ws.send(JSON.stringify({ textType: 'sysHtml', text }));
        });

        //
        // GMCP Room.Info
        ee.on('room:update', (data) => {
          ws.send(JSON.stringify(data));
        });
        // GMCP Char.Items.*
        ee.on('items:update', (items) => {
          ws.send(JSON.stringify({ textType: 'roomItems', items }));
        });
        // GMCP Room.Players ...
        ee.on('players:update', (players) => {
          ws.send(JSON.stringify({ textType: 'roomPlayers', players }));
        });
        // Wilderness map
        ee.on('wild:map', (map: string) => {
          ws.send(JSON.stringify({ textType: 'wildMap', map }));
        });

        //
        // Player info
        ee.on('myself:update', (data) => {
          ws.send(JSON.stringify(data));
        });
        ee.on('battle:update', (battle) => {
          ws.send(JSON.stringify({ textType: 'battleUpdate', battle }));
        });
        ee.on('battle:stop', () => {
          ws.send(JSON.stringify({ textType: 'battleStop' }));
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
      },
      close(ws) {
        const ip = ws.remoteAddress;
        console.log('[WS] Client disconnected', ip ? `from: ${ip}` : '');
      },
      message(ws, line: string) {
        // input from the browser client
        // basically the user's commands
        line = line.toString().trim();
        // Save user's original cmd for later
        STATE.Misc.input = line;
        try {
          line = processUserInput(line);
          if (typeof line === 'string' && line.length > 0) {
            ee.emit('user:text', line);
          }
        } catch (err) {
          console.error(`Error processing input! ${err}`);
        }
      },
      error(ws, err) {
        console.error('[WS] error:', err);
      },
    },
  });

  console.log('-'.repeat(80));
  console.log(`Server started on: ${server.url}`);
  console.log('-'.repeat(80));
}
