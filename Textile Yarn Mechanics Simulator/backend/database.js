const presets = [
  {
    name: '平纹布拉伸预设',
    config: {
      warpDensity: 20,
      weftTwist: 300,
      weavePattern: 'plain',
      layers: 1,
      loadType: 'tensile'
    }
  },
  {
    name: '斜纹布剪切预设',
    config: {
      warpDensity: 25,
      weftTwist: 400,
      weavePattern: 'twill',
      layers: 1,
      loadType: 'shear'
    }
  },
  {
    name: '缎纹布顶破预设',
    config: {
      warpDensity: 30,
      weftTwist: 500,
      weavePattern: 'satin',
      layers: 1,
      loadType: 'bursting'
    }
  },
  {
    name: '多层复合弯曲预设',
    config: {
      warpDensity: 22,
      weftTwist: 350,
      weavePattern: 'multi_layer',
      layers: 3,
      loadType: 'bending'
    }
  }
]

const fabricConfigs = []
const loadDisplacementData = []

module.exports = { presets, fabricConfigs, loadDisplacementData }
