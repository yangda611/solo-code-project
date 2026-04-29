import { tilesEqual, isHonor, isTerminal, isSimple, getTileId, sortTiles, SUITS } from './tile.js';
import { countTiles, isQiDui, isShiSanYao, findHuDecompositions } from './huPai.js';

export const FAN_TYPES = {
  GUO_SHI_WU_SHUANG: { name: '国士无双', value: 88, description: '由13种幺九牌各一张加其中一张做将组成' },
  SI_GANG: { name: '四杠', value: 88, description: '四个杠' },
  LIAN_QI_DUI: { name: '连七对', value: 88, description: '由一种花色序数牌组成序数相连的七个对子' },
  JIU_LIAN_BAO_DENG: { name: '九莲宝灯', value: 88, description: '由一种花色序数牌按1112345678999组成的特定牌型' },
  SI_AN_KE: { name: '四暗刻', value: 64, description: '四个暗刻（暗杠）' },
  LUAN_FENG_SHUANG: { name: '绿一色', value: 88, description: '由23468条及发字中的任何牌组成' },
  DA_SI_YUAN: { name: '大四喜', value: 88, description: '由4副风刻（杠）组成' },
  DA_SAN_YUAN: { name: '大三元', value: 88, description: '由中发白3副刻子组成' },
  XIAO_SI_YUAN: { name: '小四喜', value: 64, description: '由3副风刻及一对将牌组成' },
  XIAO_SAN_YUAN: { name: '小三元', value: 64, description: '由中发白两副刻子及将牌组成' },
  ZI_YI_SE: { name: '字一色', value: 64, description: '由字牌组成的刻子（杠）、将牌' },
  SI_SE_SI_GAO: { name: '四色四高', value: 48, description: '四种花色4副序数相同的顺子' },
  SI_BU_GAO: { name: '四步高', value: 24, description: '一种花色4副依次递增一位数的顺子' },
  SAN_GANG: { name: '三杠', value: 32, description: '三个杠' },
  HUN_YAO_JIU: { name: '混幺九', value: 32, description: '由字牌和序数牌一、九的刻子和将牌组成' },
  QING_YAO_JIU: { name: '清幺九', value: 64, description: '由序数牌一、九刻子、将牌组成' },
  TIAN_HU: { name: '天胡', value: 16, description: '庄家起手胡牌' },
  DI_HU: { name: '地胡', value: 16, description: '闲家第一轮自摸或胡庄家打出的第一张牌' },
  REN_HU: { name: '人胡', value: 16, description: '闲家在第一轮胡其他人打出的牌' },
  SHUANG_LONG_HUI: { name: '双龙会', value: 32, description: '两个老少副，5为将牌' },
  QI_DUI: { name: '七对', value: 24, description: '由7个对子组成' },
  QING_QI_DUI: { name: '清七对', value: 48, description: '由一种花色的7个对子组成' },
  LONG_QI_DUI: { name: '龙七对', value: 32, description: '七对中有4张相同的牌' },
  DA_QI_DUI: { name: '大七对', value: 24, description: '由4副刻子（或杠）和将牌组成' },
  QING_YI_SE: { name: '清一色', value: 24, description: '由一种花色的序数牌组成' },
  HUN_YI_SE: { name: '混一色', value: 6, description: '由一种花色序数牌及字牌组成' },
  WU_FENG: { name: '无风', value: 1, description: '胡牌时没有风牌' },
  MEN_QING: { name: '门清', value: 2, description: '没有吃碰杠，自摸胡牌' },
  AN_QI_DUI: { name: '暗七对', value: 24, description: '门清的七对' },
  DUAN_YAO: { name: '断幺', value: 2, description: '胡牌时没有幺九牌和字牌' },
  YI_BAN_GAO: { name: '一般高', value: 1, description: '由一种花色2副相同的顺子组成' },
  XI_LIAN_BAN: { name: '喜相逢', value: 1, description: '2种花色2副序数相同的顺子' },
  LIAN_LIU: { name: '连六', value: 1, description: '一种花色6张相连接的序数牌' },
  LAO_SHAO_FU: { name: '老少副', value: 1, description: '一种花色牌的123、789两副顺子' },
  YAO_JIU_KE: { name: '幺九刻', value: 1, description: '3张相同的一、九序数牌或字牌组成的刻子（或杠）' },
  MING_GANG: { name: '明杠', value: 1, description: '自己有暗刻，碰别人打出的一张相同的牌开杠' },
  AN_GANG: { name: '暗杠', value: 2, description: '自己抓进4张相同的牌开杠' },
  SHUANG_GANG: { name: '双暗杠', value: 6, description: '两个暗杠' },
  QUE_YI_MEN: { name: '缺一门', value: 1, description: '胡牌时缺少一种花色序数牌' },
  WU_GUI: { name: '无字', value: 1, description: '胡牌时没有字牌' },
  BIAN_ZHANG: { name: '边张', value: 1, description: '单和123的3或789的7' },
  KAN_ZHANG: { name: '坎张', value: 1, description: '单和两张牌中间的一张牌' },
  DAN_DIAO: { name: '单钓将', value: 1, description: '钓单张牌做将牌' },
  ZI_MO: { name: '自摸', value: 1, description: '自己抓进牌胡牌' },
  HAI_DI_LAO_YUE: { name: '海底捞月', value: 1, description: '和打出的最后一张牌' },
  HAI_DI_LAO_YU: { name: '海底捞鱼', value: 1, description: '自摸牌墙上最后一张牌' },
  GANG_SHANG_KAI_HUA: { name: '杠上开花', value: 1, description: '开杠抓进的牌成胡牌' },
  QIANG_GANG: { name: '抢杠', value: 1, description: '胡别人补杠的牌' },
  BU_HUA: { name: '补花', value: 1, description: '抓进花牌，补张后胡牌' },
  JUE_ZHANG: { name: '绝张', value: 4, description: '胡牌池、桌面已亮明的3张牌所剩的第4张牌' },
  SHUANG_MING_GANG: { name: '双明杠', value: 4, description: '两个明杠' },
  SAN_AN_KE: { name: '三暗刻', value: 16, description: '三个暗刻' },
  SAN_TONG_KE: { name: '三同刻', value: 16, description: '3种序数牌相同刻子' },
  SAN_SE_SAN_BU_GAO: { name: '三色三步高', value: 6, description: '3种花色3副依次递增一位的顺子' },
  SAN_SE_TONG_GAO: { name: '三色同高', value: 8, description: '3种花色3副序数相同的顺子' },
  HUA_LONG: { name: '花龙', value: 8, description: '3种花色的3副顺子连接成1-9的序数牌' },
  TUI_BU_DAO: { name: '推不倒', value: 8, description: '由牌面图形没有上下区别的牌组成' },
  SHUANG_JIAN_KE: { name: '双箭刻', value: 6, description: '2副箭刻（或杠）' },
  QUAN_DAI_YAO: { name: '全带幺', value: 4, description: '每副顺子、刻子、将牌都带有幺九牌' },
  BU_QIU_REN: { name: '不求人', value: 4, description: '没有吃碰杠，自摸胡牌' },
  SHUANG_AN_KE: { name: '双暗刻', value: 2, description: '两个暗刻' },
  HE_TI: { name: '和牌', value: 1, description: '基本胡牌' }
};

