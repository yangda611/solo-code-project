#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_phaseField;
uniform sampler2D u_concentrationField;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_timeStep;
uniform float u_undercooling;
uniform float u_anisotropyStrength;
uniform float u_anisotropyMode;
uniform float u_interfaceThickness;
uniform float u_noiseAmplitude;
uniform float u_mobility;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float gaussianNoise(vec2 uv, float time) {
    float n = rand(uv + vec2(time));
    float n2 = rand(uv + vec2(time + 0.1));
    return (n + n2 - 1.0) * 0.7071;
}

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    
    float phi = texture(u_phaseField, v_uv).r;
    float c = texture(u_concentrationField, v_uv).r;
    
    float phiL = texture(u_phaseField, v_uv + vec2(-texelSize.x, 0.0)).r;
    float phiR = texture(u_phaseField, v_uv + vec2(texelSize.x, 0.0)).r;
    float phiB = texture(u_phaseField, v_uv + vec2(0.0, -texelSize.y)).r;
    float phiT = texture(u_phaseField, v_uv + vec2(0.0, texelSize.y)).r;
    
    float phiTL = texture(u_phaseField, v_uv + vec2(-texelSize.x, texelSize.y)).r;
    float phiTR = texture(u_phaseField, v_uv + vec2(texelSize.x, texelSize.y)).r;
    float phiBL = texture(u_phaseField, v_uv + vec2(-texelSize.x, -texelSize.y)).r;
    float phiBR = texture(u_phaseField, v_uv + vec2(texelSize.x, -texelSize.y)).r;
    
    float laplacian = (phiL + phiR + phiB + phiT - 4.0 * phi) / (texelSize.x * texelSize.x);
    
    float gradX = (phiR - phiL) / (2.0 * texelSize.x);
    float gradY = (phiT - phiB) / (2.0 * texelSize.y);
    float gradMagSq = gradX * gradX + gradY * gradY;
    
    float theta = atan(gradY, gradX);
    float anisotropy = 1.0 + u_anisotropyStrength * cos(u_anisotropyMode * theta);
    float anisotropySq = anisotropy * anisotropy;
    
    float dPhi = phi * (1.0 - phi) * (1.0 - 2.0 * phi);
    
    float drivingForce = u_undercooling * phi * (1.0 - phi);
    
    float noise = gaussianNoise(v_uv, u_time) * u_noiseAmplitude;
    
    float epsilon = u_interfaceThickness;
    float dPhidt = u_mobility * (epsilon * epsilon * anisotropySq * laplacian - dPhi + drivingForce) + noise;
    
    float newPhi = phi + u_timeStep * dPhidt;
    newPhi = clamp(newPhi, 0.0, 1.0);
    
    fragColor = vec4(newPhi, 0.0, 0.0, 1.0);
}
