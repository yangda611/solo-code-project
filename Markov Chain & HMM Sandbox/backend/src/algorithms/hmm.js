class HMM {
  constructor(states, observations, transitionMatrix, emissionMatrix, initialDistribution = null) {
    this.states = states
    this.observations = observations
    this.N = states.length
    this.M = observations.length
    this.A = transitionMatrix
    this.B = emissionMatrix
    this.pi = initialDistribution || Array(this.N).fill(1 / this.N)
  }

  steadyStateDistribution(maxIterations = 1000, tolerance = 1e-10) {
    let pi = [...this.pi]
    for (let i = 0; i < maxIterations; i++) {
      const nextPi = new Array(this.N).fill(0)
      for (let j = 0; j < this.N; j++) {
        for (let iState = 0; iState < this.N; iState++) {
          nextPi[j] += pi[iState] * this.A[iState][j]
        }
      }
      const diff = Math.max(...nextPi.map((v, i) => Math.abs(v - pi[i])))
      pi = nextPi
      if (diff < tolerance) break
    }
    const sum = pi.reduce((a, b) => a + b, 0)
    return pi.map(v => v / sum)
  }

  viterbi(observationSequence) {
    const T = observationSequence.length
    const obsIndices = observationSequence.map(o => this.observations.indexOf(o))
    
    if (obsIndices.includes(-1)) {
      throw new Error('观测序列包含未知观测值')
    }

    const delta = Array(T).fill(null).map(() => Array(this.N).fill(0))
    const psi = Array(T).fill(null).map(() => Array(this.N).fill(0))

    for (let i = 0; i < this.N; i++) {
      delta[0][i] = this.pi[i] * this.B[i][obsIndices[0]]
      psi[0][i] = 0
    }

    for (let t = 1; t < T; t++) {
      for (let j = 0; j < this.N; j++) {
        let maxVal = -Infinity
        let maxIdx = 0
        for (let i = 0; i < this.N; i++) {
          const val = delta[t-1][i] * this.A[i][j]
          if (val > maxVal) {
            maxVal = val
            maxIdx = i
          }
        }
        delta[t][j] = maxVal * this.B[j][obsIndices[t]]
        psi[t][j] = maxIdx
      }
    }

    let maxProb = -Infinity
    let lastState = 0
    for (let i = 0; i < this.N; i++) {
      if (delta[T-1][i] > maxProb) {
        maxProb = delta[T-1][i]
        lastState = i
      }
    }

    const path = [lastState]
    for (let t = T - 2; t >= 0; t--) {
      path.unshift(psi[t + 1][path[0]])
    }

    return {
      path: path.map(i => this.states[i]),
      probability: maxProb,
      delta
    }
  }

  forward(observationSequence) {
    const T = observationSequence.length
    const obsIndices = observationSequence.map(o => this.observations.indexOf(o))
    const alpha = Array(T).fill(null).map(() => Array(this.N).fill(0))
    const scaling = Array(T).fill(0)

    for (let i = 0; i < this.N; i++) {
      alpha[0][i] = this.pi[i] * this.B[i][obsIndices[0]]
    }
    scaling[0] = alpha[0].reduce((a, b) => a + b, 0)
    for (let i = 0; i < this.N; i++) {
      alpha[0][i] /= scaling[0]
    }

    for (let t = 1; t < T; t++) {
      for (let j = 0; j < this.N; j++) {
        let sum = 0
        for (let i = 0; i < this.N; i++) {
          sum += alpha[t-1][i] * this.A[i][j]
        }
        alpha[t][j] = sum * this.B[j][obsIndices[t]]
      }
      scaling[t] = alpha[t].reduce((a, b) => a + b, 0)
      for (let j = 0; j < this.N; j++) {
        alpha[t][j] /= scaling[t]
      }
    }

    const logLikelihood = scaling.reduce((sum, s) => sum + Math.log(s), 0)
    return { alpha, scaling, logLikelihood }
  }

  backward(observationSequence, scaling) {
    const T = observationSequence.length
    const obsIndices = observationSequence.map(o => this.observations.indexOf(o))
    const beta = Array(T).fill(null).map(() => Array(this.N).fill(0))

    for (let i = 0; i < this.N; i++) {
      beta[T-1][i] = 1 / scaling[T-1]
    }

    for (let t = T - 2; t >= 0; t--) {
      for (let i = 0; i < this.N; i++) {
        let sum = 0
        for (let j = 0; j < this.N; j++) {
          sum += this.A[i][j] * this.B[j][obsIndices[t+1]] * beta[t+1][j]
        }
        beta[t][i] = sum / scaling[t]
      }
    }

    return { beta }
  }

  posteriorProbabilities(observationSequence) {
    const { alpha, scaling, logLikelihood } = this.forward(observationSequence)
    const { beta } = this.backward(observationSequence, scaling)
    
    const gamma = []
    const T = observationSequence.length
    
    for (let t = 0; t < T; t++) {
      gamma[t] = []
      for (let i = 0; i < this.N; i++) {
        gamma[t][i] = alpha[t][i] * beta[t][i] * scaling[t]
      }
    }

    return { gamma, alpha, beta, logLikelihood }
  }

  baumWelch(observationSequence, maxIterations = 100, tolerance = 1e-6) {
    const T = observationSequence.length
    const obsIndices = observationSequence.map(o => this.observations.indexOf(o))
    const likelihoodHistory = []
    
    let prevLogLikelihood = -Infinity

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const { alpha, scaling, logLikelihood } = this.forward(observationSequence)
      const { beta } = this.backward(observationSequence, scaling)
      
      likelihoodHistory.push(Math.exp(logLikelihood))

      if (Math.abs(logLikelihood - prevLogLikelihood) < tolerance) {
        break
      }
      prevLogLikelihood = logLikelihood

      const gamma = Array(T).fill(null).map(() => Array(this.N).fill(0))
      const xi = Array(T - 1).fill(null).map(() => Array(this.N).fill(null).map(() => Array(this.N).fill(0)))

      for (let t = 0; t < T; t++) {
        for (let i = 0; i < this.N; i++) {
          gamma[t][i] = alpha[t][i] * beta[t][i]
        }
      }

      for (let t = 0; t < T - 1; t++) {
        for (let i = 0; i < this.N; i++) {
          for (let j = 0; j < this.N; j++) {
            xi[t][i][j] = alpha[t][i] * this.A[i][j] * this.B[j][obsIndices[t+1]] * beta[t+1][j]
          }
        }
      }

      for (let i = 0; i < this.N; i++) {
        this.pi[i] = gamma[0][i]
      }
      const piSum = this.pi.reduce((a, b) => a + b, 0)
      this.pi = this.pi.map(v => v / piSum)

      for (let i = 0; i < this.N; i++) {
        const gammaSum = gamma.slice(0, -1).reduce((sum, row) => sum + row[i], 0)
        for (let j = 0; j < this.N; j++) {
          const xiSum = xi.reduce((sum, row) => sum + row[i][j], 0)
          this.A[i][j] = gammaSum > 0 ? xiSum / gammaSum : 1 / this.N
        }
        const rowSum = this.A[i].reduce((a, b) => a + b, 0)
        this.A[i] = this.A[i].map(v => v / rowSum)
      }

      for (let j = 0; j < this.N; j++) {
        const gammaSum = gamma.reduce((sum, row) => sum + row[j], 0)
        for (let k = 0; k < this.M; k++) {
          let obsSum = 0
          for (let t = 0; t < T; t++) {
            if (obsIndices[t] === k) {
              obsSum += gamma[t][j]
            }
          }
          this.B[j][k] = gammaSum > 0 ? obsSum / gammaSum : 1 / this.M
        }
        const rowSum = this.B[j].reduce((a, b) => a + b, 0)
        this.B[j] = this.B[j].map(v => v / rowSum)
      }
    }

    return {
      transitionMatrix: this.A,
      emissionMatrix: this.B,
      initialDistribution: this.pi,
      likelihoodHistory
    }
  }
}

module.exports = HMM
