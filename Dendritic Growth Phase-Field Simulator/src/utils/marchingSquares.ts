const EDGE_TABLE = [
  0, 8, 4, 12,
  2, 10, 6, 14,
  1, 9, 5, 13,
  3, 11, 7, 15
]

const LINE_TABLE: number[][][] = [
  [],
  [[0, 3]],
  [[0, 1]],
  [[1, 3]],
  [[1, 2]],
  [[0, 1], [2, 3]],
  [[0, 2]],
  [[2, 3]],
  [[2, 3]],
  [[0, 2]],
  [[0, 3], [1, 2]],
  [[1, 2]],
  [[1, 3]],
  [[0, 1]],
  [[0, 3]],
  []
]

function interpolateEdge(
  data: Float32Array,
  width: number,
  x: number,
  y: number,
  edge: number,
  threshold: number,
  step: number = 1
): [number, number] {
  const idx = y * width + x
  
  switch (edge) {
    case 0: {
      const v1 = data[idx]
      const v2 = data[(y + step) * width + x]
      const t = (v2 - v1) !== 0 ? (threshold - v1) / (v2 - v1) : 0.5
      return [x / step, y / step + t]
    }
    case 1: {
      const v1 = data[idx]
      const v2 = data[y * width + x + step]
      const t = (v2 - v1) !== 0 ? (threshold - v1) / (v2 - v1) : 0.5
      return [x / step + t, y / step]
    }
    case 2: {
      const v1 = data[y * width + x + step]
      const v2 = data[(y + step) * width + x + step]
      const t = (v2 - v1) !== 0 ? (threshold - v1) / (v2 - v1) : 0.5
      return [x / step + 1, y / step + t]
    }
    case 3: {
      const v1 = data[(y + step) * width + x]
      const v2 = data[(y + step) * width + x + step]
      const t = (v2 - v1) !== 0 ? (threshold - v1) / (v2 - v1) : 0.5
      return [x / step + t, y / step + 1]
    }
    default:
      return [x / step, y / step]
  }
}

export function marchingSquares(
  data: Float32Array,
  width: number,
  height: number,
  threshold: number = 0.5,
  downsample: number = 1
): Array<Array<[number, number]>> {
  const contours: Array<Array<[number, number]>> = []
  
  for (let y = 0; y < height - downsample; y += downsample) {
    for (let x = 0; x < width - downsample; x += downsample) {
      let squareIndex = 0
      
      if (data[y * width + x] > threshold) squareIndex |= 1
      if (data[y * width + x + downsample] > threshold) squareIndex |= 2
      if (data[(y + downsample) * width + x + downsample] > threshold) squareIndex |= 4
      if (data[(y + downsample) * width + x] > threshold) squareIndex |= 8

      if (squareIndex === 0 || squareIndex === 15) continue

      const lines = LINE_TABLE[squareIndex]
      
      for (const line of lines) {
        const contour: Array<[number, number]> = []
        
        for (const edge of line) {
          const point = interpolateEdge(data, width, x, y, edge, threshold, downsample)
          contour.push([point[0], point[1]])
        }
        
        if (contour.length > 0) {
          contours.push(contour)
        }
      }
    }
  }

  return contours
}

export function findGrowthTips(
  phaseData: Float32Array,
  width: number,
  height: number,
  prevPhaseData: Float32Array | null,
  downsample: number = 1,
  threshold: number = 0.5
): Array<{ x: number; y: number; vx: number; vy: number; speed: number }> {
  const tips: Array<{ x: number; y: number; vx: number; vy: number; speed: number }> = []
  const visited = new Set<string>()
  const step = downsample * 2

  for (let y = step * 2; y < height - step * 2; y += step) {
    for (let x = step * 2; x < width - step * 2; x += step) {
      const idx = y * width + x
      
      if (phaseData[idx] < threshold || phaseData[idx] > threshold + 0.2) continue

      let solidCount = 0
      for (let dy = -step; dy <= step; dy += step) {
        for (let dx = -step; dx <= step; dx += step) {
          if (phaseData[(y + dy) * width + x + dx] > threshold) {
            solidCount++
          }
        }
      }

      if (solidCount >= 3 && solidCount <= 6) {
        let gradX = 0
        let gradY = 0
        
        for (let dy = -step; dy <= step; dy += step) {
          for (let dx = -step; dx <= step; dx += step) {
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 0.1) {
              const val = phaseData[(y + dy) * width + x + dx]
              gradX += val * dx / dist
              gradY += val * dy / dist
            }
          }
        }

        const mag = Math.sqrt(gradX * gradX + gradY * gradY)
        if (mag > 0.1) {
          gradX /= mag
          gradY /= mag

          let vx = 0
          let vy = 0
          let speed = 0

          if (prevPhaseData) {
            const delta = phaseData[idx] - prevPhaseData[idx]
            speed = Math.abs(delta) * 100
            vx = gradX * speed
            vy = gradY * speed
          }

          const key = `${Math.floor(x / 8 / downsample)},${Math.floor(y / 8 / downsample)}`
          if (!visited.has(key)) {
            visited.add(key)
            tips.push({ x: x / step, y: y / step, vx, vy, speed })
          }
        }
      }
    }
  }

  return tips
}

export function detectNumericalArtifacts(
  phaseData: Float32Array,
  width: number,
  height: number,
  params: { undercooling: number; noiseAmplitude: number; interfaceThickness: number }
): {
  gridLocking: boolean
  speedUnderestimation: boolean
  denseSidebranches: boolean
  wavelengthFreezing: boolean
} {
  let gridLocking = false
  let speedUnderestimation = false
  let denseSidebranches = false
  let wavelengthFreezing = false

  let axisGrowthCount = 0
  let diagonalGrowthCount = 0

  const centerX = width / 2
  const centerY = height / 2

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2
    for (let r = 10; r < Math.min(width, height) / 2 - 10; r++) {
      const x = Math.floor(centerX + Math.cos(angle) * r)
      const y = Math.floor(centerY + Math.sin(angle) * r)
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (phaseData[y * width + x] > 0.5) {
          const angleDeg = (angle * 180 / Math.PI) % 90
          if (angleDeg < 10 || angleDeg > 80 || (angleDeg > 35 && angleDeg < 55)) {
            axisGrowthCount++
          } else {
            diagonalGrowthCount++
          }
          break
        }
      }
    }
  }

  if (axisGrowthCount > diagonalGrowthCount * 2) {
    gridLocking = true
  }

  if (params.interfaceThickness > 5 && params.undercooling > 0.3) {
    speedUnderestimation = true
  }

  if (params.noiseAmplitude > 0.03) {
    denseSidebranches = true
  }

  if (params.undercooling > 0.6) {
    wavelengthFreezing = true
  }

  return { gridLocking, speedUnderestimation, denseSidebranches, wavelengthFreezing }
}
