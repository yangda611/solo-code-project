
import * as THREE from 'three'
import { SpaceColonization } from './SpaceColonization'
import { CollisionDetector } from './CollisionDetector'
import { NutritionSystem } from './NutritionSystem'
import type {
  VineNode,
  VineBranch,
  Leaf,
  GrowthParams,
  LightSource,
  Obstacle,
} from '../types/vine'

export class GrowthEngine {
  private nodes: VineNode[] = []
  private branches: VineBranch[] = []
  private leaves: Leaf[] = []
  private spaceColonization: SpaceColonization
  private collisionDetector: CollisionDetector
  private nutritionSystem: NutritionSystem
  private params: GrowthParams
  private lightSource: LightSource
  private nodeIdCounter: number = 0
  private leafIdCounter: number = 0
  private branchIdCounter: number = 0
  private isRunning: boolean = false
  private maxDepthReached: number = 0

  constructor(params: GrowthParams, lightSource: LightSource) {
    this.params = params
    this.lightSource = lightSource
    this.spaceColonization = new SpaceColonization()
    this.collisionDetector = new CollisionDetector()
    this.nutritionSystem = new NutritionSystem(
      params.nutritionTotal,
      params.nutritionCostPerSegment
    )
    this.spaceColonization.setLightAttractors(lightSource)
  }

  reset(): void {
    this.nodes = []
    this.branches = []
    this.leaves = []
    this.nodeIdCounter = 0
    this.leafIdCounter = 0
    this.branchIdCounter = 0
    this.maxDepthReached = 0
    this.nutritionSystem.reset(this.params.nutritionTotal, this.params.nutritionCostPerSegment)
    this.collisionDetector.resetCollisionCount()
    this.spaceColonization.setLightAttractors(this.lightSource)
    
    const rootNode = this.createNode(
      new THREE.Vector3(0, 0.15, 0),
      new THREE.Vector3(0, 1, 0),
      0
    )
    this.nodes.push(rootNode)
    
    const rootBranch: VineBranch = {
      id: this.generateBranchId(),
      nodes: [rootNode],
      leaves: [],
      parentId: null,
      depth: 0,
    }
    this.branches.push(rootBranch)
  }

  setParams(params: GrowthParams): void {
    this.params = params
    this.nutritionSystem.reset(params.nutritionTotal, params.nutritionCostPerSegment)
  }

  setLightSource(lightSource: LightSource): void {
    this.lightSource = lightSource
    this.spaceColonization.setLightAttractors(lightSource)
  }

  setObstacles(obstacles: Obstacle[]): void {
    this.collisionDetector.setObstacles(obstacles)
  }

  getNodes(): VineNode[] {
    return [...this.nodes]
  }

  getBranches(): VineBranch[] {
    return [...this.branches]
  }

  getLeaves(): Leaf[] {
    return [...this.leaves]
  }

  getStats() {
    return {
      totalNodes: this.nodes.length,
      activeBranches: this.branches.filter(b => {
        const last = b.nodes[b.nodes.length - 1]
        return last && !last.isDead && !last.isDeadlocked
      }).length,
      collisionCount: this.collisionDetector.getCollisionCount(),
      maxDepthReached: this.maxDepthReached,
      nutritionRemaining: this.nutritionSystem.getRemaining(),
    }
  }

  start(): void {
    this.isRunning = true
  }

  stop(): void {
    this.isRunning = false
  }

  private updateExistingNodes(deltaTime: number): void {
    for (const node of this.nodes) {
      if (node.collisionFlash > 0) {
        node.collisionFlash = Math.max(0, node.collisionFlash - deltaTime * 2)
      }
      if ((node.isDead || node.isDeadlocked) && node.witherProgress < 1) {
        node.witherProgress = Math.min(1, node.witherProgress + deltaTime * 0.5)
      }
    }
  }

  update(deltaTime: number): void {
    if (!this.isRunning) return

    const growthAmount = this.params.growthSpeed * deltaTime
    
    this.updateExistingNodes(deltaTime)
    
    const activeNodes = this.nodes.filter(
      n => n.isGrowing && !n.isDead && !n.isDeadlocked && n.depth < this.params.maxDepth
    )

    for (const node of activeNodes) {
      if (node.age < 1) {
        node.age += deltaTime * this.params.growthSpeed * 2
        continue
      }

      if (!this.nutritionSystem.canGrow()) {
        node.isDead = true
        node.witherProgress = Math.min(1, node.witherProgress + deltaTime)
        continue
      }

      const newPosition = this.calculateNextPosition(node, growthAmount)
      
      const collision = this.collisionDetector.checkSegmentCollision(
        node.position,
        newPosition,
        node.thickness
      )

      if (collision) {
        node.collisionFlash = 1
        const avoidDir = this.collisionDetector.calculateAvoidanceDirection(
          node.position,
          node.direction,
          this.params.obstacleAvoidanceWeight
        )
        node.direction.lerp(avoidDir, 0.3)
        
        if (this.collisionDetector.isPathDeadlocked(node.position, node.direction)) {
          node.isDeadlocked = true
        }
        continue
      }

      const selfCollisions = this.collisionDetector.checkSelfCollision(
        { ...node, position: newPosition },
        this.nodes
      )
      
      if (selfCollisions.length > 0 && Math.random() > 0.7) {
        continue
      }

      const newNode = this.createNode(
        newPosition,
        node.direction.clone(),
        node.depth + 1
      )
      newNode.nutrition = this.nutritionSystem.calculateNutritionByDepth(
        node.depth + 1,
        this.params.maxDepth
      )
      
      this.nodes.push(newNode)
      
      const branch = this.branches.find(b => 
        b.nodes[b.nodes.length - 1]?.id === node.id
      )
      if (branch) {
        branch.nodes.push(newNode)
      }

      if (this.nodes.length % this.params.leafInterval === 0) {
        this.createLeaf(newNode)
      }

      if (Math.random() < this.params.branchProbability && node.depth < this.params.maxDepth - 2) {
        this.createBranch(node)
      }

      node.isGrowing = false
      
      this.nutritionSystem.consumeNutrition(this.params.nutritionCostPerSegment)
    }

    this.spaceColonization.removeDeadAttractors(this.nodes)

    for (const leaf of this.leaves) {
      if (leaf.growthProgress < 1) {
        leaf.growthProgress = Math.min(1, leaf.growthProgress + deltaTime * 0.5)
      }
    }
  }

