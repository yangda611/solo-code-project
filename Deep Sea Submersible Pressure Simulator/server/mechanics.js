const math = require('mathjs');

const SEA_WATER_DENSITY = 1025;
const GRAVITY = 9.81;
const ATMOSPHERIC_PRESSURE = 101325;

function calculateExternalPressure(depth) {
  return ATMOSPHERIC_PRESSURE + SEA_WATER_DENSITY * GRAVITY * depth;
}

function calculateHoopStress(outerRadius, innerRadius, externalPressure) {
  const r2 = outerRadius;
  const r1 = innerRadius;
  const p = externalPressure;

  const hoopStress = p * (r2 ** 2 + r1 ** 2) / (r2 ** 2 - r1 ** 2);

  return hoopStress;
}

function calculateLongitudinalStress(outerRadius, innerRadius, externalPressure, length, endCapType = 'hemispherical') {
  const r2 = outerRadius;
  const r1 = innerRadius;
  const p = externalPressure;

  let longitudinalStress;

  switch (endCapType) {
    case 'hemispherical':
    case 'spherical':
      longitudinalStress = p * (r1 ** 2) / (r2 ** 2 - r1 ** 2) * 0.5;
      break;
    case 'ellipsoidal':
      const b = r1 * 0.75;
      const k = 1 / 6 * (2 + r1 / b);
      longitudinalStress = p * r1 * k / (2 * (r2 - r1));
      break;
    case 'flat':
      longitudinalStress = p * r1 ** 2 / (r2 ** 2 - r1 ** 2);
      break;
    default:
      longitudinalStress = p * r1 ** 2 / (r2 ** 2 - r1 ** 2) * 0.5;
  }

  return longitudinalStress;
}

function calculateRadialStress(outerRadius, innerRadius, externalPressure, atPosition = 'outer') {
  const r2 = outerRadius;
  const r1 = innerRadius;
  const p = externalPressure;

  if (atPosition === 'outer') {
    return -p;
  } else if (atPosition === 'inner') {
    return 0;
  }

  const r = atPosition;
  return -p * (r2 ** 2 * (r ** 2 - r1 ** 2)) / (r ** 2 * (r2 ** 2 - r1 ** 2));
}

function calculateVonMisesStress(hoopStress, longitudinalStress, radialStress) {
  const sigmaH = hoopStress;
  const sigmaL = longitudinalStress;
  const sigmaR = radialStress;

  return Math.sqrt(
    0.5 * (
      Math.pow(sigmaH - sigmaL, 2) +
      Math.pow(sigmaL - sigmaR, 2) +
      Math.pow(sigmaR - sigmaH, 2)
    )
  );
}

function calculateStressConcentrationFactor(windowDiameter, outerRadius, thickness, weldQuality = 'class_a') {
  const d = windowDiameter;
  const R = outerRadius;
  const t = thickness;

  const baseSCF = 3.0 * (1 + Math.sqrt(d / (4 * t)));

  let weldFactor = 1.0;
  switch (weldQuality) {
    case 'class_aa':
      weldFactor = 1.1;
      break;
    case 'class_a':
      weldFactor = 1.3;
      break;
    case 'class_b':
      weldFactor = 1.6;
      break;
    case 'class_c':
      weldFactor = 2.0;
      break;
  }

  const curvatureFactor = 1 + 0.3 * (d / (2 * R));

  return baseSCF * weldFactor * curvatureFactor;
}

function calculateDeformation(outerRadius, innerRadius, externalPressure, youngsModulus, poissonRatio) {
  const r2 = outerRadius;
  const r1 = innerRadius;
  const p = externalPressure;
  const E = youngsModulus;
  const nu = poissonRatio;

  const radialDeformation = (p * r2 * (1 - nu) / E) * (
    (r2 ** 2 + r1 ** 2) / (r2 ** 2 - r1 ** 2) + nu / (1 - nu)
  );

  const hoopStrain = radialDeformation / r2;
  const longitudinalStrain = (p * r1 ** 2 * (1 - 2 * nu)) / (E * (r2 ** 2 - r1 ** 2));
  const longitudinalDeformation = longitudinalStrain * (r2 * 4);

  return {
    radial: Math.abs(radialDeformation),
    longitudinal: Math.abs(longitudinalDeformation),
    hoopStrain,
    longitudinalStrain
  };
}

