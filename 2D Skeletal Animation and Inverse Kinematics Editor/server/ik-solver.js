class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  mul(s) {
    return new Vector2(this.x * s, this.y * s);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2();
    return new Vector2(this.x / len, this.y / len);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  static fromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  clone() {
    return new Vector2(this.x, this.y);
  }
}

class Bone {
  constructor(id, x, y, length, angle = 0, parent = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.length = length;
    this.angle = angle;
    this.parent = parent;
    this.children = [];
    this.constraint = { min: -Math.PI, max: Math.PI };
    this.actualAngle = angle;
  }

  getEndPosition() {
    return new Vector2(
      this.x + Math.cos(this.actualAngle) * this.length,
      this.y + Math.sin(this.actualAngle) * this.length
    );
  }

  getWorldAngle() {
    let angle = this.actualAngle;
    let parent = this.parent;
    while (parent) {
      angle += parent.actualAngle;
      parent = parent.parent;
    }
    return angle;
  }

  getWorldPosition() {
    let pos = new Vector2(this.x, this.y);
    let parent = this.parent;
    while (parent) {
      const endPos = parent.getEndPosition();
      pos = pos.add(endPos.sub(new Vector2(parent.x, parent.y)));
      parent = parent.parent;
    }
    return pos;
  }

  setConstraint(min, max) {
    this.constraint = { min, max };
  }

  applyConstraint(angle) {
    return Math.max(this.constraint.min, Math.min(this.constraint.max, angle));
  }
}

class Skeleton {
  constructor() {
    this.bones = [];
    this.root = null;
  }

  addBone(id, x, y, length, angle, parentId = null) {
    const parent = parentId ? this.bones.find(b => b.id === parentId) : null;
    const bone = new Bone(id, x, y, length, angle, parent);
    if (parent) {
      const endPos = parent.getEndPosition();
      bone.x = endPos.x - parent.x;
      bone.y = endPos.y - parent.y;
      parent.children.push(bone);
    }
    if (!this.root) this.root = bone;
    this.bones.push(bone);
    return bone;
  }

  getEndEffector() {
    let leaf = this.bones.find(b => b.children.length === 0);
    return leaf ? leaf.getEndPosition() : new Vector2();
  }

  getBoneChain() {
    const chain = [];
    let current = this.bones.find(b => b.children.length === 0);
    while (current) {
      chain.unshift(current);
      current = current.parent;
    }
    return chain;
  }

  updatePositions() {
    const updateBone = (bone, parentPos, parentAngle) => {
      const worldAngle = parentAngle + bone.actualAngle;
      bone.worldX = parentPos.x + bone.x;
      bone.worldY = parentPos.y + bone.y;
      bone.worldAngle = worldAngle;
      
      const endX = bone.worldX + Math.cos(worldAngle) * bone.length;
      const endY = bone.worldY + Math.sin(worldAngle) * bone.length;
      
      bone.children.forEach(child => {
        updateBone(child, new Vector2(bone.worldX, bone.worldY), worldAngle);
      });
    };
    
    if (this.root) {
      updateBone(this.root, new Vector2(this.root.x, this.root.y), 0);
    }
  }
}

class CCDSolver {
  constructor(skeleton) {
    this.skeleton = skeleton;
    this.maxIterations = 100;
    this.threshold = 0.1;
    this.errorHistory = [];
  }

  setParams(maxIterations, threshold) {
    this.maxIterations = maxIterations;
    this.threshold = threshold;
  }

