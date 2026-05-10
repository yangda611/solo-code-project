import * as math from 'mathjs';

const TOOL_DAMAGE = {
  air_chisel: { erosion_rate: 0.15, coordinate_error_rate: 0.02 },
  brush: { erosion_rate: 0.01, coordinate_error_rate: 0.001 },
  chemical: { erosion_rate: 0.03, coordinate_error_rate: 0.005 }
};

const JOINT_CONSTRAINTS = {
  hinge: {
    min_angle: [-90, -5, -5],
    max_angle: [90, 5, 5]
  },
  ball: {
    min_angle: [-120, -120, -120],
    max_angle: [120, 120, 120]
  },
  fixed: {
    min_angle: [-5, -5, -5],
    max_angle: [5, 5, 5]
  }
};

const WEATHERING_RATES = {
  normal: 0.001,
  accelerated: 0.01,
  rapid: 0.05
};

function calculateBoneMatch(fragment1, fragment2) {
  const typeScore = calculateTypeCompatibility(fragment1.bone_type, fragment2.bone_type);
  
  const dist1 = [fragment1.position_x, fragment1.position_y, fragment1.position_z];
  const dist2 = [fragment2.position_x, fragment2.position_y, fragment2.position_z];
  const distance = math.distance(dist1, dist2);
  const distanceScore = Math.max(0, 1 - distance / 5);
  
  const rot1 = [fragment1.rotation_x, fragment1.rotation_y, fragment1.rotation_z];
  const rot2 = [fragment2.rotation_x, fragment2.rotation_y, fragment2.rotation_z];
  const rotDiff = math.distance(
    rot1.map(r => r * Math.PI / 180),
    rot2.map(r => r * Math.PI / 180)
  );
  const rotationScore = Math.max(0, 1 - rotDiff / Math.PI);
  
  const orientationScore = calculateOrientationMatch(fragment1, fragment2);
  
  const confidence = typeScore * 0.3 + distanceScore * 0.3 + rotationScore * 0.2 + orientationScore * 0.2;
  
  return {
    confidence,
    typeScore,
    distanceScore,
    rotationScore,
    orientationScore,
    distance,
    angleDifference: rotDiff
  };
}

function calculateTypeCompatibility(type1, type2) {
  const compatibility = {
    'skull': { 'vertebra': 0.8, 'skull': 0.1 },
    'vertebra': { 'vertebra': 0.9, 'skull': 0.8, 'pelvis': 0.7, 'rib': 0.6 },
    'limb': { 'vertebra': 0.5, 'pelvis': 0.6, 'limb': 0.4 },
    'pelvis': { 'vertebra': 0.7, 'limb': 0.6 },
    'rib': { 'vertebra': 0.6, 'rib': 0.5 },
    'tooth': { 'skull': 0.9, 'jaw': 0.8 },
    'tusk': { 'skull': 0.9 }
  };
  
  if (type1 === type2 && type1 !== 'vertebra' && type1 !== 'rib' && type1 !== 'tooth') {
    return 0.1;
  }
  
  const pair1 = compatibility[type1]?.[type2] || 0.3;
  const pair2 = compatibility[type2]?.[type1] || 0.3;
  
  return Math.max(pair1, pair2);
}

function calculateOrientationMatch(fragment1, fragment2) {
  const forward1 = rotateVector([0, 0, 1], [
    fragment1.rotation_x, fragment1.rotation_y, fragment1.rotation_z
  ]);
  const forward2 = rotateVector([0, 0, 1], [
    fragment2.rotation_x, fragment2.rotation_y, fragment2.rotation_z
  ]);
  
  const dot = math.dot(forward1, forward2);
  const similarity = Math.abs(dot);
  
  return similarity;
}

