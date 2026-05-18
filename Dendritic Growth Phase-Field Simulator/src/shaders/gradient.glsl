#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_phaseField;
uniform vec2 u_resolution;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    
    float phi = texture(u_phaseField, v_uv).r;
    
    float phiL = texture(u_phaseField, v_uv + vec2(-texelSize.x, 0.0)).r;
    float phiR = texture(u_phaseField, v_uv + vec2(texelSize.x, 0.0)).r;
    float phiB = texture(u_phaseField, v_uv + vec2(0.0, -texelSize.y)).r;
    float phiT = texture(u_phaseField, v_uv + vec2(0.0, texelSize.y)).r;
    
    float phiTL = texture(u_phaseField, v_uv + vec2(-texelSize.x, texelSize.y)).r;
    float phiTR = texture(u_phaseField, v_uv + vec2(texelSize.x, texelSize.y)).r;
    float phiBL = texture(u_phaseField, v_uv + vec2(-texelSize.x, -texelSize.y)).r;
    float phiBR = texture(u_phaseField, v_uv + vec2(texelSize.x, -texelSize.y)).r;
    
    float gradX = (phiR - phiL) / (2.0 * texelSize.x);
    float gradY = (phiT - phiB) / (2.0 * texelSize.y);
    
    float gradXX = (phiR + phiL - 2.0 * phi) / (texelSize.x * texelSize.x);
    float gradYY = (phiT + phiB - 2.0 * phi) / (texelSize.y * texelSize.y);
    float gradXY = (phiTR + phiBL - phiTL - phiBR) / (4.0 * texelSize.x * texelSize.y);
    
    float gradMagSq = gradX * gradX + gradY * gradY;
    float gradMag = sqrt(gradMagSq);
    
    float curvature = 0.0;
    if (gradMag > 0.001) {
        curvature = -(gradXX * gradY * gradY - 2.0 * gradX * gradY * gradXY + gradYY * gradX * gradX) / pow(gradMagSq, 1.5);
    }
    
    float orientation = atan(gradY, gradX);
    
    fragColor = vec4(gradX, gradY, curvature, orientation);
}
