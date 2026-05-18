export class StructureSolver {
  y: number;
  yDot: number;
  yDDot: number;
  mass: number;
  stiffness: number;
  damping: number;
  equilibriumY: number;

  constructor(mass: number, stiffness: number, damping: number, equilibriumY: number) {
    this.mass = mass;
    this.stiffness = stiffness;
    this.damping = damping;
    this.equilibriumY = equilibriumY;
    this.y = equilibriumY;
    this.yDot = 0;
    this.yDDot = 0;
  }

  setParams(mass: number, stiffness: number, damping: number): void {
    this.mass = mass;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  step(force: number, dt: number): void {
    const displacement = this.y - this.equilibriumY;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.yDot;
    const totalForce = force + springForce + dampingForce;

    this.yDDot = totalForce / this.mass;

    this.yDot += this.yDDot * dt;
    this.y += this.yDot * dt;
  }

  reset(): void {
    this.y = this.equilibriumY;
    this.yDot = 0;
    this.yDDot = 0;
  }

  getDisplacement(): number {
    return this.y - this.equilibriumY;
  }

  getVelocity(): number {
    return this.yDot;
  }

  getNaturalFrequency(): number {
    return Math.sqrt(this.stiffness / this.mass);
  }
}
