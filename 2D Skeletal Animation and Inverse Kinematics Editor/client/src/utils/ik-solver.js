class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y)
  }

  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y)
  }

  mul(s) {
    return new Vector2(this.x * s, this.y * s)
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize() {
    const len = this.length()
    if (len === 0) return new Vector2()
    return new Vector2(this.x / len, this.y / len)
  }

  clone() {
    return new Vector2(this.x, this.y)
  }
}

class Bone {
  constructor(id, x, y, length, angle = 0, parentId = null) {
    this.id = id
    this.x = x
    this.y = y
    this.length = length
    this.angle = angle
    this.actualAngle = angle
    this.parentId = parentId
    this.constraint = { min: -Math.PI, max: Math.PI }
  }
}

class Skeleton {
  constructor(bonesData) {
    this.bones = bonesData.map(b => {
      const bone = new Bone(b.id, b.x, b.y, b.length, b.angle, b.parentId)
      if (b.constraint) {
        bone.constraint = { ...b.constraint }
      }
      return bone
    })
  }

  getBoneChain() {
    const chain = []
    let current = null

    for (const bone of this.bones) {
      if (!bone) continue
      const hasChild = this.bones.some(b => b && b.parentId === bone.id)
      if (!hasChild) {
        current = bone
        break
      }
    }

    if (!current && this.bones.length > 0) {
      current = this.bones[this.bones.length - 1]
    }

    while (current) {
      chain.unshift(current)
      const next = this.bones.find(b => b && b.id === current.parentId)
      if (next === current) break
      current = next
    }

    return chain
  }

  getBoneWorldPosition(bone) {
    if (!bone) return new Vector2()
    
    const chain = [bone]
    let parent = this.bones.find(b => b && b.id === bone.parentId)

    while (parent) {
      chain.unshift(parent)
      const nextParent = this.bones.find(b => b && b.id === parent.parentId)
      if (nextParent === parent) break
      parent = nextParent
    }

    let worldX = chain[0]?.x || 0
    let worldY = chain[0]?.y || 0
    let worldAngle = 0

    for (let i = 0; i < chain.length; i++) {
      const b = chain[i]
      if (b && typeof b.actualAngle === 'number') {
        worldAngle += b.actualAngle
      }
      if (i < chain.length - 1 && b && typeof b.length === 'number') {
        worldX += Math.cos(worldAngle) * b.length
        worldY += Math.sin(worldAngle) * b.length
      }
    }

    return new Vector2(worldX, worldY)
  }

  getEndEffector() {
    const chain = this.getBoneChain()
    if (chain.length === 0) return new Vector2()

    let worldX = chain[0]?.x || 0
    let worldY = chain[0]?.y || 0
    let worldAngle = 0

    for (const bone of chain) {
      if (bone && typeof bone.actualAngle === 'number') {
        worldAngle += bone.actualAngle
      }
      if (bone && typeof bone.length === 'number') {
        worldX += Math.cos(worldAngle) * bone.length
        worldY += Math.sin(worldAngle) * bone.length
      }
    }

    return new Vector2(worldX, worldY)
  }
}

class CCDSolver {
  constructor(skeleton) {
    this.skeleton = skeleton
    this.maxIterations = 100
    this.threshold = 0.1
    this.errorHistory = []
  }

  setParams(maxIterations, threshold) {
    this.maxIterations = maxIterations
    this.threshold = threshold
  }

  solve(target) {
    this.errorHistory = []
    const chain = this.skeleton.getBoneChain()
    
    if (chain.length < 2) {
      return {
        success: false,
        error: Infinity,
        iterations: 0,
        constraintViolations: [],
        boneAngles: {}
      }
    }

    let iterations = 0
    const constraintViolations = []

    const getChainEnd = () => {
      let worldX = chain[0]?.x || 0
      let worldY = chain[0]?.y || 0
      let worldAngle = 0

      for (const bone of chain) {
        if (bone && typeof bone.actualAngle === 'number') {
          worldAngle += bone.actualAngle
        }
        if (bone && typeof bone.length === 'number') {
          worldX += Math.cos(worldAngle) * bone.length
          worldY += Math.sin(worldAngle) * bone.length
        }
      }

      return new Vector2(worldX, worldY)
    }

    while (iterations < this.maxIterations) {
      for (let i = chain.length - 1; i >= 0; i--) {
        const bone = chain[i]
        const endEffector = getChainEnd()
        const error = endEffector.sub(new Vector2(target.x, target.y)).length()
        this.errorHistory.push(error)

        if (error <= this.threshold) break

        if (!bone) continue

        let boneWorldX = chain[0]?.x || 0
        let boneWorldY = chain[0]?.y || 0
        let boneWorldAngle = 0

        for (let j = 0; j < i; j++) {
          const chainBone = chain[j]
          if (chainBone && typeof chainBone.actualAngle === 'number') {
            boneWorldAngle += chainBone.actualAngle
          }
          if (chainBone && typeof chainBone.length === 'number') {
            boneWorldX += Math.cos(boneWorldAngle) * chainBone.length
            boneWorldY += Math.sin(boneWorldAngle) * chainBone.length
          }
        }

        const toEnd = endEffector.sub(new Vector2(boneWorldX, boneWorldY))
        const toTarget = new Vector2(target.x, target.y).sub(new Vector2(boneWorldX, boneWorldY))

        const angleToEnd = Math.atan2(toEnd.y, toEnd.x)
        const angleToTarget = Math.atan2(toTarget.y, toTarget.x)
        let angleDiff = angleToTarget - angleToEnd

        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI

        if (typeof bone.actualAngle !== 'number') continue

        bone.actualAngle += angleDiff

        let constrainedAngle = bone.actualAngle
        if (bone.constraint && bone.constraint.min !== undefined && bone.constraint.max !== undefined) {
          constrainedAngle = Math.max(
            bone.constraint.min,
            Math.min(bone.constraint.max, bone.actualAngle)
          )
        }

        if (Math.abs(bone.actualAngle - constrainedAngle) > 0.001) {
          constraintViolations.push({
            boneId: bone.id,
            iteration: iterations,
            attempted: bone.actualAngle,
            constrained: constrainedAngle
          })
        }

        bone.actualAngle = constrainedAngle
      }

      const finalError = getChainEnd().sub(new Vector2(target.x, target.y)).length()
      if (finalError <= this.threshold) break
      iterations++
    }

    const boneAngles = {}
    this.skeleton.bones.forEach(bone => {
      if (bone && bone.id) {
        boneAngles[bone.id] = typeof bone.actualAngle === 'number' ? bone.actualAngle : bone.angle || 0
      }
    })

    const finalErrorResult = getChainEnd().sub(new Vector2(target.x, target.y)).length()

    return {
      success: finalErrorResult <= this.threshold,
      error: finalErrorResult,
      iterations: iterations + 1,
      errorHistory: this.errorHistory,
      constraintViolations,
      boneAngles
    }
  }
}

