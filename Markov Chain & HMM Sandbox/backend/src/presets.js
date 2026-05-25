const presets = {
  'absorbing-collapse': {
    id: 'absorbing-collapse',
    name: '预设一：吸收态导致概率坍塌的稳态退化',
    description: '展示吸收态如何导致马尔可夫链最终收敛于单一状态，观察稳态分布中其他状态概率归零的现象',
    states: ['S0-正常', 'S1-预警', 'S2-吸收态'],
    observations: ['O1', 'O2', 'O3'],
    transitionMatrix: [
      [0.7, 0.2, 0.1],
      [0.1, 0.6, 0.3],
      [0.0, 0.0, 1.0]
    ],
    emissionMatrix: [
      [0.8, 0.15, 0.05],
      [0.2, 0.5, 0.3],
      [0.0, 0.0, 1.0]
    ],
    initialDistribution: [0.8, 0.15, 0.05],
    observationSequence: ['O1', 'O1', 'O2', 'O1', 'O2', 'O3', 'O3', 'O3', 'O3', 'O3']
  },

  'viterbi-overflow': {
    id: 'viterbi-overflow',
    name: '预设二：观测序列长度与状态数不匹配的维特比溢出',
    description: '长观测序列导致概率数值下溢，delta矩阵值趋近于零，展示数值稳定性问题',
    states: ['S0', 'S1', 'S2', 'S3', 'S4'],
    observations: ['红', '蓝', '绿'],
    transitionMatrix: [
      [0.5, 0.2, 0.15, 0.1, 0.05],
      [0.1, 0.5, 0.2, 0.15, 0.05],
      [0.05, 0.1, 0.5, 0.25, 0.1],
      [0.1, 0.05, 0.15, 0.5, 0.2],
      [0.2, 0.1, 0.1, 0.1, 0.5]
    ],
    emissionMatrix: [
      [0.6, 0.3, 0.1],
      [0.3, 0.6, 0.1],
      [0.1, 0.3, 0.6],
      [0.4, 0.4, 0.2],
      [0.2, 0.4, 0.4]
    ],
    initialDistribution: [0.2, 0.2, 0.2, 0.2, 0.2],
    observationSequence: Array(50).fill(0).map((_, i) => ['红', '蓝', '绿'][i % 3])
  },

  'zero-prob-failure': {
    id: 'zero-prob-failure',
    name: '预设三：零概率转移下的参数估计失败',
    description: '零概率转移导致Baum-Welch算法参数估计失败，展示稀疏数据下的过拟合震荡',
    states: ['A', 'B', 'C'],
    observations: ['X', 'Y'],
    transitionMatrix: [
      [0.5, 0.5, 0.0],
      [0.0, 0.5, 0.5],
      [0.5, 0.0, 0.5]
    ],
    emissionMatrix: [
      [0.9, 0.1],
      [0.1, 0.9],
      [0.5, 0.5]
    ],
    initialDistribution: [0.33, 0.33, 0.34],
    observationSequence: ['X', 'X', 'X', 'Y', 'Y', 'Y', 'X', 'Y']
  },

  'dirichlet-bias': {
    id: 'dirichlet-bias',
    name: '预设四：非遍历链的狄利克雷先验偏差',
    description: '非遍历马尔可夫链导致参数学习偏差，展示先验分布对结果的影响',
    states: ['区域1-A', '区域1-B', '区域2-C', '区域2-D'],
    observations: ['高', '中', '低'],
    transitionMatrix: [
      [0.8, 0.2, 0.0, 0.0],
      [0.2, 0.8, 0.0, 0.0],
      [0.0, 0.0, 0.7, 0.3],
      [0.0, 0.0, 0.4, 0.6]
    ],
    emissionMatrix: [
      [0.7, 0.2, 0.1],
      [0.6, 0.3, 0.1],
      [0.1, 0.3, 0.6],
      [0.1, 0.2, 0.7]
    ],
    initialDistribution: [0.25, 0.25, 0.25, 0.25],
    observationSequence: ['高', '高', '中', '高', '低', '低', '中', '低', '高', '中', '低', '低']
  }
}

module.exports = presets
