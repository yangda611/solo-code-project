class FluidSolver {
  constructor(nx, ny, nz) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.dx = 1.0;
    this.dy = 1.0;
    this.dz = 1.0;
    
    this.u = new Array(nx + 1).fill(0).map(() => 
      new Array(ny).fill(0).map(() => new Array(nz).fill(0))
    );
    this.v = new Array(nx).fill(0).map(() => 
      new Array(ny + 1).fill(0).map(() => new Array(nz).fill(0))
    );
    this.w = new Array(nx).fill(0).map(() => 
      new Array(ny).fill(0).map(() => new Array(nz + 1).fill(0))
    );
    this.p = new Array(nx).fill(0).map(() => 
      new Array(ny).fill(0).map(() => new Array(nz).fill(0))
    );
    
    this.density = new Array(nx).fill(0).map(() => 
      new Array(ny).fill(0).map(() => new Array(nz).fill(0.5))
    );
    this.densityFiltered = new Array(nx).fill(0).map(() => 
      new Array(ny).fill(0).map(() => new Array(nz).fill(0.5))
    );
    
    this.inlet = [];
    this.outlet = [];
    this.solid = [];
    
    this.reynolds = 100;
    this.mu = 0.001;
    this.rho = 1.0;
    
    this.alphaMin = 1e-9;
    this.alphaMax = 1.0;
    this.q = 1.0;
  }

  setBoundaryConditions(inlet, outlet, solid) {
    this.inlet = inlet || [];
    this.outlet = outlet || [];
    this.solid = solid || [];
    
    this.solid.forEach(s => {
      const startX = Math.max(0, Math.floor(s.x));
      const endX = Math.min(this.nx, Math.ceil(s.x + s.sx));
      const startY = Math.max(0, Math.floor(s.y));
      const endY = Math.min(this.ny, Math.ceil(s.y + s.sy));
      const startZ = Math.max(0, Math.floor(s.z));
      const endZ = Math.min(this.nz, Math.ceil(s.z + s.sz));
      
      for (let i = startX; i < endX; i++) {
        for (let j = startY; j < endY; j++) {
          for (let k = startZ; k < endZ; k++) {
            this.density[i][j][k] = 0.0;
            this.densityFiltered[i][j][k] = 0.0;
          }
        }
      }
    });
  }

  interpolateVelocity(x, y, z) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const k = Math.floor(z);
    
    if (i < 0 || i >= this.nx - 1 || j < 0 || j >= this.ny - 1 || k < 0 || k >= this.nz - 1) {
      return { u: 0, v: 0, w: 0 };
    }
    
    const fx = x - i;
    const fy = y - j;
    const fz = z - k;
    
    const u = (1 - fx) * (1 - fy) * (1 - fz) * this.u[i][j][k] +
              fx * (1 - fy) * (1 - fz) * this.u[i + 1][j][k] +
              (1 - fx) * fy * (1 - fz) * this.u[i][j + 1][k] +
              fx * fy * (1 - fz) * this.u[i + 1][j + 1][k] +
              (1 - fx) * (1 - fy) * fz * this.u[i][j][k + 1] +
              fx * (1 - fy) * fz * this.u[i + 1][j][k + 1] +
              (1 - fx) * fy * fz * this.u[i][j + 1][k + 1] +
              fx * fy * fz * this.u[i + 1][j + 1][k + 1];
    
    const v = (1 - fx) * (1 - fy) * (1 - fz) * this.v[i][j][k] +
              fx * (1 - fy) * (1 - fz) * this.v[i + 1][j][k] +
              (1 - fx) * fy * (1 - fz) * this.v[i][j + 1][k] +
              fx * fy * (1 - fz) * this.v[i + 1][j + 1][k] +
              (1 - fx) * (1 - fy) * fz * this.v[i][j][k + 1] +
              fx * (1 - fy) * fz * this.v[i + 1][j][k + 1] +
              (1 - fx) * fy * fz * this.v[i][j + 1][k + 1] +
              fx * fy * fz * this.v[i + 1][j + 1][k + 1];
    
    const w = (1 - fx) * (1 - fy) * (1 - fz) * this.w[i][j][k] +
              fx * (1 - fy) * (1 - fz) * this.w[i + 1][j][k] +
              (1 - fx) * fy * (1 - fz) * this.w[i][j + 1][k] +
              fx * fy * (1 - fz) * this.w[i + 1][j + 1][k] +
              (1 - fx) * (1 - fy) * fz * this.w[i][j][k + 1] +
              fx * (1 - fy) * fz * this.w[i + 1][j][k + 1] +
              (1 - fx) * fy * fz * this.w[i][j + 1][k + 1] +
              fx * fy * fz * this.w[i + 1][j + 1][k + 1];
    
    return { u, v, w };
  }

  solveNavierStokes(maxIter = 100, tol = 1e-5) {
    const nu = this.mu / this.rho;
    let iter = 0;
    let residual = Infinity;
    
    while (iter < maxIter && residual > tol) {
      residual = 0;
      
      for (let i = 1; i < this.nx - 1; i++) {
        for (let j = 1; j < this.ny - 1; j++) {
          for (let k = 1; k < this.nz - 1; k++) {
            const rho = this.getInterpolatedDensity(i, j, k);
            const alpha = this.alphaMin + (this.alphaMax - this.alphaMin) * Math.pow(rho, this.q);
            
            const uOld = this.u[i][j][k];
            const vOld = this.v[i][j][k];
            const wOld = this.w[i][j][k];
            
            const uConvec = (this.u[i + 1][j][k] + this.u[i][j][k]) / 2 * 
                           (this.u[i + 1][j][k] - this.u[i - 1][j][k]) / (2 * this.dx) +
                           (this.v[i][j][k] + this.v[i + 1][j][k]) / 2 *
                           (this.u[i][j + 1][k] - this.u[i][j - 1][k]) / (2 * this.dy) +
                           (this.w[i][j][k] + this.w[i + 1][j][k]) / 2 *
                           (this.u[i][j][k + 1] - this.u[i][j][k - 1]) / (2 * this.dz);
            
            const vConvec = (this.u[i][j][k] + this.u[i][j + 1][k]) / 2 *
                           (this.v[i + 1][j][k] - this.v[i - 1][j][k]) / (2 * this.dx) +
                           (this.v[i][j + 1][k] + this.v[i][j][k]) / 2 *
                           (this.v[i][j + 1][k] - this.v[i][j - 1][k]) / (2 * this.dy) +
                           (this.w[i][j][k] + this.w[i][j + 1][k]) / 2 *
                           (this.v[i][j][k + 1] - this.v[i][j][k - 1]) / (2 * this.dz);
            
            const wConvec = (this.u[i][j][k] + this.u[i][j][k + 1]) / 2 *
                           (this.w[i + 1][j][k] - this.w[i - 1][j][k]) / (2 * this.dx) +
                           (this.v[i][j][k] + this.v[i][j][k + 1]) / 2 *
                           (this.w[i][j + 1][k] - this.w[i][j - 1][k]) / (2 * this.dy) +
                           (this.w[i][j][k + 1] + this.w[i][j][k]) / 2 *
                           (this.w[i][j][k + 1] - this.w[i][j][k - 1]) / (2 * this.dz);
            
            const uDiff = nu * (
              (this.u[i + 1][j][k] - 2 * this.u[i][j][k] + this.u[i - 1][j][k]) / (this.dx * this.dx) +
              (this.u[i][j + 1][k] - 2 * this.u[i][j][k] + this.u[i][j - 1][k]) / (this.dy * this.dy) +
              (this.u[i][j][k + 1] - 2 * this.u[i][j][k] + this.u[i][j][k - 1]) / (this.dz * this.dz)
            );
            
            const vDiff = nu * (
              (this.v[i + 1][j][k] - 2 * this.v[i][j][k] + this.v[i - 1][j][k]) / (this.dx * this.dx) +
              (this.v[i][j + 1][k] - 2 * this.v[i][j][k] + this.v[i][j - 1][k]) / (this.dy * this.dy) +
              (this.v[i][j][k + 1] - 2 * this.v[i][j][k] + this.v[i][j][k - 1]) / (this.dz * this.dz)
            );
            
            const wDiff = nu * (
              (this.w[i + 1][j][k] - 2 * this.w[i][j][k] + this.w[i - 1][j][k]) / (this.dx * this.dx) +
              (this.w[i][j + 1][k] - 2 * this.w[i][j][k] + this.w[i][j - 1][k]) / (this.dy * this.dy) +
              (this.w[i][j][k + 1] - 2 * this.w[i][j][k] + this.w[i][j][k - 1]) / (this.dz * this.dz)
            );
            
            const pGradU = (this.p[i][j][k] - this.p[i - 1][j][k]) / this.dx;
            const pGradV = (this.p[i][j][k] - this.p[i][j - 1][k]) / this.dy;
            const pGradW = (this.p[i][j][k] - this.p[i][j][k - 1]) / this.dz;
            
            this.u[i][j][k] = uOld + 0.01 * (-uConvec + uDiff - pGradU / this.rho - alpha * uOld);
            this.v[i][j][k] = vOld + 0.01 * (-vConvec + vDiff - pGradV / this.rho - alpha * vOld);
            this.w[i][j][k] = wOld + 0.01 * (-wConvec + wDiff - pGradW / this.rho - alpha * wOld);
            
            residual += Math.abs(this.u[i][j][k] - uOld) + 
                       Math.abs(this.v[i][j][k] - vOld) + 
                       Math.abs(this.w[i][j][k] - wOld);
          }
        }
      }
      
      this.applyBoundaryVelocities();
      this.projectPressure();
      iter++;
    }
    
    return { iterations: iter, residual };
  }

  applyBoundaryVelocities() {
    this.inlet.forEach(inlet => {
      const velocity = inlet.value || 1.0;
      for (let i = Math.max(0, Math.floor(inlet.x)); i < Math.min(this.nx, Math.ceil(inlet.x + inlet.sx)); i++) {
        for (let j = Math.max(0, Math.floor(inlet.y)); j < Math.min(this.ny, Math.ceil(inlet.y + inlet.sy)); j++) {
          for (let k = Math.max(0, Math.floor(inlet.z)); k < Math.min(this.nz, Math.ceil(inlet.z + inlet.sz)); k++) {
            this.u[i][j][k] = velocity;
            this.v[i][j][k] = 0;
            this.w[i][j][k] = 0;
          }
        }
      }
    });
    
    this.outlet.forEach(outlet => {
      for (let i = Math.max(0, Math.floor(outlet.x)); i < Math.min(this.nx, Math.ceil(outlet.x + outlet.sx)); i++) {
        for (let j = Math.max(0, Math.floor(outlet.y)); j < Math.min(this.ny, Math.ceil(outlet.y + outlet.sy)); j++) {
          for (let k = Math.max(0, Math.floor(outlet.z)); k < Math.min(this.nz, Math.ceil(outlet.z + outlet.sz)); k++) {
            this.p[i][j][k] = 0;
          }
        }
      }
    });
    
    for (let j = 0; j < this.ny; j++) {
      for (let k = 0; k < this.nz; k++) {
        this.u[0][j][k] = 0;
        this.u[this.nx - 1][j][k] = 0;
      }
    }
    for (let i = 0; i < this.nx; i++) {
      for (let k = 0; k < this.nz; k++) {
        this.v[i][0][k] = 0;
        this.v[i][this.ny - 1][k] = 0;
      }
    }
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        this.w[i][j][0] = 0;
        this.w[i][j][this.nz - 1] = 0;
      }
    }
  }

  projectPressure(maxIter = 50) {
    for (let iter = 0; iter < maxIter; iter++) {
      for (let i = 1; i < this.nx - 1; i++) {
        for (let j = 1; j < this.ny - 1; j++) {
          for (let k = 1; k < this.nz - 1; k++) {
            const div = (this.u[i + 1][j][k] - this.u[i][j][k]) / this.dx +
                       (this.v[i][j + 1][k] - this.v[i][j][k]) / this.dy +
                       (this.w[i][j][k + 1] - this.w[i][j][k]) / this.dz;
            
            const pUpdate = div * (this.dx * this.dy * this.dz) / 6;
            this.p[i][j][k] -= 0.1 * pUpdate;
          }
        }
      }
      
      for (let i = 1; i < this.nx - 1; i++) {
        for (let j = 1; j < this.ny - 1; j++) {
          for (let k = 1; k < this.nz - 1; k++) {
            const pGradX = (this.p[i][j][k] - this.p[i - 1][j][k]) / this.dx;
            const pGradY = (this.p[i][j][k] - this.p[i][j - 1][k]) / this.dy;
            const pGradZ = (this.p[i][j][k] - this.p[i][j][k - 1]) / this.dz;
            
            this.u[i][j][k] -= 0.1 * pGradX / this.rho;
            this.v[i][j][k] -= 0.1 * pGradY / this.rho;
            this.w[i][j][k] -= 0.1 * pGradZ / this.rho;
          }
        }
      }
    }
  }

  getInterpolatedDensity(i, j, k) {
    const iClamp = Math.max(0, Math.min(this.nx - 1, i));
    const jClamp = Math.max(0, Math.min(this.ny - 1, j));
    const kClamp = Math.max(0, Math.min(this.nz - 1, k));
    return this.densityFiltered[iClamp][jClamp][kClamp];
  }

  computeObjectiveAndSensitivity() {
    let objective = 0;
    const sensitivity = new Array(this.nx).fill(0).map(() => 
      new Array(this.ny).fill(0).map(() => new Array(this.nz).fill(0))
    );
    
    for (let i = 1; i < this.nx - 1; i++) {
      for (let j = 1; j < this.ny - 1; j++) {
        for (let k = 1; k < this.nz - 1; k++) {
          const rho = this.densityFiltered[i][j][k];
          const alpha = this.alphaMin + (this.alphaMax - this.alphaMin) * Math.pow(rho, this.q);
          
          const uMag = this.u[i][j][k] * this.u[i][j][k] + 
                      this.v[i][j][k] * this.v[i][j][k] + 
                      this.w[i][j][k] * this.w[i][j][k];
          
          objective += alpha * uMag * this.dx * this.dy * this.dz;
          sensitivity[i][j][k] = -(this.alphaMax - this.alphaMin) * this.q * 
                                Math.pow(rho, this.q - 1) * uMag * this.dx * this.dy * this.dz;
        }
      }
    }
    
    return { objective, sensitivity };
  }

  applyDensityFilter(filterRadius = 2) {
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          let sum = 0;
          let weightSum = 0;
          
          for (let di = -filterRadius; di <= filterRadius; di++) {
            for (let dj = -filterRadius; dj <= filterRadius; dj++) {
              for (let dk = -filterRadius; dk <= filterRadius; dk++) {
                const ni = i + di;
                const nj = j + dj;
                const nk = k + dk;
                
                if (ni >= 0 && ni < this.nx && nj >= 0 && nj < this.ny && nk >= 0 && nk < this.nz) {
                  const dist = Math.sqrt(di * di + dj * dj + dk * dk);
                  const weight = Math.max(0, filterRadius - dist);
                  sum += weight * this.density[ni][nj][nk];
                  weightSum += weight;
                }
              }
            }
          }
          
          this.densityFiltered[i][j][k] = sum / weightSum;
        }
      }
    }
  }

  applyHeavisideProjection(eta = 0.5, beta = 8) {
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          const rho = this.densityFiltered[i][j][k];
          const exp1 = Math.exp(-beta * eta);
          const exp2 = Math.exp(-beta * (1 - eta));
          const exprho = Math.exp(-beta * (rho - eta));
          this.densityFiltered[i][j][k] = (exprho - exp1) / (exp2 - exp1);
          this.densityFiltered[i][j][k] = Math.max(0, Math.min(1, this.densityFiltered[i][j][k]));
        }
      }
    }
  }

  updateDensities(sensitivity, learningRate = 0.05) {
    let maxChange = 0;
    
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          let isSolid = false;
          this.solid.forEach(s => {
            if (i >= s.x && i < s.x + s.sx && j >= s.y && j < s.y + s.sy && k >= s.z && k < s.z + s.sz) {
              isSolid = true;
            }
          });
          
          if (!isSolid) {
            const oldDensity = this.density[i][j][k];
            let newDensity = oldDensity - learningRate * sensitivity[i][j][k];
            newDensity = Math.max(0.001, Math.min(1, newDensity));
            this.density[i][j][k] = newDensity;
            maxChange = Math.max(maxChange, Math.abs(newDensity - oldDensity));
          }
        }
      }
    }
    
    return maxChange;
  }

  computePressureDrop() {
    let inletPressure = 0;
    let outletPressure = 0;
    let inletCount = 0;
    let outletCount = 0;
    
    this.inlet.forEach(inlet => {
      for (let i = Math.max(0, Math.floor(inlet.x)); i < Math.min(this.nx, Math.ceil(inlet.x + inlet.sx)); i++) {
        for (let j = Math.max(0, Math.floor(inlet.y)); j < Math.min(this.ny, Math.ceil(inlet.y + inlet.sy)); j++) {
          for (let k = Math.max(0, Math.floor(inlet.z)); k < Math.min(this.nz, Math.ceil(inlet.z + inlet.sz)); k++) {
            inletPressure += this.p[i][j][k];
            inletCount++;
          }
        }
      }
    });
    
    this.outlet.forEach(outlet => {
      for (let i = Math.max(0, Math.floor(outlet.x)); i < Math.min(this.nx, Math.ceil(outlet.x + outlet.sx)); i++) {
        for (let j = Math.max(0, Math.floor(outlet.y)); j < Math.min(this.ny, Math.ceil(outlet.y + outlet.sy)); j++) {
          for (let k = Math.max(0, Math.floor(outlet.z)); k < Math.min(this.nz, Math.ceil(outlet.z + outlet.sz)); k++) {
            outletPressure += this.p[i][j][k];
            outletCount++;
          }
        }
      }
    });
    
    if (inletCount > 0 && outletCount > 0) {
      return (inletPressure / inletCount) - (outletPressure / outletCount);
    }
    return 0;
  }

  getVelocityField() {
    const velocities = [];
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          velocities.push({
            x: i,
            y: j,
            z: k,
            u: this.u[i][j][k],
            v: this.v[i][j][k],
            w: this.w[i][j][k]
          });
        }
      }
    }
    return velocities;
  }

  getPressureField() {
    const pressures = [];
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          pressures.push({
            x: i,
            y: j,
            z: k,
            p: this.p[i][j][k]
          });
        }
      }
    }
    return pressures;
  }

  getDensityField() {
    const densities = [];
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          densities.push({
            x: i,
            y: j,
            z: k,
            rho: this.density[i][j][k],
            rhoFiltered: this.densityFiltered[i][j][k]
          });
        }
      }
    }
    return densities;
  }
}

module.exports = FluidSolver;
