export const SUITS = {
  WAN: 'wan',
  TIAO: 'tiao',
  TONG: 'tong',
  FENG: 'feng',
  ZI: 'zi'
};

export const FENG_NAMES = ['东', '南', '西', '北'];
export const ZI_NAMES = ['中', '发', '白'];

export const TILE_TYPES = {
  [SUITS.WAN]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.TIAO]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.TONG]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.FENG]: [1, 2, 3, 4],
  [SUITS.ZI]: [1, 2, 3]
};

export function getTileDisplay(tile) {
  if (!tile) return '';
  
  const { suit, value } = tile;
  
  switch (suit) {
    case SUITS.WAN:
      return `${value}万`;
    case SUITS.TIAO:
      return `${value}条`;
    case SUITS.TONG:
      return `${value}筒`;
    case SUITS.FENG:
      return FENG_NAMES[value - 1];
    case SUITS.ZI:
      return ZI_NAMES[value - 1];
    default:
      return '';
  }
}

export function getTileId(tile) {
  if (!tile) return '';
  return `${tile.suit}_${tile.value}`;
}

export function createTile(suit, value) {
  return {
    suit,
    value,
    id: `${suit}_${value}`,
    display: getTileDisplay({ suit, value })
  };
}

export function tilesEqual(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  return tile1.suit === tile2.suit && tile1.value === tile2.value;
}

export function isSameSuit(tile1, tile2) {
  if (!tile1 || !tile2) return false;
  return tile1.suit === tile2.suit;
}

export function isConsecutive(tile1, tile2, tile3) {
  if (!tile1 || !tile2 || !tile3) return false;
  if (!isSameSuit(tile1, tile2) || !isSameSuit(tile2, tile3)) return false;
  
  const values = [tile1.value, tile2.value, tile3.value].sort((a, b) => a - b);
  return values[1] === values[0] + 1 && values[2] === values[1] + 1;
}

export function isTerminal(tile) {
  if (!tile) return false;
  if (tile.suit === SUITS.FENG || tile.suit === SUITS.ZI) return false;
  return tile.value === 1 || tile.value === 9;
}

export function isHonor(tile) {
  if (!tile) return false;
  return tile.suit === SUITS.FENG || tile.suit === SUITS.ZI;
}

export function isSimple(tile) {
  if (!tile) return false;
  return tile.suit === SUITS.WAN || tile.suit === SUITS.TIAO || tile.suit === SUITS.TONG;
}

export function compareTiles(tile1, tile2) {
  if (!tile1 || !tile2) return 0;
  
  const suitOrder = {
    [SUITS.WAN]: 0,
    [SUITS.TIAO]: 1,
    [SUITS.TONG]: 2,
    [SUITS.FENG]: 3,
    [SUITS.ZI]: 4
  };
  
  const suitDiff = suitOrder[tile1.suit] - suitOrder[tile2.suit];
  if (suitDiff !== 0) return suitDiff;
  
  return tile1.value - tile2.value;
}

export function sortTiles(tiles) {
  return [...tiles].sort(compareTiles);
}
