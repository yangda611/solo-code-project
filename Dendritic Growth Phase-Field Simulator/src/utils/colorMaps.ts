export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    case 5: return [v, p, q]
    default: return [0, 0, 0]
  }
}

export function phaseColorMap(phi: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (phi - 0.3) / 0.4))
  
  const liquidR = 0.05
  const liquidG = 0.1
  const liquidB = 0.3
  
  const solidR = 0.9
  const solidG = 0.8
  const solidB = 0.6
  
  return [
    liquidR + t * (solidR - liquidR),
    liquidG + t * (solidG - liquidG),
    liquidB + t * (solidB - liquidB)
  ]
}

export function concentrationColorMap(c: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, c))
  
  if (t < 0.5) {
    const nt = t * 2
    return [
      0.1 + nt * 0.1,
      0.2 + nt * 0.4,
      0.5 - nt * 0.1
    ]
  } else {
    const nt = (t - 0.5) * 2
    return [
      0.2 + nt * 0.7,
      0.6 - nt * 0.3,
      0.4 - nt * 0.2
    ]
  }
}

export function orientationColorMap(angle: number, phi: number): [number, number, number] {
  const h = (angle + Math.PI) / (2 * Math.PI)
  const s = 0.7
  const v = phi * 0.7 + 0.3
  return hsvToRgb(h, s, v)
}

export function curvatureColorMap(curvature: number, phi: number): [number, number, number] {
  const interfaceMask = Math.max(0, Math.min(1, (phi - 0.3) / 0.4))
  
  if (curvature < 0) {
    const t = Math.min(1, -curvature * 2)
    return [
      0.95 * (1 - interfaceMask) + (0.2 + t * 0.75) * interfaceMask,
      0.95 * (1 - interfaceMask) + (0.5 - t * 0.2) * interfaceMask,
      0.95 * (1 - interfaceMask) + (1.0 - t * 0.5) * interfaceMask
    ]
  } else {
    const t = Math.min(1, curvature * 2)
    return [
      0.95 * (1 - interfaceMask) + (1.0 - t * 0.5) * interfaceMask,
      0.95 * (1 - interfaceMask) + (0.95 - t * 0.65) * interfaceMask,
      0.95 * (1 - interfaceMask) + (0.95 - t * 0.75) * interfaceMask
    ]
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}
