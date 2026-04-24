import { Item } from './Inventory.js';
import {
  BLOCK_GRASS,
  BLOCK_DIRT,
  BLOCK_STONE,
  BLOCK_WOOD,
  BLOCK_PLANKS,
  BLOCK_COBBLESTONE,
  BLOCK_CRAFTING_TABLE,
  BLOCK_SAND,
  BLOCK_GRAVEL,
  BLOCK_CLAY,
  BLOCK_BRICK,
  BLOCK_BOOKSHELF,
  BLOCK_TNT,
} from '../utils/Constants.js';

export const ITEM_DEFINITIONS = {
  pickaxe_wood: { name: '木镐', type: 'tool', durability: 60, miningLevel: 1 },
  pickaxe_stone: { name: '石镐', type: 'tool', durability: 132, miningLevel: 2 },
  pickaxe_iron: { name: '铁镐', type: 'tool', durability: 251, miningLevel: 3 },
  pickaxe_gold: { name: '金镐', type: 'tool', durability: 33, miningLevel: 2 },
  pickaxe_diamond: { name: '钻石镐', type: 'tool', durability: 1562, miningLevel: 4 },
  
  shovel_wood: { name: '木铲', type: 'tool', durability: 60, miningLevel: 1 },
  shovel_stone: { name: '石铲', type: 'tool', durability: 132, miningLevel: 2 },
  shovel_iron: { name: '铁铲', type: 'tool', durability: 251, miningLevel: 3 },
  
  axe_wood: { name: '木斧', type: 'tool', durability: 60, miningLevel: 1 },
  axe_stone: { name: '石斧', type: 'tool', durability: 132, miningLevel: 2 },
  axe_iron: { name: '铁斧', type: 'tool', durability: 251, miningLevel: 3 },
  
  sword_wood: { name: '木剑', type: 'tool', durability: 60, damage: 4 },
  sword_stone: { name: '石剑', type: 'tool', durability: 132, damage: 5 },
  sword_iron: { name: '铁剑', type: 'tool', durability: 251, damage: 6 },
  sword_gold: { name: '金剑', type: 'tool', durability: 33, damage: 5 },
  sword_diamond: { name: '钻石剑', type: 'tool', durability: 1562, damage: 7 },
  
  stick: { name: '木棍', type: 'item' },
  iron_ingot: { name: '铁锭', type: 'item' },
  gold_ingot: { name: '金锭', type: 'item' },
  diamond: { name: '钻石', type: 'item' },
  coal: { name: '煤炭', type: 'item' },
  flint: { name: '燧石', type: 'item' },
  clay_ball: { name: '粘土球', type: 'item' },
  brick: { name: '砖', type: 'item' },
  paper: { name: '纸', type: 'item' },
  book: { name: '书', type: 'item' },
  gunpowder: { name: '火药', type: 'item' },
  sand: { name: '沙', type: 'item' },
  
  block_dirt: { name: '泥土', type: 'block', blockId: BLOCK_DIRT },
  block_stone: { name: '石头', type: 'block', blockId: BLOCK_STONE },
  block_wood: { name: '木头', type: 'block', blockId: BLOCK_WOOD },
  block_planks: { name: '木板', type: 'block', blockId: BLOCK_PLANKS },
  block_cobblestone: { name: '圆石', type: 'block', blockId: BLOCK_COBBLESTONE },
  block_sand: { name: '沙子', type: 'block', blockId: BLOCK_SAND },
  block_gravel: { name: '沙砾', type: 'block', blockId: BLOCK_GRAVEL },
  block_clay: { name: '粘土', type: 'block', blockId: BLOCK_CLAY },
  block_brick: { name: '砖块', type: 'block', blockId: BLOCK_BRICK },
  block_bookshelf: { name: '书架', type: 'block', blockId: BLOCK_BOOKSHELF },
  block_tnt: { name: 'TNT', type: 'block', blockId: BLOCK_TNT },
  block_crafting_table: { name: '工作台', type: 'block', blockId: BLOCK_CRAFTING_TABLE },
  torch: { name: '火把', type: 'block', blockId: 24 },
};

