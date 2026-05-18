import {
  vertexShaderSource,
  heightFragmentShader,
  velocityFragmentShader,
  renderFragmentShader
} from '../shaders/waveShaders';
import { WaveParams, GRID_SIZE, GRAVITY, DT } from '../types';

export class WaveSolver {
  private gl: WebGLRenderingContext;
  private width: number;
  private height: number;
  
  private heightProgram: WebGLProgram;
  private velocityProgram: WebGLProgram;
  private renderProgram: WebGLProgram;
  
  private heightTextures: WebGLTexture[];
  private velocityTextures: WebGLTexture[];
  private terrainTexture: WebGLTexture;
  
  private framebuffers: WebGLFramebuffer[];
  
  private currentHeightBuffer: number = 0;
  private currentVelocityBuffer: number = 0;
  
  private time: number = 0;
  private params: WaveParams;
  
  private positionBuffer: WebGLBuffer;
  
  constructor(canvas: HTMLCanvasElement, params: WaveParams) {
    this.gl = canvas.getContext('webgl')!;
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.width = GRID_SIZE;
    this.height = GRID_SIZE;
    this.params = params;
    
    this.heightTextures = [];
    this.velocityTextures = [];
    this.framebuffers = [];
    
    this.initShaders();
    this.initBuffers();
    this.initTextures();
  }
  
  private initShaders() {
    this.heightProgram = this.createProgram(vertexShaderSource, heightFragmentShader);
    this.velocityProgram = this.createProgram(vertexShaderSource, velocityFragmentShader);
    this.renderProgram = this.createProgram(vertexShaderSource, renderFragmentShader);
  }
  
  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    
    return program;
  }
  
  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }
  
  private initBuffers() {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
  }
  
  private initTextures() {
    this.heightTextures[0] = this.createFloatTexture();
    this.heightTextures[1] = this.createFloatTexture();
    this.velocityTextures[0] = this.createFloatTexture();
    this.velocityTextures[1] = this.createFloatTexture();
    this.terrainTexture = this.createFloatTexture();
    
    this.framebuffers[0] = this.gl.createFramebuffer()!;
    this.framebuffers[1] = this.gl.createFramebuffer()!;
    
    this.clearTexture(this.heightTextures[0]);
    this.clearTexture(this.heightTextures[1]);
    this.clearTexture(this.velocityTextures[0]);
    this.clearTexture(this.velocityTextures[1]);
  }
  
  private createFloatTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }
  
  private clearTexture(texture: WebGLTexture) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  
  setTerrain(terrain: number[][]) {
    const gl = this.gl;
    const data = new Float32Array(this.width * this.height * 4);
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const depth = terrain[y]?.[x] ?? 5;
        data[idx] = depth;
        data[idx + 1] = depth;
        data[idx + 2] = depth;
        data[idx + 3] = 1;
      }
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
  }
  
  setParams(params: WaveParams) {
    this.params = params;
  }
  
  step() {
    this.time += DT;
    
    this.stepHeight();
    this.stepVelocity();
    this.swapBuffers();
  }
  
  private stepHeight() {
    const gl = this.gl;
    const program = this.heightProgram;
    const readIdx = this.currentHeightBuffer;
    const writeIdx = 1 - this.currentHeightBuffer;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.heightTextures[writeIdx], 0);
    
    gl.viewport(0, 0, this.width, this.height);
    
    this.bindAttribute(program, 'a_position', 2);
    
    this.bindTexture(program, 'u_height', this.heightTextures[readIdx], 0);
    this.bindTexture(program, 'u_velocityX', this.velocityTextures[this.currentVelocityBuffer], 1);
    this.bindTexture(program, 'u_velocityY', this.velocityTextures[this.currentVelocityBuffer], 2);
    this.bindTexture(program, 'u_terrain', this.terrainTexture, 3);
    
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), this.time);
    gl.uniform1f(gl.getUniformLocation(program, 'u_dt'), DT);
    gl.uniform1f(gl.getUniformLocation(program, 'u_gravity'), GRAVITY);
    gl.uniform1f(gl.getUniformLocation(program, 'u_dispersion'), this.params.dispersionStrength);
    gl.uniform1f(gl.getUniformLocation(program, 'u_waveHeight'), this.params.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_wavePeriod'), this.params.period);
    gl.uniform1f(gl.getUniformLocation(program, 'u_waveDirection'), this.params.direction);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  private stepVelocity() {
    const gl = this.gl;
    const program = this.velocityProgram;
    const readIdx = this.currentVelocityBuffer;
    const writeIdx = 1 - this.currentVelocityBuffer;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[1]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.velocityTextures[writeIdx], 0);
    
    gl.viewport(0, 0, this.width, this.height);
    
    this.bindAttribute(program, 'a_position', 2);
    
    this.bindTexture(program, 'u_height', this.heightTextures[1 - this.currentHeightBuffer], 0);
    this.bindTexture(program, 'u_velocityX', this.velocityTextures[readIdx], 1);
    this.bindTexture(program, 'u_velocityY', this.velocityTextures[readIdx], 2);
    this.bindTexture(program, 'u_terrain', this.terrainTexture, 3);
    
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_dt'), DT);
    gl.uniform1f(gl.getUniformLocation(program, 'u_gravity'), GRAVITY);
    gl.uniform1f(gl.getUniformLocation(program, 'u_breakingThreshold'), this.params.breakingThreshold);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  private swapBuffers() {
    this.currentHeightBuffer = 1 - this.currentHeightBuffer;
    this.currentVelocityBuffer = 1 - this.currentVelocityBuffer;
  }
  
  private bindAttribute(program: WebGLProgram, name: string, size: number) {
    const gl = this.gl;
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }
  
  private bindTexture(program: WebGLProgram, name: string, texture: WebGLTexture, unit: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
  }
  
  render(canvas: HTMLCanvasElement, renderMode: number = 0) {
    const gl = this.gl;
    const program = this.renderProgram;
    
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    this.bindAttribute(program, 'a_position', 2);
    
    this.bindTexture(program, 'u_height', this.heightTextures[this.currentHeightBuffer], 0);
    this.bindTexture(program, 'u_velocityX', this.velocityTextures[this.currentVelocityBuffer], 1);
    this.bindTexture(program, 'u_velocityY', this.velocityTextures[this.currentVelocityBuffer], 2);
    this.bindTexture(program, 'u_terrain', this.terrainTexture, 3);
    
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), this.time);
    gl.uniform1f(gl.getUniformLocation(program, 'u_maxHeight'), this.params.height * 2);
    gl.uniform1i(gl.getUniformLocation(program, 'u_renderMode'), renderMode);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  
  getHeightData(): Float32Array {
    const gl = this.gl;
    const data = new Float32Array(this.width * this.height * 4);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.heightTextures[this.currentHeightBuffer], 0);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, data);
    
    return data;
  }
  
  getVelocityData(): Float32Array {
    const gl = this.gl;
    const data = new Float32Array(this.width * this.height * 4);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[1]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.velocityTextures[this.currentVelocityBuffer], 0);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, data);
    
    return data;
  }
  
  reset() {
    this.time = 0;
    this.clearTexture(this.heightTextures[0]);
    this.clearTexture(this.heightTextures[1]);
    this.clearTexture(this.velocityTextures[0]);
    this.clearTexture(this.velocityTextures[1]);
  }
  
  getTime(): number {
    return this.time;
  }
}
