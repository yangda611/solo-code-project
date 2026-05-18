export class FFT {
  private n: number;
  private log2n: number;
  private cosTable: Float32Array;
  private sinTable: Float32Array;

  constructor(size: number) {
    this.n = size;
    this.log2n = Math.log2(size);
    
    this.cosTable = new Float32Array(size);
    this.sinTable = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
      this.cosTable[i] = Math.cos(-2 * Math.PI * i / size);
      this.sinTable[i] = Math.sin(-2 * Math.PI * i / size);
    }
  }

  transform(real: Float32Array, imag: Float32Array): void {
    const n = this.n;
    
    for (let i = 0; i < n; i++) {
      const j = this.reverseBits(i);
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    for (let s = 1; s <= this.log2n; s++) {
      const m = 1 << s;
      const m2 = m >> 1;
      
      for (let k = 0; k < n; k += m) {
        for (let j = 0; j < m2; j++) {
          const idx = (j * n) / m;
          const c = this.cosTable[idx];
          const si = this.sinTable[idx];
          
          const t1 = c * real[k + j + m2] - si * imag[k + j + m2];
          const t2 = si * real[k + j + m2] + c * imag[k + j + m2];
          
          real[k + j + m2] = real[k + j] - t1;
          imag[k + j + m2] = imag[k + j] - t2;
          real[k + j] += t1;
          imag[k + j] += t2;
        }
      }
    }
  }

  private reverseBits(i: number): number {
    let result = 0;
    for (let j = 0; j < this.log2n; j++) {
      result = (result << 1) | (i & 1);
      i >>= 1;
    }
    return result;
  }
}

export function computeMagnitudes(real: Float32Array, imag: Float32Array): Float32Array {
  const n = real.length;
  const magnitudes = new Float32Array(n / 2);
  
  for (let i = 0; i < n / 2; i++) {
    magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
  }
  
  return magnitudes;
}
