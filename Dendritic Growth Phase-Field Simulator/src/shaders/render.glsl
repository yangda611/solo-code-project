#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_phaseField;
uniform sampler2D u_concentrationField;
uniform sampler2D u_gradientField;
uniform int u_visualMode;
uniform float u_time;
uniform vec2 u_resolution;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    float phi = texture(u_phaseField, v_uv).r;
    float c = texture(u_concentrationField, v_uv).r;
    vec4 grad = texture(u_gradientField, v_uv);
    float curvature = grad.z;
    float orientation = grad.w;
    
    vec3 color;
    
    if (u_visualMode == 0) {
        float t = smoothstep(0.3, 0.7, phi);
        vec3 liquidColor = vec3(0.05, 0.1, 0.3);
        vec3 solidColor = vec3(0.9, 0.8, 0.6);
        color = mix(liquidColor, solidColor, t);
        
        float interfaceWidth = fwidth(phi) * 2.0;
        float interfaceDist = abs(phi - 0.5);
        if (interfaceDist < interfaceWidth * 2.0) {
            float glow = 1.0 - smoothstep(0.0, interfaceWidth * 2.0, interfaceDist);
            vec3 glowColor = vec3(0.0, 1.0, 0.8);
            color += glowColor * glow * 0.5;
        }
    } else if (u_visualMode == 1) {
        float t = clamp(c, 0.0, 1.0);
        vec3 lowColor = vec3(0.1, 0.2, 0.5);
        vec3 midColor = vec3(0.2, 0.6, 0.4);
        vec3 highColor = vec3(0.9, 0.3, 0.2);
        
        if (t < 0.5) {
            color = mix(lowColor, midColor, t * 2.0);
        } else {
            color = mix(midColor, highColor, (t - 0.5) * 2.0);
        }
        
        float pulse = sin(u_time * 3.0 + c * 10.0) * 0.5 + 0.5;
        float interfaceMask = smoothstep(0.3, 0.7, phi);
        color = mix(color, color * (1.0 + pulse * 0.2), interfaceMask * 0.3);
    } else if (u_visualMode == 2) {
        float hue = (orientation + 3.14159) / 6.28318;
        hue = fract(hue + u_time * 0.1);
        float sat = 0.7 + 0.3 * sin(u_time);
        float val = phi * 0.7 + 0.3;
        color = hsv2rgb(vec3(hue, sat, val));
        
        float interfaceDist = abs(phi - 0.5);
        if (interfaceDist < 0.1) {
            color *= 1.3;
        }
    } else if (u_visualMode == 3) {
        float normCurv = clamp(curvature * 0.5 + 0.5, 0.0, 1.0);
        vec3 negColor = vec3(0.2, 0.5, 1.0);
        vec3 zeroColor = vec3(0.95, 0.95, 0.95);
        vec3 posColor = vec3(1.0, 0.3, 0.2);
        
        if (curvature < 0.0) {
            color = mix(zeroColor, negColor, -curvature * 2.0);
        } else {
            color = mix(zeroColor, posColor, curvature * 2.0);
        }
        
        float interfaceMask = smoothstep(0.3, 0.7, phi);
        color = mix(vec3(0.1), color, interfaceMask);
    }
    
    fragColor = vec4(color, 1.0);
}
