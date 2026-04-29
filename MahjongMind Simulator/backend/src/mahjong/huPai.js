import { tilesEqual, sortTiles, isHonor, isTerminal } from './tile.js';

export function countTiles(tiles) {
  const count = {};
  tiles.forEach(tile => {
    if (tile) {
      const id = `${tile.suit}_${tile.value}`;
      count[id] = (count[id] || 0) + 1;
    }
  });
  return count;
}

export function isHu(hand, melds = [], winningTile = null) {
  let allTiles = [...hand];
  
  if (winningTile) {
    allTiles.push(winningTile);
  }
  
  melds.forEach(meld => {
    allTiles = [...allTiles, ...meld.tiles];
  });
  
  if (allTiles.length !== 14) {
    return false;
  }
  
  const count = countTiles(allTiles);
  const sortedTiles = sortTiles(allTiles);
  
  if (isQiDui(count)) {
    return true;
  }
  
  if (isShiSanYao(sortedTiles, count)) {
    return true;
  }
  
  return isStandardHu(count, sortedTiles);
}

export function isStandardHu(count, sortedTiles) {
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

export function canFormMelds(count) {
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

export function isQiDui(count) {
  const values = Object.values(count);
  if (values.length !== 7) return false;
  return values.every(v => v === 2 || v === 4);
}

export function isShiSanYao(tiles, count) {
  if (tiles.length !== 14) return false;
  
  const yaoTiles = [
    'wan_1', 'wan_9',
    'tiao_1', 'tiao_9',
    'tong_1', 'tong_9',
    'feng_1', 'feng_2', 'feng_3', 'feng_4',
    'zi_1', 'zi_2', 'zi_3'
  ];
  
  for (const yao of yaoTiles) {
    if (!count[yao] || count[yao] < 1) {
      return false;
    }
  }
  
  let hasPair = false;
  for (const yao of yaoTiles) {
    if (count[yao] >= 2) {
      hasPair = true;
      break;
    }
  }
  
  return hasPair;
}

export function findHuDecompositions(hand, melds = [], winningTile = null) {
  let allTiles = [...hand];
  if (winningTile) {
    allTiles.push(winningTile);
  }
  
  melds.forEach(meld => {
    allTiles = [...allTiles, ...meld.tiles];
  });
  
  const count = countTiles(allTiles);
  const decompositions = [];
  
  if (isQiDui(count)) {
    decompositions.push({
      type: 'qidui',
      pairs: Object.entries(count)
        .filter(([_, v]) => v >= 2)
        .map(([id]) => id)
    });
  }
  
  if (isShiSanYao(allTiles, count)) {
    decompositions.push({
      type: 'shisanyao',
      tiles: Object.keys(count)
    });
  }
  
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
    
    const meldsResult = findAllMeldCombinations(testCount);
    meldsResult.forEach(meldCombination => {
      decompositions.push({
        type: 'standard',
        pair: pairId,
        melds: meldCombination
      });
    });
  }
  
  return decompositions;
}

export function findAllMeldCombinations(count) {
  const combinations = [];
  const remaining = { ...count };
  
  function backtrack(currentMelds) {
    const entries = Object.entries(remaining);
    
    if (entries.length === 0) {
      combinations.push([...currentMelds]);
      return;
    }
    
    const [key, value] = entries[0];
    
    if (value >= 3) {
      remaining[key] -= 3;
      if (remaining[key] === 0) {
        delete remaining[key];
      }
      currentMelds.push({ type: 'ke', tiles: [key, key, key] });
      backtrack(currentMelds);
      currentMelds.pop();
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
          
          currentMelds.push({ type: 'shun', tiles: [key, key1, key2] });
          backtrack(currentMelds);
          currentMelds.pop();
          
          remaining[key] = (remaining[key] || 0) + 1;
          remaining[key1] = (remaining[key1] || 0) + 1;
          remaining[key2] = (remaining[key2] || 0) + 1;
        }
      }
    }
  }
  
  backtrack([]);
  return combinations;
}
