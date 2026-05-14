function calculateContactForce(warpDensity, weftTwist, displacement) {
  const baseForce = warpDensity * weftTwist * 0.01
  const contactForce = baseForce * Math.exp(displacement * 0.1)
  return contactForce
}

function calculateStressStrain(youngsModulus, strain) {
  const stress = youngsModulus * strain * (1 + 0.3 * strain * strain)
  return stress
}

function calculateBucklingMode(warpStiffness, weftStiffness, strain) {
  const stiffnessRatio = warpStiffness / weftStiffness
  const buckleAmplitude = 0.5 * Math.abs(stiffnessRatio - 1) * Math.sin(strain * Math.PI)
  return buckleAmplitude
}

function calculateStressConcentration(weavePattern, strain) {
  let concentrationFactor = 1.0
  switch (weavePattern) {
    case 'plain':
      concentrationFactor = 1.5 + 0.5 * Math.sin(strain * 10)
      break
    case 'twill':
      concentrationFactor = 1.3 + 0.3 * Math.sin(strain * 8)
      break
    case 'satin':
      concentrationFactor = 1.8 + 0.4 * Math.sin(strain * 12)
      break
    case 'multi_layer':
      concentrationFactor = 2.0 + 0.6 * Math.sin(strain * 6)
      break
  }
  return concentrationFactor
}

function calculatePoissonsRatio(strain, shear) {
  let poisson = 0.3 - 0.5 * Math.tanh(strain * 5)
  if (shear > 0.3) {
    poisson = -poisson * Math.min(1, (shear - 0.3) * 5)
  }
  return poisson
}

function calculateInterlayerSlip(layers, bendingStrain) {
  const slip = 0.1 * layers * bendingStrain * bendingStrain
  return slip
}

function simulateMechanics(config, loadParams) {
  const { warpDensity, weftTwist, weavePattern, layers, yarnProperties } = config
  const { loadType, maxDisplacement, steps = 50 } = loadParams

  const results = {
    contactForces: [],
    stressStrainCurve: [],
    buckleAmplitudes: [],
    stressConcentrations: [],
    poissonsRatios: [],
    interlayerSlips: []
  }

  const warpModulus = yarnProperties?.warp?.youngsModulus || 10
  const weftModulus = yarnProperties?.weft?.youngsModulus || 8

  for (let i = 0; i <= steps; i++) {
    const displacement = (i / steps) * maxDisplacement
    const strain = displacement / 100

    const contactForce = calculateContactForce(warpDensity, weftTwist, displacement)
    const stress = calculateStressStrain(warpModulus, strain)
    const buckle = calculateBucklingMode(warpModulus, weftModulus, strain)
    const stressConc = calculateStressConcentration(weavePattern, strain)
    const poisson = calculatePoissonsRatio(strain, loadType === 'shear' ? strain : 0)
    const slip = calculateInterlayerSlip(layers, strain)

    results.contactForces.push({ displacement, force: contactForce })
    results.stressStrainCurve.push({ strain, stress })
    results.buckleAmplitudes.push({ displacement, amplitude: buckle })
    results.stressConcentrations.push({ displacement, factor: stressConc })
    results.poissonsRatios.push({ strain, ratio: poisson })
    results.interlayerSlips.push({ displacement, slip })
  }

  return results
}

module.exports = { simulateMechanics }
