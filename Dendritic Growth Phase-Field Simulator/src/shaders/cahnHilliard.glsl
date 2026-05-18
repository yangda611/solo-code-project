#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_phaseField;
uniform sampler2D u_concentrationField;
uniform vec2 u_resolution;
uniform float u_timeStep;
uniform float u_mobility;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    
    float phi = texture(u_phaseField, v_uv).r;
    float c = texture(u_concentrationField, v_uv).r;
    
    float phiL = texture(u_phaseField, v_uv + vec2(-texelSize.x, 0.0)).r;
    float phiR = texture(u_phaseField, v_uv + vec2(texelSize.x, 0.0)).r;
    float phiB = texture(u_phaseField, v_uv + vec2(0.0, -texelSize.y)).r;
    float phiT = texture(u_phaseField, v_uv + vec2(0.0, texelSize.y)).r;
    
    float cL = texture(u_concentrationField, v_uv + vec2(-texelSize.x, 0.0)).r;
    float cR = texture(u_concentrationField, v_uv + vec2(texelSize.x, 0.0)).r;
    float cB = texture(u_concentrationField, v_uv + vec2(0.0, -texelSize.y)).r;
    float cT = texture(u_concentrationField, v_uv + vec2(0.0, texelSize.y)).r;
    
    float cLL = texture(u_concentrationField, v_uv + vec2(-2.0 * texelSize.x, 0.0)).r;
    float cRR = texture(u_concentrationField, v_uv + vec2(2.0 * texelSize.x, 0.0)).r;
    float cBB = texture(u_concentrationField, v_uv + vec2(0.0, -2.0 * texelSize.y)).r;
    float cTT = texture(u_concentrationField, v_uv + vec2(0.0, 2.0 * texelSize.y)).r;
    
    float cLR = texture(u_concentrationField, v_uv + vec2(texelSize.x, texelSize.y)).r;
    float cLB = texture(u_concentrationField, v_uv + vec2(-texelSize.x, -texelSize.y)).r;
    float cRB = texture(u_concentrationField, v_uv + vec2(texelSize.x, -texelSize.y)).r;
    float cLT = texture(u_concentrationField, v_uv + vec2(-texelSize.x, texelSize.y)).r;
    
    float laplacianC = (cL + cR + cB + cT - 4.0 * c) / (texelSize.x * texelSize.x);
    
    float hPrime = 30.0 * phi * phi * (1.0 - phi) * (1.0 - phi);
    
    float cSolid = 0.9;
    float cLiquid = 0.1;
    
    float gPrime = 2.0 * (c - cLiquid) * (cSolid - c) * (cSolid + cLiquid - 2.0 * c);
    
    float gradPhiX = (phiR - phiL) / (2.0 * texelSize.x);
    float gradPhiY = (phiT - phiB) / (2.0 * texelSize.y);
    float gradCX = (cR - cL) / (2.0 * texelSize.x);
    float gradCY = (cT - cB) / (2.0 * texelSize.y);
    
    float gradDot = gradPhiX * gradCX + gradPhiY * gradCY;
    
    float mu = hPrime * gPrime + 0.5 * gradDot;
    
    float muL = texture(u_concentrationField, v_uv + vec2(-texelSize.x, 0.0)).g;
    float muR = texture(u_concentrationField, v_uv + vec2(texelSize.x, 0.0)).g;
    float muB = texture(u_concentrationField, v_uv + vec2(0.0, -texelSize.y)).g;
    float muT = texture(u_concentrationField, v_uv + vec2(0.0, texelSize.y)).g;
    
    if (muL == 0.0 && muR == 0.0) {
        float laplacianMu = laplacianC * 0.1;
        float dCdt = u_mobility * 0.1 * laplacianMu;
        float newC = c + u_timeStep * dCdt;
        newC = clamp(newC, 0.0, 1.0);
        fragColor = vec4(newC, mu, 0.0, 1.0);
    } else {
        float laplacianMu = (muL + muR + muB + muT - 4.0 * mu) / (texelSize.x * texelSize.x);
        float dCdt = u_mobility * 0.1 * laplacianMu;
        float newC = c + u_timeStep * dCdt;
        newC = clamp(newC, 0.0, 1.0);
        fragColor = vec4(newC, mu, 0.0, 1.0);
    }
}
