
import type { VineNode, VineBranch, GrowthParams } from '../types/vine'

export class NutritionSystem {
  private totalNutrition: number
  private remainingNutrition: number
  private costPerSegment: number

  constructor(totalNutrition: number = 100, costPerSegment: number = 1) {
    this.totalNutrition = totalNutrition
    this.remainingNutrition = totalNutrition
    this.costPerSegment = costPerSegment
  }

  reset(totalNutrition?: number, costPerSegment?: number): void {
    if (totalNutrition !== undefined) {
      this.totalNutrition = totalNutrition
      this.remainingNutrition = totalNutrition
    }
    if (costPerSegment !== undefined) {
      this.costPerSegment = costPerSegment
    }
  }

  getRemaining(): number {
    return this.remainingNutrition
  }

  getTotal(): number {
    return this.totalNutrition
  }

  getCostPerSegment(): number {
    return this.costPerSegment
  }

  consumeNutrition(amount: number): boolean {
    if (this.remainingNutrition >= amount) {
      this.remainingNutrition -= amount
      return true
    }
    return false
  }

  canGrow(): boolean {
    return this.remainingNutrition >= this.costPerSegment
  }

  allocateNutritionToBranches(branches: VineBranch[]): Map<string, number> {
    const allocations = new Map<string, number>()
    const activeBranches = branches.filter(b => {
      const lastNode = b.nodes[b.nodes.length - 1]
      return lastNode && !lastNode.isDead && !lastNode.isDeadlocked
    })

    if (activeBranches.length === 0) {
      return allocations
    }

    const totalDepth = activeBranches.reduce((sum, b) => sum + (b.depth + 1), 0)
    
    for (const branch of activeBranches) {
      const priority = 1 / (branch.depth + 1)
      const allocation = (priority / totalDepth) * this.remainingNutrition * 0.1
      allocations.set(branch.id, Math.min(allocation, this.costPerSegment * 2))
    }

    return allocations
  }

  distributeNutrition(
    nodes: VineNode[],
    params: GrowthParams
  ): { canGrow: string[]; willDie: string[] } {
    const canGrow: string[] = []
    const willDie: string[] = []
    const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth)

    for (const node of sortedNodes) {
      if (node.isDead || node.isDeadlocked) {
        continue
      }

      const cost = this.costPerSegment * (1 + node.depth * 0.1)
      
      if (node.nutrition >= cost) {
        node.nutrition -= cost * 0.5
        if (this.consumeNutrition(cost * 0.5)) {
          canGrow.push(node.id)
        } else if (node.nutrition >= cost) {
          node.nutrition -= cost
          canGrow.push(node.id)
        } else {
          willDie.push(node.id)
        }
      } else if (node.nutrition > 0) {
        node.nutrition -= params.growthSpeed * 0.01
        if (node.nutrition <= 0) {
          willDie.push(node.id)
        }
      } else {
        willDie.push(node.id)
      }
    }

    return { canGrow, willDie }
  }

  calculateNutritionByDepth(depth: number, maxDepth: number): number {
    const depthFactor = 1 - depth / (maxDepth + 1)
    return this.costPerSegment * 3 * depthFactor
  }
}
