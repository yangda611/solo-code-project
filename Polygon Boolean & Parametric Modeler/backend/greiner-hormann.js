class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.alpha = 0;
    this.intersect = false;
    this.entry = false;
    this.visited = false;
    this.next = null;
    this.prev = null;
    this.neighbor = null;
  }

  equals(other, epsilon = 1e-8) {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon;
  }

  distance(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
}

class Polygon {
  constructor(points = []) {
    this.head = null;
    this.tail = null;
    this.length = 0;
    this.isHole = false;
    
    points.forEach(p => this.addPoint(new Point(p.x, p.y)));
  }

  addPoint(point) {
    if (!this.head) {
      this.head = point;
      this.tail = point;
      point.next = point;
      point.prev = point;
    } else {
      point.prev = this.tail;
      point.next = this.head;
      this.tail.next = point;
      this.head.prev = point;
      this.tail = point;
    }
    this.length++;
  }

  insertAfter(point, newPoint) {
    newPoint.prev = point;
    newPoint.next = point.next;
    point.next.prev = newPoint;
    point.next = newPoint;
    if (point === this.tail) {
      this.tail = newPoint;
    }
    this.length++;
  }

  toArray() {
    const result = [];
    if (!this.head) return result;
    let current = this.head;
    do {
      result.push({ x: current.x, y: current.y, intersect: current.intersect });
      current = current.next;
    } while (current !== this.head);
    return result;
  }

  getArea() {
    let area = 0;
    if (!this.head) return 0;
    let current = this.head;
    do {
      const next = current.next;
      area += current.x * next.y - next.x * current.y;
      current = current.next;
    } while (current !== this.head);
    return Math.abs(area) / 2;
  }

  isClockwise() {
    let sum = 0;
    if (!this.head) return true;
    let current = this.head;
    do {
      const next = current.next;
      sum += (next.x - current.x) * (next.y + current.y);
      current = current.next;
    } while (current !== this.head);
    return sum > 0;
  }

  reverse() {
    if (!this.head) return;
    let current = this.head;
    do {
      const temp = current.next;
      current.next = current.prev;
      current.prev = temp;
      current = temp;
    } while (current !== this.head);
    const temp = this.head;
    this.head = this.tail;
    this.tail = temp;
  }
}

class GreinerHormann {
  constructor() {
    this.epsilon = 1e-8;
    this.intersections = [];
  }

  pointInPolygon(point, polygon) {
    let inside = false;
    if (!polygon.head) return false;
    let current = polygon.head;
    do {
      const next = current.next;
      if (((current.y > point.y) !== (next.y > point.y)) &&
          (point.x < (next.x - current.x) * (point.y - current.y) / (next.y - current.y) + current.x)) {
        inside = !inside;
      }
      current = current.next;
    } while (current !== polygon.head);
    return inside;
  }

  lineIntersection(p1, p2, p3, p4) {
    const d1 = this.orientation(p3, p4, p1);
    const d2 = this.orientation(p3, p4, p2);
    const d3 = this.orientation(p1, p2, p3);
    const d4 = this.orientation(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
      const numA = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
      const alpha = numA / denom;
      
      return {
        point: new Point(
          p1.x + alpha * (p2.x - p1.x),
          p1.y + alpha * (p2.y - p1.y)
        ),
        alpha,
        intersects: true
      };
    }

    if (this.onSegment(p1, p3, p2)) {
      return { point: new Point(p3.x, p3.y), alpha: 0, intersects: true, collinear: true };
    }
    if (this.onSegment(p1, p4, p2)) {
      return { point: new Point(p4.x, p4.y), alpha: 1, intersects: true, collinear: true };
    }
    if (this.onSegment(p3, p1, p4)) {
      return { point: new Point(p1.x, p1.y), alpha: 0, intersects: true, collinear: true };
    }
    if (this.onSegment(p3, p2, p4)) {
      return { point: new Point(p2.x, p2.y), alpha: 1, intersects: true, collinear: true };
    }

    return { intersects: false };
  }