function rotateVector(vector, angles) {
  const [x, y, z] = vector;
  const [rx, ry, rz] = angles.map(a => a * Math.PI / 180);
  
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  
  let vx = x, vy = y, vz = z;
  
  vx = vx * cy + vz * sy;
  vz = -vx * sy + vz * cy;
  
  vy = vy * cx - vz * sx;
  vz = vy * sx + vz * cx;
  
  const temp = vx;
  vx = vx * cz - vy * sz;
  vy = temp * sz + vy * cz;
  
  return [vx, vy, vz];
}

function estimateJointAngles(fragment1, fragment2, jointType = 'ball') {
  const pos1 = [fragment1.position_x, fragment1.position_y, fragment1.position_z];
  const pos2 = [fragment2.position_x, fragment2.position_y, fragment2.position_z];
  
  const direction = math.subtract(pos2, pos1);
  const dist = math.norm(direction);
  const normalized = dist > 0 ? math.divide(direction, dist) : [0, 0, 1];
  
  const pitch = Math.atan2(normalized[1], Math.sqrt(normalized[0]**2 + normalized[2]**2)) * 180 / Math.PI;
  const yaw = Math.atan2(normalized[0], normalized[2]) * 180 / Math.PI;
  const roll = (fragment1.rotation_z + fragment2.rotation_z) / 2;
  
  const angles = [pitch, yaw, roll];
  
  return constrainJointAngles(angles, jointType);
}

function constrainJointAngles(angles, jointType) {
  const constraints = JOINT_CONSTRAINTS[jointType] || JOINT_CONSTRAINTS.ball;
  
  return angles.map((angle, i) => {
    return Math.max(
      constraints.min_angle[i],
      Math.min(constraints.max_angle[i], angle)
    );
  });
}

function validateBiomechanics(topology, fragments) {
  const results = {
    valid: true,
    issues: [],
    validJoints: []
  };
  
  const fragmentMap = {};
  for (const f of fragments) {
    fragmentMap[f.bone_type] = f;
    fragmentMap[f.name] = f;
  }
  
  for (const joint of topology) {
    if (!joint.parent_bone) continue;
    
    const childFragment = fragmentMap[joint.bone_name] || fragmentMap[joint.bone_name.toLowerCase()];
    const parentFragment = fragmentMap[joint.parent_bone] || fragmentMap[joint.parent_bone.toLowerCase()];
    
    if (!childFragment || !parentFragment) {
      results.issues.push(`无法找到骨骼: ${joint.bone_name} 或 ${joint.parent_bone}`);
      continue;
    }
    
    const jointCheck = checkJointValidity(
      childFragment,
      parentFragment,
      joint.joint_type,
      [joint.joint_angle_x, joint.joint_angle_y, joint.joint_angle_z]
    );
    
    if (!jointCheck.valid) {
      results.valid = false;
      results.issues.push(`关节 ${joint.bone_name} -> ${joint.parent_bone} 不合理: ${jointCheck.reason}`);
    } else {
      results.validJoints.push(joint.bone_name);
    }
    
    const mechanicsCheck = checkBiomechanicalLogic(
      childFragment,
      parentFragment,
      [joint.joint_angle_x, joint.joint_angle_y, joint.joint_angle_z]
    );
    
    if (!mechanicsCheck.valid) {
      results.valid = false;
      results.issues.push(`关节 ${joint.bone_name} 生物力学不合理: ${mechanicsCheck.reason}`);
    }
  }
  
  return results;
}

function checkJointValidity(child, parent, jointType, angles) {
  const constraints = JOINT_CONSTRAINTS[jointType] || JOINT_CONSTRAINTS.ball;
  
  for (let i = 0; i < 3; i++) {
    if (angles[i] < constraints.min_angle[i] || angles[i] > constraints.max_angle[i]) {
      return {
        valid: false,
        reason: `角度 ${['俯仰', '偏航', '翻滚'][i]} (${angles[i].toFixed(1)}°) 超出关节类型 ${jointType} 的限制范围`
      };
    }
  }
  
  return { valid: true };
}

