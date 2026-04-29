import { useState, useCallback, useMemo } from 'react';

const SUITS = {
  WAN: 'wan',
  TIAO: 'tiao',
  TONG: 'tong',
  FENG: 'feng',
  ZI: 'zi'
};

const TILE_TYPES = {
  [SUITS.WAN]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.TIAO]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.TONG]: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [SUITS.FENG]: [1, 2, 3, 4],
  [SUITS.ZI]: [1, 2, 3]
};

function createTile(suit, value) {
  const FENG_NAMES = ['东', '南', '西', '北'];
  const ZI_NAMES = ['中', '发', '白'];
  
  let display = '';
  switch (suit) {
    case SUITS.WAN: display = `${value}万`; break;
    case SUITS.TIAO: display = `${value}条`; break;
    case SUITS.TONG: display = `${value}筒`; break;
    case SUITS.FENG: display = FENG_NAMES[value - 1]; break;
    case SUITS.ZI: display = ZI_NAMES[value - 1]; break;
  }
  
  return {
    suit,
    value,
    id: `${suit}_${value}`,
    display
  };
}

function generateWall() {
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

function shuffleWall(wall) {
  const shuffled = [...wall];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function tilesEqual(t1, t2) {
  if (!t1 || !t2) return false;
  return t1.suit === t2.suit && t1.value === t2.value;
}

function sortTiles(tiles) {
  const suitOrder = { wan: 0, tiao: 1, tong: 2, feng: 3, zi: 4 };
  return [...tiles].sort((a, b) => {
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return a.value - b.value;
  });
}

function countTiles(tiles) {
  const count = {};
  tiles.forEach(tile => {
    if (tile) {
      const id = tile.id;
      count[id] = (count[id] || 0) + 1;
    }
  });
  return count;
}

function isStandardHu(count) {
  const pairs = [];
  Object.entries(count).forEach(([id, cnt]) => {
    if (cnt >= 2) {
      pairs.push(id);
    }
  });
  
  for (const pairId of pairs) {
    const testCount = { ...count };
    testCount[pairId] -= 2;
    if (testCount[pairId] === 0) {
      delete testCount[pairId];
    }
    
    if (canFormMelds(testCount)) {
      return true;
    }
  }
  
  return false;
}

function canFormMelds(count) {
  const remaining = { ...count };
  
  function tryFormMelds() {
    const entries = Object.entries(remaining);
    
    if (entries.length === 0) {
      return true;
    }
    
    const [key, value] = entries[0];
    
    if (value >= 3) {
      remaining[key] -= 3;
      if (remaining[key] === 0) {
        delete remaining[key];
      }
      if (tryFormMelds()) {
        return true;
      }
      remaining[key] = (remaining[key] || 0) + 3;
    }
    
    if (value > 0) {
      const [suit, valStr] = key.split('_');
      const val = parseInt(valStr);
      
      if (suit !== 'feng' && suit !== 'zi') {
        const key1 = `${suit}_${val + 1}`;
        const key2 = `${suit}_${val + 2}`;
        
        if (remaining[key1] > 0 && remaining[key2] > 0) {
          remaining[key]--;
          remaining[key1]--;
          remaining[key2]--;
          
          if (remaining[key] === 0) delete remaining[key];
          if (remaining[key1] === 0) delete remaining[key1];
          if (remaining[key2] === 0) delete remaining[key2];
          
          if (tryFormMelds()) {
            return true;
          }
          
          remaining[key] = (remaining[key] || 0) + 1;
          remaining[key1] = (remaining[key1] || 0) + 1;
          remaining[key2] = (remaining[key2] || 0) + 1;
        }
      }
    }
    
    return false;
  }
  
  return tryFormMelds();
}

function isQiDui(count) {
  const values = Object.values(count);
  if (values.length !== 7) return false;
  return values.every(v => v === 2 || v === 4);
}

function findWaitingTiles(hand, melds = []) {
  const waiting = [];
  const allTiles = [];
  
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      allTiles.push(createTile(suit, value));
    });
  });
  
  const handCount = countTiles(hand);
  
  for (const testTile of allTiles) {
    const currentCount = handCount[testTile.id] || 0;
    if (currentCount >= 4) continue;
    
    const testHand = [...hand, testTile];
    const testCount = countTiles(testHand);
    
    if (isStandardHu(testCount) || isQiDui(testCount)) {
      waiting.push({
        tile: testTile,
        tileId: testTile.id,
        display: testTile.display
      });
    }
  }
  
  return waiting;
}

