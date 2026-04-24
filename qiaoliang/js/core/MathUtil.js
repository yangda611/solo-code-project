const MathUtil = {
    PI: Math.PI,
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI / 2,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI,

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    unlerp(a, b, value) {
        if (a === b) return 0;
        return (value - a) / (b - a);
    },

    remap(value, a1, b1, a2, b2) {
        return this.lerp(a2, b2, this.unlerp(a1, b1, value));
    },

    degreesToRadians(degrees) {
        return degrees * this.DEG_TO_RAD;
    },

    radiansToDegrees(radians) {
        return radians * this.RAD_TO_DEG;
    },

    normalizeAngle(angle) {
        while (angle > this.PI) angle -= this.TWO_PI;
        while (angle < -this.PI) angle += this.TWO_PI;
        return angle;
    },

    shortestAngleDifference(from, to) {
        const diff = to - from;
        return this.normalizeAngle(diff);
    },

    lerpAngle(from, to, t) {
        const diff = this.shortestAngleDifference(from, to);
        return from + diff * t;
    },

    random(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);
    },

    randomInt(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.floor(min + Math.random() * (max - min + 1));
    },

    randomNormal(mean = 0, stdDev = 1) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z * stdDev;
    },

    mapRange(value, inMin, inMax, outMin, outMax) {
        return this.remap(value, inMin, inMax, outMin, outMax);
    },

    sign(value) {
        return value > 0 ? 1 : value < 0 ? -1 : 0;
    },

    approx(a, b, epsilon = 0.0001) {
        return Math.abs(a - b) < epsilon;
    },

    roundToNearest(value, step) {
        return Math.round(value / step) * step;
    },

    floorToNearest(value, step) {
        return Math.floor(value / step) * step;
    },

    ceilToNearest(value, step) {
        return Math.ceil(value / step) * step;
    },

    smoothstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },

    smootherstep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * t * (t * (t * 6 - 15) + 10);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    easeInCubic(t) {
        return t * t * t;
    },

    easeOutCubic(t) {
        return (--t) * t * t + 1;
    },

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },

    easeInElastic(t) {
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
    },

    easeOutElastic(t) {
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },

    pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
        const v0x = cx - ax;
        const v0y = cy - ay;
        const v1x = bx - ax;
        const v1y = by - ay;
        const v2x = px - ax;
        const v2y = py - ay;

        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return u >= 0 && v >= 0 && u + v < 1;
    },

    pointInCircle(px, py, cx, cy, r) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= r * r;
    },

    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    lineIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const fx = x1 - cx;
        const fy = y1 - cy;

        const a = dx * dx + dy * dy;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - r * r;

        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return false;

        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
    },

    closestPointOnLineSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) return { x: x1, y: y1, t: 0 };

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        t = this.clamp(t, 0, 1);

        return {
            x: x1 + t * dx,
            y: y1 + t * dy,
            t: t
        };
    },

    distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const closest = this.closestPointOnLineSegment(px, py, x1, y1, x2, y2);
        const dx = px - closest.x;
        const dy = py - closest.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    springForce(displacement, springConstant) {
        return -springConstant * displacement;
    },

    damperForce(velocity, dampingCoefficient) {
        return -dampingCoefficient * velocity;
    },

    coulombFriction(normalForce, velocity, staticCoeff, kineticCoeff) {
        const speed = Math.abs(velocity);
        const direction = this.sign(velocity);

        if (speed < 0.001) {
            const maxStaticForce = staticCoeff * normalForce;
            return 0;
        } else {
            return -direction * kineticCoeff * normalForce;
        }
    },

    stressToColor(stressRatio, alpha = 1) {
        const clamped = this.clamp(stressRatio, 0, 1);
        
        let r, g, b;
        if (clamped < 0.33) {
            const t = clamped / 0.33;
            r = 46;
            g = Math.round(this.lerp(204, 156, t));
            b = Math.round(this.lerp(113, 18, t));
        } else if (clamped < 0.66) {
            const t = (clamped - 0.33) / 0.33;
            r = Math.round(this.lerp(243, 231, t));
            g = Math.round(this.lerp(156, 76, t));
            b = 18;
        } else {
            const t = (clamped - 0.66) / 0.34;
            r = Math.round(this.lerp(231, 255, t));
            g = Math.round(this.lerp(76, 0, t));
            b = Math.round(this.lerp(60, 0, t));
        }

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
};

if (typeof module !== 'undefined') {
    module.exports = MathUtil;
}
