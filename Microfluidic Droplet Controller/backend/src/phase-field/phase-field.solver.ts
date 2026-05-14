export interface PhaseFieldConfig {
  width: number;
  height: number;
  dx: number;
  dy: number;
  interfacialTension: number;
  mobility: number;
  relaxationTime: number;
}

export interface SimulationResult {
  phaseField: number[][];
  velocityField: { u: number[][]; v: number[][] };
  pressureField: number[][];
  droplets: Droplet[];
  averageSize: number;
  generationFrequency: number;
}

export interface Droplet {
  id: number;
  x: number;
  y: number;
  radius: number;
  volume: number;
  velocity: { x: number; y: number };
  isSatellite: boolean;
}

export class PhaseFieldSolver {
  private nx: number;
  private ny: number;
  private phi: number[][];
  private mu: number[][];
  private u: number[][];
  private v: number[][];
  private p: number[][];
  private config: PhaseFieldConfig;
  private dropletCount: number = 0;
  private time: number = 0;

  constructor(config: PhaseFieldConfig) {
    this.config = config;
    this.nx = Math.floor(config.width / config.dx);
    this.ny = Math.floor(config.height / config.dy);
    this.initializeFields();
  }

  private initializeFields(): void {
    this.phi = Array(this.ny).fill(null).map(() => Array(this.nx).fill(-1));
    this.mu = Array(this.ny).fill(null).map(() => Array(this.nx).fill(0));
    this.u = Array(this.ny).fill(null).map(() => Array(this.nx).fill(0));
    this.v = Array(this.ny).fill(null).map(() => Array(this.nx).fill(0));
    this.p = Array(this.ny).fill(null).map(() => Array(this.nx).fill(0));

    const inletWidth = Math.floor(this.ny * 0.3);
    const inletStart = Math.floor(this.ny * 0.35);
    
    for (let j = inletStart; j < inletStart + inletWidth; j++) {
      for (let i = 0; i < Math.floor(this.nx * 0.1); i++) {
        this.phi[j][i] = 1 + 0.1 * Math.sin(i * 0.5) * Math.cos(j * 0.3);
      }
    }
  }