function calculateEntryProbability(hand, melds = [], wall, discards = []) {
  const remainingCount = {};
  const allTiles = [];
  
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      allTiles.push(createTile(suit, value));
    });
  });
  
  allTiles.forEach(tile => {
    remainingCount[tile.id] = 4;
  });
  
  [...hand, ...discards, ...melds.flatMap(m => m.tiles)].forEach(tile => {
    if (tile) {
      remainingCount[tile.id] = (remainingCount[tile.id] || 0) - 1;
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

function canPeng(hand, tile) {
  const count = countTiles(hand);
  return (count[tile.id] || 0) >= 2;
}

function canGang(hand, tile) {
  const count = countTiles(hand);
  return (count[tile.id] || 0) >= 3;
}

function canHu(hand, melds, tile) {
  const testHand = [...hand, tile];
  const count = countTiles(testHand);
  return isStandardHu(count) || isQiDui(count);
}

function findBestDiscard(hand, melds = [], wall, discards = []) {
  const probability = calculateEntryProbability(hand, melds, wall, discards);
  
  const currentWaiting = findWaitingTiles(hand, melds);
  if (currentWaiting.length > 0) {
    return {
      type: 'waiting',
      message: '已听牌',
      waitingTiles: currentWaiting
    };
  }
  
  const allTestTiles = [];
  Object.entries(TILE_TYPES).forEach(([suit, values]) => {
    values.forEach(value => {
      allTestTiles.push(createTile(suit, value));
    });
  });
  
  const options = [];
  
  for (let i = 0; i < hand.length; i++) {
    const discardTile = hand[i];
    const remainingHand = hand.filter((_, idx) => idx !== i);
    
    const directWaiting = findWaitingTiles(remainingHand, melds);
    if (directWaiting.length > 0) {
      let totalRemaining = 0;
      directWaiting.forEach(w => {
        totalRemaining += probability.remainingCount[w.tileId] || 0;
      });
      
      options.push({
        discardTile,
        discardId: discardTile.id,
        remainingHand,
        isDirectWaiting: true,
        directWaitingTiles: directWaiting,
        oneEntryCount: 0,
        score: 10000 + totalRemaining * 100 + directWaiting.length,
        totalProb: 0,
        waitingCount: directWaiting.length,
        totalRemaining
      });
      continue;
    }
    
    const oneEntryResult = [];
    
    for (const testTile of allTestTiles) {
      const testCount = countTiles(remainingHand);
      if ((testCount[testTile.id] || 0) >= 4) continue;
      
      const testHand = [...remainingHand, testTile];
      
      let bestWaitingForEntry = [];
      
      for (let j = 0; j < testHand.length; j++) {
        const afterDiscard = testHand.filter((_, idx) => idx !== j);
        const waiting = findWaitingTiles(afterDiscard, melds);
        
        if (waiting.length > 0) {
          if (waiting.length > bestWaitingForEntry.length) {
            bestWaitingForEntry = waiting;
          }
        }
      }
      
      if (bestWaitingForEntry.length > 0) {
        oneEntryResult.push({
          entryTile: testTile,
          entryTileId: testTile.id,
          probability: probability.getProbability(testTile.id),
          waitingTiles: bestWaitingForEntry
        });
      }
    }
    
    let totalProb = 0;
    let totalWaitingCount = 0;
    let totalRemaining = 0;
    
    oneEntryResult.forEach(entry => {
      totalProb += entry.probability;
      totalWaitingCount += entry.waitingTiles.length;
      entry.waitingTiles.forEach(w => {
        totalRemaining += probability.remainingCount[w.tileId] || 0;
      });
    });
    
    options.push({
      discardTile,
      discardId: discardTile.id,
      remainingHand,
      isDirectWaiting: false,
      oneEntryCount: oneEntryResult.length,
      oneEntryTiles: oneEntryResult,
      score: totalProb * 100 + totalWaitingCount,
      totalProb,
      waitingCount: totalWaitingCount,
      totalRemaining
    });
  }
  
  options.sort((a, b) => {
    if (a.isDirectWaiting && !b.isDirectWaiting) return -1;
    if (!a.isDirectWaiting && b.isDirectWaiting) return 1;
    return b.score - a.score;
  });
  
  return {
    bestOption: options[0],
    allOptions: options,
    probabilityInfo: probability
  };
}

export function useGameState() {
  const [gameState, setGameState] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [huResult, setHuResult] = useState(null);
  
  const initGame = useCallback(() => {
    const playerNames = ['玩家', '东家', '南家', '西家'];
    
    let wall = shuffleWall(generateWall());
    
    const players = playerNames.map((name, index) => ({
      id: index,
      name,
      hand: [],
      melds: [],
      discards: [],
      score: 25000,
      isDealer: index === 0
    }));
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 13; j++) {
        const tile = wall.pop();
        if (tile) {
          players[i].hand.push(tile);
        }
      }
    }
    
    const deadWall = wall.splice(-14);
    
    players.forEach(player => {
      player.hand = sortTiles(player.hand);
    });
    
    const newGameState = {
      id: Date.now().toString(),
      status: 'playing',
      round: 1,
      dealer: 0,
      currentPlayer: 0,
      players,
      wall,
      deadWall,
      lastDiscard: null,
      lastDiscardPlayer: null,
      actionHistory: []
    };
    
    setGameState(newGameState);
    setSelectedTile(null);
    setHuResult(null);
    
    updateAnalysis(newGameState, 0);
  }, []);
  
  const updateAnalysis = useCallback((state, playerIndex) => {
    if (!state) return;
    
    const player = state.players[playerIndex];
    const waiting = findWaitingTiles(player.hand, player.melds);
    
    const probability = calculateEntryProbability(
      player.hand, 
      player.melds, 
      state.wall,
      player.discards
    );
    
    let bestDiscard = null;
    if (waiting.length === 0) {
      bestDiscard = findBestDiscard(
        player.hand,
        player.melds,
        state.wall,
        player.discards
      );
    }
    
    const stage = waiting.length > 0 ? 'waiting' : 'one_entry';
    const shanten = waiting.length > 0 ? 0 : 1;
    
    setAnalysis({
      isWaiting: waiting.length > 0,
      waitingTiles: waiting.map(w => ({
        ...w,
        remaining: probability.remainingCount[w.tileId] || 0,
        probability: probability.getProbability(w.tileId)
      })),
      shanten,
      stage,
      bestDiscard,
      remainingCount: probability.remainingCount,
      totalRemaining: probability.totalRemaining
    });
  }, []);
  
  const drawTile = useCallback(() => {
    if (!gameState) return;
    if (gameState.currentPlayer !== 0) return;
    
    const player = gameState.players[0];
    if (player.hand.length > 13) {
      return;
    }
    
    const newState = { ...gameState };
    const newPlayer = newState.players[0];
    
    if (newState.wall.length > 0) {
      const tile = newState.wall.pop();
      if (tile) {
        newPlayer.hand = sortTiles([...newPlayer.hand, tile]);
        
        const waiting = findWaitingTiles(newPlayer.hand, newPlayer.melds);
        if (waiting.length > 0) {
          newState.canHu = true;
        }
        
        setGameState(newState);
        updateAnalysis(newState, 0);
      }
    }
  }, [gameState, updateAnalysis]);
  
  const checkAvailableActions = useCallback((state, discardedTile, discardedPlayer) => {
    if (!state || !discardedTile) return null;
    
    const actions = [];
    
    for (let i = 0; i < 4; i++) {
      if (i === discardedPlayer) continue;
      
      const player = state.players[i];
      
      if (canHu(player.hand, player.melds, discardedTile)) {
        actions.push({
          player: i,
          type: 'hu',
          priority: 3
        });
      }
      
      if (canGang(player.hand, discardedTile)) {
        actions.push({
          player: i,
          type: 'gang',
          priority: 2
        });
      }
      
      if (canPeng(player.hand, discardedTile)) {
        actions.push({
          player: i,
          type: 'peng',
          priority: 1
        });
      }
    }
    
    if (actions.length === 0) return null;
    
    actions.sort((a, b) => b.priority - a.priority);
    
    return actions;
  }, []);

  const discardTile = useCallback((tileIndex) => {
    if (!gameState) return;
    if (gameState.currentPlayer !== 0) return;
    
    const newState = { ...gameState };
    const player = newState.players[0];
    
    const tile = player.hand[tileIndex];
    player.hand = player.hand.filter((_, idx) => idx !== tileIndex);
    player.discards.push(tile);
    
    newState.lastDiscard = tile;
    newState.lastDiscardPlayer = 0;
    
    const availableActions = checkAvailableActions(newState, tile, 0);
    
    if (availableActions && availableActions.length > 0) {
      const playerActions = availableActions.filter(a => a.player === 0);
      if (playerActions.length > 0) {
        newState.waitingForPlayerAction = true;
        newState.availableActions = playerActions;
        setGameState(newState);
        setSelectedTile(null);
        updateAnalysis(newState, 0);
        return;
      }
    }
    
    newState.currentPlayer = (newState.currentPlayer + 1) % 4;
    
    setGameState(newState);
    setSelectedTile(null);
    updateAnalysis(newState, 0);
    
    setTimeout(() => {
      simulateAI();
    }, 300);
  }, [gameState, updateAnalysis, checkAvailableActions, simulateAI]);
  
  const checkHu = useCallback(() => {
    if (!gameState) return false;
    
    const player = gameState.players[0];
    const count = countTiles(player.hand);
    
    return isStandardHu(count) || isQiDui(count);
  }, [gameState]);
  
  const doHu = useCallback(() => {
    if (!gameState) return;
    
    const player = gameState.players[0];
    const count = countTiles(player.hand);
    
    const fanDetails = [];
    let totalFan = 0;
    
    if (isQiDui(count)) {
      fanDetails.push({ name: '七对', value: 24 });
      totalFan += 24;
    } else {
      fanDetails.push({ name: '平胡', value: 1 });
      totalFan += 1;
    }
    
    setHuResult({
      winner: player,
      winningTile: player.hand[player.hand.length - 1],
      totalFan,
      fanDetails,
      isSelfDrawn: true,
      isLastTile: gameState.wall.length === 0,
      isRobKong: false
    });
  }, [gameState]);
  
  const simulateAIRound = useCallback((state) => {
    if (!state) return state;
    
    let newState = { ...state };
    let currentPlayer = newState.currentPlayer;
    
    if (currentPlayer === 0) return newState;
    if (newState.wall.length <= 0) return newState;
    
    const player = newState.players[currentPlayer];
    
    if (player.hand.length <= 13) {
      if (newState.wall.length > 0) {
        const tile = newState.wall.pop();
        if (tile) {
          player.hand = sortTiles([...player.hand, tile]);
          
          const count = countTiles(player.hand);
          if (isStandardHu(count) || isQiDui(count)) {
            const fanDetails = [];
            let totalFan = 0;
            
            if (isQiDui(count)) {
              fanDetails.push({ name: '七对', value: 24 });
              totalFan += 24;
            } else {
              fanDetails.push({ name: '平胡', value: 1 });
              totalFan += 1;
            }
            
            setHuResult({
              winner: player,
              winningTile: tile,
              totalFan,
              fanDetails,
              isSelfDrawn: true,
              isLastTile: newState.wall.length === 0,
              isRobKong: false
            });
            return newState;
          }
        }
      }
    }
    
    if (player.hand.length > 13) {
      const discardIndex = Math.floor(Math.random() * player.hand.length);
      const discarded = player.hand[discardIndex];
      player.hand = player.hand.filter((_, idx) => idx !== discardIndex);
      player.discards.push(discarded);
      
      newState.lastDiscard = discarded;
      newState.lastDiscardPlayer = currentPlayer;
      
      const playerHand = newState.players[0].hand;
      const playerMelds = newState.players[0].melds;
      
      const actions = [];
      
      if (canHu(playerHand, playerMelds, discarded)) {
        actions.push({ player: 0, type: 'hu', priority: 3 });
      }
      if (canGang(playerHand, discarded)) {
        actions.push({ player: 0, type: 'gang', priority: 2 });
      }
      if (canPeng(playerHand, discarded)) {
        actions.push({ player: 0, type: 'peng', priority: 1 });
      }
      
      if (actions.length > 0) {
        actions.sort((a, b) => b.priority - a.priority);
        newState.waitingForPlayerAction = true;
        newState.availableActions = actions;
        return newState;
      }
      
      newState.currentPlayer = (newState.currentPlayer + 1) % 4;
    }
    
    return newState;
  }, []);

  const simulateAI = useCallback(() => {
    if (!gameState) return;
    
    let currentPlayer = gameState.currentPlayer;
    
    if (currentPlayer === 0) return;
    if (gameState.wall.length <= 0) return;
    
    let newState = { ...gameState };
    
    while (currentPlayer !== 0 && newState.wall.length > 0 && !newState.waitingForPlayerAction) {
      newState = simulateAIRound(newState);
      currentPlayer = newState.currentPlayer;
      
      if (newState.waitingForPlayerAction) {
        break;
      }
    }
    
    setGameState(newState);
    updateAnalysis(newState, 0);
  }, [gameState, updateAnalysis, simulateAIRound]);

  const doPeng = useCallback(() => {
    if (!gameState || !gameState.lastDiscard || !gameState.waitingForPlayerAction) return;
    if (!gameState.availableActions || !gameState.availableActions.some(a => a.type === 'peng')) return;
    
    const newState = { ...gameState };
    const player = newState.players[0];
    const discardedTile = newState.lastDiscard;
    
    let removedCount = 0;
    player.hand = player.hand.filter(tile => {
      if (removedCount < 2 && tilesEqual(tile, discardedTile)) {
        removedCount++;
        return false;
      }
      return true;
    });
    
    player.melds.push({
      type: 'peng',
      tiles: [discardedTile, discardedTile, discardedTile],
      fromPlayer: newState.lastDiscardPlayer
    });
    
    newState.waitingForPlayerAction = false;
    newState.availableActions = null;
    newState.currentPlayer = 0;
    
    setGameState(newState);
    updateAnalysis(newState, 0);
  }, [gameState, updateAnalysis]);

  const doGang = useCallback(() => {
    if (!gameState || !gameState.lastDiscard || !gameState.waitingForPlayerAction) return;
    if (!gameState.availableActions || !gameState.availableActions.some(a => a.type === 'gang')) return;
    
    const newState = { ...gameState };
    const player = newState.players[0];
    const discardedTile = newState.lastDiscard;
    
    let removedCount = 0;
    player.hand = player.hand.filter(tile => {
      if (removedCount < 3 && tilesEqual(tile, discardedTile)) {
        removedCount++;
        return false;
      }
      return true;
    });
    
    player.melds.push({
      type: 'gang',
      tiles: [discardedTile, discardedTile, discardedTile, discardedTile],
      fromPlayer: newState.lastDiscardPlayer
    });
    
    newState.waitingForPlayerAction = false;
    newState.availableActions = null;
    newState.currentPlayer = 0;
    
    if (newState.wall.length > 0) {
      const tile = newState.wall.pop();
      if (tile) {
        player.hand = sortTiles([...player.hand, tile]);
        
        const waiting = findWaitingTiles(player.hand, player.melds);
        if (waiting.length > 0) {
          newState.canHu = true;
        }
      }
    }
    
    setGameState(newState);
    updateAnalysis(newState, 0);
  }, [gameState, updateAnalysis]);

  const doHuFromDiscard = useCallback(() => {
    if (!gameState || !gameState.lastDiscard || !gameState.waitingForPlayerAction) return;
    if (!gameState.availableActions || !gameState.availableActions.some(a => a.type === 'hu')) return;
    
    const player = gameState.players[0];
    const testHand = [...player.hand, gameState.lastDiscard];
    const count = countTiles(testHand);
    
    const fanDetails = [];
    let totalFan = 0;
    
    if (isQiDui(count)) {
      fanDetails.push({ name: '七对', value: 24 });
      totalFan += 24;
    } else {
      fanDetails.push({ name: '平胡', value: 1 });
      totalFan += 1;
    }
    
    setHuResult({
      winner: player,
      winningTile: gameState.lastDiscard,
      totalFan,
      fanDetails,
      isSelfDrawn: false,
      isLastTile: gameState.wall.length === 0,
      isRobKong: false
    });
  }, [gameState]);

  const skipAction = useCallback(() => {
    if (!gameState || !gameState.waitingForPlayerAction) return;
    
    const newState = { ...gameState };
    newState.waitingForPlayerAction = false;
    newState.availableActions = null;
    newState.currentPlayer = (newState.currentPlayer + 1) % 4;
    
    setGameState(newState);
    updateAnalysis(newState, 0);
    
    setTimeout(() => {
      simulateAI();
    }, 300);
  }, [gameState, updateAnalysis, simulateAI]);
  
  return {
    gameState,
    selectedTile,
    analysis,
    huResult,
    initGame,
    drawTile,
    discardTile,
    selectTile: setSelectedTile,
    checkHu,
    doHu,
    doPeng,
    doGang,
    doHuFromDiscard,
    skipAction,
    simulateAI,
    closeHuResult: () => setHuResult(null)
  };
}
