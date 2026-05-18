export class MacGrid {
  nx: number;
  ny: number;
  dx: number;
  dy: number;
  u: Float32Array;
  v: Float32Array;
  p: Float32Array;
  vort: Float32Array;
  tmp: Float32Array;

  constructor(nx: number, ny: number, dx: number, dy: number) {
    this.nx = nx;
    this.ny = ny;
    this.dx = dx;
    this.dy = dy;
    this.u = new Float32Array((nx + 1) * ny);
    this.v = new Float32Array(nx * (ny + 1));
    this.p = new Float32Array(nx * ny);
    this.vort = new Float32Array(nx * ny);
    this.tmp = new Float32Array(nx * ny);
  }

  idxU(i: number, j: number): number {
    return j * (this.nx + 1) + i;
  }

  idxV(i: number, j: number): number {
    return j * this.nx + i;
  }

  idx(i: number, j: number): number {
    return j * this.nx + i;
  }

  clampU(i: number, j: number): number {
    i = Math.max(0, Math.min(this.nx, i));
    j = Math.max(0, Math.min(this.ny - 1, j));
    return this.idxU(i, j);
  }

  clampV(i: number, j: number): number {
    i = Math.max(0, Math.min(this.nx - 1, i));
    j = Math.max(0, Math.min(this.ny, j));
    return this.idxV(i, j);
  }

  clamp(i: number, j: number): number {
    i = Math.max(0, Math.min(this.nx - 1, i));
    j = Math.max(0, Math.min(this.ny - 1, j));
    return this.idx(i, j);
  }

  reset(): void {
    this.u.fill(0);
    this.v.fill(0);
    this.p.fill(0);
    this.vort.fill(0);
  }

  computeVorticity(): void {
    for (let j = 1; j < this.ny - 1; j++) {
      for (let i = 1; i < this.nx - 1; i++) {
        const duDy = (this.u[this.idxU(i, j + 1)] - this.u[this.idxU(i, j)]) / this.dy;
        const dvDx = (this.v[this.idxV(i + 1, j)] - this.v[this.idxV(i, j)]) / this.dx;
        this.vort[this.idx(i, j)] = dvDx - duDy;
      }
    }
  }

  getVelocityAt(x: number, y: number): [number, number] {
    const i = Math.floor(x / this.dx);
    const j = Math.floor(y / this.dy);
    const fx = x / this.dx - i;
    const fy = y / this.dy - j;

    const u00 = this.u[this.clampU(i, j)];
    const u10 = this.u[this.clampU(i + 1, j)];
    const u01 = this.u[this.clampU(i, j + 1)];
    const u11 = this.u[this.clampU(i + 1, j + 1)];
    const u = (1 - fx) * (1 - fy) * u00 + fx * (1 - fy) * u10 + (1 - fx) * fy * u01 + fx * fy * u11;

    const v00 = this.v[this.clampV(i, j)];
    const v10 = this.v[this.clampV(i + 1, j)];
    const v01 = this.v[this.clampV(i, j + 1)];
    const v11 = this.v[this.clampV(i + 1, j + 1)];
    const v = (1 - fx) * (1 - fy) * v00 + fx * (1 - fy) * v10 + (1 - fx) * fy * v01 + fx * fy * v11;

    return [u, v];
  }
}