function checkBiomechanicalLogic(child, parent, angles) {
  const [pitch, yaw, roll] = angles;
  
  if (child.bone_type === 'skull' || parent.bone_type === 'skull') {
    if (pitch < -60 || pitch > 80) {
      return { valid: false, reason: '头骨俯仰角度超出自然范围' };
    }
  }
  
  if (child.bone_type === 'limb' || parent.bone_type === 'limb') {
    if (Math.abs(pitch) > 160) {
      return { valid: false, reason: '肢体关节弯曲角度超出生物力学可能范围' };
    }
  }
  
  if (child.bone_type === 'vertebra' || parent.bone_type === 'vertebra') {
    if (Math.abs(yaw) > 45 || Math.abs(roll) > 30) {
      return { valid: false, reason: '脊椎关节旋转角度超出自然运动范围' };
    }
  }
  
  return { valid: true };
}

function applyToolDamage(fragment, toolType, intensity) {
  const tool = TOOL_DAMAGE[toolType] || TOOL_DAMAGE.brush;
  
  const erosionIncrease = tool.erosion_rate * intensity;
  const newErosion = Math.min(1, (fragment.erosion_level || 0) + erosionIncrease);
  
  const errorIncrease = tool.coordinate_error_rate * intensity;
  const newError = {
    x: (fragment.coordinate_error_x || 0) + (Math.random() - 0.5) * 2 * errorIncrease,
    y: (fragment.coordinate_error_y || 0) + (Math.random() - 0.5) * 2 * errorIncrease,
    z: (fragment.coordinate_error_z || 0) + (Math.random() - 0.5) * 2 * errorIncrease
  };
  
  return {
    erosion_level: newErosion,
    coordinate_error_x: newError.x,
    coordinate_error_y: newError.y,
    coordinate_error_z: newError.z,
    damaged: newErosion > 0.5
  };
}

function applyWeathering(fragment, timeExposed, accelerationFactor = 1) {
  const baseRate = timeExposed < 10 ? WEATHERING_RATES.normal :
                   timeExposed < 100 ? WEATHERING_RATES.accelerated :
                   WEATHERING_RATES.rapid;
  
  const weatheringIncrease = baseRate * timeExposed * accelerationFactor;
  const newWeathering = Math.min(1, (fragment.weathering_level || 0) + weatheringIncrease);
  
  return {
    weathering_level: newWeathering,
    crumbling: newWeathering > 0.7,
    fragile: newWeathering > 0.4
  };
}

function calculateStratigraphicError(layers, discoveredLayer, trueLayer) {
  if (discoveredLayer === trueLayer) {
    return { error: 0, message: '层位判断正确' };
  }
  
  const layerDiff = Math.abs(discoveredLayer - trueLayer);
  const ageDiff = Math.abs(layers[discoveredLayer]?.age - layers[trueLayer]?.age);
  
  const severity = layerDiff <= 1 ? '轻微' : layerDiff <= 3 ? '中等' : '严重';
  
  return {
    error: layerDiff,
    ageError: ageDiff,
    severity,
    message: `层位划分错误: 相差 ${layerDiff} 层, 年代偏差约 ${ageDiff} 百万年 (${severity})`
  };
}

