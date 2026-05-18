import type { PresetScenario, ResidueType } from '~/types/hp-model';

const generateSequence = (length: number, pattern: string): ResidueType[] => {
  const result: ResidueType[] = [];
  for (let i = 0; i < length; i++) {
    result.push(pattern[i % pattern.length] as ResidueType);
  }
  return result;
};

const generateTwoStateSequence = (): ResidueType[] => {
  const seq: ResidueType[] = [];
  for (let i = 0; i < 5; i++) seq.push('H');
  for (let i = 0; i < 6; i++) seq.push('P');
  for (let i = 0; i < 5; i++) seq.push('H');
  return seq;
};

const generateDispersedSequence = (): ResidueType[] => {
  return generateSequence(20, 'HPHPPHHPHPPHPHHPPHP');
};

const generateHelicalSequence = (): ResidueType[] => {
  return generateSequence(24, 'HPPHPPHPPHPPHPPHPPHPPHPP');
};

const generateMultiDomainSequence = (): ResidueType[] => {
  const seq: ResidueType[] = [];
  for (let i = 0; i < 8; i++) seq.push('H');
  for (let i = 0; i < 8; i++) seq.push('P');
  for (let i = 0; i < 8; i++) seq.push('H');
  for (let i = 0; i < 8; i++) seq.push('P');
  return seq;
};

export const presetScenarios: PresetScenario[] = [
  {
    id: 'two-state',
    name: '快速两态折叠',
    description: '两端疏水残基簇，中间极性连接，表现出典型的两态折叠行为',
    params: {
      chainLength: 16,
      sequence: generateTwoStateSequence(),
      hydrophobicStrength: 1.0,
      initialTemperature: 5.0,
      coolingRate: 0.995,
      simulationMethod: 'metropolis'
    },
    phenomenon: '可以观察到清晰的两态转变：从伸展态快速塌缩到中间态，然后跃迁至天然态'
  },
  {
    id: 'glass-trap',
    name: '玻璃态动力学陷阱',
    description: '疏水残基分散分布，快速冷却导致陷入亚稳态',
    params: {
      chainLength: 20,
      sequence: generateDispersedSequence(),
      hydrophobicStrength: 1.2,
      initialTemperature: 10.0,
      coolingRate: 0.98,
      simulationMethod: 'metropolis'
    },
    phenomenon: '温度下降过快导致系统陷入高能亚稳态，无法跨越能垒到达天然态，展现典型的玻璃态行为'
  },
  {
    id: 'helix-preference',
    name: '螺旋结构偏好',
    description: 'H-P-P周期性重复序列偏好形成螺旋构象',
    params: {
      chainLength: 24,
      sequence: generateHelicalSequence(),
      hydrophobicStrength: 0.8,
      initialTemperature: 4.0,
      coolingRate: 0.997,
      simulationMethod: 'metropolis'
    },
    phenomenon: '疏水残基在序列中的周期性分布促使构象形成螺旋结构，展现格点模型的构象偏好性'
  },
  {
    id: 'multi-domain',
    name: '多域独立折叠',
    description: '两段疏水结构域被长极性连接子隔开',
    params: {
      chainLength: 32,
      sequence: generateMultiDomainSequence(),
      hydrophobicStrength: 1.0,
      initialTemperature: 6.0,
      coolingRate: 0.998,
      simulationMethod: 'metropolis'
    },
    phenomenon: '两个结构域先独立折叠形成疏水核，然后通过连接子相互靠近组装，展示模块化折叠过程'
  }
];

export const getDefaultScenario = (): PresetScenario => presetScenarios[0];

export const getScenarioById = (id: string): PresetScenario | undefined => {
  return presetScenarios.find(s => s.id === id);
};