function calculateBucklingPressure(outerRadius, innerRadius, length, youngsModulus, poissonRatio, ribCount, ribHeight) {
  const r = outerRadius;
  const t = outerRadius - innerRadius;
  const L = length;
  const E = youngsModulus;
  const nu = poissonRatio;

  const effectiveRibHeight = ribHeight || 0;
  const effectiveThickness = t + effectiveRibHeight * 0.5;
  const k = 2 * (Math.pow(L / (Math.PI * r), 1.5));

  let criticalBucklingPressure = (2 * E * Math.pow(effectiveThickness / r, 3)) /
    (3 * (1 - nu ** 2)) * Math.sqrt(k);

  if (ribCount > 0) {
    const ribSpacing = L / (ribCount + 1);
    const ribReduction = 0.15 * Math.min(ribCount, 10);
    criticalBucklingPressure *= (1 + ribReduction);
  }

  return criticalBucklingPressure;
}

function calculateBurstPressure(outerRadius, innerRadius, yieldStrength) {
  const r2 = outerRadius;
  const r1 = innerRadius;
  const sigmaY = yieldStrength;

  const burstPressure = (2 * sigmaY / Math.sqrt(3)) *
    Math.log(r2 / r1) *
    (1 - r1 ** 2 / r2 ** 2);

  return Math.max(0, burstPressure);
}

function calculateFatigueLife(stressAmplitude, meanStress, materialProperties, stressConcentrationFactor = 1.0) {
  const sigmaA = stressAmplitude * stressConcentrationFactor;
  const sigmaM = meanStress;
  const sigmaUlt = materialProperties.ultimate_strength;
  const sigmaY = materialProperties.yield_strength;
  const fatigueCoeff = materialProperties.fatigue_coefficient;
  const fatigueExp = materialProperties.fatigue_exponent;

  const goodmanCorrectedStress = sigmaA / (1 - sigmaM / sigmaUlt);

  if (goodmanCorrectedStress <= 0) {
    return Infinity;
  }

  const cycles = Math.pow(
    fatigueCoeff / goodmanCorrectedStress,
    1 / Math.abs(fatigueExp)
  );

  const fatigueLimit = 0.4 * sigmaY;
  if (goodmanCorrectedStress < fatigueLimit) {
    return Infinity;
  }

  return cycles;
}

function calculateSafetyFactor(vonMisesStress, yieldStrength, temperature = 273.15, ductileBrittleTransition = 153) {
  const deltaT = ductileBrittleTransition - temperature;
  let temperatureFactor = 1.0;

  if (temperature < ductileBrittleTransition) {
    temperatureFactor = 1 - 0.005 * Math.max(0, deltaT);
    temperatureFactor = Math.max(0.5, temperatureFactor);
  }

  const effectiveYieldStrength = yieldStrength * temperatureFactor;
  const safetyFactor = effectiveYieldStrength / vonMisesStress;

  return {
    safetyFactor,
    temperatureFactor,
    effectiveYieldStrength,
    isBrittleTransition: temperature < ductileBrittleTransition
  };
}

function evaluateFailureMode(safetyFactor, externalPressure, bucklingPressure, burstPressure,
                              stressConcentrationFactor, maxHoopStress, yieldStrength) {
  const failureModes = [];

  if (safetyFactor < 1.0) {
    failureModes.push({
      type: 'yielding',
      severity: 'critical',
      description: '超过屈服极限，发生塑性变形'
    });
  } else if (safetyFactor < 1.5) {
    failureModes.push({
      type: 'yielding_risk',
      severity: 'warning',
      description: '安全系数偏低，屈服风险较高'
    });
  }

  if (externalPressure > bucklingPressure) {
    failureModes.push({
      type: 'buckling',
      severity: 'catastrophic',
      description: '超过临界屈曲压力，舱体失稳'
    });
  } else if (externalPressure > bucklingPressure * 0.7) {
    failureModes.push({
      type: 'buckling_risk',
      severity: 'warning',
      description: '接近临界屈曲压力'
    });
  }

  if (externalPressure > burstPressure) {
    failureModes.push({
      type: 'burst',
      severity: 'catastrophic',
      description: '超过爆破压力，舱体爆裂'
    });
  }

  if (stressConcentrationFactor > 4.0) {
    failureModes.push({
      type: 'stress_concentration',
      severity: 'high',
      description: '观察窗边缘应力集中系数超标'
    });
  }

  if (maxHoopStress > yieldStrength * 0.9) {
    failureModes.push({
      type: 'hoop_failure',
      severity: 'critical',
      description: '环向应力接近极限'
    });
  }

  return failureModes;
}

