import { ref, onUnmounted } from 'vue'
import vertexShaderSource from '../shaders/vertex.glsl?raw'
import allenCahnShaderSource from '../shaders/allenCahn.glsl?raw'
import cahnHilliardShaderSource from '../shaders/cahnHilliard.glsl?raw'
import gradientShaderSource from '../shaders/gradient.glsl?raw'
import renderShaderSource from '../shaders/render.glsl?raw'
import type { SimulationParams } from '../types/simulation'

interface ShaderProgram {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}

function createShaderProgram(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
  uniformNames: string[]
): ShaderProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)

  if (!vertexShader || !fragmentShader) return null

  const program = createProgram(gl, vertexShader, fragmentShader)
  if (!program) return null

  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }

  return { program, uniforms }
}

function createFloatTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  data: Float32Array | null = null
): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    width,
    height,
    0,
    gl.RGBA,
    gl.FLOAT,
    data
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}

export function useWebGL() {
  const glContext = ref<WebGL2RenderingContext | null>(null)
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const isInitialized = ref(false)
  const error = ref<string | null>(null)

  let allenCahnProgram: ShaderProgram | null = null
  let cahnHilliardProgram: ShaderProgram | null = null
  let gradientProgram: ShaderProgram | null = null
  let renderProgram: ShaderProgram | null = null

  let phasePing: WebGLTexture | null = null
  let phasePong: WebGLTexture | null = null
  let concentrationPing: WebGLTexture | null = null
  let concentrationPong: WebGLTexture | null = null
  let gradientTexture: WebGLTexture | null = null

  let framebuffer: WebGLFramebuffer | null = null
  let vertexBuffer: WebGLBuffer | null = null
  let vertexArray: WebGLVertexArrayObject | null = null

  let gridWidth = 512
  let gridHeight = 512

  function init(canvas: HTMLCanvasElement, width: number, height: number) {
    canvasRef.value = canvas
    gridWidth = width
    gridHeight = height

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      preserveDrawingBuffer: true
    })

    if (!gl) {
      error.value = 'WebGL2 not supported'
      return false
    }

    const floatTextureExt = gl.getExtension('EXT_color_buffer_float')
    if (!floatTextureExt) {
      error.value = 'Float texture not supported'
      return false
    }

    glContext.value = gl

    allenCahnProgram = createShaderProgram(gl, allenCahnShaderSource, [
      'u_phaseField',
      'u_concentrationField',
      'u_resolution',
      'u_time',
      'u_timeStep',
      'u_undercooling',
      'u_anisotropyStrength',
      'u_anisotropyMode',
      'u_interfaceThickness',
      'u_noiseAmplitude',
      'u_mobility'
    ])

    cahnHilliardProgram = createShaderProgram(gl, cahnHilliardShaderSource, [
      'u_phaseField',
      'u_concentrationField',
      'u_resolution',
      'u_timeStep',
      'u_mobility'
    ])

    gradientProgram = createShaderProgram(gl, gradientShaderSource, [
      'u_phaseField',
      'u_resolution'
    ])

    renderProgram = createShaderProgram(gl, renderShaderSource, [
      'u_phaseField',
      'u_concentrationField',
      'u_gradientField',
      'u_visualMode',
      'u_time',
      'u_resolution'
    ])

    if (!allenCahnProgram || !cahnHilliardProgram || !gradientProgram || !renderProgram) {
      error.value = 'Failed to create shader programs'
      return false
    }

    phasePing = createFloatTexture(gl, gridWidth, gridHeight)
    phasePong = createFloatTexture(gl, gridWidth, gridHeight)
    concentrationPing = createFloatTexture(gl, gridWidth, gridHeight)
    concentrationPong = createFloatTexture(gl, gridWidth, gridHeight)
    gradientTexture = createFloatTexture(gl, gridWidth, gridHeight)

    if (!phasePing || !phasePong || !concentrationPing || !concentrationPong || !gradientTexture) {
      error.value = 'Failed to create textures'
      return false
    }

    framebuffer = gl.createFramebuffer()

    vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW)

    vertexArray = gl.createVertexArray()
    gl.bindVertexArray(vertexArray)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    isInitialized.value = true
    return true
  }

  function initializeFields(params: SimulationParams) {
    const gl = glContext.value
    if (!gl) return

    const phaseData = new Float32Array(gridWidth * gridHeight * 4)
    const concentrationData = new Float32Array(gridWidth * gridHeight * 4)

    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4

        let phi = 0.0
        for (const nucleus of params.nuclei) {
          const nx = nucleus.x * gridWidth
          const ny = nucleus.y * gridHeight
          const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2)
          if (dist < nucleus.radius) {
            phi = 1.0
          } else if (dist < nucleus.radius + params.interfaceThickness) {
            const t = (dist - nucleus.radius) / params.interfaceThickness
            phi = Math.max(phi, 0.5 * (1 + Math.cos(t * Math.PI)))
          }
        }

        phaseData[idx] = phi
        phaseData[idx + 1] = 0
        phaseData[idx + 2] = 0
        phaseData[idx + 3] = 1

        concentrationData[idx] = 0.3 + phi * 0.4
        concentrationData[idx + 1] = 0
        concentrationData[idx + 2] = 0
        concentrationData[idx + 3] = 1
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, phasePing)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gridWidth, gridHeight, gl.RGBA, gl.FLOAT, phaseData)
    
    gl.bindTexture(gl.TEXTURE_2D, concentrationPing)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gridWidth, gridHeight, gl.RGBA, gl.FLOAT, concentrationData)

    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  function stepSimulation(params: SimulationParams, time: number) {
    const gl = glContext.value
    if (!gl || !isInitialized.value) return

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.bindVertexArray(vertexArray)
    gl.viewport(0, 0, gridWidth, gridHeight)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, phasePong, 0)
    gl.useProgram(allenCahnProgram!.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, phasePing)
    gl.uniform1i(allenCahnProgram!.uniforms.u_phaseField!, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, concentrationPing)
    gl.uniform1i(allenCahnProgram!.uniforms.u_concentrationField!, 1)
    gl.uniform2f(allenCahnProgram!.uniforms.u_resolution!, gridWidth, gridHeight)
    gl.uniform1f(allenCahnProgram!.uniforms.u_time!, time)
    gl.uniform1f(allenCahnProgram!.uniforms.u_timeStep!, params.timeStep)
    gl.uniform1f(allenCahnProgram!.uniforms.u_undercooling!, params.undercooling)
    gl.uniform1f(allenCahnProgram!.uniforms.u_anisotropyStrength!, params.anisotropyStrength)
    gl.uniform1f(allenCahnProgram!.uniforms.u_anisotropyMode!, params.anisotropyMode)
    gl.uniform1f(allenCahnProgram!.uniforms.u_interfaceThickness!, params.interfaceThickness)
    gl.uniform1f(allenCahnProgram!.uniforms.u_noiseAmplitude!, params.noiseAmplitude)
    gl.uniform1f(allenCahnProgram!.uniforms.u_mobility!, params.mobility)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const tempPhase = phasePing
    phasePing = phasePong
    phasePong = tempPhase

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, concentrationPong, 0)
    gl.useProgram(cahnHilliardProgram!.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, phasePing)
    gl.uniform1i(cahnHilliardProgram!.uniforms.u_phaseField!, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, concentrationPing)
    gl.uniform1i(cahnHilliardProgram!.uniforms.u_concentrationField!, 1)
    gl.uniform2f(cahnHilliardProgram!.uniforms.u_resolution!, gridWidth, gridHeight)
    gl.uniform1f(cahnHilliardProgram!.uniforms.u_timeStep!, params.timeStep)
    gl.uniform1f(cahnHilliardProgram!.uniforms.u_mobility!, params.mobility)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    const tempConc = concentrationPing
    concentrationPing = concentrationPong
    concentrationPong = tempConc

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gradientTexture, 0)
    gl.useProgram(gradientProgram!.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, phasePing)
    gl.uniform1i(gradientProgram!.uniforms.u_phaseField!, 0)
    gl.uniform2f(gradientProgram!.uniforms.u_resolution!, gridWidth, gridHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  function render(visualMode: number, time: number) {
    const gl = glContext.value
    if (!gl || !isInitialized.value) return

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindVertexArray(vertexArray)
    gl.viewport(0, 0, gridWidth, gridHeight)

    gl.useProgram(renderProgram!.program)
    
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, phasePing)
    gl.uniform1i(renderProgram!.uniforms.u_phaseField!, 0)
    
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, concentrationPing)
    gl.uniform1i(renderProgram!.uniforms.u_concentrationField!, 1)
    
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, gradientTexture)
    gl.uniform1i(renderProgram!.uniforms.u_gradientField!, 2)
    
    gl.uniform1i(renderProgram!.uniforms.u_visualMode!, visualMode)
    gl.uniform1f(renderProgram!.uniforms.u_time!, time)
    gl.uniform2f(renderProgram!.uniforms.u_resolution!, gridWidth, gridHeight)
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  function readPhaseField(): Float32Array {
    const gl = glContext.value
    if (!gl) return new Float32Array()

    const data = new Float32Array(gridWidth * gridHeight * 4)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, phasePing, 0)
    gl.readPixels(0, 0, gridWidth, gridHeight, gl.RGBA, gl.FLOAT, data)
    return data
  }

  function readConcentrationField(): Float32Array {
    const gl = glContext.value
    if (!gl) return new Float32Array()

    const data = new Float32Array(gridWidth * gridHeight * 4)
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, concentrationPing, 0)
    gl.readPixels(0, 0, gridWidth, gridHeight, gl.RGBA, gl.FLOAT, data)
    return data
  }

  function cleanup() {
    const gl = glContext.value
    if (!gl) return

    if (phasePing) gl.deleteTexture(phasePing)
    if (phasePong) gl.deleteTexture(phasePong)
    if (concentrationPing) gl.deleteTexture(concentrationPing)
    if (concentrationPong) gl.deleteTexture(concentrationPong)
    if (gradientTexture) gl.deleteTexture(gradientTexture)
    if (framebuffer) gl.deleteFramebuffer(framebuffer)
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer)
    if (vertexArray) gl.deleteVertexArray(vertexArray)
    if (allenCahnProgram) gl.deleteProgram(allenCahnProgram.program)
    if (cahnHilliardProgram) gl.deleteProgram(cahnHilliardProgram.program)
    if (gradientProgram) gl.deleteProgram(gradientProgram.program)
    if (renderProgram) gl.deleteProgram(renderProgram.program)
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    glContext,
    canvasRef,
    isInitialized,
    error,
    gridWidth,
    gridHeight,
    init,
    initializeFields,
    stepSimulation,
    render,
    readPhaseField,
    readConcentrationField,
    cleanup
  }
}
