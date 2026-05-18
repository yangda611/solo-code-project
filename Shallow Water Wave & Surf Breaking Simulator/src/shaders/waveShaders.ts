export const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const heightFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_height;
  uniform sampler2D u_velocityX;
  uniform sampler2D u_velocityY;
  uniform sampler2D u_terrain;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_dt;
  uniform float u_gravity;
  uniform float u_dispersion;
  uniform float u_waveHeight;
  uniform float u_wavePeriod;
  uniform float u_waveDirection;
  
  varying vec2 v_uv;
  
  void main() {
    vec2 texel = 1.0 / u_resolution;
    
    float h = texture2D(u_height, v_uv).r;
    float hL = texture2D(u_height, v_uv - vec2(texel.x, 0.0)).r;
    float hR = texture2D(u_height, v_uv + vec2(texel.x, 0.0)).r;
    float hB = texture2D(u_height, v_uv - vec2(0.0, texel.y)).r;
    float hT = texture2D(u_height, v_uv + vec2(0.0, texel.y)).r;
    
    float d = texture2D(u_terrain, v_uv).r;
    float hTotal = max(h + d, 0.01);
    
    float u = texture2D(u_velocityX, v_uv).r;
    float v = texture2D(u_velocityY, v_uv).r;
    
    float gradHX = (hR - hL) / (2.0 * texel.x);
    float gradHY = (hT - hB) / (2.0 * texel.y);
    
    float hXX = (hR + hL - 2.0 * h) / (texel.x * texel.x);
    float hYY = (hT + hB - 2.0 * h) / (texel.y * texel.y);
    float laplacian = hXX + hYY;
    
    float dispersionTerm = u_dispersion * laplacian * hTotal * hTotal / 6.0;
    
    float source = 0.0;
    float boundaryDist = v_uv.x;
    if (boundaryDist < 0.05) {
      float envelope = smoothstep(0.0, 0.05, boundaryDist);
      float omega = 6.28318 / u_wavePeriod;
      float wave = u_waveHeight * sin(omega * u_time - v_uv.y * u_waveDirection * 10.0);
      source = wave * (1.0 - envelope) * 0.1;
    }
    
    float newH = h - u_dt * hTotal * (gradHX + gradHY) + u_dt * dispersionTerm + source;
    
    float boundary = 1.0;
    if (v_uv.x < texel.x || v_uv.x > 1.0 - texel.x ||
        v_uv.y < texel.y || v_uv.y > 1.0 - texel.y) {
      boundary = -1.0;
    }
    
    gl_FragColor = vec4(newH * boundary, 0.0, 0.0, 1.0);
  }
`;

export const velocityFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_height;
  uniform sampler2D u_velocityX;
  uniform sampler2D u_velocityY;
  uniform sampler2D u_terrain;
  uniform vec2 u_resolution;
  uniform float u_dt;
  uniform float u_gravity;
  uniform float u_breakingThreshold;
  
  varying vec2 v_uv;
  
  void main() {
    vec2 texel = 1.0 / u_resolution;
    
    float h = texture2D(u_height, v_uv).r;
    float hL = texture2D(u_height, v_uv - vec2(texel.x, 0.0)).r;
    float hR = texture2D(u_height, v_uv + vec2(texel.x, 0.0)).r;
    float hB = texture2D(u_height, v_uv - vec2(0.0, texel.y)).r;
    float hT = texture2D(u_height, v_uv + vec2(0.0, texel.y)).r;
    
    float d = texture2D(u_terrain, v_uv).r;
    float hTotal = max(h + d, 0.01);
    
    float u = texture2D(u_velocityX, v_uv).r;
    float v = texture2D(u_velocityY, v_uv).r;
    
    float gradHX = (hR - hL) / (2.0 * texel.x);
    float gradHY = (hT - hB) / (2.0 * texel.y);
    
    float newU = u - u_dt * u_gravity * gradHX;
    float newV = v - u_dt * u_gravity * gradHY;
    
    float slope = sqrt(gradHX * gradHX + gradHY * gradHY);
    float breaking = smoothstep(u_breakingThreshold * 0.5, u_breakingThreshold, slope);
    newU *= (1.0 - breaking * 0.5);
    newV *= (1.0 - breaking * 0.5);
    
    float boundary = 1.0;
    if (v_uv.x < texel.x || v_uv.x > 1.0 - texel.x) {
      boundary = -1.0;
      newU = 0.0;
    }
    if (v_uv.y < texel.y || v_uv.y > 1.0 - texel.y) {
      boundary = -1.0;
      newV = 0.0;
    }
    
    gl_FragColor = vec4(newU, newV, slope, breaking);
  }
`;

export const renderFragmentShader = `
  precision highp float;
  
  uniform sampler2D u_height;
  uniform sampler2D u_velocityX;
  uniform sampler2D u_velocityY;
  uniform sampler2D u_terrain;
  uniform float u_time;
  uniform float u_maxHeight;
  uniform int u_renderMode;
  
  varying vec2 v_uv;
  
  vec3 heightToColor(float h, float maxH) {
    float normalized = h / maxH * 0.5 + 0.5;
    normalized = clamp(normalized, 0.0, 1.0);
    
    vec3 c1 = vec3(0.0, 0.2, 0.5);
    vec3 c2 = vec3(0.0, 0.5, 0.8);
    vec3 c3 = vec3(0.2, 0.8, 1.0);
    vec3 c4 = vec3(1.0, 1.0, 0.8);
    vec3 c5 = vec3(1.0, 0.8, 0.4);
    
    if (normalized < 0.25) {
      return mix(c1, c2, normalized * 4.0);
    } else if (normalized < 0.5) {
      return mix(c2, c3, (normalized - 0.25) * 4.0);
    } else if (normalized < 0.75) {
      return mix(c3, c4, (normalized - 0.5) * 4.0);
    } else {
      return mix(c4, c5, (normalized - 0.75) * 4.0);
    }
  }
  
  void main() {
    float h = texture2D(u_height, v_uv).r;
    float d = texture2D(u_terrain, v_uv).r;
    float u = texture2D(u_velocityX, v_uv).r;
    float v = texture2D(u_velocityY, v_uv).r;
    
    vec3 color;
    
    if (u_renderMode == 0) {
      color = heightToColor(h, u_maxHeight);
    } else if (u_renderMode == 1) {
      float speed = sqrt(u * u + v * v);
      color = vec3(speed * 10.0, speed * 5.0, 0.5);
    } else {
      float vorticity = (u + v) * 10.0;
      color = vec3(0.5 + vorticity, 0.5 - abs(vorticity), 0.5 - vorticity);
    }
    
    float depthContour = fract(d * 10.0);
    if (depthContour < 0.1) {
      color = mix(color, vec3(0.3, 0.3, 0.3), 0.3);
    }
    
    float shimmer = sin(u_time * 3.0 + v_uv.x * 50.0 + v_uv.y * 30.0) * 0.05;
    color += shimmer;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
