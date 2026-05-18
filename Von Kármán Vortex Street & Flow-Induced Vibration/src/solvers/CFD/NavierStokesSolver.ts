import { MacGrid } from './MacGrid';

export class NavierStokesSolver {
  grid: MacGrid;
  viscosity: number;
  dt: number;
  cylinderX: number;
  cylinderY: number;
  cylinderR: number;

  constructor(nx: number, ny: number, dx: number, dy: number, dt: number) {
    this.grid = new MacGrid(nx, ny, dx, dy);
    this.viscosity = 0.0;
    this.dt = dt;
    this.cylinderX = nx * dx * 0.3;
    this.cylinderY = ny * dy * 0.5;
    this.cylinderR = nx * dx * 0.05;
  }

  setReynolds(Re: number, U: number): void {
    this.viscosity = U * 2 * this.cylinderR / Re;
  }

  setCylinderPosition(y: number): void {
    this.cylinderY = y;
  }

  advectU(): void {
    const { grid, dt } = this;
    const { nx, ny, dx, dy, u, v } = grid;

    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx; i++) {
        const x = i * dx;
        const y = (j + 0.5) * dy;
        const [velU, velV] = this.getVelocityAt(x, y);
        const x0 = x - velU * dt;
        const y0 = y - velV * dt;
        grid.tmp[grid.idxU(i, j)] = this.interpolateU(x0, y0);
      }
    }

    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx; i++) {
        u[grid.idxU(i, j)] = grid.tmp[grid.idxU(i, j)];
      }
    }
  }

  advectV(): void {
    const { grid, dt } = this;
    const { nx, ny, dx, dy, u, v } = grid;

    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const x = (i + 0.5) * dx;
        const y = j * dy;
        const [velU, velV] = this.getVelocityAt(x, y);
        const x0 = x - velU * dt;
        const y0 = y - velV * dt;
        grid.tmp[grid.idxV(i, j)] = this.interpolateV(x0, y0);
      }
    }

    for (let j = 1; j < ny; j++) {
      for (let i = 1; i < nx - 1; i++) {
        v[grid.idxV(i, j)] = grid.tmp[grid.idxV(i, j)];
      }
    }
  }

  getVelocityAt(x: number, y: number): [number, number] {
    const { grid } = this;
    const { dx, dy } = grid;
    const i = Math.floor(x / dx);
    const j = Math.floor(y / dy);
    const fx = x / dx - i;
    const fy = y / dy - j;

    const u00 = grid.u[grid.clampU(i, j)];
    const u10 = grid.u[grid.clampU(i + 1, j)];
    const u01 = grid.u[grid.clampU(i, j + 1)];
    const u11 = grid.u[grid.clampU(i + 1, j + 1)];
    const u = (1 - fx) * (1 - fy) * u00 + fx * (1 - fy) * u10 + (1 - fx) * fy * u01 + fx * fy * u11;

    const v00 = grid.v[grid.clampV(i, j)];
    const v10 = grid.v[grid.clampV(i + 1, j)];
    const v01 = grid.v[grid.clampV(i, j + 1)];
    const v11 = grid.v[grid.clampV(i + 1, j + 1)];
    const v = (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;

    return [u, v];
  }

  interpolateU(x: number, y: number): number {
    const { grid } = this;
    const { dx, dy } = grid;
    const i = Math.floor(x / dx);
    const j = Math.floor((y - 0.5 * dy) / dy);
    const fx = x / dx - i;
    const fy = (y - 0.5 * dy) / dy - j;

    const u00 = grid.u[grid.clampU(i, j)];
    const u10 = grid.u[grid.clampU(i + 1, j)];
    const u01 = grid.u[grid.clampU(i, j + 1)];
    const u11 = grid.u[grid.clampU(i + 1, j + 1)];

    return (1 - fx) * (1 - fy) * u00 + fx * (1 - fy) * u10 + (1 - fx) * fy * u01 + fx * fy * u11;
  }

  interpolateV(x: number, y: number): number {
    const { grid } = this;
    const { dx, dy } = grid;
    const i = Math.floor((x - 0.5 * dx) / dx);
    const j = Math.floor(y / dy);
    const fx = (x - 0.5 * dx) / dx - i;
    const fy = y / dy - j;

    const v00 = grid.v[grid.clampV(i, j)];
    const v10 = grid.v[grid.clampV(i + 1, j)];
    const v01 = grid.v[grid.clampV(i, j + 1)];
    const v11 = grid.v[grid.clampV(i + 1, j + 1)];

    return (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;
  }

  diffuseU(): void {
    const { grid, viscosity, dt } = this;
    const { nx, ny, dx, dy, u } = grid;
    const a = dt * viscosity / (dx * dx);
    const b = dt * viscosity / (dy * dy);

    for (let iter = 0; iter < 20; iter++) {
      for (let j = 1; j < ny - 1; j++) {
        for (let i = 1; i < nx; i++) {
          const idx = grid.idxU(i, j);
          const left = grid.u[grid.idxU(i - 1, j)];
          const right = grid.u[grid.idxU(i + 1, j)];
          const down = grid.u[grid.idxU(i, j - 1)];
          const up = grid.u[grid.idxU(i, j + 1)];
          grid.tmp[idx] = (u[idx] + a * (left + right) + b * (down + up)) / (1 + 2 * a + 2 * b);
        }
      }
      for (let j = 1; j < ny - 1; j++) {
        for (let i = 1; i < nx; i++) {
          u[grid.idxU(i, j)] = grid.tmp[grid.idxU(i, j)];
        }
      }
    }
  }

  diffuseV(): void {
    const { grid, viscosity, dt } = this;
    const { nx, ny, dx, dy, v } = grid;
    const a = dt * viscosity / (dx * dx);
    const b = dt * viscosity / (dy * dy);

    for (let iter = 0; iter < 20; iter++) {
      for (let j = 1; j < ny; j++) {
        for (let i = 1; i < nx - 1; i++) {
          const idx = grid.idxV(i, j);
          const left = grid.v[grid.idxV(i - 1, j)];
          const right = grid.v[grid.idxV(i + 1, j)];
          const down = grid.v[grid.idxV(i, j - 1)];
          const up = grid.v[grid.idxV(i, j + 1)];
          grid.tmp[idx] = (v[idx] + a * (left + right) + b * (down + up)) / (1 + 2 * a + 2 * b);
        }
      }
      for (let j = 1; j < ny; j++) {
        for (let i = 1; i < nx - 1; i++) {
          v[grid.idxV(i, j)] = grid.tmp[grid.idxV(i, j)];
        }
      }
    }
  }

  applyCylinderBoundary(): void {
    const { grid } = this;
    const { nx, ny, dx, dy, u, v } = grid;
    const cx = this.cylinderX;
    const cy = this.cylinderY;
    const r = this.cylinderR;

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = i * dx;
        const y = (j + 0.5) * dy;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < r) {
          u[grid.idxU(i, j)] = 0;
        }
      }
    }

    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i < nx; i++) {
        const x = (i + 0.5) * dx;
        const y = j * dy;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < r) {
          v[grid.idxV(i, j)] = 0;
        }
      }
    }
  }

  applyInflowBoundary(U: number): void {
    const { grid } = this;
    const { nx, ny, u, v } = grid;

    for (let j = 0; j < ny; j++) {
      u[grid.idxU(0, j)] = U;
    }

    for (let j = 0; j <= ny; j++) {
      v[grid.idxV(0, j)] = 0;
    }
  }

  applyOutflowBoundary(): void {
    const { grid } = this;
    const { nx, ny, u, v } = grid;

    for (let j = 0; j < ny; j++) {
      u[grid.idxU(nx, j)] = u[grid.idxU(nx - 1, j)];
    }

    for (let j = 0; j <= ny; j++) {
      v[grid.idxV(nx - 1, j)] = v[grid.idxV(nx - 2, j)];
    }
  }

  applyWallBoundary(): void {
    const { grid } = this;
    const { nx, ny, u, v } = grid;

    for (let i = 0; i <= nx; i++) {
      u[grid.idxU(i, 0)] = 0;
      u[grid.idxU(i, ny - 1)] = 0;
    }

    for (let i = 0; i < nx; i++) {
      v[grid.idxV(i, 0)] = 0;
      v[grid.idxV(i, ny)] = 0;
    }
  }

  computeDivergence(): void {
    const { grid } = this;
    const { nx, ny, dx, dy, u, v, p } = grid;

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const divU = (u[grid.idxU(i + 1, j)] - u[grid.idxU(i, j)]) / dx;
        const divV = (v[grid.idxV(i, j + 1)] - v[grid.idxV(i, j)]) / dy;
        p[grid.idx(i, j)] = divU + divV;
      }
    }
  }

  pressureSolve(div: Float32Array): void {
    const { grid } = this;
    const { nx, ny, dx, dy, p } = grid;

    for (let iter = 0; iter < 50; iter++) {
      for (let j = 1; j < ny - 1; j++) {
        for (let i = 1; i < nx - 1; i++) {
          const idx = grid.idx(i, j);
          const left = p[grid.idx(i - 1, j)];
          const right = p[grid.idx(i + 1, j)];
          const down = p[grid.idx(i, j - 1)];
          const up = p[grid.idx(i, j + 1)];
          const divergence = div[idx];
          grid.tmp[idx] = (left + right + down + up - dx * dy * divergence) / 4;
        }
      }

      for (let j = 0; j < ny; j++) {
        grid.tmp[grid.idx(0, j)] = grid.tmp[grid.idx(1, j)];
        grid.tmp[grid.idx(nx - 1, j)] = grid.tmp[grid.idx(nx - 2, j)];
      }
      for (let i = 0; i < nx; i++) {
        grid.tmp[grid.idx(i, 0)] = grid.tmp[grid.idx(i, 1)];
        grid.tmp[grid.idx(i, ny - 1)] = grid.tmp[grid.idx(i, ny - 2)];
      }

      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          p[grid.idx(i, j)] = grid.tmp[grid.idx(i, j)];
        }
      }
    }
  }

  project(): void {
    const { grid, dt } = this;
    const { nx, ny, dx, dy, u, v, p } = grid;

    this.computeDivergence();

    const div = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        div[grid.idx(i, j)] = p[grid.idx(i, j)];
      }
    }

    p.fill(0);
    this.pressureSolve(div);

    for (let j = 0; j < ny; j++) {
      for (let i = 1; i < nx; i++) {
        u[grid.idxU(i, j)] -= (p[grid.idx(i, j)] - p[grid.idx(i - 1, j)]) / dx * dt;
      }
    }

    for (let j = 1; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        v[grid.idxV(i, j)] -= (p[grid.idx(i, j)] - p[grid.idx(i, j - 1)]) / dy * dt;
      }
    }
  }

  computeForces(U: number): [number, number] {
    const { grid } = this;
    const { dx, dy, p } = grid;
    const cx = this.cylinderX;
    const cy = this.cylinderY;
    const r = this.cylinderR;

    let lift = 0;
    let drag = 0;
    const nSamples = 32;

    for (let k = 0; k < nSamples; k++) {
      const theta = (k / nSamples) * 2 * Math.PI;
      const x = cx + r * Math.cos(theta);
      const y = cy + r * Math.sin(theta);
      const pressure = this.interpolatePressure(x, y);
      const nxDir = -Math.cos(theta);
      const nyDir = -Math.sin(theta);
      const ds = 2 * Math.PI * r / nSamples;
      drag += -pressure * nxDir * ds;
      lift += -pressure * nyDir * ds;
    }

    const refLength = 2 * r;
    const refArea = refLength * 1;
    const dynamicPressure = 0.5 * U * U * refArea;

    return [lift / dynamicPressure, drag / dynamicPressure];
  }

  interpolatePressure(x: number, y: number): number {
    const { grid } = this;
    const { dx, dy, p } = grid;
    const i = Math.floor(x / dx);
    const j = Math.floor(y / dy);
    const fx = x / dx - i;
    const fy = y / dy - j;

    const p00 = p[grid.clamp(i, j)];
    const p10 = p[grid.clamp(i + 1, j)];
    const p01 = p[grid.clamp(i, j + 1)];
    const p11 = p[grid.clamp(i + 1, j + 1)];

    return (1 - fx) * (1 - fy) * p00 + fx * (1 - fy) * p10 + (1 - fx) * fy * p01 + fx * fy * p11;
  }

  step(U: number): void {
    this.advectU();
    this.advectV();
    this.diffuseU();
    this.diffuseV();
    this.project();
    this.applyInflowBoundary(U);
    this.applyOutflowBoundary();
    this.applyWallBoundary();
    this.applyCylinderBoundary();
    this.grid.computeVorticity();
  }

  reset(U: number): void {
    this.grid.reset();
    this.applyInflowBoundary(U);
  }
}
