export function getStressColor(stressRatio, alpha = 1) {
  const clampedRatio = Math.max(0, Math.min(1, stressRatio))

  let r, g, b

  if (clampedRatio < 0.16) {
    const t = clampedRatio / 0.16
    r = 0
    g = 1.0
    b = 0
  } else if (clampedRatio < 0.33) {
    const t = (clampedRatio - 0.16) / 0.17
    r = 0.25 * t
    g = 1.0
    b = 0
  } else if (clampedRatio < 0.5) {
    const t = (clampedRatio - 0.33) / 0.17
    r = 0.25 + 0.75 * t
    g = 1.0
    b = 0
  } else if (clampedRatio < 0.66) {
    const t = (clampedRatio - 0.5) / 0.16
    r = 1.0
    g = 1.0 - 0.5 * t
    b = 0
  } else if (clampedRatio < 0.83) {
    const t = (clampedRatio - 0.66) / 0.17
    r = 1.0
    g = 0.5 - 0.5 * t
    b = 0
  } else {
    const t = (clampedRatio - 0.83) / 0.17
    r = 1.0 - 0.47 * t
    g = 0
    b = t
  }

  return [r, g, b]
}

export function getStressColorHex(stressRatio) {
  const [r, g, b] = getStressColor(stressRatio)
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

export function getStressGradient() {
  return [
    { ratio: 0, color: '#00ff00', label: '安全' },
    { ratio: 0.33, color: '#ffff00', label: '中等' },
    { ratio: 0.5, color: '#ff8800', label: '较高' },
    { ratio: 0.83, color: '#ff0000', label: '危险' },
    { ratio: 1, color: '#8800ff', label: '临界' }
  ]
}

export function getSafetyFactorColor(safetyFactor) {
  if (safetyFactor >= 3.0) return '#00ff00'
  if (safetyFactor >= 2.0) return '#88ff00'
  if (safetyFactor >= 1.5) return '#ffff00'
  if (safetyFactor >= 1.2) return '#ff8800'
  if (safetyFactor >= 1.0) return '#ff4400'
  return '#ff0000'
}

export function getSeverityColor(severity) {
  switch (severity) {
    case 'catastrophic': return '#ff0044'
    case 'critical': return '#ff4400'
    case 'high': return '#ff8800'
    case 'warning': return '#ffcc00'
    default: return '#00ff88'
  }
}

export function formatPressure(pressurePa) {
  if (pressurePa >= 1e6) {
    return `${(pressurePa / 1e6).toFixed(2)} MPa`
  } else if (pressurePa >= 1e3) {
    return `${(pressurePa / 1e3).toFixed(2)} kPa`
  }
  return `${pressurePa.toFixed(2)} Pa`
}

export function formatStress(stressPa) {
  if (stressPa >= 1e9) {
    return `${(stressPa / 1e9).toFixed(3)} GPa`
  } else if (stressPa >= 1e6) {
    return `${(stressPa / 1e6).toFixed(2)} MPa`
  }
  return `${(stressPa / 1e3).toFixed(2)} kPa`
}

export function formatDepth(depth) {
  if (depth >= 1000) {
    return `${(depth / 1000).toFixed(2)} km`
  }
  return `${depth.toFixed(0)} m`
}
