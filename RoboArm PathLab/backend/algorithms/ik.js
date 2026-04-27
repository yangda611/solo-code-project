const THREE = require('three');

function calculateForwardKinematics(armConfig, jointAngles) {
  const { jointCount, linkLengths, basePosition = { x: 0, y: 0, z: 0 } } = armConfig;
  const positions = [{ ...basePosition }];
  
  let currentPosition = new THREE.Vector3(basePosition.x, basePosition.y, basePosition.z);
  let currentRotation = new THREE.Euler(0, 0, 0);
  
  for (let i = 0; i < jointCount; i++) {
    const angle = jointAngles[i] || 0;
    const length = linkLengths[i] || 1;
    
    if (i % 2 === 0) {
      currentRotation.y += angle;
    } else {
      currentRotation.x += angle;
    }
    
    const direction = new THREE.Vector3(0, 1, 0);
    direction.applyEuler(currentRotation);
    direction.multiplyScalar(length);
    
    currentPosition.add(direction);
    positions.push({
      x: currentPosition.x,
      y: currentPosition.y,
      z: currentPosition.z
    });
  }
  
  return positions;
}

function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calculateTotalReach(armConfig) {
  return armConfig.linkLengths.reduce((sum, length) => sum + length, 0);
}

function isWithinReach(armConfig, targetPoint) {
  const totalReach = calculateTotalReach(armConfig);
  const basePosition = armConfig.basePosition || { x: 0, y: 0, z: 0 };
  const distance = calculateDistance(basePosition, targetPoint);
  return distance <= totalReach;
}

function clampAngle(angle, min, max) {
  return Math.max(min, Math.min(max, angle));
}

function calculateInverseKinematics(armConfig, targetPoint) {
  const { jointCount, linkLengths, angleLimits, basePosition = { x: 0, y: 0, z: 0 } } = armConfig;
  
  if (!isWithinReach(armConfig, targetPoint)) {
    return {
      success: false,
      error: '目标点超出机械臂可达范围',
      reachable: false
    };
  }
  
  const maxIterations = 1000;
  const tolerance = 0.01;
  const learningRate = 0.1;
  
  let jointAngles = new Array(jointCount).fill(0);
  
  for (let i = 0; i < jointCount; i++) {
    if (angleLimits && angleLimits[i]) {
      jointAngles[i] = (angleLimits[i].min + angleLimits[i].max) / 2;
    }
  }
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const positions = calculateForwardKinematics(armConfig, jointAngles);
    const endEffector = positions[positions.length - 1];
    
    const distance = calculateDistance(endEffector, targetPoint);
    
    if (distance < tolerance) {
      return {
        success: true,
        jointAngles,
        endEffector,
        reachable: true,
        iterations: iter
      };
    }
    
    for (let i = 0; i < jointCount; i++) {
      const deltaAngle = 0.01;
      
      const anglesPlus = [...jointAngles];
      anglesPlus[i] += deltaAngle;
      const positionsPlus = calculateForwardKinematics(armConfig, anglesPlus);
      const endPlus = positionsPlus[positionsPlus.length - 1];
      
      const anglesMinus = [...jointAngles];
      anglesMinus[i] -= deltaAngle;
      const positionsMinus = calculateForwardKinematics(armConfig, anglesMinus);
      const endMinus = positionsMinus[positionsMinus.length - 1];
      
      const gradientX = (endPlus.x - endMinus.x) / (2 * deltaAngle);
      const gradientY = (endPlus.y - endMinus.y) / (2 * deltaAngle);
      const gradientZ = (endPlus.z - endMinus.z) / (2 * deltaAngle);
      
      const errorX = targetPoint.x - endEffector.x;
      const errorY = targetPoint.y - endEffector.y;
      const errorZ = targetPoint.z - endEffector.z;
      
      const error = errorX * gradientX + errorY * gradientY + errorZ * gradientZ;
      jointAngles[i] += learningRate * error;
      
      if (angleLimits && angleLimits[i]) {
        jointAngles[i] = clampAngle(jointAngles[i], angleLimits[i].min, angleLimits[i].max);
      }
    }
  }
  
  const positions = calculateForwardKinematics(armConfig, jointAngles);
  const endEffector = positions[positions.length - 1];
  const finalDistance = calculateDistance(endEffector, targetPoint);
  
  if (finalDistance < 0.1) {
    return {
      success: true,
      jointAngles,
      endEffector,
      reachable: true,
      iterations: maxIterations,
      approximate: true
    };
  }
  
  return {
    success: false,
    error: '无法找到有效解，目标点可能超出关节角度限制',
    reachable: false,
    bestAttempt: {
      jointAngles,
      endEffector,
      distance: finalDistance
    }
  };
}

module.exports = {
  calculateInverseKinematics,
  calculateForwardKinematics,
  calculateDistance,
  isWithinReach
};
