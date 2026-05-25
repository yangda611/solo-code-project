
import * as THREE from 'three'
import type { VineNode, Obstacle } from '../types/vine'

export class CollisionDetector {
  private obstacles: Obstacle[] = []
  private collisionCount: number = 0

  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = [...obstacles]
  }

  addObstacle(obstacle: Obstacle): void {
    this.obstacles.push(obstacle)
  }

  removeObstacle(id: string): void {
    this.obstacles = this.obstacles.filter(o => o.id !== id)
  }

  clearObstacles(): void {
    this.obstacles = []
  }

  getObstacles(): Obstacle[] {
    return [...this.obstacles]
  }

  getCollisionCount(): number {
    return this.collisionCount
  }

  resetCollisionCount(): void {
    this.collisionCount = 0
  }

  checkPointCollision(position: THREE.Vector3, radius: number = 0.1): Obstacle | null {
    for (const obstacle of this.obstacles) {
      const distance = position.distanceTo(obstacle.position)
      if (distance < obstacle.radius + radius) {
        return obstacle
      }
    }
    return null
  }

  checkSegmentCollision(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number = 0.1
  ): { obstacle: Obstacle; point: THREE.Vector3 } | null {
    for (const obstacle of this.obstacles) {
      const closestPoint = this.closestPointOnSegment(start, end, obstacle.position)
      const distance = closestPoint.distanceTo(obstacle.position)
      if (distance < obstacle.radius + radius) {
        this.collisionCount++
        return { obstacle, point: closestPoint }
      }
    }
    return null
  }

  private closestPointOnSegment(
    start: THREE.Vector3,
    end: THREE.Vector3,
    point: THREE.Vector3
  ): THREE.Vector3 {
    const segment = end.clone().sub(start)
    const segmentLength = segment.length()
    if (segmentLength === 0) return start.clone()

    segment.normalize()
    const toPoint = point.clone().sub(start)
    let projection = toPoint.dot(segment)
    projection = Math.max(0, Math.min(segmentLength, projection))

    return start.clone().add(segment.multiplyScalar(projection))
  }

  calculateAvoidanceDirection(
    position: THREE.Vector3,
    currentDirection: THREE.Vector3,
    avoidanceWeight: number
  ): THREE.Vector3 {
    const avoidance = new THREE.Vector3(0, 0, 0)
    
    for (const obstacle of this.obstacles) {
      const toObstacle = obstacle.position.clone().sub(position)
      const distance = toObstacle.length()
      const influenceRadius = obstacle.radius * 3
      
      if (distance < influenceRadius && distance > 0) {
        const strength = 1 - distance / influenceRadius
        toObstacle.normalize()
        avoidance.sub(toObstacle.multiplyScalar(strength * avoidanceWeight))
      }
    }

    const finalDir = currentDirection.clone().multiplyScalar(1 - avoidanceWeight)
    finalDir.add(avoidance)
    
    if (finalDir.length() === 0) {
      return currentDirection.clone()
    }
    
    return finalDir.normalize()
  }

  checkSelfCollision(
    node: VineNode,
    allNodes: VineNode[],
    threshold: number = 0.2
  ): VineNode[] {
    const collisions: VineNode[] = []
    
    for (const other of allNodes) {
      if (other.id === node.id) continue
      if (Math.abs(other.depth - node.depth) < 3) continue
      
      const distance = node.position.distanceTo(other.position)
      if (distance < threshold) {
        collisions.push(other)
      }
    }
    
    return collisions
  }

  isPathDeadlocked(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    lookAhead: number = 5
  ): boolean {
    const testPos = position.clone()
    const testDir = direction.clone()
    
    for (let i = 0; i < lookAhead; i++) {
      testPos.add(testDir.clone().multiplyScalar(0.5))
      
      let blocked = false
      for (const obstacle of this.obstacles) {
        if (testPos.distanceTo(obstacle.position) < obstacle.radius + 0.2) {
          blocked = true
          break
        }
      }
      
      if (!blocked) {
        return false
      }
      
      const angles = [Math.PI / 4, -Math.PI / 4, Math.PI / 6, -Math.PI / 6]
      for (const angle of angles) {
        const rotatedDir = testDir.clone()
        rotatedDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        const altPos = position.clone().add(rotatedDir.multiplyScalar(0.5 * (i + 1)))
        
        let altBlocked = false
        for (const obstacle of this.obstacles) {
          if (altPos.distanceTo(obstacle.position) < obstacle.radius + 0.2) {
            altBlocked = true
            break
          }
        }
        
        if (!altBlocked) {
          return false
        }
      }
    }
    
    return true
  }
}