  private calculateNextPosition(node: VineNode, growthAmount: number): THREE.Vector3 {
    const colonizedDir = this.spaceColonization.calculateGrowthDirection(
      node,
      this.nodes,
      this.lightSource,
      this.params
    )
    
    const avoidDir = this.collisionDetector.calculateAvoidanceDirection(
      node.position,
      colonizedDir,
      this.params.obstacleAvoidanceWeight
    )
    
    node.direction.lerp(avoidDir, 0.1).normalize()
    
    const groundY = 0.08
    const upVector = new THREE.Vector3(0, 1, 0)
    
    if (node.position.y < groundY + 0.3 && node.direction.y < 0) {
      const groundAvoidFactor = Math.max(0, 1 - (node.position.y - groundY) / 0.3)
      node.direction.lerp(upVector, groundAvoidFactor * 0.5).normalize()
    }
    
    let newPosition = node.position.clone().add(
      node.direction.clone().multiplyScalar(this.params.segmentLength * growthAmount)
    )
    
    if (newPosition.y < groundY) {
      newPosition.y = groundY + 0.05
      const reflectionDir = node.direction.clone()
      reflectionDir.y = Math.abs(reflectionDir.y) * 0.5 + 0.3
      node.direction.lerp(reflectionDir.normalize(), 0.8)
    }
    
    return newPosition
  }

  private createNode(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    depth: number
  ): VineNode {
    if (depth > this.maxDepthReached) {
      this.maxDepthReached = depth
    }
    
    return {
      id: this.generateNodeId(),
      position: position.clone(),
      direction: direction.clone().normalize(),
      thickness: Math.max(0.02, 0.1 * Math.pow(0.98, depth)),
      depth,
      nutrition: 5,
      isGrowing: true,
      isDead: false,
      isDeadlocked: false,
      age: 0,
      collisionFlash: 0,
      witherProgress: 0,
    }
  }

  private createBranch(parentNode: VineNode): void {
    const angle = this.params.branchAngle * (0.5 + Math.random() * 0.5)
    const axis = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize()
    
    const newDirection = parentNode.direction.clone()
    newDirection.applyAxisAngle(axis, angle).normalize()
    
    const branchNode = this.createNode(
      parentNode.position.clone(),
      newDirection,
      parentNode.depth + 1
    )
    this.nodes.push(branchNode)
    
    const newBranch: VineBranch = {
      id: this.generateBranchId(),
      nodes: [branchNode],
      leaves: [],
      parentId: parentNode.id,
      depth: parentNode.depth + 1,
    }
    this.branches.push(newBranch)
  }

  private createLeaf(node: VineNode): void {
    const leafOffset = node.direction.clone().multiplyScalar(node.thickness * 1.5)
    const leafPosition = node.position.clone().add(leafOffset)
    
    const groundY = 0.05
    if (leafPosition.y < groundY) {
      leafPosition.y = groundY + Math.random() * 0.1
    }
    
    const up = new THREE.Vector3(0, 1, 0)
    const tangent = node.direction.clone()
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize()
    if (normal.length() === 0) normal.set(1, 0, 0)
    
    const randomAngle = (Math.random() - 0.5) * Math.PI * 0.8
    const leafNormal = normal.clone().applyAxisAngle(tangent, randomAngle)
    
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), leafNormal)
    
    const tiltAngle = Math.PI * 0.25 + Math.random() * Math.PI * 0.2
    quaternion.multiply(
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
        tiltAngle
      )
    )
    
    const rotation = new THREE.Euler().setFromQuaternion(quaternion)
    
    const minY = groundY + 0.02
    if (leafPosition.y < minY) {
      const upVector = new THREE.Vector3(0, 1, 0)
      const correctionQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
        upVector
      )
      quaternion.slerp(correctionQuat, 0.5)
      rotation.setFromQuaternion(quaternion)
    }
    
    const leaf: Leaf = {
      id: this.generateLeafId(),
      position: leafPosition,
      rotation,
      scale: 0.4 + Math.random() * 0.4,
      growthProgress: 0,
      nodeId: node.id,
    }
    this.leaves.push(leaf)
    
    const branch = this.branches.find(b => 
      b.nodes.some(n => n.id === node.id)
    )
    if (branch) {
      branch.leaves.push(leaf)
    }
  }

  private generateNodeId(): string {
    return `node-${this.nodeIdCounter++}`
  }

  private generateBranchId(): string {
    return `branch-${this.branchIdCounter++}`
  }

  private generateLeafId(): string {
    return `leaf-${this.leafIdCounter++}`
  }
}
