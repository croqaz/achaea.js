import * as R from 'remeda';
import { createServer } from 'http';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const dirName = dirname(fileURLToPath(import.meta.url + '/..'));

import express from 'express';
import { WebSocketServer } from 'ws';

import ee from '../events/index.ts';
import * as m from '../maps/index.ts';
import { STATE } from '../core/state.ts';
import processUserInput from '../core/input.ts';

const app = express();
app.use(express.static(`${dirName}/static`));

export const server = createServer(app);
export const wss = new WebSocketServer({ server });

app.get('/player.json', (_req, res) => {
  // For DEBUG: see the state of the player
  res.json(R.omit(STATE.Me, ['rift', 'items']));
});

app.get('/room.json', (_req, res) => {
  res.json(R.omit(STATE.Room, ['items', 'players']));
});

app.get('/map.json', (_req, res) => {
  res.set('Cache-control', 'public, max-age=1');
  res.json(m.MAP);
});

app.get('/area/:id.json', async (req, res) => {
  res.set('Cache-control', 'public, max-age=1');
  res.json(await m.getArea(req.params.id, true));
});

app.get('/room/:id.json', async (req, res) => {
  // For DEBUG: see a single map room
  res.set('Cache-control', 'public, max-age=1');
  res.json(await m.getRoom(req.params.id, true));
});

wss.on('connection', function (ws, req) {
  const ip = req.socket.remoteAddress;
  console.log('[WS] Client connected from:', ip);
  ws.on('close', function () {
    console.log('[WS] Client disconnected');
  });

  ws.on('error', console.error);

  // input from the browser client
  // basically the user's commands
  ws.on('message', function (line: string) {
    line = line.toString().trim();
    // Save user's original cmd for later
    STATE.Custom.input = line;
    try {
      line = processUserInput(line);
      if (line && typeof line === 'string') {
        ee.emit('user:text', line);
      }
    } catch (err) {
      console.error(`ERROR processing input!! ${err}`);
    }
  });

  // pass game text to the client
  ee.on('game:html', (text: string) => {
    if (!text) return;
    ws.send(JSON.stringify({ textType: 'gameText', text }));
  });
  // Game comm channels
  ee.on('channel:text', (data) => {
    data.textType = 'channelText';
    ws.send(JSON.stringify(data));
  });

  // send CLI & auto-text (aliases, triggers)
  ee.on('user:text', (text: string) => {
    ws.send(JSON.stringify({ textType: 'userText', text }));
  });
  // Display text, not related to the Telnet output
  // It goes to the GUI client and is not persisted
  ee.on('sys:text', (text: string) => {
    ws.send(JSON.stringify({ textType: 'sysText', text }));
  });

  ee.on('room:update', (data) => {
    // GMCP Room.Info
    ws.send(JSON.stringify(data));
  });
  ee.on('items:update', (data) => {
    // GMCP Char.Items.*
    ws.send(JSON.stringify({ textType: 'roomItems', items: data }));
  });
  ee.on('players:update', (data) => {
    // GMCP Room.Players ...
    ws.send(JSON.stringify({ textType: 'roomPlayers', players: data }));
  });

  ee.on('myself:update', (data) => {
    ws.send(JSON.stringify(data));
  });

  ee.on('battle:update', (battle) => {
    ws.send(JSON.stringify({ textType: 'battleUpdate', battle }));
  });
  ee.on('battle:stop', () => {
    ws.send(JSON.stringify({ textType: 'battleStop' }));
  });
});

export function startServer(port = 18888) {
  server.listen(port, function () {
    console.log('-'.repeat(80));
    console.log(`Started server on: http://127.0.0.1:${port}`);
    console.log('-'.repeat(80));
  });
}
