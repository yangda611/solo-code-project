export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 256;
export const CHUNK_AREA = CHUNK_SIZE * CHUNK_SIZE;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE;

export const WORLD_SEED = 12345;

export const RENDER_DISTANCE = 8;
export const LOAD_DISTANCE = RENDER_DISTANCE + 2;
export const UNLOAD_DISTANCE = LOAD_DISTANCE + 2;

export const BLOCK_AIR = 0;
export const BLOCK_GRASS = 1;
export const BLOCK_DIRT = 2;
export const BLOCK_STONE = 3;
export const BLOCK_SAND = 4;
export const BLOCK_GRAVEL = 5;
export const BLOCK_WATER = 6;
export const BLOCK_LAVA = 7;
export const BLOCK_WOOD = 8;
export const BLOCK_LEAVES = 9;
export const BLOCK_BEDROCK = 10;
export const BLOCK_COAL_ORE = 11;
export const BLOCK_IRON_ORE = 12;
export const BLOCK_GOLD_ORE = 13;
export const BLOCK_DIAMOND_ORE = 14;
export const BLOCK_COBBLESTONE = 15;
export const BLOCK_PLANKS = 16;
export const BLOCK_CRAFTING_TABLE = 17;
export const BLOCK_FURNACE = 18;
export const BLOCK_BRICK = 19;
export const BLOCK_TNT = 20;
export const BLOCK_BOOKSHELF = 21;
export const BLOCK_MOSS_STONE = 22;
export const BLOCK_OBSIDIAN = 23;
export const BLOCK_TORCH = 24;
export const BLOCK_FIRE = 25;
export const BLOCK_SANDSTONE = 26;
export const BLOCK_SNOW = 27;
export const BLOCK_ICE = 28;
export const BLOCK_SNOW_BLOCK = 29;
export const BLOCK_CACTUS = 30;
export const BLOCK_CLAY = 31;
export const BLOCK_PUMPKIN = 32;
export const BLOCK_NETHERRACK = 33;
export const BLOCK_SOUL_SAND = 34;
export const BLOCK_GLOWSTONE = 35;
export const BLOCK_END_STONE = 36;

export const BLOCK_TYPES = {
  [BLOCK_AIR]: { id: 0, name: 'air', solid: false, transparent: true, light: 0, color: 0x000000 },
  [BLOCK_GRASS]: { id: 1, name: 'grass', solid: true, transparent: false, light: 0, color: 0x4CAF50 },
  [BLOCK_DIRT]: { id: 2, name: 'dirt', solid: true, transparent: false, light: 0, color: 0x8B4513 },
  [BLOCK_STONE]: { id: 3, name: 'stone', solid: true, transparent: false, light: 0, color: 0x808080 },
  [BLOCK_SAND]: { id: 4, name: 'sand', solid: true, transparent: false, light: 0, color: 0xF4D03F },
  [BLOCK_GRAVEL]: { id: 5, name: 'gravel', solid: true, transparent: false, light: 0, color: 0x696969 },
  [BLOCK_WATER]: { id: 6, name: 'water', solid: false, transparent: true, light: 0, color: 0x3498DB, liquid: true, gravity: true },
  [BLOCK_LAVA]: { id: 7, name: 'lava', solid: false, transparent: true, light: 15, color: 0xE74C3C, liquid: true, gravity: true },
  [BLOCK_WOOD]: { id: 8, name: 'wood', solid: true, transparent: false, light: 0, color: 0xA0522D },
  [BLOCK_LEAVES]: { id: 9, name: 'leaves', solid: true, transparent: false, light: 0, color: 0x228B22 },
  [BLOCK_BEDROCK]: { id: 10, name: 'bedrock', solid: true, transparent: false, light: 0, color: 0x1C1C1C, unbreakable: true },
  [BLOCK_COAL_ORE]: { id: 11, name: 'coal_ore', solid: true, transparent: false, light: 0, color: 0x36454F },
  [BLOCK_IRON_ORE]: { id: 12, name: 'iron_ore', solid: true, transparent: false, light: 0, color: 0xC0C0C0 },
  [BLOCK_GOLD_ORE]: { id: 13, name: 'gold_ore', solid: true, transparent: false, light: 0, color: 0xFFD700 },
  [BLOCK_DIAMOND_ORE]: { id: 14, name: 'diamond_ore', solid: true, transparent: false, light: 0, color: 0x00CED1 },
  [BLOCK_COBBLESTONE]: { id: 15, name: 'cobblestone', solid: true, transparent: false, light: 0, color: 0x505050 },
  [BLOCK_PLANKS]: { id: 16, name: 'planks', solid: true, transparent: false, light: 0, color: 0xDEB887 },
  [BLOCK_CRAFTING_TABLE]: { id: 17, name: 'crafting_table', solid: true, transparent: false, light: 0, color: 0x8B4513 },
  [BLOCK_FURNACE]: { id: 18, name: 'furnace', solid: true, transparent: false, light: 0, color: 0x696969 },
  [BLOCK_BRICK]: { id: 19, name: 'brick', solid: true, transparent: false, light: 0, color: 0xB22222 },
  [BLOCK_TNT]: { id: 20, name: 'tnt', solid: true, transparent: false, light: 0, color: 0xFF0000 },
  [BLOCK_BOOKSHELF]: { id: 21, name: 'bookshelf', solid: true, transparent: false, light: 0, color: 0x8B4513 },
  [BLOCK_MOSS_STONE]: { id: 22, name: 'moss_stone', solid: true, transparent: false, light: 0, color: 0x4A5D23 },
  [BLOCK_OBSIDIAN]: { id: 23, name: 'obsidian', solid: true, transparent: false, light: 0, color: 0x1A1A2E },
  [BLOCK_TORCH]: { id: 24, name: 'torch', solid: false, transparent: false, light: 14, color: 0xFFD700 },
  [BLOCK_FIRE]: { id: 25, name: 'fire', solid: false, transparent: true, light: 15, color: 0xFF4500 },
  [BLOCK_SANDSTONE]: { id: 26, name: 'sandstone', solid: true, transparent: false, light: 0, color: 0xF5DEB3 },
  [BLOCK_SNOW]: { id: 27, name: 'snow', solid: true, transparent: false, light: 0, color: 0xFFFFFF },
  [BLOCK_ICE]: { id: 28, name: 'ice', solid: true, transparent: true, light: 0, color: 0xE0FFFF },
  [BLOCK_SNOW_BLOCK]: { id: 29, name: 'snow_block', solid: true, transparent: false, light: 0, color: 0xFAFAFA },
  [BLOCK_CACTUS]: { id: 30, name: 'cactus', solid: true, transparent: false, light: 0, color: 0x2E8B57 },
  [BLOCK_CLAY]: { id: 31, name: 'clay', solid: true, transparent: false, light: 0, color: 0xB0C4DE },
  [BLOCK_PUMPKIN]: { id: 32, name: 'pumpkin', solid: true, transparent: false, light: 0, color: 0xFF8C00 },
  [BLOCK_NETHERRACK]: { id: 33, name: 'netherrack', solid: true, transparent: false, light: 0, color: 0x8B0000 },
  [BLOCK_SOUL_SAND]: { id: 34, name: 'soul_sand', solid: true, transparent: false, light: 0, color: 0x4A3728 },
  [BLOCK_GLOWSTONE]: { id: 35, name: 'glowstone', solid: true, transparent: false, light: 15, color: 0xFFD700 },
  [BLOCK_END_STONE]: { id: 36, name: 'end_stone', solid: true, transparent: false, light: 0, color: 0xFFFFE0 },
};

