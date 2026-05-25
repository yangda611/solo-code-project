
import * as THREE from 'three'
import type { LSystemState, LSystemRule } from '../types/vine'

export class LSystem {
  private axiom: string
  private rules: LSystemRule[]
  private currentString: string

  constructor(axiom: string = 'F') {
    this.axiom = axiom
    this.currentString = axiom
    this.rules = [
      { symbol: 'F', replacement: 'F[+F][-F]F', probability: 0.7 },
      { symbol: 'F', replacement: 'F[&F][^F]F', probability: 0.3 },
    ]
  }

  iterate(iterations: number = 1): string {
    for (let i = 0; i < iterations; i++) {
      let newString = ''
      for (const char of this.currentString) {
        const matchingRules = this.rules.filter(r => r.symbol === char)
        if (matchingRules.length > 0) {
          const totalProb = matchingRules.reduce((sum, r) => sum + (r.probability || 1), 0)
          let random = Math.random() * totalProb
          let selected = matchingRules[0]
          for (const rule of matchingRules) {
            random -= rule.probability || 1
            if (random <= 0) {
              selected = rule
              break
            }
          }
          newString += selected.replacement
        } else {
          newString += char
        }
      }
      this.currentString = newString
    }
    return this.currentString
  }

  reset(): void {
    this.currentString = this.axiom
  }

  getString(): string {
    return this.currentString
  }

  setRules(rules: LSystemRule[]): void {
    this.rules = rules
  }
}

export class LSystemInterpreter {
  private state: LSystemState
  private stateStack: LSystemState[]
  private branchAngle: number

  constructor(branchAngle: number = Math.PI / 4) {
    this.branchAngle = branchAngle
    this.stateStack = []
    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      thickness: 0.1,
      depth: 0,
    }
  }

  reset(startPosition?: THREE.Vector3): void {
    this.state = {
      position: startPosition?.clone() || new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      thickness: 0.1,
      depth: 0,
    }
    this.stateStack = []
  }

  interpretSymbol(symbol: string, segmentLength: number = 1): LSystemState | null {
    const up = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(this.state.direction, up).normalize()
    if (right.length() === 0) right.set(1, 0, 0)

    switch (symbol) {
      case 'F': {
        const newPos = this.state.position.clone().add(
          this.state.direction.clone().multiplyScalar(segmentLength)
        )
        const oldState = { ...this.state }
        this.state.position = newPos
        this.state.thickness *= 0.98
        return oldState
      }
      case '+': {
        const quat = new THREE.Quaternion().setFromAxisAngle(up, this.branchAngle)
        this.state.direction.applyQuaternion(quat).normalize()
        return null
      }
      case '-': {
        const quat = new THREE.Quaternion().setFromAxisAngle(up, -this.branchAngle)
        this.state.direction.applyQuaternion(quat).normalize()
        return null
      }
      case '&': {
        const quat = new THREE.Quaternion().setFromAxisAngle(right, this.branchAngle)
        this.state.direction.applyQuaternion(quat).normalize()
        return null
      }
      case '^': {
        const quat = new THREE.Quaternion().setFromAxisAngle(right, -this.branchAngle)
        this.state.direction.applyQuaternion(quat).normalize()
        return null
      }
      case '[':
        this.stateStack.push({
          position: this.state.position.clone(),
          direction: this.state.direction.clone(),
          thickness: this.state.thickness,
          depth: this.state.depth + 1,
        })
        this.state.depth++
        return null
      case ']': {
        const popped = this.stateStack.pop()
        if (popped) {
          this.state = popped
        }
        return null
      }
      default:
        return null
    }
  }

  getState(): LSystemState {
    return { ...this.state }
  }

  setBranchAngle(angle: number): void {
    this.branchAngle = angle
  }
}
