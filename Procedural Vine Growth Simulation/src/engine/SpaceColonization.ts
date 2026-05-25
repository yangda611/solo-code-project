
import * as THREE from 'three'
import type { VineNode, LightSource, GrowthParams } from '../types/vine'

export class SpaceColonization {
  private attractors: THREE.Vector3[] = []
  private killDistance: number = 0.5
  private influenceRadius: number = 3.0

  constructor() {
    this.attractors = []
  }

  setLightAttractors(lightSource: LightSource, count: number = 50): void {
    this.attractors = []
    const lightDir = lightSource.direction.clone().normalize()
    const basePos = lightDir.clone().multiplyScalar(10)
    
    for (let i = 0; i < count; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4
      )
      this.attractors.push(basePos.clone().add(offset))
    }
  }

  addAttractor(position: THREE.Vector3): void {
    this.attractors.push(position.clone())
  }

  clearAttractors(): void {
    this.attractors = []
  }

  calculateGrowthDirection(
    node: VineNode,
    allNodes: VineNode[],
    lightSource: LightSource,
    params: GrowthParams
  ): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, 0)
    let attractorCount = 0

    for (const attractor of this.attractors) {
      const toAttractor = attractor.clone().sub(node.position)
      const distance = toAttractor.length()
      
      if (distance < this.influenceRadius && distance > this.killDistance) {
        toAttractor.normalize()
        direction.add(toAttractor)
        attractorCount++
      }
    }

    if (attractorCount > 0) {
      direction.divideScalar(attractorCount)
    }

    const phototropismDir = lightSource.direction.clone().normalize()
    direction.multiplyScalar(1 - params.phototropismWeight)
    direction.add(phototropismDir.multiplyScalar(params.phototropismWeight))

    const randomDir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize()
    direction.multiplyScalar(1 - params.randomnessWeight)
    direction.add(randomDir.multiplyScalar(params.randomnessWeight))

    for (const other of allNodes) {
      if (other.id === node.id) continue
      const toOther = other.position.clone().sub(node.position)
      const distance = toOther.length()
      if (distance < 0.3 && distance > 0) {
        toOther.normalize()
        direction.sub(toOther.multiplyScalar(0.5))
      }
    }

    if (direction.length() === 0) {
      direction.copy(node.direction)
    }

    return direction.normalize()
  }

  removeDeadAttractors(nodes: VineNode[]): void {
    this.attractors = this.attractors.filter(attractor => {
      for (const node of nodes) {
        if (attractor.distanceTo(node.position) < this.killDistance) {
          return false
        }
      }
      return true
    })
  }
}