export const BIOME_OCEAN = 0;
export const BIOME_PLAINS = 1;
export const BIOME_DESERT = 2;
export const BIOME_FOREST = 3;
export const BIOME_TAIGA = 4;
export const BIOME_SWAMP = 5;
export const BIOME_MOUNTAINS = 6;
export const BIOME_TUNDRA = 7;
export const BIOME_JUNGLE = 8;
export const BIOME_BEACH = 9;

export const BIOME_NAMES = {
  [BIOME_OCEAN]: '海洋',
  [BIOME_PLAINS]: '平原',
  [BIOME_DESERT]: '沙漠',
  [BIOME_FOREST]: '森林',
  [BIOME_TAIGA]: '针叶林',
  [BIOME_SWAMP]: '沼泽',
  [BIOME_MOUNTAINS]: '山脉',
  [BIOME_TUNDRA]: '冻原',
  [BIOME_JUNGLE]: '丛林',
  [BIOME_BEACH]: '海滩',
};

export const BIOME_PARAMS = {
  [BIOME_OCEAN]: {
    baseHeight: -5,
    heightVariation: 2,
    temp: 0.5,
    rainfall: 0.8,
    surfaceBlock: BLOCK_SAND,
    fillerBlock: BLOCK_SAND,
  },
  [BIOME_PLAINS]: {
    baseHeight: 64,
    heightVariation: 3,
    temp: 0.8,
    rainfall: 0.4,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_DESERT]: {
    baseHeight: 62,
    heightVariation: 4,
    temp: 0.9,
    rainfall: 0.1,
    surfaceBlock: BLOCK_SAND,
    fillerBlock: BLOCK_SAND,
  },
  [BIOME_FOREST]: {
    baseHeight: 65,
    heightVariation: 4,
    temp: 0.7,
    rainfall: 0.6,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_TAIGA]: {
    baseHeight: 63,
    heightVariation: 5,
    temp: 0.3,
    rainfall: 0.5,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_SWAMP]: {
    baseHeight: 61,
    heightVariation: 1,
    temp: 0.7,
    rainfall: 0.9,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_MOUNTAINS]: {
    baseHeight: 75,
    heightVariation: 15,
    temp: 0.4,
    rainfall: 0.5,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_TUNDRA]: {
    baseHeight: 62,
    heightVariation: 2,
    temp: 0.1,
    rainfall: 0.2,
    surfaceBlock: BLOCK_SNOW_BLOCK,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_JUNGLE]: {
    baseHeight: 64,
    heightVariation: 3,
    temp: 0.9,
    rainfall: 0.9,
    surfaceBlock: BLOCK_GRASS,
    fillerBlock: BLOCK_DIRT,
  },
  [BIOME_BEACH]: {
    baseHeight: 62,
    heightVariation: 2,
    temp: 0.8,
    rainfall: 0.3,
    surfaceBlock: BLOCK_SAND,
    fillerBlock: BLOCK_SAND,
  },
};

export const GRAVITY = 28.0;
export const JUMP_VELOCITY = 8.0;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_EYE_HEIGHT = 1.6;
export const MOVE_SPEED = 4.3;
export const SPRINT_SPEED = 5.6;
export const SNEAK_SPEED = 1.3;

export const REACH_DISTANCE = 5.0;
export const BLOCK_BREAK_TIME = 0.5;

export const DAY_LENGTH = 120.0;
export const NIGHT_START = 0.6;
export const NIGHT_END = 0.9;

export const FLUID_UPDATE_RATE = 20;
export const FLUID_SPREAD_DELAY = 0.5;
export const WATER_LEVEL = 62;

export const HOTBAR_SIZE = 9;
export const INVENTORY_SIZE = 36;
