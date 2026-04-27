const { calculateInverseKinematics, calculateForwardKinematics, calculateDistance } = require('./ik');
const { checkCollision } = require('./collision');

function lerpAngles(startAngles, endAngles, t) {
  return startAngles.map((start, i) => {
    const end = endAngles[i] || 0;
    return start + (end - start) * t;
  });
}

function calculateAngleDistance(angles1, angles2) {
  let totalDistance = 0;
  for (let i = 0; i < angles1.length; i++) {
    const diff = Math.abs(angles2[i] - angles1[i]);
    totalDistance += diff * diff;
  }
  return Math.sqrt(totalDistance);
}

function planStraightPath(armConfig, startAngles, targetAngles, obstacles, steps = 50) {
  const path = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const currentAngles = lerpAngles(startAngles, targetAngles, t);
    const positions = calculateForwardKinematics(armConfig, currentAngles);
    const collisionResult = checkCollision(armConfig, currentAngles, obstacles);
    
    path.push({
      step: i,
      progress: t,
      jointAngles: [...currentAngles],
      positions: [...positions],
      endEffector: positions[positions.length - 1],
      hasCollision: collisionResult.hasCollision,
      collisions: collisionResult.collisions
    });
  }
  
  return path;
}

function checkPathCollisions(armConfig, startAngles, targetAngles, obstacles, steps = 50) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const currentAngles = lerpAngles(startAngles, targetAngles, t);
    const collisionResult = checkCollision(armConfig, currentAngles, obstacles);
    
    if (collisionResult.hasCollision) {
      return {
        blocked: true,
        blockingStep: i,
        collisions: collisionResult.collisions
      };
    }
  }
  
  return {
    blocked: false
  };
}

function findAlternativePath(armConfig, startAngles, targetPoint, obstacles) {
  const ikResult = calculateInverseKinematics(armConfig, targetPoint);
  
  if (!ikResult.success) {
    return {
      success: false,
      error: ikResult.error,
      reachable: false
    };
  }
  
  const targetAngles = ikResult.jointAngles;
  
  const straightCheck = checkPathCollisions(armConfig, startAngles, targetAngles, obstacles);
  
  if (!straightCheck.blocked) {
    const path = planStraightPath(armConfig, startAngles, targetAngles, obstacles);
    return {
      success: true,
      path,
      pathType: 'direct',
      finalAngles: targetAngles,
      endEffector: ikResult.endEffector
    };
  }
  
  const waypoints = generateWaypoints(armConfig, startAngles, targetPoint, obstacles);
  
  if (waypoints.length === 0) {
    return {
      success: false,
      error: '无法找到避开障碍物的路径',
      reachable: true,
      blocked: true,
      blockingStep: straightCheck.blockingStep,
      collisions: straightCheck.collisions
    };
  }
  
  const fullPath = [];
  let currentAngles = startAngles;
  
  for (let i = 0; i < waypoints.length; i++) {
    const waypointAngles = waypoints[i].jointAngles;
    const segmentPath = planStraightPath(armConfig, currentAngles, waypointAngles, obstacles);
    
    for (let j = 0; j < segmentPath.length; j++) {
      const step = segmentPath[j];
      if (step.hasCollision) {
        return {
          success: false,
          error: '路径规划失败，仍存在碰撞',
          reachable: true,
          blocked: true,
          partialPath: fullPath.concat(segmentPath.slice(0, j))
        };
      }
    }
    
    fullPath.push(...segmentPath.slice(i === 0 ? 0 : 1));
    currentAngles = waypointAngles;
  }
  
  const finalSegment = planStraightPath(armConfig, currentAngles, targetAngles, obstacles);
  
  for (let j = 0; j < finalSegment.length; j++) {
    const step = finalSegment[j];
    if (step.hasCollision) {
      return {
        success: false,
        error: '最终路径段存在碰撞',
        reachable: true,
        blocked: true,
        partialPath: fullPath.concat(finalSegment.slice(0, j))
      };
    }
  }
  
  fullPath.push(...finalSegment.slice(1));
  
  return {
    success: true,
    path: fullPath,
    pathType: 'waypoint',
    waypointCount: waypoints.length,
    finalAngles: targetAngles,
    endEffector: ikResult.endEffector
  };
}

function generateWaypoints(armConfig, startAngles, targetPoint, obstacles) {
  const waypoints = [];
  const startPositions = calculateForwardKinematics(armConfig, startAngles);
  const startEnd = startPositions[startPositions.length - 1];
  
  const midPoint = {
    x: (startEnd.x + targetPoint.x) / 2,
    y: (startEnd.y + targetPoint.y) / 2 + 2,
    z: (startEnd.z + targetPoint.z) / 2
  };
  
  const midIk = calculateInverseKinematics(armConfig, midPoint);
  if (midIk.success) {
    const midCheck = checkPathCollisions(armConfig, startAngles, midIk.jointAngles, obstacles);
    if (!midCheck.blocked) {
      waypoints.push({
        position: midPoint,
        jointAngles: midIk.jointAngles
      });
    }
  }
  
  const alternativeMidPoint = {
    x: (startEnd.x + targetPoint.x) / 2,
    y: (startEnd.y + targetPoint.y) / 2,
    z: (startEnd.z + targetPoint.z) / 2 + 2
  };
  
  const altMidIk = calculateInverseKinematics(armConfig, alternativeMidPoint);
  if (altMidIk.success && waypoints.length === 0) {
    const altMidCheck = checkPathCollisions(armConfig, startAngles, altMidIk.jointAngles, obstacles);
    if (!altMidCheck.blocked) {
      waypoints.push({
        position: alternativeMidPoint,
        jointAngles: altMidIk.jointAngles
      });
    }
  }
  
  return waypoints;
}

function planPath(armConfig, startAngles, targetPoint, obstacles) {
  return findAlternativePath(armConfig, startAngles, targetPoint, obstacles);
}

module.exports = {
  planPath,
  planStraightPath,
  lerpAngles,
  checkPathCollisions
};
