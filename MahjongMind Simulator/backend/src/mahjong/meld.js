import { tilesEqual, isSameSuit, isConsecutive } from './tile.js';

export const MELD_TYPES = {
  CHI: 'chi',
  PENG: 'peng',
  GANG: 'gang',
  AN_GANG: 'angang',
  BU_GANG: 'bugang'
};

export function canChi(hand, discardedTile) {
  if (!discardedTile) return [];
  
  const possibleCombinations = [];
  const handTiles = [...hand];
  
  for (let i = 0; i < handTiles.length; i++) {
    for (let j = i + 1; j < handTiles.length; j++) {
      const tile1 = handTiles[i];
      const tile2 = handTiles[j];
      
      if (!isSameSuit(tile1, discardedTile) || !isSameSuit(tile2, discardedTile)) continue;
      
      const trio = [tile1, tile2, discardedTile];
      if (isConsecutive(trio[0], trio[1], trio[2])) {
        possibleCombinations.push({
          type: MELD_TYPES.CHI,
          tiles: trio,
          discardedTile,
          fromPlayer: handTiles.filter(t => tilesEqual(t, tile1) || tilesEqual(t, tile2))
        });
      }
    }
  }
  
  return possibleCombinations;
}

export function canPeng(hand, discardedTile) {
  if (!discardedTile) return false;
  
  const count = hand.filter(t => tilesEqual(t, discardedTile)).length;
  return count >= 2;
}

export function canGang(hand, discardedTile, melds = []) {
  if (!discardedTile) return { canMingGang: false, canAnGang: false, canBuGang: false };
  
  const handCount = hand.filter(t => tilesEqual(t, discardedTile)).length;
  const pengMeld = melds.find(m => 
    m.type === MELD_TYPES.PENG && 
    tilesEqual(m.tiles[0], discardedTile)
  );
  
  return {
    canMingGang: handCount >= 3,
    canAnGang: handCount >= 4,
    canBuGang: !!pengMeld && handCount >= 1
  };
}

export function createMeld(type, tiles, fromPlayer = null) {
  return {
    type,
    tiles: [...tiles],
    fromPlayer,
    isConcealed: type === MELD_TYPES.AN_GANG,
    createdAt: Date.now()
  };
}

export function applyChi(hand, combination) {
  const newHand = [...hand];
  const usedTiles = [...combination.fromPlayer];
  
  usedTiles.forEach(tile => {
    const index = newHand.findIndex(t => tilesEqual(t, tile));
    if (index !== -1) {
      newHand.splice(index, 1);
    }
  });
  
  return newHand;
}

export function applyPeng(hand, discardedTile) {
  const newHand = [...hand];
  let removed = 0;
  
  for (let i = newHand.length - 1; i >= 0 && removed < 2; i--) {
    if (tilesEqual(newHand[i], discardedTile)) {
      newHand.splice(i, 1);
      removed++;
    }
  }
  
  return newHand;
}

export function applyGang(hand, discardedTile, gangType) {
  const newHand = [...hand];
  
  if (gangType === MELD_TYPES.MING_GANG) {
    let removed = 0;
    for (let i = newHand.length - 1; i >= 0 && removed < 3; i--) {
      if (tilesEqual(newHand[i], discardedTile)) {
        newHand.splice(i, 1);
        removed++;
      }
    }
  } else if (gangType === MELD_TYPES.AN_GANG) {
    let removed = 0;
    for (let i = newHand.length - 1; i >= 0 && removed < 4; i--) {
      if (tilesEqual(newHand[i], discardedTile)) {
        newHand.splice(i, 1);
        removed++;
      }
    }
  } else if (gangType === MELD_TYPES.BU_GANG) {
    const index = newHand.findIndex(t => tilesEqual(t, discardedTile));
    if (index !== -1) {
      newHand.splice(index, 1);
    }
  }
  
  return newHand;
}
