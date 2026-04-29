const Grid = require('./Grid');
const Person = require('./Person');
const StatsTracker = require('./StatsTracker');

class SimulationEngine {
  constructor() {
    this.grid = null;
    this.people = [];
    this.statsTracker = null;
    this.isRunning = false;
    this.isPaused = false;
    this.tickInterval = null;
    this.tickRate = 50;
    this.params = {};
    this.callback = null;
    this.quarantineZones = new Set();
    this.vaccinatedCount = 0;
  }

  start(params, callback) {
    this.stop();
    this.params = { ...this.getDefaultParams(), ...params };
    this.callback = callback;
    
    this.initialize();
    this.isRunning = true;
    this.isPaused = false;
    
    this.tickInterval = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, this.tickRate);
  }

  getDefaultParams() {
    return {
      gridSize: 50,
      populationDensity: 0.3,
      infectionRate: 0.03,
      recoveryRate: 0.005,
      quarantinePolicy: 0.8,
      travelFrequency: 0.02,
      hospitalCapacity: 100,
      vaccineCoverage: 0.0,
      initialInfected: 5
    };
  }

  initialize() {
    const { gridSize, populationDensity, initialInfected, vaccineCoverage } = this.params;
    
    this.grid = new Grid(gridSize, gridSize);
    this.people = [];
    this.statsTracker = new StatsTracker();
    this.quarantineZones = new Set();
    this.vaccinatedCount = 0;

    const totalCells = gridSize * gridSize;
    const totalPeople = Math.floor(totalCells * populationDensity);

    for (let i = 0; i < totalPeople; i++) {
      let x, y;
      do {
        x = Math.floor(Math.random() * gridSize);
        y = Math.floor(Math.random() * gridSize);
      } while (this.grid.getCell(x, y).occupants.length > 0);

      const isVaccinated = Math.random() < vaccineCoverage;
      const isInfected = i < initialInfected && !isVaccinated;

      const person = new Person(x, y, {
        infected: isInfected,
        vaccinated: isVaccinated,
        travelFrequency: this.params.travelFrequency
      });

      if (isInfected) {
        person.sickDays = 0;
      }

      if (isVaccinated) {
        this.vaccinatedCount++;
      }

      this.people.push(person);
      this.grid.addPerson(person, x, y);
    }

    this.updateStats();
  }

  tick() {
    this.movePeople();
    this.processInfections();
    this.processRecoveries();
    this.updateQuarantineZones();
    this.updateStats();
    this.notifyCallback();
  }

  movePeople() {
    for (const person of this.people) {
      if (person.isolated) continue;

      const cellKey = `${person.x},${person.y}`;
      if (this.quarantineZones.has(cellKey) && Math.random() > 0.1) {
        continue;
      }

      if (Math.random() < person.travelFrequency) {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;

        const newX = Math.max(0, Math.min(this.grid.width - 1, person.x + dx));
        const newY = Math.max(0, Math.min(this.grid.height - 1, person.y + dy));

        const targetCellKey = `${newX},${newY}`;
        if (this.quarantineZones.has(targetCellKey) && Math.random() > 0.05) {
          continue;
        }

        this.grid.movePerson(person, person.x, person.y, newX, newY);
        person.x = newX;
        person.y = newY;
      }
    }
  }

  processInfections() {
    const { infectionRate, quarantinePolicy } = this.params;
    const newInfections = [];

    for (const cell of this.grid.getAllCells()) {
      if (cell.occupants.length <= 1) continue;

      const infectedPeople = cell.occupants.filter(p => p.infected && !p.isolated);
      const susceptiblePeople = cell.occupants.filter(p => !p.infected && !p.recovered && !p.vaccinated);

      for (const susceptible of susceptiblePeople) {
        for (const infected of infectedPeople) {
          if (Math.random() < infectionRate) {
            if (!newInfections.includes(susceptible)) {
              newInfections.push(susceptible);
            }
            break;
          }
        }
      }
    }

    for (const person of newInfections) {
      person.infected = true;
      person.sickDays = 0;
      person.isolated = Math.random() < quarantinePolicy;
    }
  }

  processRecoveries() {
    const { recoveryRate, hospitalCapacity } = this.params;
    let inHospitalCount = this.people.filter(p => p.infected && p.isolated).length;

    for (const person of this.people) {
      if (!person.infected) continue;

      person.sickDays++;

      const recoveryChance = person.isolated && inHospitalCount <= hospitalCapacity
        ? recoveryRate * 2
        : recoveryRate;

      if (Math.random() < recoveryChance) {
        person.infected = false;
        person.recovered = true;
        person.isolated = false;
        person.sickDays = 0;
      }

      if (person.sickDays > 300) {
        person.infected = false;
        person.recovered = true;
        person.isolated = false;
      }
    }
  }

  updateQuarantineZones() {
    const newQuarantineZones = new Set();
    
    for (const person of this.people) {
      if (person.infected && person.isolated) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = person.x + dx;
            const y = person.y + dy;
            if (x >= 0 && x < this.grid.width && y >= 0 && y < this.grid.height) {
              newQuarantineZones.add(`${x},${y}`);
            }
          }
        }
      }
    }

    this.quarantineZones = newQuarantineZones;
  }

  updateStats() {
    const stats = {
      susceptible: 0,
      infected: 0,
      recovered: 0,
      isolated: 0,
      vaccinated: this.vaccinatedCount,
      total: this.people.length,
      timestamp: Date.now()
    };

    for (const person of this.people) {
      if (person.infected) {
        stats.infected++;
        if (person.isolated) stats.isolated++;
      } else if (person.recovered) {
        stats.recovered++;
      } else if (!person.vaccinated) {
        stats.susceptible++;
      }
    }

    this.statsTracker.addStats(stats);
  }

  getRiskMap() {
    const riskMap = [];
    for (let y = 0; y < this.grid.height; y++) {
      const row = [];
      for (let x = 0; x < this.grid.width; x++) {
        const cell = this.grid.getCell(x, y);
        let risk = 0;
        
        for (const person of cell.occupants) {
          if (person.infected) {
            risk += 1;
          }
        }
        
        row.push({
          x,
          y,
          risk,
          quarantined: this.quarantineZones.has(`${x},${y}`),
          population: cell.occupants.length
        });
      }
      riskMap.push(row);
    }
    return riskMap;
  }

  notifyCallback() {
    if (this.callback) {
      this.callback({
        stats: this.statsTracker.getCurrentStats(),
        history: this.statsTracker.getHistory(),
        people: this.people.map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          infected: p.infected,
          recovered: p.recovered,
          vaccinated: p.vaccinated,
          isolated: p.isolated
        })),
        riskMap: this.getRiskMap(),
        quarantineZones: Array.from(this.quarantineZones)
      });
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  updateParams(params) {
    this.params = { ...this.params, ...params };
    if (this.people) {
      for (const person of this.people) {
        person.travelFrequency = this.params.travelFrequency;
      }
    }
  }
}

module.exports = SimulationEngine;
