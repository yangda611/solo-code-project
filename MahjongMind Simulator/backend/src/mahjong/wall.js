import { SUITS, TILE_TYPES, createTile } from './tile.js';

export function generateWall() {
  const wall = [];
  
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      for (let i = 0; i < 4; i++) {
        wall.push(createTile(suit, value));
      }
    });
  });
  
  return wall;
}

export function shuffleWall(wall) {
  const shuffled = [...wall];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export function splitDeadWall(wall, deadWallSize = 14) {
  const mainWall = [...wall];
  const deadWall = mainWall.splice(-deadWallSize);
  
  return { mainWall, deadWall };
}

export function drawTile(wall) {
  if (wall.length === 0) return null;
  return wall.pop();
}

export function drawFromDeadWall(deadWall, mainWall) {
  if (deadWall.length === 0) {
    return { tile: null, newDeadWall: deadWall, newMainWall: mainWall };
  }
  
  const newDeadWall = [...deadWall];
  const tile = newDeadWall.pop();
  
  if (mainWall.length > 0) {
    const newMainWall = [...mainWall];
    const replacement = newMainWall.pop();
    newDeadWall.unshift(replacement);
    return { tile, newDeadWall, newMainWall };
  }
  
  return { tile, newDeadWall, newMainWall: mainWall };
}

export function getRemainingTiles(wall, discards, playerHands = []) {
  const count = {};
  
  const allUsedTiles = [
    ...discards,
    ...playerHands.flat()
  ];
  
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      const id = `${suit}_${value}`;
      count[id] = 4;
    });
  });
  
  allUsedTiles.forEach(tile => {
    if (tile) {
      const id = `${tile.suit}_${tile.value}`;
      if (count[id] !== undefined) {
        count[id]--;
      }
    }
  });
  
  return count;
}