export function calculateFan(hand, melds = [], winningTile, options = {}) {
  const { isSelfDrawn = false, isLastTile = false, isRobKong = false, isGangShang = false } = options;
  
  const allTiles = [...hand, winningTile];
  melds.forEach(m => allTiles.push(...m.tiles));
  
  const count = countTiles(allTiles);
  const sorted = sortTiles(allTiles);
  const decompositions = findHuDecompositions(hand, melds, winningTile);
  
  if (decompositions.length === 0) {
    return { isValidHu: false, totalFan: 0, fanDetails: [] };
  }
  
  let maxFan = 0;
  let bestDetails = [];
  
  for (const decomp of decompositions) {
    const details = [];
    let total = 0;
    
    if (decomp.type === 'shisanyao') {
      details.push({ ...FAN_TYPES.GUO_SHI_WU_SHUANG });
      total += FAN_TYPES.GUO_SHI_WU_SHUANG.value;
      
      const hasPair = Object.values(count).some(v => v >= 2);
      if (hasPair) {
        const pairCount = Object.values(count).filter(v => v >= 2).length;
        if (pairCount === 1 && Object.values(count).some(v => v === 2)) {
        }
      }
    }
    else if (decomp.type === 'qidui') {
      details.push({ ...FAN_TYPES.QI_DUI });
      total += FAN_TYPES.QI_DUI.value;
      
      const suits = new Set(allTiles.map(t => t.suit));
      if (suits.size === 1 && isSimple(allTiles[0])) {
        details.push({ ...FAN_TYPES.QING_QI_DUI });
        total += FAN_TYPES.QING_QI_DUI.value;
      }
      
      if (Object.values(count).some(v => v === 4)) {
        details.push({ ...FAN_TYPES.LONG_QI_DUI });
        total += FAN_TYPES.LONG_QI_DUI.value;
      }
    }
    else if (decomp.type === 'standard') {
      const meldDetails = analyzeStandardMelds(decomp, melds, count, allTiles, isSelfDrawn);
      details.push(...meldDetails.details);
      total += meldDetails.total;
    }
    
    if (isSelfDrawn) {
      details.push({ ...FAN_TYPES.ZI_MO });
      total += FAN_TYPES.ZI_MO.value;
    }
    
    if (isLastTile) {
      details.push({ ...FAN_TYPES.HAI_DI_LAO_YUE });
      total += FAN_TYPES.HAI_DI_LAO_YUE.value;
    }
    
    if (isRobKong) {
      details.push({ ...FAN_TYPES.QIANG_GANG });
      total += FAN_TYPES.QIANG_GANG.value;
    }
    
    if (isGangShang) {
      details.push({ ...FAN_TYPES.GANG_SHANG_KAI_HUA });
      total += FAN_TYPES.GANG_SHANG_KAI_HUA.value;
    }
    
    if (total > maxFan) {
      maxFan = total;
      bestDetails = details;
    }
  }
  
  return {
    isValidHu: true,
    totalFan: maxFan,
    fanDetails: bestDetails,
    decompositions
  };
}

