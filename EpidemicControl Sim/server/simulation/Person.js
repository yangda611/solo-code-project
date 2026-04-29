let personIdCounter = 0;

class Person {
  constructor(x, y, options = {}) {
    this.id = ++personIdCounter;
    this.x = x;
    this.y = y;
    
    this.infected = options.infected || false;
    this.recovered = options.recovered || false;
    this.vaccinated = options.vaccinated || false;
    this.isolated = options.isolated || false;
    
    this.sickDays = 0;
    this.travelFrequency = options.travelFrequency || 0.02;
    
    this.color = this.getColor();
  }

  getColor() {
    if (this.vaccinated) {
      return '#4CAF50';
    }
    if (this.recovered) {
      return '#2196F3';
    }
    if (this.isolated) {
      return '#FF9800';
    }
    if (this.infected) {
      return '#F44336';
    }
    return '#9E9E9E';
  }

  update() {
    if (this.infected) {
      this.sickDays++;
    }
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      infected: this.infected,
      recovered: this.recovered,
      vaccinated: this.vaccinated,
      isolated: this.isolated,
      sickDays: this.sickDays,
      color: this.getColor()
    };
  }
}

module.exports = Person;
