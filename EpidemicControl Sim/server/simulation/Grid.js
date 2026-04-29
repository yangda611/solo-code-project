class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.occupants = [];
    this.riskLevel = 0;
  }
}

class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.initialize();
  }

  initialize() {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Cell(x, y));
      }
      this.cells.push(row);
    }
  }

  getCell(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.cells[y][x];
  }

  addPerson(person, x, y) {
    const cell = this.getCell(x, y);
    if (cell) {
      cell.occupants.push(person);
    }
  }

  removePerson(person, x, y) {
    const cell = this.getCell(x, y);
    if (cell) {
      const index = cell.occupants.indexOf(person);
      if (index > -1) {
        cell.occupants.splice(index, 1);
      }
    }
  }

  movePerson(person, fromX, fromY, toX, toY) {
    if (fromX === toX && fromY === toY) return;
    
    this.removePerson(person, fromX, fromY);
    this.addPerson(person, toX, toY);
  }

  getAllCells() {
    const cells = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        cells.push(this.cells[y][x]);
      }
    }
    return cells;
  }

  getNeighbors(x, y, radius = 1) {
    const neighbors = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;
        const cell = this.getCell(x + dx, y + dy);
        if (cell) {
          neighbors.push(cell);
        }
      }
    }
    return neighbors;
  }
}

module.exports = Grid;