export const RECIPES = [
  {
    output: { id: 'block_planks', count: 4 },
    input: [
      [null, null, null],
      [null, 'block_wood', null],
      [null, null, null],
    ],
  },
  {
    output: { id: 'stick', count: 4 },
    input: [
      [null, null, null],
      [null, 'block_planks', null],
      [null, 'block_planks', null],
    ],
  },
  {
    output: { id: 'pickaxe_wood', count: 1 },
    input: [
      ['block_planks', 'block_planks', 'block_planks'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'pickaxe_stone', count: 1 },
    input: [
      ['block_cobblestone', 'block_cobblestone', 'block_cobblestone'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'pickaxe_iron', count: 1 },
    input: [
      ['iron_ingot', 'iron_ingot', 'iron_ingot'],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'shovel_wood', count: 1 },
    input: [
      [null, 'block_planks', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'shovel_stone', count: 1 },
    input: [
      [null, 'block_cobblestone', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'shovel_iron', count: 1 },
    input: [
      [null, 'iron_ingot', null],
      [null, 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'axe_wood', count: 1 },
    input: [
      ['block_planks', 'block_planks', null],
      ['block_planks', 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'axe_stone', count: 1 },
    input: [
      ['block_cobblestone', 'block_cobblestone', null],
      ['block_cobblestone', 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'axe_iron', count: 1 },
    input: [
      ['iron_ingot', 'iron_ingot', null],
      ['iron_ingot', 'stick', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'sword_wood', count: 1 },
    input: [
      [null, 'block_planks', null],
      [null, 'block_planks', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'sword_stone', count: 1 },
    input: [
      [null, 'block_cobblestone', null],
      [null, 'block_cobblestone', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'sword_iron', count: 1 },
    input: [
      [null, 'iron_ingot', null],
      [null, 'iron_ingot', null],
      [null, 'stick', null],
    ],
  },
  {
    output: { id: 'block_crafting_table', count: 1 },
    input: [
      ['block_planks', 'block_planks', null],
      ['block_planks', 'block_planks', null],
      [null, null, null],
    ],
  },
  {
    output: { id: 'torch', count: 4 },
    input: [
      [null, 'coal', null],
      [null, 'stick', null],
      [null, null, null],
    ],
  },
  {
    output: { id: 'block_brick', count: 4 },
    input: [
      ['brick', 'brick', null],
      ['brick', 'brick', null],
      [null, null, null],
    ],
  },
  {
    output: { id: 'block_tnt', count: 1 },
    input: [
      ['sand', 'gunpowder', 'sand'],
      ['gunpowder', 'sand', 'gunpowder'],
      ['sand', 'gunpowder', 'sand'],
    ],
  },
  {
    output: { id: 'block_bookshelf', count: 1 },
    input: [
      ['block_planks', 'block_planks', 'block_planks'],
      ['book', 'book', 'book'],
      ['block_planks', 'block_planks', 'block_planks'],
    ],
  },
  {
    output: { id: 'paper', count: 3 },
    input: [
      ['stick', 'stick', 'stick'],
      [null, null, null],
      [null, null, null],
    ],
  },
  {
    output: { id: 'book', count: 1 },
    input: [
      ['paper', 'paper', null],
      ['paper', null, null],
      [null, null, null],
    ],
  },
];

export class CraftingManager {
  constructor() {
    this.recipes = RECIPES;
  }
  
  createItem(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return null;
    
    return new Item(itemId, def.name, def.type, {
      durability: def.durability,
      maxDurability: def.durability,
      miningLevel: def.miningLevel,
      damage: def.damage,
      blockId: def.blockId,
    });
  }
  
  findRecipe(craftingGrid) {
    for (const recipe of this.recipes) {
      if (this.matchesRecipe(recipe, craftingGrid)) {
        return recipe;
      }
    }
    return null;
  }
  
  matchesRecipe(recipe, craftingGrid) {
    const input = recipe.input;
    
    let minRow = 3, maxRow = -1;
    let minCol = 3, maxCol = -1;
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
      const cell = input[row][col];
      if (cell) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }
  
  if (minRow === 3) {
    minRow = 0;
    maxRow = 0;
    minCol = 0;
    maxCol = 0;
  }
  
  const recipeWidth = maxCol - minCol + 1;
  const recipeHeight = maxRow - minRow + 1;
  
  for (let offsetRow = 0; offsetRow <= 3 - recipeHeight; offsetRow++) {
    for (let offsetCol = 0; offsetCol <= 3 - recipeWidth; offsetCol++) {
      let matches = true;
      
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const recipeCell = input[row][col];
          const gridCell = craftingGrid[row][col];
          
          const gridItemId = gridCell ? gridCell.id : null;
          
          if (recipeCell === null && gridItemId === null) {
            continue;
          } else if (recipeCell === null && gridItemId !== null) {
            continue;
          } else if (recipeCell !== null && gridItemId === null) {
            matches = false;
            break;
          } else if (recipeCell !== gridItemId) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
      }
      
      if (matches) return true;
    }
  }
  
  return false;
}

craft(inventory, craftingGrid) {
  const recipe = this.findRecipe(craftingGrid);
  if (!recipe) return null;
  
  const requiredItems = new Map();
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const itemId = recipe.input[row][col];
      if (itemId) {
        requiredItems.set(itemId, (requiredItems.get(itemId) || 0) + 1);
      }
    }
  }
  
  for (const [itemId, count] of requiredItems) {
    if (!inventory.hasItem(itemId, count)) {
      return null;
    }
  }
  
  for (const [itemId, count] of requiredItems) {
    inventory.removeItemById(itemId, count);
  }
  
  const resultItem = this.createItem(recipe.output.id);
  return {
    item: resultItem,
    count: recipe.output.count,
  };
}
}
