const { calculateForwardKinematics, calculateDistance } = require('./ik');

function pointToLineSegmentDistance(point, lineStart, lineEnd) {
  const lineVec = {
    x: lineEnd.x - lineStart.x,
    y: lineEnd.y - lineStart.y,
    z: lineEnd.z - lineStart.z
  };
  
  const pointVec = {
    x: point.x - lineStart.x,
    y: point.y - lineStart.y,
    z: point.z - lineStart.z
  };
  
  const lineLengthSquared = lineVec.x * lineVec.x + lineVec.y * lineVec.y + lineVec.z * lineVec.z;
  
  if (lineLengthSquared === 0) {
    return calculateDistance(point, lineStart);
  }
  
  let t = (pointVec.x * lineVec.x + pointVec.y * lineVec.y + pointVec.z * lineVec.z) / lineLengthSquared;
  t = Math.max(0, Math.min(1, t));
  
  const closestPoint = {
    x: lineStart.x + t * lineVec.x,
    y: lineStart.y + t * lineVec.y,
    z: lineStart.z + t * lineVec.z
  };
  
  return calculateDistance(point, closestPoint);
}

function checkSphereCollision(point, center, radius) {
  const distance = calculateDistance(point, center);
  return {
    collision: distance <= radius,
    distance,
    penetration: radius - distance
  };
}

function checkBoxCollision(point, box) {
  const { position, size } = box;
  const halfSize = {
    x: size.x / 2,
    y: size.y / 2,
    z: size.z / 2
  };
  
  const dx = Math.max(0, Math.abs(point.x - position.x) - halfSize.x);
  const dy = Math.max(0, Math.abs(point.y - position.y) - halfSize.y);
  const dz = Math.max(0, Math.abs(point.z - position.z) - halfSize.z);
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  return {
    collision: distance <= 0.01,
    distance,
    penetration: Math.max(0, 0.01 - distance)
  };
}

function checkCylinderCollision(point, cylinder) {
  const { position, radius, height } = cylinder;
  
  const dx = point.x - position.x;
  const dz = point.z - position.z;
  const radialDistance = Math.sqrt(dx * dx + dz * dz);
  
  const halfHeight = height / 2;
  const dy = point.y - position.y;
  const isInHeightRange = dy >= -halfHeight && dy <= halfHeight;
  
  if (!isInHeightRange) {
    const verticalDistance = dy > halfHeight ? dy - halfHeight : -(dy + halfHeight);
    const horizontalDistance = Math.max(0, radialDistance - radius);
    const distance = Math.sqrt(verticalDistance * verticalDistance + horizontalDistance * horizontalDistance);
    return {
      collision: false,
      distance,
      penetration: 0
    };
  }
  
  return {
    collision: radialDistance <= radius,
    distance: Math.max(0, radialDistance - radius),
    penetration: radius - radialDistance
  };
}

function checkLineSegmentWithSphereCollision(lineStart, lineEnd, center, radius, linkRadius) {
  const closestDistance = pointToLineSegmentDistance(center, lineStart, lineEnd);
  const totalRadius = radius + linkRadius;
  
  return {
    collision: closestDistance <= totalRadius,
    distance: closestDistance,
    penetration: totalRadius - closestDistance
  };
}

function checkLineSegmentWithBoxCollision(lineStart, lineEnd, box, linkRadius) {
  const { position, size } = box;
  const halfSize = {
    x: size.x / 2,
    y: size.y / 2,
    z: size.z / 2
  };
  
  const samplePoints = 20;
  let minDistance = Infinity;
  
  for (let i = 0; i <= samplePoints; i++) {
    const t = i / samplePoints;
    const point = {
      x: lineStart.x + t * (lineEnd.x - lineStart.x),
      y: lineStart.y + t * (lineEnd.y - lineStart.y),
      z: lineStart.z + t * (lineEnd.z - lineStart.z)
    };
    
    const boxResult = checkBoxCollision(point, box);
    minDistance = Math.min(minDistance, boxResult.distance);
    
    if (boxResult.distance <= linkRadius) {
      return {
        collision: true,
        distance: boxResult.distance,
        penetration: linkRadius - boxResult.distance
      };
    }
  }
  
  return {
    collision: false,
    distance: minDistance,
    penetration: 0
  };
}

function checkLineSegmentWithCylinderCollision(lineStart, lineEnd, cylinder, linkRadius) {
  const samplePoints = 20;
  let minDistance = Infinity;
  
  for (let i = 0; i <= samplePoints; i++) {
    const t = i / samplePoints;
    const point = {
      x: lineStart.x + t * (lineEnd.x - lineStart.x),
      y: lineStart.y + t * (lineEnd.y - lineStart.y),
      z: lineStart.z + t * (lineEnd.z - lineStart.z)
    };
    
    const cylinderResult = checkCylinderCollision(point, cylinder);
    minDistance = Math.min(minDistance, cylinderResult.distance);
    
    if (cylinderResult.distance <= linkRadius) {
      return {
        collision: true,
        distance: cylinderResult.distance,
        penetration: linkRadius - cylinderResult.distance
      };
    }
  }
  
  return {
    collision: false,
    distance: minDistance,
    penetration: 0
  };
}

function checkCollision(armConfig, jointAngles, obstacles) {
  const positions = calculateForwardKinematics(armConfig, jointAngles);
  const linkRadius = armConfig.linkRadius || 0.1;
  const collisions = [];
  
  for (let linkIndex = 0; linkIndex < positions.length - 1; linkIndex++) {
    const lineStart = positions[linkIndex];
    const lineEnd = positions[linkIndex + 1];
    
    for (let obstacleIndex = 0; obstacleIndex < obstacles.length; obstacleIndex++) {
      const obstacle = obstacles[obstacleIndex];
      let result;
      
      switch (obstacle.type) {
        case 'sphere':
          result = checkLineSegmentWithSphereCollision(
            lineStart, lineEnd,
            obstacle.position, obstacle.radius, linkRadius
          );
          break;
          
        case 'box':
          result = checkLineSegmentWithBoxCollision(
            lineStart, lineEnd,
            obstacle, linkRadius
          );
          break;
          
        case 'cylinder':
          result = checkLineSegmentWithCylinderCollision(
            lineStart, lineEnd,
            obstacle, linkRadius
          );
          break;
          
        default:
          continue;
      }
      
      if (result.collision) {
        collisions.push({
          linkIndex,
          obstacleIndex,
          obstacle,
          distance: result.distance,
          penetration: result.penetration
        });
      }
    }
  }
  
  return {
    hasCollision: collisions.length > 0,
    collisions,
    totalPenetration: collisions.reduce((sum, c) => sum + c.penetration, 0)
  };
}

module.exports = {
  checkCollision,
  pointToLineSegmentDistance,
  checkSphereCollision,
  checkBoxCollision,
  checkCylinderCollision
};
