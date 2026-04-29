import { createTile, getTileId, tilesEqual, sortTiles, SUITS, TILE_TYPES } from './tile.js';
import { countTiles, isHu, findHuDecompositions } from './huPai.js';

export function findWaitingTiles(hand, melds = []) {
  const waitingTiles = [];
  const allTestTiles = generateAllTiles();
  const handCount = countTiles(hand);
  
  for (const testTile of allTestTiles) {
    const tileId = getTileId(testTile);
    const currentCount = handCount[tileId] || 0;
    
    if (currentCount >= 4) continue;
    
    if (isHu(hand, melds, testTile)) {
      const decompositions = findHuDecompositions(hand, melds, testTile);
      waitingTiles.push({
        tile: testTile,
        tileId,
        decompositions,
        isWaiting: true
      });
    }
  }
  
  return waitingTiles;
}

export function generateAllTiles() {
  const tiles = [];
  
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      tiles.push(createTile(suit, value));
    });
  });
  
  return tiles;
}

export function calculateEntryProbability(hand, melds = [], wall, discards = [], playerHands = []) {
  const remainingCount = {};
  const allUsedTiles = [
    ...hand,
    ...discards,
    ...playerHands.flat(),
    ...melds.flatMap(m => m.tiles)
  ];
  
  const allTiles = generateAllTiles();
  allTiles.forEach(tile => {
    const id = getTileId(tile);
    remainingCount[id] = 4;
  });
  
  allUsedTiles.forEach(tile => {
    if (tile) {
      const id = getTileId(tile);
      if (remainingCount[id] !== undefined) {
        remainingCount[id]--;
      }
    }
  });
  
  const totalRemaining = Object.values(remainingCount).reduce((a, b) => a + b, 0) + wall.length;
  
  return {
    remainingCount,
    totalRemaining,
    getProbability: (tileId) => {
      const count = remainingCount[tileId] || 0;
      return totalRemaining > 0 ? count / totalRemaining : 0;
    }
  };
}

export function analyzeHandPotential(hand, melds = []) {
  const analysis = {
    currentWaiting: findWaitingTiles(hand, melds),
    oneEntryWaiting: [],
    twoEntryWaiting: [],
    shanten: calculateShanten(hand, melds)
  };
  
  if (analysis.currentWaiting.length > 0) {
    return { ...analysis, stage: 'waiting' };
  }
  
  const oneEntryResult = findOneEntryTiles(hand, melds);
  analysis.oneEntryWaiting = oneEntryResult;
  
  if (oneEntryResult.length > 0) {
    return { ...analysis, stage: 'one_entry' };
  }
  
  return { ...analysis, stage: 'two_entry' };
}

export function findOneEntryTiles(hand, melds = []) {
  const results = [];
  const allTiles = generateAllTiles();
  const handCount = countTiles(hand);
  
  for (const testTile of allTiles) {
    const tileId = getTileId(testTile);
    const currentCount = handCount[tileId] || 0;
    
    if (currentCount >= 4) continue;
    
    const testHand = [...hand, testTile];
    
    for (let i = 0; i < testHand.length; i++) {
      const discardHand = testHand.filter((_, idx) => idx !== i);
      const waiting = findWaitingTiles(discardHand, melds);
      
      if (waiting.length > 0) {
        results.push({
          entryTile: testTile,
          entryTileId: tileId,
          discardTile: testHand[i],
          discardTileId: getTileId(testHand[i]),
          resultingWaiting: waiting.map(w => w.tile)
        });
      }
    }
  }
  
  return results;
}

export function calculateShanten(hand, melds = []) {
  let minShanten = 13;
  
  const waiting = findWaitingTiles(hand, melds);
  if (waiting.length > 0) {
    return 0;
  }
  
  const oneEntry = findOneEntryTiles(hand, melds);
  if (oneEntry.length > 0) {
    return 1;
  }
  
  const allTiles = generateAllTiles();
  const handCount = countTiles(hand);
  
  for (const tile1 of allTiles) {
    const id1 = getTileId(tile1);
    if ((handCount[id1] || 0) >= 4) continue;
    
    const hand1 = [...hand, tile1];
    
    for (let i = 0; i < hand1.length; i++) {
      const discard1 = hand1.filter((_, idx) => idx !== i);
      
      for (const tile2 of allTiles) {
        const id2 = getTileId(tile2);
        const count2 = countTiles(discard1);
        if ((count2[id2] || 0) >= 4) continue;
        
        const hand2 = [...discard1, tile2];
        
        for (let j = 0; j < hand2.length; j++) {
          const discard2 = hand2.filter((_, idx) => idx !== j);
          const waiting = findWaitingTiles(discard2, melds);
          
          if (waiting.length > 0) {
            return 2;
          }
        }
      }
    }
  }
  
  return 3;
}

export function findBestDiscard(hand, melds = [], wall, discards = [], playerHands = []) {
  const probability = calculateEntryProbability(hand, melds, wall, discards, playerHands);
  
  const currentWaiting = findWaitingTiles(hand, melds);
  if (currentWaiting.length > 0) {
    return {
      type: 'waiting',
      message: '已听牌，无需打牌或选择打出无用牌',
      waitingTiles: currentWaiting
    };
  }
  
  const options = [];
  const handCount = countTiles(hand);
  
  for (let i = 0; i < hand.length; i++) {
    const discardTile = hand[i];
    const discardId = getTileId(discardTile);
    const remainingHand = hand.filter((_, idx) => idx !== i);
    
    const oneEntryResult = findOneEntryTiles(remainingHand, melds);
    
    let totalProbability = 0;
    let bestWaitingCount = 0;
    
    oneEntryResult.forEach(result => {
      const entryProb = probability.getProbability(result.entryTileId);
      totalProbability += entryProb;
      
      result.resultingWaiting.forEach(waitingTile => {
        const waitingId = getTileId(waitingTile);
        bestWaitingCount += probability.remainingCount[waitingId] || 0;
      });
    });
    
    options.push({
      discardTile,
      discardId,
      remainingHand,
      oneEntryCount: oneEntryResult.length,
      totalProbability,
      bestWaitingCount,
      score: totalProbability * 100 + bestWaitingCount
    });
  }
  
  options.sort((a, b) => b.score - a.score);
  
  return {
    bestOption: options[0],
    allOptions: options,
    probabilityInfo: probability
  };
}