function analyzeStandardMelds(decomposition, melds, count, allTiles, isSelfDrawn) {
  const details = [];
  let total = 0;
  
  const allMelds = [...(decomposition.melds || [])];
  const explicitMelds = melds.map(m => ({
    type: m.type === 'chi' ? 'shun' : 'ke',
    tiles: m.tiles.map(t => getTileId(t)),
    isConcealed: m.isConcealed
  }));
  
  const suits = new Set(allTiles.map(t => t.suit));
  const simpleSuits = new Set(allTiles.filter(t => isSimple(t)).map(t => t.suit));
  
  if (simpleSuits.size === 1 && !allTiles.some(t => isHonor(t))) {
    details.push({ ...FAN_TYPES.QING_YI_SE });
    total += FAN_TYPES.QING_YI_SE.value;
  }
  else if (simpleSuits.size === 1 && allTiles.some(t => isHonor(t))) {
    details.push({ ...FAN_TYPES.HUN_YI_SE });
    total += FAN_TYPES.HUN_YI_SE.value;
  }
  
  if (simpleSuits.size === 2 && suits.size === 2) {
    details.push({ ...FAN_TYPES.QUE_YI_MEN });
    total += FAN_TYPES.QUE_YI_MEN.value;
  }
  
  if (!allTiles.some(t => isHonor(t))) {
    details.push({ ...FAN_TYPES.WU_GUI });
    total += FAN_TYPES.WU_GUI.value;
  }
  
  if (!allTiles.some(t => t.suit === SUITS.FENG)) {
    details.push({ ...FAN_TYPES.WU_FENG });
    total += FAN_TYPES.WU_FENG.value;
  }
  
  if (!allTiles.some(t => isTerminal(t) || isHonor(t))) {
    details.push({ ...FAN_TYPES.DUAN_YAO });
    total += FAN_TYPES.DUAN_YAO.value;
  }
  
  const gangCount = explicitMelds.filter(m => m.tiles.length === 4 || melds.some(mm => mm.type === 'gang' || mm.type === 'angang')).length;
  const anGangCount = explicitMelds.filter(m => m.isConcealed).length;
  
  if (gangCount >= 4) {
    details.push({ ...FAN_TYPES.SI_GANG });
    total += FAN_TYPES.SI_GANG.value;
  }
  else if (gangCount >= 3) {
    details.push({ ...FAN_TYPES.SAN_GANG });
    total += FAN_TYPES.SAN_GANG.value;
  }
  else if (anGangCount >= 2) {
    details.push({ ...FAN_TYPES.SHUANG_GANG });
    total += FAN_TYPES.SHUANG_GANG.value;
  }
  else if (gangCount >= 2) {
    details.push({ ...FAN_TYPES.SHUANG_MING_GANG });
    total += FAN_TYPES.SHUANG_MING_GANG.value;
  }
  
  const keCount = allMelds.filter(m => m.type === 'ke').length + explicitMelds.filter(m => m.type === 'ke').length;
  const concealedKeCount = explicitMelds.filter(m => m.isConcealed && m.type === 'ke').length;
  
  if (keCount >= 4) {
    details.push({ ...FAN_TYPES.DA_QI_DUI });
    total += FAN_TYPES.DA_QI_DUI.value;
    
    if (concealedKeCount >= 4) {
      details.push({ ...FAN_TYPES.SI_AN_KE });
      total += FAN_TYPES.SI_AN_KE.value;
    }
  }
  else if (concealedKeCount >= 3) {
    details.push({ ...FAN_TYPES.SAN_AN_KE });
    total += FAN_TYPES.SAN_AN_KE.value;
  }
  else if (concealedKeCount >= 2) {
    details.push({ ...FAN_TYPES.SHUANG_AN_KE });
    total += FAN_TYPES.SHUANG_AN_KE.value;
  }
  
  const fengKe = allTiles.filter(t => t.suit === SUITS.FENG);
  const ziKe = allTiles.filter(t => t.suit === SUITS.ZI);
  
  const fengCount = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const ziCount = { 1: 0, 2: 0, 3: 0 };
  
  fengKe.forEach(t => fengCount[t.value]++);
  ziKe.forEach(t => ziCount[t.value]++);
  
  const fengKeCount = Object.values(fengCount).filter(v => v >= 3).length;
  const ziKeCount = Object.values(ziCount).filter(v => v >= 3).length;
  
  if (fengKeCount >= 4) {
    details.push({ ...FAN_TYPES.DA_SI_YUAN });
    total += FAN_TYPES.DA_SI_YUAN.value;
  }
  else if (fengKeCount >= 3) {
    details.push({ ...FAN_TYPES.XIAO_SI_YUAN });
    total += FAN_TYPES.XIAO_SI_YUAN.value;
  }
  
  if (ziKeCount >= 3) {
    details.push({ ...FAN_TYPES.DA_SAN_YUAN });
    total += FAN_TYPES.DA_SAN_YUAN.value;
  }
  else if (ziKeCount >= 2) {
    details.push({ ...FAN_TYPES.XIAO_SAN_YUAN });
    total += FAN_TYPES.XIAO_SAN_YUAN.value;
  }
  
  const hasYao = allTiles.some(t => isTerminal(t) || isHonor(t));
  const allKeZi = keCount >= 4;
  
  if (allKeZi && hasYao) {
    const allYao = allTiles.every(t => isTerminal(t) || isHonor(t));
    if (allYao) {
      const hasHonor = allTiles.some(t => isHonor(t));
      if (hasHonor) {
        details.push({ ...FAN_TYPES.HUN_YAO_JIU });
        total += FAN_TYPES.HUN_YAO_JIU.value;
      } else {
        details.push({ ...FAN_TYPES.QING_YAO_JIU });
        total += FAN_TYPES.QING_YAO_JIU.value;
      }
    }
  }
  
  const shunMelds = allMelds.filter(m => m.type === 'shun');
  if (shunMelds.length >= 2) {
    const shunValues = shunMelds.map(m => {
      const vals = m.tiles.map(t => parseInt(t.split('_')[1])).sort((a, b) => a - b);
      return { suit: m.tiles[0].split('_')[0], start: vals[0] };
    });
    
    for (let i = 0; i < shunValues.length; i++) {
      for (let j = i + 1; j < shunValues.length; j++) {
        if (shunValues[i].suit === shunValues[j].suit && shunValues[i].start === shunValues[j].start) {
          details.push({ ...FAN_TYPES.YI_BAN_GAO });
          total += FAN_TYPES.YI_BAN_GAO.value;
        }
        else if (shunValues[i].suit !== shunValues[j].suit && shunValues[i].start === shunValues[j].start) {
          details.push({ ...FAN_TYPES.XI_LIAN_BAN });
          total += FAN_TYPES.XI_LIAN_BAN.value;
        }
      }
    }
    
    for (let i = 0; i < shunValues.length; i++) {
      for (let j = 0; j < shunValues.length; j++) {
        if (i !== j && shunValues[i].suit === shunValues[j].suit) {
          if ((shunValues[i].start === 1 && shunValues[j].start === 7) ||
              (shunValues[i].start === 7 && shunValues[j].start === 1)) {
            details.push({ ...FAN_TYPES.LAO_SHAO_FU });
            total += FAN_TYPES.LAO_SHAO_FU.value;
          }
        }
      }
    }
  }
  
  if (melds.length === 0 && isSelfDrawn) {
    details.push({ ...FAN_TYPES.MEN_QING });
    total += FAN_TYPES.MEN_QING.value;
  }
  
  return { details, total };
}

export function checkMinimumFan(hand, melds, winningTile, options = {}, minFan = 8) {
  const result = calculateFan(hand, melds, winningTile, options);
  return {
    ...result,
    meetsMinimum: result.totalFan >= minFan
  };
}
