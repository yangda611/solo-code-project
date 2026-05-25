const presets = {
  preset1: {
    name: '多重间接循环隐藏的深层依赖',
    description: '包含深层嵌套的间接循环，测试Tarjan算法的递归检测能力',
    graph: {
      A: ['B', 'C'],
      B: ['D'],
      C: ['E'],
      D: ['F'],
      E: ['F'],
      F: ['G'],
      G: ['H'],
      H: ['B'],
      I: ['J'],
      J: ['K'],
      K: ['I', 'G'],
      L: ['M'],
      M: ['N'],
      N: ['L'],
      O: ['P'],
      P: ['Q'],
      Q: ['R'],
      R: ['S'],
      S: ['O'],
      T: ['U'],
      U: []
    },
    expectedCycles: [
      ['B', 'D', 'F', 'G', 'H', 'B'],
      ['I', 'J', 'K', 'I'],
      ['L', 'M', 'N', 'L'],
      ['O', 'P', 'Q', 'R', 'S', 'O']
    ],
    issues: ['递归检测性能卡顿']
  },

  preset2: {
    name: '自环依赖导致的死锁启动顺序',
    description: '包含自环依赖的模块，展示启动时可能出现的死锁问题',
    graph: {
      ServiceA: ['ServiceB', 'ServiceA'],
      ServiceB: ['ServiceC'],
      ServiceC: ['ServiceD', 'ServiceC'],
      ServiceD: ['ServiceE'],
      ServiceE: ['ServiceF'],
      ServiceF: ['ServiceG'],
      ServiceG: ['ServiceH'],
      ServiceH: ['ServiceB'],
      Config: ['Config'],
      Logger: []
    },
    expectedCycles: [
      ['ServiceA', 'ServiceA'],
      ['ServiceC', 'ServiceC'],
      ['ServiceB', 'ServiceC', 'ServiceD', 'ServiceE', 'ServiceF', 'ServiceG', 'ServiceH', 'ServiceB']
    ],
    issues: ['自环依赖死锁风险']
  },

  preset3: {
    name: '不同强连通分量间的虚假边干扰',
    description: '存在跨分量的反向边，可能干扰循环检测和拓扑排序',
    graph: {
      Module1: ['Module2', 'Module3'],
      Module2: ['Module4'],
      Module3: ['Module5'],
      Module4: ['Module2'],
      Module5: ['Module3'],
      Module6: ['Module7', 'Module4'],
      Module7: ['Module8'],
      Module8: ['Module7'],
      Module9: ['Module10', 'Module6'],
      Module10: ['Module11'],
      Module11: ['Module10'],
      Module12: ['Module9', 'Module8']
    },
    expectedCycles: [
      ['Module2', 'Module4', 'Module2'],
      ['Module3', 'Module5', 'Module3'],
      ['Module7', 'Module8', 'Module7'],
      ['Module10', 'Module11', 'Module10']
    ],
    issues: ['跨分量反向边未被标记', '强连通分量识别遗漏']
  },

  preset4: {
    name: '动态导入引发的条件循环检测失效',
    description: '包含条件性动态导入，在某些执行路径下才会出现循环',
    graph: {
      Core: ['Auth', 'Utils'],
      Auth: ['User', 'Permission'],
      User: ['Profile', 'Settings'],
      Profile: ['Core'],
      Permission: ['Role'],
      Role: ['User'],
      Utils: ['Logger'],
      Logger: [],
      PluginA: ['Core'],
      PluginB: ['Core'],
      DynamicModule: ['PluginA', 'PluginB'],
      Settings: ['DynamicModule']
    },
    dynamicNodes: ['DynamicModule', 'PluginA', 'PluginB'],
    expectedCycles: [
      ['Core', 'Auth', 'User', 'Profile', 'Core'],
      ['User', 'Role', 'Permission', 'User'],
      ['Core', 'Auth', 'User', 'Settings', 'DynamicModule', 'PluginA', 'Core']
    ],
    issues: ['动态导入缺失导致的假阳性循环', '条件循环检测失效']
  }
};

function getPreset(presetId) {
  return presets[presetId] || null;
}

function getAllPresets() {
  return Object.keys(presets).map(id => ({
    id,
    name: presets[id].name,
    description: presets[id].description
  }));
}

module.exports = {
  presets,
  getPreset,
  getAllPresets
};