function calculateTectonicBias(fragments, tiltAngle = 5) {
  const rad = tiltAngle * Math.PI / 180;
  const tiltMatrix = [
    [Math.cos(rad), 0, Math.sin(rad)],
    [0, 1, 0],
    [-Math.sin(rad), 0, Math.cos(rad)]
  ];
  
  const biasedFragments = fragments.map(f => {
    const originalPos = [f.position_x, f.position_y, f.position_z];
    const biasedPos = math.multiply(tiltMatrix, originalPos);
    
    return {
      ...f,
      systematic_bias_x: biasedPos[0] - originalPos[0],
      systematic_bias_y: biasedPos[1] - originalPos[1],
      systematic_bias_z: biasedPos[2] - originalPos[2]
    };
  });
  
  const totalBias = biasedFragments.reduce((acc, f) => ({
    x: acc.x + Math.abs(f.systematic_bias_x),
    y: acc.y + Math.abs(f.systematic_bias_y),
    z: acc.z + Math.abs(f.systematic_bias_z)
  }), { x: 0, y: 0, z: 0 });
  
  return {
    tiltAngle,
    fragments: biasedFragments,
    averageBias: {
      x: totalBias.x / fragments.length,
      y: totalBias.y / fragments.length,
      z: totalBias.z / fragments.length
    },
    message: `地层倾斜 ${tiltAngle}° 导致所有碎片坐标产生系统性偏移`
  };
}

function analyzeFragmentationPattern(fragments) {
  const analysis = {
    totalFragments: fragments.length,
    boneTypes: {},
    fragmentationPattern: null,
    quality: {
      overall: 0,
      erosion: 0,
      weathering: 0
    }
  };
  
  for (const f of fragments) {
    analysis.boneTypes[f.bone_type] = (analysis.boneTypes[f.bone_type] || 0) + 1;
  }
  
  const vertebraCount = analysis.boneTypes['vertebra'] || 0;
  const limbCount = analysis.boneTypes['limb'] || 0;
  const otherCount = fragments.length - vertebraCount - limbCount;
  
  if (vertebraCount > limbCount + otherCount) {
    analysis.fragmentationPattern = '轴向骨骼为主 - 可能是搬运沉积环境';
  } else if (limbCount > vertebraCount) {
    analysis.fragmentationPattern = '附肢骨骼为主 - 可能是原地埋葬';
  } else {
    analysis.fragmentationPattern = '混合破碎模式 - 复杂沉积历史';
  }
  
  const avgErosion = fragments.reduce((sum, f) => sum + (f.erosion_level || 0), 0) / fragments.length;
  const avgWeathering = fragments.reduce((sum, f) => sum + (f.weathering_level || 0), 0) / fragments.length;
  
  analysis.quality = {
    erosion: avgErosion,
    weathering: avgWeathering,
    overall: 1 - (avgErosion * 0.5 + avgWeathering * 0.5)
  };
  
  return analysis;
}

function matchAllFragments(fragments) {
  const matches = [];
  
  for (let i = 0; i < fragments.length; i++) {
    for (let j = i + 1; j < fragments.length; j++) {
      const match = calculateBoneMatch(fragments[i], fragments[j]);
      if (match.confidence > 0.4) {
        const jointAngles = estimateJointAngles(
          fragments[i],
          fragments[j],
          inferJointType(fragments[i].bone_type, fragments[j].bone_type)
        );
        
        matches.push({
          fragment1: fragments[i].id,
          fragment2: fragments[j].id,
          bone1: fragments[i].name,
          bone2: fragments[j].name,
          confidence: match.confidence,
          jointType: inferJointType(fragments[i].bone_type, fragments[j].bone_type),
          jointAngles,
          details: match
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

function inferJointType(type1, type2) {
  if (type1 === 'vertebra' && type2 === 'vertebra') return 'ball';
  if (type1 === 'skull' || type2 === 'skull') return 'ball';
  if (type1 === 'limb' || type2 === 'limb') return 'ball';
  if (type1 === 'pelvis' || type2 === 'pelvis') return 'fixed';
  if (type1 === 'rib' || type2 === 'rib') return 'hinge';
  return 'ball';
}

export {
  calculateBoneMatch,
  estimateJointAngles,
  validateBiomechanics,
  applyToolDamage,
  applyWeathering,
  calculateStratigraphicError,
  calculateTectonicBias,
  analyzeFragmentationPattern,
  matchAllFragments,
  TOOL_DAMAGE,
  JOINT_CONSTRAINTS
};