class FABRIKSolver {
  constructor(skeleton) {
    this.skeleton = skeleton
    this.maxIterations = 100
    this.threshold = 0.1
    this.errorHistory = []
  }

  setParams(maxIterations, threshold) {
    this.maxIterations = maxIterations
    this.threshold = threshold
  }

  solve(target) {
    this.errorHistory = []
    const chain = this.skeleton.getBoneChain()

    if (chain.length < 2) {
      return {
        success: false,
        error: Infinity,
        iterations: 0,
        constraintViolations: [],
        boneAngles: {}
      }
    }

    const getChainPositions = () => {
      const startX = chain[0]?.x || 0
      const startY = chain[0]?.y || 0
      const positions = [new Vector2(startX, startY)]
      let angle = 0
      let x = startX
      let y = startY

      for (const bone of chain) {
        if (bone && typeof bone.actualAngle === 'number') {
          angle += bone.actualAngle
        }
        if (bone && typeof bone.length === 'number') {
          x += Math.cos(angle) * bone.length
          y += Math.sin(angle) * bone.length
        }
        positions.push(new Vector2(x, y))
      }
      return positions
    }

    let positions = getChainPositions()
    let iterations = 0
    const constraintViolations = []

    while (iterations < this.maxIterations) {
      positions[positions.length - 1] = new Vector2(target.x, target.y)

      for (let i = positions.length - 2; i >= 0; i--) {
        const dir = positions[i].sub(positions[i + 1]).normalize()
        const length = chain[i]?.length || 0
        positions[i] = positions[i + 1].add(dir.mul(length))
      }

      const startX = chain[0]?.x || 0
      const startY = chain[0]?.y || 0
      positions[0] = new Vector2(startX, startY)

      for (let i = 0; i < positions.length - 1; i++) {
        const dir = positions[i + 1].sub(positions[i]).normalize()
        const length = chain[i]?.length || 0
        positions[i + 1] = positions[i].add(dir.mul(length))
      }

      for (let i = 0; i < chain.length; i++) {
        const bone = chain[i]
        if (!bone) continue

        const dir = positions[i + 1].sub(positions[i])
        let targetAngle = Math.atan2(dir.y, dir.x)

        let parentAngle = 0
        for (let j = 0; j < i; j++) {
          if (chain[j] && typeof chain[j].actualAngle === 'number') {
            parentAngle += chain[j].actualAngle
          }
        }

        if (i > 0) {
          targetAngle -= parentAngle
        }

        let constrainedAngle = targetAngle
        if (bone.constraint && bone.constraint.min !== undefined && bone.constraint.max !== undefined) {
          constrainedAngle = Math.max(
            bone.constraint.min,
            Math.min(bone.constraint.max, targetAngle)
          )
        }

        if (Math.abs(targetAngle - constrainedAngle) > 0.001) {
          constraintViolations.push({
            boneId: bone.id,
            iteration: iterations,
            attempted: targetAngle,
            constrained: constrainedAngle
          })
        }

        bone.actualAngle = constrainedAngle
      }

      const error = positions[positions.length - 1].sub(new Vector2(target.x, target.y)).length()
      this.errorHistory.push(error)
      if (error <= this.threshold) break
      iterations++
    }

    const boneAngles = {}
    this.skeleton.bones.forEach(bone => {
      if (bone && bone.id) {
        boneAngles[bone.id] = typeof bone.actualAngle === 'number' ? bone.actualAngle : bone.angle || 0
      }
    })

    const finalError = positions[positions.length - 1].sub(new Vector2(target.x, target.y)).length()

    return {
      success: finalError <= this.threshold,
      error: finalError,
      iterations: iterations + 1,
      errorHistory: this.errorHistory,
      constraintViolations,
      boneAngles
    }
  }
}

export {
  Vector2,
  Bone,
  Skeleton,
  CCDSolver,
  FABRIKSolver
}
