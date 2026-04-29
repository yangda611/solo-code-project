class StatsTracker {
  constructor() {
    this.history = [];
    this.maxHistoryLength = 500;
  }

  addStats(stats) {
    this.history.push({
      ...stats,
      time: this.history.length
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  getCurrentStats() {
    if (this.history.length === 0) {
      return {
        susceptible: 0,
        infected: 0,
        recovered: 0,
        isolated: 0,
        vaccinated: 0,
        total: 0,
        timestamp: Date.now()
      };
    }
    return this.history[this.history.length - 1];
  }

  getHistory() {
    return [...this.history];
  }

  getLastN(n) {
    return this.history.slice(-n);
  }

  clear() {
    this.history = [];
  }
}

module.exports = StatsTracker;