  orientation(p, q, r) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(val) < this.epsilon) return 0;
    return val > 0 ? 1 : -1;
  }

  onSegment(p, q, r) {
    return q.x <= Math.max(p.x, r.x) + this.epsilon &&
           q.x >= Math.min(p.x, r.x) - this.epsilon &&
           q.y <= Math.max(p.y, r.y) + this.epsilon &&
           q.y >= Math.min(p.y, r.y) - this.epsilon &&
           this.orientation(p, q, r) === 0;
  }

  insertIntersections(subject, clip) {
    this.intersections = [];
    
    let sCurrent = subject.head;
    do {
      const sNext = sCurrent.next;
      let cCurrent = clip.head;
      
      do {
        const cNext = cCurrent.next;
        const result = this.lineIntersection(sCurrent, sNext, cCurrent, cNext);
        
        if (result.intersects && result.alpha > this.epsilon && result.alpha < 1 - this.epsilon) {
          const sIntersect = new Point(result.point.x, result.point.y);
          const cIntersect = new Point(result.point.x, result.point.y);
          
          sIntersect.intersect = true;
          cIntersect.intersect = true;
          sIntersect.neighbor = cIntersect;
          cIntersect.neighbor = sIntersect;
          sIntersect.alpha = result.alpha;
          
          subject.insertAfter(sCurrent, sIntersect);
          clip.insertAfter(cCurrent, cIntersect);
          
          this.intersections.push({ s: sIntersect, c: cIntersect });
        }
        
        cCurrent = cNext;
      } while (cCurrent !== clip.head);
      
      sCurrent = sCurrent.next;
    } while (sCurrent !== subject.head);

    this.markEntryExit(subject, clip);
    this.markEntryExit(clip, subject);
  }

  markEntryExit(polygon, other) {
    let current = polygon.head;
    let entry = !this.pointInPolygon(polygon.head, other);
    
    do {
      if (current.intersect) {
        current.entry = entry;
        current.neighbor.entry = !entry;
        entry = !entry;
      }
      current = current.next;
    } while (current !== polygon.head);
  }

  clip(subjectPoints, clipPoints, operation) {
    const subject = new Polygon(subjectPoints);
    const clip = new Polygon(clipPoints);

    if (subject.isClockwise()) subject.reverse();
    if (!clip.isClockwise()) clip.reverse();

    this.insertIntersections(subject, clip);

    if (this.intersections.length === 0) {
      return this.handleNoIntersections(subjectPoints, clipPoints, operation);
    }

    const resultPolygons = [];
    let processed = 0;
    const total = this.intersections.length;

    while (processed < total) {
      let current = this.findUnvisitedIntersection(subject);
      if (!current) break;

      const resultPoly = [];
      const startPoint = current;
      let onSubject = true;

      do {
        if (!current.intersect) {
          resultPoly.push({ x: current.x, y: current.y });
        } else {
          resultPoly.push({ x: current.x, y: current.y, isIntersection: true });
          current.visited = true;
          current.neighbor.visited = true;
          processed += 2;
          
          if (operation === 'union') {
            current = current.entry ? current.next : current.neighbor;
            onSubject = current.entry;
          } else if (operation === 'intersection') {
            current = current.entry ? current.neighbor : current.next;
            onSubject = !current.entry;
          } else if (operation === 'difference') {
            current = current.entry ? current.next : current.neighbor;
            onSubject = current.entry;
          }
        }
        
        if (onSubject || (!current.intersect && current.next && current.next.intersect)) {
          current = current.next;
        } else {
          current = current.prev;
        }
      } while (current !== startPoint && processed <= total * 2);

      if (resultPoly.length >= 3) {
        resultPolygons.push(resultPoly);
      }
    }

    return this.fixBoundaries(resultPolygons, operation);
  }

  findUnvisitedIntersection(polygon) {
    let current = polygon.head;
    do {
      if (current.intersect && !current.visited) {
        return current;
      }
      current = current.next;
    } while (current !== polygon.head);
    return null;
  }

  handleNoIntersections(subject, clip, operation) {
    const subjectPoly = new Polygon(subject);
    const clipPoly = new Polygon(clip);
    const sInC = this.pointInPolygon(subjectPoly.head, clipPoly);
    const cInS = this.pointInPolygon(clipPoly.head, subjectPoly);

    if (operation === 'union') {
      if (sInC) return [clip];
      if (cInS) return [subject];
      return [subject, clip];
    } else if (operation === 'intersection') {
      if (sInC) return [subject];
      if (cInS) return [clip];
      return [];
    } else if (operation === 'difference') {
      if (sInC) return [];
      if (cInS) {
        const result = new Polygon(subject);
        result.isHole = true;
        return [subject];
      }
      return [subject];
    }
    return [];
  }

  fixBoundaries(polygons, operation) {
    const fixed = [];
    const epsilon = 1e-6;

    for (const poly of polygons) {
      if (poly.length < 3) continue;

      const cleaned = [];
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const prev = cleaned[cleaned.length - 1];
        
        if (!prev || Math.abs(p.x - prev.x) > epsilon || Math.abs(p.y - prev.y) > epsilon) {
          cleaned.push(p);
        }
      }

      if (cleaned.length >= 3) {
        const area = this.calculateArea(cleaned);
        if (area > epsilon) {
          fixed.push(cleaned);
        }
      }
    }

    return fixed;
  }

  calculateArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  fixCollinearEdges(points) {
    const result = [];
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];
      
      const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
      
      if (Math.abs(cross) > this.epsilon) {
        result.push(curr);
      }
    }
    
    return result.length >= 3 ? result : points;
  }

  detectSelfIntersections(points) {
    const intersections = [];
    const n = points.length;
    
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      
      for (let j = i + 2; j < n; j++) {
        if ((j + 1) % n === i) continue;
        
        const p3 = points[j];
        const p4 = points[(j + 1) % n];
        
        const result = this.lineIntersection(
          new Point(p1.x, p1.y),
          new Point(p2.x, p2.y),
          new Point(p3.x, p3.y),
          new Point(p4.x, p4.y)
        );
        
        if (result.intersects && result.alpha > this.epsilon && result.alpha < 1 - this.epsilon) {
          intersections.push({
            point: { x: result.point.x, y: result.point.y },
            edges: [[i, (i + 1) % n], [j, (j + 1) % n]]
          });
        }
      }
    }
    
    return intersections;
  }
}

module.exports = { GreinerHormann, Point, Polygon };
