import { sortTiles, getTileId, getTileDisplay, tilesEqual } from './tile.js';
import { generateWall, shuffleWall, drawTile, getRemainingTiles } from './wall.js';
import { findWaitingTiles, calculateEntryProbability, findBestDiscard, analyzeHandPotential } from './tingPai.js';
import { calculateFan, checkMinimumFan } from './fanXing.js';

export {
  sortTiles, getTileId, getTileDisplay, tilesEqual,
  generateWall, shuffleWall, drawTile, getRemainingTiles,
  findWaitingTiles, calculateEntryProbability, findBestDiscard, analyzeHandPotential,
  calculateFan, checkMinimumFan
};

export function analyzeHand(hand, melds = [], wall = [], discards = [], playerHands = []) {
  const sortedHand = sortTiles(hand);
  
  const waitingResult = findWaitingTiles(hand, melds);
  const isWaiting = waitingResult.length > 0;
  
  const probability = calculateEntryProbability(hand, melds, wall, discards, playerHands);
  
  const potential = analyzeHandPotential(hand, melds);
  
  let bestDiscard = null;
  if (!isWaiting) {
    bestDiscard = findBestDiscard(hand, melds, wall, discards, playerHands);
  }
  
  const waitingDetails = waitingResult.map(w => ({
    tile: w.tile,
    tileId: w.tileId,
    display: getTileDisplay(w.tile),
    remaining: probability.remainingCount[w.tileId] || 0,
    probability: probability.getProbability(w.tileId),
    decompositions: w.decompositions
  }));
  
  return {
    hand: sortedHand,
    melds,
    isWaiting,
    waitingTiles: waitingDetails,
    shanten: potential.shanten,
    stage: potential.stage,
    bestDiscard,
    remainingCount: probability.remainingCount,
    totalRemaining: probability.totalRemaining,
    oneEntryWaiting: potential.oneEntryWaiting
  };
}

export function calculateWaitingTiles(hand, melds = []) {
  const waiting = findWaitingTiles(hand, melds);
  
  return {
    canHu: waiting.length > 0,
    waitingTiles: waiting.map(w => ({
      tile: w.tile,
      tileId: w.tileId,
      display: getTileDisplay(w.tile)
    })),
    analysis: waiting.length > 0 ? '已听牌' : '未听牌'
  };
}

export function fullGameAnalysis(gameState, playerIndex = 0) {
  const player = gameState.players[playerIndex];
  
  const allDiscards = [];
  const allPlayerHands = [];
  
  gameState.players.forEach((p, idx) => {
    if (idx !== playerIndex) {
      allDiscards.push(...p.discards);
      allPlayerHands.push(p.hand);
    }
  });
  
  const handAnalysis = analyzeHand(
    player.hand,
    player.melds,
    gameState.wall,
    allDiscards,
    allPlayerHands
  );
  
  return {
    playerName: player.name,
    playerIndex,
    hand: handAnalysis.hand,
    melds: player.melds,
    discards: player.discards,
    score: player.score,
    isDealer: player.isDealer,
    analysis: handAnalysis,
    wallRemaining: gameState.wall.length,
    deadWallRemaining: gameState.deadWall.length
  };
}
