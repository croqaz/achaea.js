window.AREA = { rooms: {} };
window.ROOM = { id: 0, items: [], players: [] };

const COLOR = {
  amber: '#FFC901',
};

const EXITS = {
  up: 'u',
  down: 'd',
  north: 'n',
  south: 's',
  east: 'e',
  west: 'w',
  northeast: 'ne',
  northwest: 'nw',
  southeast: 'se',
  southwest: 'sw',
};

window.addEventListener('load', function () {
  const styles = window.getComputedStyle(document.documentElement);
  COLOR.background = styles.getPropertyValue('--background');
  COLOR.background1 = styles.getPropertyValue('--background1');
  COLOR.background2 = styles.getPropertyValue('--background2');
  COLOR.background3 = styles.getPropertyValue('--background3');
  COLOR.foreground = styles.getPropertyValue('--foreground');
  COLOR.blue1 = styles.getPropertyValue('--blue1');
  COLOR.blue2 = styles.getPropertyValue('--blue2');
  COLOR.blue3 = styles.getPropertyValue('--blue3');
  COLOR.darkForeground = styles.getPropertyValue('--dark-foreground');
  COLOR.brightForeground = styles.getPropertyValue('--bright-foreground');

  // Setup Paper.js
  const canvas = document.getElementById('map');
  window.PAPER = new paper.PaperScope();
  window.PAPER.setup(canvas);
  const tool = new window.PAPER.Tool();
  tool.minDistance = 10;

  // Mouse zoom in & out
  canvas.onwheel = function (event) {
    const { view } = window.PAPER;
    const scale = Math.round(event.deltaY / 10) / 120;
    if (scale > 0 && view.zoom <= 0.2) return false;
    if (scale < 0 && view.zoom > 5) return false;
    view.scale(1 - parseFloat(scale.toFixed(1)));
    return false;
  };
});

export async function fetchRoom() {
  // Fetch the current room
  const res = await fetch('/room.json');
  const data = await res.json();
  if (data && data.room && data.room.coord) {
    window.ROOM = { id: data.num, level: data.room.coord.z };
    console.log('Room:', data.name, window.ROOM);
    return data;
  }
}

export async function fetchMap(data) {
  if (!data || !data.room || !data.room.area) return;
  const areaID = data.room.area;

  // Fetch the area map
  const res = await fetch(`/area/${areaID}.json`);
  const area = await res.json();
  // Check no. rooms for this area
  const noRooms = Object.keys(area.rooms).length;
  if (noRooms) console.log('Area:', area.name, 'Rooms:', noRooms);
  else console.warn('Area:', area.name, 'has NO ROOMS!');

  window.AREA = area;
}

// Related to drawing map
let mainLayer = null;
let currentRoom = null;