  solve(target) {
    this.errorHistory = [];
    const chain = this.skeleton.getBoneChain();
    if (chain.length < 2) return { success: false, error: Infinity, iterations: 0, constraintViolations: [] };

    let iterations = 0;
    let error = Infinity;
    const constraintViolations = [];

    while (iterations < this.maxIterations && error > this.threshold) {
      for (let i = chain.length - 2; i >= 0; i--) {
        const bone = chain[i];
        const endEffector = this.skeleton.getEndEffector();
        
        error = endEffector.sub(new Vector2(target.x, target.y)).length();
        this.errorHistory.push(error);

        if (error <= this.threshold) break;

        const bonePos = bone.getWorldPosition();
        const toEnd = endEffector.sub(bonePos);
        const toTarget = new Vector2(target.x, target.y).sub(bonePos);

        const angleToEnd = toEnd.angle();
        const angleToTarget = toTarget.angle();
        let angleDiff = angleToTarget - angleToEnd;

        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const originalAngle = bone.actualAngle;
        bone.actualAngle += angleDiff;
        
        const constrainedAngle = bone.applyConstraint(bone.actualAngle);
        if (Math.abs(bone.actualAngle - constrainedAngle) > 0.001) {
          constraintViolations.push({
            boneId: bone.id,
            iteration: iterations,
            attempted: bone.actualAngle,
            constrained: constrainedAngle
          });
        }
        bone.actualAngle = constrainedAngle;
      }
      iterations++;
    }

    const finalError = this.skeleton.getEndEffector().sub(new Vector2(target.x, target.y)).length();
    return {
      success: finalError <= this.threshold,
      error: finalError,
      iterations,
      errorHistory: this.errorHistory,
      constraintViolations
    };
  }
}

class FABRIKSolver {
  constructor(skeleton) {
    this.skeleton = skeleton;
    this.maxIterations = 100;
    this.threshold = 0.1;
    this.errorHistory = [];
  }

  setParams(maxIterations, threshold) {
    this.maxIterations = maxIterations;
    this.threshold = threshold;
  }

  getChainPositions(chain) {
    const positions = [];
    let pos = chain[0].getWorldPosition();
    positions.push(pos.clone());
    
    for (let i = 0; i < chain.length; i++) {
      pos = chain[i].getEndPosition();
      positions.push(pos.clone());
    }
    return positions;
  }

  solve(target) {
    this.errorHistory = [];
    const chain = this.skeleton.getBoneChain();
    if (chain.length < 2) return { success: false, error: Infinity, iterations: 0, constraintViolations: [] };

    const rootPos = chain[0].getWorldPosition().clone();
    let positions = this.getChainPositions(chain);
    
    let iterations = 0;
    let error = Infinity;
    const constraintViolations = [];

    while (iterations < this.maxIterations && error > this.threshold) {
      positions[positions.length - 1] = new Vector2(target.x, target.y);
      
      for (let i = positions.length - 2; i >= 0; i--) {
        const dir = positions[i].sub(positions[i + 1]).normalize();
        const length = i < chain.length ? chain[i].length : chain[chain.length - 1].length;
        positions[i] = positions[i + 1].add(dir.mul(length));
      }

      positions[0] = rootPos.clone();
      
      for (let i = 0; i < positions.length - 1; i++) {
        const dir = positions[i + 1].sub(positions[i]).normalize();
        const length = i < chain.length ? chain[i].length : chain[chain.length - 1].length;
        positions[i + 1] = positions[i].add(dir.mul(length));
      }

      for (let i = 0; i < chain.length; i++) {
        const bone = chain[i];
        const dir = positions[i + 1].sub(positions[i]);
        let targetAngle = dir.angle();
        
        if (bone.parent) {
          targetAngle -= bone.parent.getWorldAngle();
        }

        const originalAngle = bone.actualAngle;
        const constrainedAngle = bone.applyConstraint(targetAngle);
        
        if (Math.abs(targetAngle - constrainedAngle) > 0.001) {
          constraintViolations.push({
            boneId: bone.id,
            iteration: iterations,
            attempted: targetAngle,
            constrained: constrainedAngle
          });
        }
        
        bone.actualAngle = constrainedAngle;
      }

      error = positions[positions.length - 1].sub(new Vector2(target.x, target.y)).length();
      this.errorHistory.push(error);
      iterations++;
    }

    return {
      success: error <= this.threshold,
      error,
      iterations,
      errorHistory: this.errorHistory,
      constraintViolations
    };
  }
}

module.exports = {
  Vector2,
  Bone,
  Skeleton,
  CCDSolver,
  FABRIKSolver
};