function generateStressGrid(outerRadius, innerRadius, length, externalPressure,
                            youngsModulus, poissonRatio, gridResolution = 20) {
  const grid = [];

  for (let i = 0; i <= gridResolution; i++) {
    for (let j = 0; j <= gridResolution; j++) {
      for (let k = 0; k <= gridResolution / 2; k++) {
        const r = innerRadius + (outerRadius - innerRadius) * (k / (gridResolution / 2));
        const theta = 2 * Math.PI * (i / gridResolution);
        const z = -length / 2 + length * (j / gridResolution);

        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        const hoopStress = calculateHoopStress(outerRadius, innerRadius, externalPressure);
        const longitudinalStress = calculateLongitudinalStress(outerRadius, innerRadius, externalPressure, length);
        const radialStress = calculateRadialStress(outerRadius, innerRadius, externalPressure, r);

        const vonMises = calculateVonMisesStress(hoopStress, longitudinalStress, radialStress);

        grid.push({
          position: { x, y, z },
          r, theta, z,
          hoopStress,
          longitudinalStress,
          radialStress,
          vonMisesStress: vonMises
        });
      }
    }
  }

  return grid;
}

function analyzeStructure(designParams, depth, temperature = 273.15) {
  const {
    outerRadius, innerRadius, length, windowDiameter, windowCount,
    ribCount, ribHeight, weldQuality, material
  } = designParams;

  const externalPressure = calculateExternalPressure(depth);

  const hoopStress = calculateHoopStress(outerRadius, innerRadius, externalPressure);
  const longitudinalStress = calculateLongitudinalStress(outerRadius, innerRadius, externalPressure, length, designParams.endCapType);
  const radialStress = calculateRadialStress(outerRadius, innerRadius, externalPressure, 'inner');

  const vonMisesStress = calculateVonMisesStress(hoopStress, longitudinalStress, radialStress);

  const scf = calculateStressConcentrationFactor(windowDiameter, outerRadius, outerRadius - innerRadius, weldQuality);

  const maxHoopStress = hoopStress * scf;
  const maxVonMises = vonMisesStress * scf;

  const deformation = calculateDeformation(
    outerRadius, innerRadius, externalPressure,
    material.youngs_modulus, material.poisson_ratio
  );

  const bucklingPressure = calculateBucklingPressure(
    outerRadius, innerRadius, length,
    material.youngs_modulus, material.poisson_ratio,
    ribCount, ribHeight
  );

  const burstPressure = calculateBurstPressure(outerRadius, innerRadius, material.yield_strength);

  const safetyAnalysis = calculateSafetyFactor(
    maxVonMises, material.yield_strength,
    temperature, material.ductile_brittle_transition
  );

  const stressAmplitude = maxVonMises * 0.5;
  const meanStress = maxVonMises * 0.5;
  const fatigueLife = calculateFatigueLife(
    stressAmplitude, meanStress, material, scf
  );

  const failureModes = evaluateFailureMode(
    safetyAnalysis.safetyFactor,
    externalPressure,
    bucklingPressure,
    burstPressure,
    scf,
    maxHoopStress,
    material.yield_strength
  );

  const stressGrid = generateStressGrid(
    outerRadius, innerRadius, length, externalPressure,
    material.youngs_modulus, material.poisson_ratio
  );

  return {
    depth,
    externalPressure,
    temperature,
    hoopStress,
    longitudinalStress,
    radialStress,
    maxHoopStress,
    maxLongitudinalStress: longitudinalStress * scf,
    maxRadialStress: radialStress,
    maxVonMisesStress: maxVonMises,
    stressConcentrationFactor: scf,
    deformation,
    bucklingPressure,
    burstPressure,
    safetyFactor: safetyAnalysis.safetyFactor,
    temperatureFactor: safetyAnalysis.temperatureFactor,
    effectiveYieldStrength: safetyAnalysis.effectiveYieldStrength,
    isBrittleTransition: safetyAnalysis.isBrittleTransition,
    fatigueLife,
    failureModes,
    stressGrid,
    yieldStrength: material.yield_strength,
    ultimateStrength: material.ultimate_strength
  };
}

module.exports = {
  calculateExternalPressure,
  calculateHoopStress,
  calculateLongitudinalStress,
  calculateRadialStress,
  calculateVonMisesStress,
  calculateStressConcentrationFactor,
  calculateDeformation,
  calculateBucklingPressure,
  calculateBurstPressure,
  calculateFatigueLife,
  calculateSafetyFactor,
  evaluateFailureMode,
  analyzeStructure
};