export function drawMap(data) {
  if (!window.AREA.rooms || !window.AREA.name) return;
  const noRooms = Object.keys(window.AREA.rooms).length;
  // console.log('DRAWING MAP::', window.AREA.name, 'Rooms:', noRooms);

  const { Group, Layer, Path, PointText, tool } = window.PAPER;
  window.PAPER.project.clear();

  const GRID = 40;
  const FONT_SZ = 20;
  const FONT_FAM = 'MononokiRegular, monospace';

  mainLayer = new Layer();
  const pathGroup = new Group();
  const roomGroup = new Group();
  mainLayer.addChild(pathGroup);
  mainLayer.addChild(roomGroup);

  let titleBorder = null;
  const roomTitle = new PointText({
    justification: 'center',
    fillColor: COLOR.foreground,
    fontFamily: FONT_FAM,
    fontSize: Math.round(FONT_SZ / 1.5),
    visible: false,
  });
  roomGroup.addChild(roomTitle);

  function drawRoom(p1, p2, room) {
    const exits = (room.exits || []).map((x) => EXITS[x.direction] || x.direction);
    let title = `#${room.id} -- ${room.environment.name}\n${room.title}`;
    title += `\nExits: ${exits.join(', ')}`;

    // Room group to hold the square & info
    const group = new Group({ data: { id: room.id, title } });

    const fillColor = room.environment.htmlcolor || '#AAA';
    const opacity = room.visited || room.id === window.ROOM.id ? 0.9 : 0.15;
    const rect = new Path.Rectangle({
      center: [p1, p2],
      size: [GRID / 2, GRID / 2],
      strokeColor: COLOR.background,
      strokeWidth: 2,
      fillColor,
      opacity,
    });
    if (room.id === window.ROOM.id) {
      currentRoom = rect;
      rect.strokeWidth = 4;
      rect.strokeColor = COLOR.amber;
    }
    group.addChild(rect);

    if (
      room.features &&
      room.features.length > 0 &&
      !(room.features.length === 1 && (room.features[0] === 'indoors' || room.features[0] === 'road'))
    ) {
      let content = '';
      const hasFeat = (x) => room.features.includes(x);
      if (hasFeat('shop')) content = '$';
      else if (hasFeat('bank')) content = 'B';
      else if (hasFeat('library')) content = 'L';
      else if (hasFeat('postoffice')) content = 'P';
      else if (hasFeat('subdivision')) content = 'D';
      else if (hasFeat('wilderness')) content = 'W';
      else if (hasFeat('news')) content = 'N';
      group.addChild(
        new PointText({
          content,
          point: [p1, p2 + FONT_SZ / 3],
          justification: 'center',
          fillColor: COLOR.background1,
          fontFamily: FONT_FAM,
          fontSize: FONT_SZ,
        }),
      );
      if (hasFeat('sewer')) {
        group.addChild(
          new PointText({
            content: 'G',
            point: [p1, p2 + FONT_SZ / 3],
            justification: 'center',
            fillColor: COLOR.background3,
            fontFamily: FONT_FAM,
            fontSize: FONT_SZ,
          }),
        );
      }
    } else {
      let content = null;
      if (exits.includes('u') && exits.includes('d') && exits.includes('in') && exits.includes('out')) {
        content = '✦';
      } else if (exits.includes('u') && exits.includes('d')) {
        content = '↕';
      } else if (exits.includes('in') && exits.includes('out')) {
        content = '↔';
      } else if (exits.includes('u')) {
        content = '▲';
      } else if (exits.includes('d')) {
        content = '▼';
      } else if (exits.includes('in')) {
        content = '❮';
      } else if (exits.includes('out')) {
        content = '❯';
      }
      if (content) {
        group.addChild(
          new PointText({
            content,
            point: [p1, p2 - 1 + FONT_SZ / 3],
            justification: 'center',
            fillColor: COLOR.background2,
            fontFamily: FONT_FAM,
            fontSize: FONT_SZ,
          }),
        );
      }
    }

    // Display room info on mouse hover
    group.onMouseEnter = function () {
      rect.selected = true;
      const titlePos = this.position.subtract([0, GRID]);
      roomTitle.content = this.data.title;
      roomTitle.position = titlePos;
      roomTitle.visible = true;
      // Border around the room info
      titleBorder = new Path.Rectangle({
        center: titlePos,
        size: [roomTitle.strokeBounds.width + 4, FONT_SZ * 2.6],
        strokeColor: COLOR.foreground,
        fillColor: COLOR.background1,
      });
      roomGroup.addChild(titleBorder);
      // Room info must be on top
      roomTitle.bringToFront();
    };
    group.onMouseLeave = function () {
      rect.selected = false;
      roomTitle.visible = false;
      titleBorder.remove();
    };
    // On room double-click, auto-walk
    group.onDoubleClick = function () {
      this.fillColor = COLOR.amber;
      const userInput = document.getElementById('userInput');
      userInput.focus();
      userInput.value = `//go ${this.data.id}`;
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    };

    return group;
  }

  function drawPath(p1, p2, tgt, exit) {
    const D = 22;
    const L = tgt ? tgt.coord.z : NaN;
    const dir = EXITS[exit.direction] || exit.direction;
    let tgtCoord = tgt ? tgt.coord : { x: p1, y: p2 - D };

    // Hack to fix the broken coords to other levels in the same Area,
    // or to other areas with completely different coords
    let toPoint = [tgtCoord.x * GRID, -tgtCoord.y * GRID];
    if (L !== window.ROOM.level) {
      if (dir === 'w' || dir === 'in') toPoint = [p1 - D, p2];
      else if (dir === 'e' || dir === 'out') toPoint = [p1 + D, p2];
      else if (dir === 's' || dir === 'd') toPoint = [p1, p2 + D];
      else if (dir === 'n' || dir === 'u') toPoint = [p1, p2 - D];
      else if (dir === 'se') toPoint = [p1 + D, p2 + D];
      else if (dir === 'se') toPoint = [p1 + D, p2 + D];
      else if (dir === 'sw') toPoint = [p1 - D, p2 + D];
      else if (dir === 'ne') toPoint = [p1 + D, p2 - D];
      else if (dir === 'nw') toPoint = [p1 - D, p2 - D];
    }

    const path = new Path.Line({
      from: [p1, p2],
      to: toPoint,
      strokeColor: COLOR.background1,
      strokeCap: 'round',
      strokeWidth: 2,
    });

    if (L !== window.ROOM.level) {
      path.dashArray = [1, 3];
      path.strokeColor = '#999';
    } else if (dir === 'in' || dir === 'out') {
      path.dashArray = [2, 6];
      path.strokeColor = 'red';
    } else if (dir === 'u' || dir === 'd') {
      path.dashArray = [2, 6];
      path.strokeColor = 'blue';
    } else if (dir === 'worm warp') {
      path.strokeWidth = 1;
      path.dashArray = [2, 6];
      path.strokeColor = '#999';
    }
    return path;
  }

  for (const room of Object.values(window.AREA.rooms)) {
    // Only draw current Z level
    if (room.coord.z !== window.ROOM.level) continue;
    const p1 = parseInt(room.coord.x) * GRID;
    const p2 = -parseInt(room.coord.y) * GRID;

    // Draw the room
    roomGroup.addChild(drawRoom(p1, p2, room));

    // Draw connections
    if (!room.exits) continue;
    for (const exit of room.exits) {
      const tgt = window.AREA.rooms[exit.target];
      // Draw the path
      pathGroup.addChild(drawPath(p1, p2, tgt, exit));
    }
  }

  const topCenter = roomGroup.bounds.topCenter;
  // Big area name text
  roomGroup.addChild(
    new PointText({
      point: [topCenter.x, topCenter.y - FONT_SZ],
      content: window.AREA.name,
      justification: 'center',
      fillColor: COLOR.brightForeground,
      fontFamily: FONT_FAM,
      fontSize: FONT_SZ,
      fontWeight: 'bold',
    }),
  );

  autoCenterMap();

  // drag the map with the mouse
  tool.onMouseDrag = (event) => {
    mainLayer.translate(event.delta);
  };
}

export function autoCenterMap() {
  const { view } = window.PAPER;

  // auto center the layer with rooms & paths
  mainLayer.position = view.center;

  // auto center the view on the current room
  if (currentRoom) view.center = currentRoom.position;
}
