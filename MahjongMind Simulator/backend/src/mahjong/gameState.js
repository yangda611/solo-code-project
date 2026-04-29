export const ACTION_TYPES = {
  DRAW: 'draw',
  DISCARD: 'discard',
  CHI: 'chi',
  PENG: 'peng',
  GANG: 'gang',
  BU_GANG: 'bugang',
  HU: 'hu',
  LIUJU: 'liuju'
};

export const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  WAITING_ACTION: 'waiting_action',
  HU: 'hu',
  LIUJU: 'liuju',
  ENDED: 'ended'
};

export function createGameState(playerNames = ['玩家', '东家', '南家', '西家']) {
  return {
    id: null,
    status: GAME_STATUS.WAITING,
    round: 1,
    dealer: 0,
    currentPlayer: 0,
    players: playerNames.map((name, index) => ({
      id: index,
      name,
      hand: [],
      melds: [],
      discards: [],
      score: 0,
      isDealer: index === 0,
      isRiichi: false,
      isTsumo: false
    })),
    wall: [],
    deadWall: [],
    lastDiscard: null,
    lastDiscardPlayer: null,
    pendingActions: [],
    actionHistory: [],
    winningInfo: null
  };
}

export function startGame(gameState, shuffledWall) {
  const newState = { ...gameState };
  
  newState.players.forEach(player => {
    player.hand = [];
    player.melds = [];
    player.discards = [];
    player.isRiichi = false;
    player.isTsumo = false;
  });
  
  newState.wall = [...shuffledWall];
  newState.deadWall = [];
  newState.lastDiscard = null;
  newState.lastDiscardPlayer = null;
  newState.pendingActions = [];
  newState.actionHistory = [];
  newState.winningInfo = null;
  newState.status = GAME_STATUS.PLAYING;
  newState.currentPlayer = newState.dealer;
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 13; j++) {
      const tile = newState.wall.pop();
      if (tile) {
        newState.players[newState.currentPlayer].hand.push(tile);
      }
    }
    newState.currentPlayer = (newState.currentPlayer + 1) % 4;
  }
  
  const deadWallSize = 14;
  newState.deadWall = newState.wall.splice(-deadWallSize);
  
  newState.currentPlayer = newState.dealer;
  
  return newState;
}

export function nextPlayer(gameState) {
  return (gameState.currentPlayer + 1) % 4;
}

export function addActionToHistory(gameState, action) {
  return {
    ...action,
    timestamp: Date.now(),
    player: gameState.currentPlayer
  };
}
