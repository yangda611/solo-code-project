const presets = {
  'miura-ori': {
    name: 'Miura-ori 预设',
    panelThickness: 0.08,
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0.5, y: 1, z: 0 },
      { x: 1.5, y: 1, z: 0 },
      { x: 2.5, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 }
    ],
    edges: [
      { start: 0, end: 1, type: 'mountain' },
      { start: 1, end: 2, type: 'mountain' },
      { start: 3, end: 4, type: 'valley' },
      { start: 4, end: 5, type: 'valley' },
      { start: 6, end: 7, type: 'mountain' },
      { start: 7, end: 8, type: 'mountain' },
      { start: 0, end: 3, type: 'valley' },
      { start: 3, end: 6, type: 'valley' },
      { start: 1, end: 4, type: 'mountain' },
      { start: 4, end: 7, type: 'mountain' },
      { start: 2, end: 5, type: 'valley' },
      { start: 5, end: 8, type: 'valley' },
      { start: 0, end: 4, type: 'valley' },
      { start: 1, end: 3, type: 'mountain' },
      { start: 1, end: 7, type: 'valley' },
      { start: 4, end: 8, type: 'mountain' }
    ],
    faces: [
      { vertices: [0, 1, 4, 3] },
      { vertices: [1, 2, 5, 4] },
      { vertices: [3, 4, 7, 6] },
      { vertices: [4, 5, 8, 7] }
    ]
  },

  'waterbomb': {
    name: 'Waterbomb 预设',
    panelThickness: 0.1,
    vertices: [
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 }
    ],
    edges: [
      { start: 0, end: 1, type: 'valley' },
      { start: 1, end: 2, type: 'mountain' },
      { start: 2, end: 3, type: 'valley' },
      { start: 3, end: 4, type: 'mountain' },
      { start: 4, end: 5, type: 'valley' },
      { start: 5, end: 6, type: 'mountain' },
      { start: 6, end: 7, type: 'valley' },
      { start: 7, end: 8, type: 'mountain' },
      { start: 8, end: 1, type: 'valley' },
      { start: 0, end: 3, type: 'mountain' },
      { start: 0, end: 5, type: 'valley' },
      { start: 0, end: 7, type: 'mountain' }
    ],
    faces: [
      { vertices: [0, 1, 2, 3] },
      { vertices: [0, 3, 4, 5] },
      { vertices: [0, 5, 6, 7] },
      { vertices: [0, 7, 8, 1] }
    ]
  },

  'randlett-flasher': {
    name: 'Randlett flasher 预设',
    panelThickness: 0.06,
    vertices: [
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 1.5, z: 0 },
      { x: 0, y: 0.5, z: 0 },
      { x: 0.5, y: 0, z: 0 },
      { x: 1.5, y: 0, z: 0 },
      { x: 2, y: 0.5, z: 0 },
      { x: 2, y: 1.5, z: 0 },
      { x: 1.5, y: 2, z: 0 },
      { x: 0.5, y: 2, z: 0 }
    ],
    edges: [
      { start: 0, end: 1, type: 'mountain' },
      { start: 0, end: 2, type: 'valley' },
      { start: 0, end: 3, type: 'mountain' },
      { start: 0, end: 4, type: 'valley' },
      { start: 0, end: 5, type: 'mountain' },
      { start: 0, end: 6, type: 'valley' },
      { start: 0, end: 7, type: 'mountain' },
      { start: 0, end: 8, type: 'valley' },
      { start: 1, end: 8, type: 'mountain' },
      { start: 8, end: 7, type: 'valley' },
      { start: 7, end: 6, type: 'mountain' },
      { start: 6, end: 5, type: 'valley' },
      { start: 5, end: 4, type: 'mountain' },
      { start: 4, end: 3, type: 'valley' },
      { start: 3, end: 2, type: 'mountain' },
      { start: 2, end: 1, type: 'valley' }
    ],
    faces: [
      { vertices: [0, 1, 8] },
      { vertices: [0, 8, 7] },
      { vertices: [0, 7, 6] },
      { vertices: [0, 6, 5] },
      { vertices: [0, 5, 4] },
      { vertices: [0, 4, 3] },
      { vertices: [0, 3, 2] },
      { vertices: [0, 2, 1] }
    ]
  },

  'thick-panel': {
    name: '厚板兼容性预设',
    panelThickness: 0.25,
    vertices: [
      { x: 0, y: 0, z: 0 },
      { x: 1.2, y: 0, z: 0 },
      { x: 2.4, y: 0, z: 0 },
      { x: 0.6, y: 1, z: 0 },
      { x: 1.8, y: 1, z: 0 },
      { x: 3.0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1.2, y: 2, z: 0 },
      { x: 2.4, y: 2, z: 0 }
    ],
    edges: [
      { start: 0, end: 1, type: 'mountain' },
      { start: 1, end: 2, type: 'valley' },
      { start: 3, end: 4, type: 'mountain' },
      { start: 4, end: 5, type: 'valley' },
      { start: 6, end: 7, type: 'mountain' },
      { start: 7, end: 8, type: 'valley' },
      { start: 0, end: 3, type: 'valley' },
      { start: 3, end: 6, type: 'mountain' },
      { start: 1, end: 4, type: 'valley' },
      { start: 4, end: 7, type: 'mountain' },
      { start: 2, end: 5, type: 'valley' },
      { start: 5, end: 8, type: 'mountain' },
      { start: 0, end: 4, type: 'valley' },
      { start: 1, end: 3, type: 'mountain' },
      { start: 1, end: 7, type: 'valley' },
      { start: 4, end: 8, type: 'mountain' }
    ],
    faces: [
      { vertices: [0, 1, 4, 3] },
      { vertices: [1, 2, 5, 4] },
      { vertices: [3, 4, 7, 6] },
      { vertices: [4, 5, 8, 7] }
    ]
  }
};

module.exports = presets;
