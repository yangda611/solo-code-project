class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static fromPolar(angle, magnitude = 1) {
        return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }

    static fromScalar(s) {
        return new Vector2(s, s);
    }

    static zero() {
        return new Vector2(0, 0);
    }

    static up() {
        return new Vector2(0, -1);
    }

    static down() {
        return new Vector2(0, 1);
    }

    static left() {
        return new Vector2(-1, 0);
    }

    static right() {
        return new Vector2(1, 0);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    setVector(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    setScalar(s) {
        this.x = s;
        this.y = s;
        return this;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    addScalar(s) {
        return new Vector2(this.x + s, this.y + s);
    }

    addInPlace(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    addScalarInPlace(s) {
        this.x += s;
        this.y += s;
        return this;
    }

    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    subScalar(s) {
        return new Vector2(this.x - s, this.y - s);
    }

    subInPlace(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mulScalar(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    mulScalarInPlace(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    divScalar(s) {
        if (s === 0) return new Vector2(0, 0);
        return new Vector2(this.x / s, this.y / s);
    }

    divScalarInPlace(s) {
        if (s === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            this.x /= s;
            this.y /= s;
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return this.divScalar(mag);
    }

    normalizeInPlace() {
        const mag = this.magnitude();
        if (mag === 0) {
            this.x = 0;
            this.y = 0;
        } else {
            this.divScalarInPlace(mag);
        }
        return this;
    }

    setMagnitude(magnitude) {
        return this.normalize().mulScalar(magnitude);
    }

    setMagnitudeInPlace(magnitude) {
        this.normalizeInPlace().mulScalarInPlace(magnitude);
        return this;
    }

    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            return this.normalize().mulScalar(max);
        }
        return this.copy();
    }

    limitInPlace(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.normalizeInPlace().mulScalarInPlace(max);
        }
        return this;
    }

    distanceTo(v) {
        return this.sub(v).magnitude();
    }

    distanceSquaredTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    setAngle(angle) {
        const mag = this.magnitude();
        this.x = Math.cos(angle) * mag;
        this.y = Math.sin(angle) * mag;
        return this;
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    rotateAround(center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = this.x - center.x;
        const dy = this.y - center.y;
        return new Vector2(
            center.x + dx * cos - dy * sin,
            center.y + dx * sin + dy * cos
        );
    }

    lerp(v, t) {
        return new Vector2(
            this.x + (v.x - this.x) * t,
            this.y + (v.y - this.y) * t
        );
    }

    equals(v, epsilon = 0.0001) {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }

    isZero() {
        return this.x === 0 && this.y === 0;
    }

    projectOnto(v) {
        const dot = this.dot(v);
        const magSq = v.magnitudeSquared();
        if (magSq === 0) return new Vector2(0, 0);
        return v.mulScalar(dot / magSq);
    }

    reflect(normal) {
        const dot = this.dot(normal);
        return this.sub(normal.mulScalar(2 * dot));
    }

    perpendicular() {
        return new Vector2(-this.y, this.x);
    }

    toString() {
        return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    toArray() {
        return [this.x, this.y];
    }
}

if (typeof module !== 'undefined') {
    module.exports = Vector2;
}