  private calculateChemicalPotential(): void {
    const epsilon = this.config.interfacialTension * 0.1;
    
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const laplacianPhi = 
          (this.phi[j][i + 1] + this.phi[j][i - 1] - 2 * this.phi[j][i]) / (this.config.dx * this.config.dx) +
          (this.phi[j + 1][i] + this.phi[j - 1][i] - 2 * this.phi[j][i]) / (this.config.dy * this.config.dy);
        
        this.mu[j][i] = 
          (this.phi[j][i] * this.phi[j][i] * this.phi[j][i] - this.phi[j][i]) -
          epsilon * epsilon * laplacianPhi;
      }
    }
  }

  private advectPhaseField(dt: number): void {
    const newPhi = JSON.parse(JSON.stringify(this.phi));
    
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const dPhiDx = (this.phi[j][i + 1] - this.phi[j][i - 1]) / (2 * this.config.dx);
        const dPhiDy = (this.phi[j + 1][i] - this.phi[j - 1][i]) / (2 * this.config.dy);
        
        const advection = -(this.u[j][i] * dPhiDx + this.v[j][i] * dPhiDy);
        
        newPhi[j][i] += dt * (advection + this.config.mobility * this.mu[j][i]);
        newPhi[j][i] = Math.max(-1, Math.min(1, newPhi[j][i]));
      }
    }
    
    this.phi = newPhi;
  }

  private solveNavierStokes(dt: number, flowRateRatio: number): void {
    for (let j = 0; j < this.ny; j++) {
      this.u[j][0] = 0.001 * flowRateRatio;
    }

    const inletWidth = Math.floor(this.ny * 0.3);
    const inletStart = Math.floor(this.ny * 0.35);
    for (let j = inletStart; j < inletStart + inletWidth; j++) {
      this.v[j][0] = 0.0005;
    }

    const newU = JSON.parse(JSON.stringify(this.u));
    const newV = JSON.parse(JSON.stringify(this.v));

    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const rho = 1000 + 500 * this.phi[j][i];
        const mu = 0.001 + 0.001 * (1 + this.phi[j][i]) / 2;

        const convU = 
          this.u[j][i] * (this.u[j][i + 1] - this.u[j][i - 1]) / (2 * this.config.dx) +
          this.v[j][i] * (this.u[j + 1][i] - this.u[j - 1][i]) / (2 * this.config.dy);
        
        const convV = 
          this.u[j][i] * (this.v[j][i + 1] - this.v[j][i - 1]) / (2 * this.config.dx) +
          this.v[j][i] * (this.v[j + 1][i] - this.v[j - 1][i]) / (2 * this.config.dy);

        const laplacianU = 
          (this.u[j][i + 1] + this.u[j][i - 1] - 2 * this.u[j][i]) / (this.config.dx * this.config.dx) +
          (this.u[j + 1][i] + this.u[j - 1][i] - 2 * this.u[j][i]) / (this.config.dy * this.config.dy);
        
        const laplacianV = 
          (this.v[j][i + 1] + this.v[j][i - 1] - 2 * this.v[j][i]) / (this.config.dx * this.config.dx) +
          (this.v[j + 1][i] + this.v[j - 1][i] - 2 * this.v[j][i]) / (this.config.dy * this.config.dy);

        const gradPx = (this.p[j][i + 1] - this.p[j][i - 1]) / (2 * this.config.dx);
        const gradPy = (this.p[j + 1][i] - this.p[j - 1][i]) / (2 * this.config.dy);

        const surfaceTensionForceX = this.mu[j][i] * 
          (this.phi[j][i + 1] - this.phi[j][i - 1]) / (2 * this.config.dx);
        const surfaceTensionForceY = this.mu[j][i] * 
          (this.phi[j + 1][i] - this.phi[j - 1][i]) / (2 * this.config.dy);

        newU[j][i] += dt * (-convU - gradPx / rho + mu * laplacianU / rho + surfaceTensionForceX / rho);
        newV[j][i] += dt * (-convV - gradPy / rho + mu * laplacianV / rho + surfaceTensionForceY / rho);
      }
    }

    this.u = newU;
    this.v = newV;

    this.solvePressurePoisson(dt);
  }

  private solvePressurePoisson(dt: number): void {
    for (let iter = 0; iter < 20; iter++) {
      const newP = JSON.parse(JSON.stringify(this.p));
      
      for (let j = 1; j < this.ny - 1; j++) {
        for (let i = 1; i < this.nx - 1; i++) {
          const divU = 
            (this.u[j][i + 1] - this.u[j][i - 1]) / (2 * this.config.dx) +
            (this.v[j + 1][i] - this.v[j - 1][i]) / (2 * this.config.dy);

          const laplacianP = 
            (this.p[j][i + 1] + this.p[j][i - 1] - 2 * this.p[j][i]) / (this.config.dx * this.config.dx) +
            (this.p[j + 1][i] + this.p[j - 1][i] - 2 * this.p[j][i]) / (this.config.dy * this.config.dy);

          const rhs = (divU / dt - laplacianP) / (2 / (this.config.dx * this.config.dx) + 2 / (this.config.dy * this.config.dy));
          newP[j][i] += rhs * 0.8;
        }
      }
      
      this.p = newP;
    }
  }

  private detectDroplets(): Droplet[] {
    const droplets: Droplet[] = [];
    const visited = Array(this.ny).fill(null).map(() => Array(this.nx).fill(false));
    const threshold = 0.5;

    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        if (this.phi[j][i] > threshold && !visited[j][i]) {
          const droplet = this.floodFillDroplet(i, j, visited, threshold);
          if (droplet.volume > 0.1) {
            droplet.id = ++this.dropletCount;
            droplet.isSatellite = droplet.volume < 0.3;
            droplets.push(droplet);
          }
        }
      }
    }

    return droplets;
  }

  private floodFillDroplet(startI: number, startJ: number, visited: boolean[][], threshold: number): Droplet {
    const stack: [number, number][] = [[startI, startJ]];
    let sumX = 0, sumY = 0, count = 0;
    let maxDist = 0;

    while (stack.length > 0) {
      const [i, j] = stack.pop()!;
      
      if (i < 0 || i >= this.nx || j < 0 || j >= this.ny || visited[j][i] || this.phi[j][i] < threshold) {
        continue;
      }

      visited[j][i] = true;
      sumX += i * this.config.dx;
      sumY += j * this.config.dy;
      count++;

      stack.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
    }

    const centerX = sumX / count;
    const centerY = sumY / count;
    const volume = count * this.config.dx * this.config.dy;
    const radius = Math.sqrt(volume / Math.PI);

    return {
      id: 0,
      x: centerX,
      y: centerY,
      radius,
      volume,
      velocity: { 
        x: this.u[Math.round(centerY / this.config.dy)]?.[Math.round(centerX / this.config.dx)] || 0.001,
        y: 0
      },
      isSatellite: false,
    };
  }

  step(dt: number, flowRateRatio: number): SimulationResult {
    this.calculateChemicalPotential();
    this.solveNavierStokes(dt, flowRateRatio);
    this.advectPhaseField(dt);
    this.time += dt;

    const droplets = this.detectDroplets();
    const avgSize = droplets.length > 0 
      ? droplets.reduce((sum, d) => sum + d.radius, 0) / droplets.length 
      : 0;

    return {
      phaseField: this.phi,
      velocityField: { u: this.u, v: this.v },
      pressureField: this.p,
      droplets,
      averageSize: avgSize,
      generationFrequency: droplets.length / Math.max(1, this.time),
    };
  }

  getTime(): number {
    return this.time;
  }
}
