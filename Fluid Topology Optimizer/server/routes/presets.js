const express = require('express');
const router = express.Router();

const presets = {
  microchannel: {
    name: '微通道散热器预设',
    gridSizeX: 40,
    gridSizeY: 8,
    gridSizeZ: 16,
    reynoldsMin: 100,
    reynoldsMax: 500,
    pressureDropConstraint: 50,
    minFeatureSize: 2,
    inlet: [
      { x: 0, y: 2, z: 4, sx: 1, sy: 4, sz: 8, type: 'inlet', value: 1.0 }
    ],
    outlet: [
      { x: 39, y: 2, z: 4, sx: 1, sy: 4, sz: 8, type: 'outlet', value: 0 }
    ],
    solid: [
      { x: 0, y: 0, z: 0, sx: 40, sy: 2, sz: 16, type: 'solid' },
      { x: 0, y: 6, z: 0, sx: 40, sy: 2, sz: 16, type: 'solid' },
      { x: 0, y: 0, z: 0, sx: 40, sy: 8, sz: 2, type: 'solid' },
      { x: 0, y: 0, z: 14, sx: 40, sy: 8, sz: 2, type: 'solid' }
    ]
  },
  
  manifold: {
    name: '歧管分配器预设',
    gridSizeX: 48,
    gridSizeY: 24,
    gridSizeZ: 12,
    reynoldsMin: 50,
    reynoldsMax: 300,
    pressureDropConstraint: 30,
    minFeatureSize: 3,
    inlet: [
      { x: 0, y: 10, z: 4, sx: 1, sy: 4, sz: 4, type: 'inlet', value: 1.5 }
    ],
    outlet: [
      { x: 47, y: 4, z: 4, sx: 1, sy: 4, sz: 4, type: 'outlet', value: 0 },
      { x: 47, y: 16, z: 4, sx: 1, sy: 4, sz: 4, type: 'outlet', value: 0 }
    ],
    solid: [
      { x: 0, y: 0, z: 0, sx: 48, sy: 2, sz: 12, type: 'solid' },
      { x: 0, y: 22, z: 0, sx: 48, sy: 2, sz: 12, type: 'solid' },
      { x: 0, y: 0, z: 0, sx: 48, sy: 24, sz: 2, type: 'solid' },
      { x: 0, y: 0, z: 10, sx: 48, sy: 24, sz: 2, type: 'solid' },
      { x: 22, y: 8, z: 3, sx: 4, sy: 8, sz: 6, type: 'solid' }
    ]
  },
  
  airfoil: {
    name: '气动减阻翼型预设',
    gridSizeX: 50,
    gridSizeY: 30,
    gridSizeZ: 8,
    reynoldsMin: 1000,
    reynoldsMax: 5000,
    pressureDropConstraint: 20,
    minFeatureSize: 2,
    inlet: [
      { x: 0, y: 5, z: 2, sx: 1, sy: 20, sz: 4, type: 'inlet', value: 2.0 }
    ],
    outlet: [
      { x: 49, y: 5, z: 2, sx: 1, sy: 20, sz: 4, type: 'outlet', value: 0 }
    ],
    solid: [
      { x: 0, y: 0, z: 0, sx: 50, sy: 5, sz: 8, type: 'solid' },
      { x: 0, y: 25, z: 0, sx: 50, sy: 5, sz: 8, type: 'solid' },
      { x: 20, y: 12, z: 2, sx: 10, sy: 6, sz: 4, type: 'solid' }
    ]
  },
  
  dialysis: {
    name: '血液透析流道预设',
    gridSizeX: 36,
    gridSizeY: 20,
    gridSizeZ: 10,
    reynoldsMin: 10,
    reynoldsMax: 100,
    pressureDropConstraint: 10,
    minFeatureSize: 2,
    inlet: [
      { x: 0, y: 8, z: 3, sx: 1, sy: 4, sz: 4, type: 'inlet', value: 0.5 },
      { x: 0, y: 14, z: 3, sx: 1, sy: 4, sz: 4, type: 'inlet', value: 0.5 }
    ],
    outlet: [
      { x: 35, y: 8, z: 3, sx: 1, sy: 4, sz: 4, type: 'outlet', value: 0 },
      { x: 35, y: 2, z: 3, sx: 1, sy: 4, sz: 4, type: 'outlet', value: 0 }
    ],
    solid: [
      { x: 0, y: 0, z: 0, sx: 36, sy: 2, sz: 10, type: 'solid' },
      { x: 0, y: 18, z: 0, sx: 36, sy: 2, sz: 10, type: 'solid' },
      { x: 0, y: 0, z: 0, sx: 36, sy: 20, sz: 2, type: 'solid' },
      { x: 0, y: 0, z: 8, sx: 36, sy: 20, sz: 2, type: 'solid' },
      { x: 15, y: 5, z: 3, sx: 6, sy: 10, sz: 4, type: 'solid' }
    ]
  }
};

router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    presets: Object.keys(presets).map(key => ({
      id: key,
      name: presets[key].name
    }))
  });
});

router.get('/:presetId', (req, res) => {
  try {
    const { presetId } = req.params;
    const preset = presets[presetId];
    
    if (!preset) {
      return res.status(404).json({ success: false, error: 'Preset not found' });
    }
    
    res.json({ success: true, preset });
  } catch (error) {
    console.error('Preset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
