use num_complex::Complex64;
use crate::models::{DensityMatrix, GateType, GateOperation, NoiseParameters, EntropyTrajectory, MeasurementResult};

pub const I: [[Complex64; 2]; 2] = [
    [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
    [Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0)],
];

pub const H: [[Complex64; 2]; 2] = [
    [Complex64::new(1.0 / 2.0_f64.sqrt(), 0.0), Complex64::new(1.0 / 2.0_f64.sqrt(), 0.0)],
    [Complex64::new(1.0 / 2.0_f64.sqrt(), 0.0), Complex64::new(-1.0 / 2.0_f64.sqrt(), 0.0)],
];

pub const X: [[Complex64; 2]; 2] = [
    [Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0)],
    [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
];

pub const Y: [[Complex64; 2]; 2] = [
    [Complex64::new(0.0, 0.0), Complex64::new(0.0, -1.0)],
    [Complex64::new(0.0, 1.0), Complex64::new(0.0, 0.0)],
];

pub const Z: [[Complex64; 2]; 2] = [
    [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
    [Complex64::new(0.0, 0.0), Complex64::new(-1.0, 0.0)],
];

pub const S: [[Complex64; 2]; 2] = [
    [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
    [Complex64::new(0.0, 0.0), Complex64::new(0.0, 1.0)],
];

pub const T: [[Complex64; 2]; 2] = [
    [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
    [Complex64::new(0.0, 0.0), Complex64::new(1.0 / 2.0_f64.sqrt(), 1.0 / 2.0_f64.sqrt())],
];

pub fn rx(theta: f64) -> [[Complex64; 2]; 2] {
    let cos = (theta / 2.0).cos();
    let sin = (theta / 2.0).sin();
    [
        [Complex64::new(cos, 0.0), Complex64::new(0.0, -sin)],
        [Complex64::new(0.0, -sin), Complex64::new(cos, 0.0)],
    ]
}

pub fn ry(theta: f64) -> [[Complex64; 2]; 2] {
    let cos = (theta / 2.0).cos();
    let sin = (theta / 2.0).sin();
    [
        [Complex64::new(cos, 0.0), Complex64::new(-sin, 0.0)],
        [Complex64::new(sin, 0.0), Complex64::new(cos, 0.0)],
    ]
}

pub fn rz(theta: f64) -> [[Complex64; 2]; 2] {
    let cos = (theta / 2.0).cos();
    let sin = (theta / 2.0).sin();
    [
        [Complex64::new(cos, -sin), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(cos, sin)],
    ]
}

pub fn cnot_matrix() -> [[Complex64; 4]; 4] {
    [
        [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
    ]
}

pub fn cz_matrix() -> [[Complex64; 4]; 4] {
    [
        [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(-1.0, 0.0)],
    ]
}

pub fn swap_matrix() -> [[Complex64; 4]; 4] {
    [
        [Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0)],
        [Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(0.0, 0.0), Complex64::new(1.0, 0.0)],
    ]
}

pub fn initialize_density_matrix(n_qubits: usize) -> DensityMatrix {
    let size = 2usize.pow(n_qubits as u32);
    let mut data = vec![vec![Complex64::new(0.0, 0.0); size]; size];
    data[0][0] = Complex64::new(1.0, 0.0);
    DensityMatrix { data, size }
}

pub fn tensor_product_single_qubit(gate: &[[Complex64; 2]; 2], qubit_idx: usize, n_qubits: usize) -> Vec<Vec<Complex64>> {
    let size = 2usize.pow(n_qubits as u32);
    let mut result = vec![vec![Complex64::new(0.0, 0.0); size]; size];
    
    for i in 0..size {
        for j in 0..size {
            let i_before = (i >> (n_qubits - qubit_idx - 1)) & 1;
            let j_before = (j >> (n_qubits - qubit_idx - 1)) & 1;
            let i_mask = size - (1 << (n_qubits - qubit_idx - 1));
            let j_mask = size - (1 << (n_qubits - qubit_idx - 1));
            
            if (i & i_mask) == (j & j_mask) {
                result[i][j] = gate[i_before][j_before];
            }
        }
    }
    result
}

pub fn tensor_product_two_qubit(gate: &[[Complex64; 4]; 4], qubit1: usize, qubit2: usize, n_qubits: usize) -> Vec<Vec<Complex64>> {
    let size = 2usize.pow(n_qubits as u32);
    let mut result = vec![vec![Complex64::new(0.0, 0.0); size]; size];
    let mut q1 = qubit1;
    let mut q2 = qubit2;
    
    if q1 > q2 {
        std::mem::swap(&mut q1, &mut q2);
    }
    
    for i in 0..size {
        for j in 0..size {
            let i1 = (i >> (n_qubits - q1 - 1)) & 1;
            let i2 = (i >> (n_qubits - q2 - 1)) & 1;
            let j1 = (j >> (n_qubits - q1 - 1)) & 1;
            let j2 = (j >> (n_qubits - q2 - 1)) & 1;
            
            let mask1 = !(1 << (n_qubits - q1 - 1));
            let mask2 = !(1 << (n_qubits - q2 - 1));
            
            if (i & mask1 & mask2) == (j & mask1 & mask2) {
                let gate_row = i1 * 2 + i2;
                let gate_col = j1 * 2 + j2;
                result[i][j] = gate[gate_row][gate_col];
            }
        }
    }
    result
}

pub fn multiply_matrices(a: &[Vec<Complex64>], b: &[Vec<Complex64>]) -> Vec<Vec<Complex64>> {
    let n = a.len();
    let mut result = vec![vec![Complex64::new(0.0, 0.0); n]; n];
    
    for i in 0..n {
        for k in 0..n {
            if a[i][k].norm() < 1e-10 {
                continue;
            }
            for j in 0..n {
                result[i][j] += a[i][k] * b[k][j];
            }
        }
    }
    result
}

pub fn conjugate_transpose(m: &[Vec<Complex64>]) -> Vec<Vec<Complex64>> {
    let n = m.len();
    let mut result = vec![vec![Complex64::new(0.0, 0.0); n]; n];
    
    for i in 0..n {
        for j in 0..n {
            result[i][j] = m[j][i].conj();
        }
    }
    result
}

pub fn apply_gate(dm: &mut DensityMatrix, gate_op: &GateOperation, n_qubits: usize) {
    let gate_matrix = match &gate_op.gate_type {
        GateType::H => tensor_product_single_qubit(&H, gate_op.qubits[0], n_qubits),
        GateType::X => tensor_product_single_qubit(&X, gate_op.qubits[0], n_qubits),
        GateType::Y => tensor_product_single_qubit(&Y, gate_op.qubits[0], n_qubits),
        GateType::Z => tensor_product_single_qubit(&Z, gate_op.qubits[0], n_qubits),
        GateType::S => tensor_product_single_qubit(&S, gate_op.qubits[0], n_qubits),
        GateType::T => tensor_product_single_qubit(&T, gate_op.qubits[0], n_qubits),
        GateType::Rx { theta } => tensor_product_single_qubit(&rx(*theta), gate_op.qubits[0], n_qubits),
        GateType::Ry { theta } => tensor_product_single_qubit(&ry(*theta), gate_op.qubits[0], n_qubits),
        GateType::Rz { theta } => tensor_product_single_qubit(&rz(*theta), gate_op.qubits[0], n_qubits),
        GateType::CNOT => tensor_product_two_qubit(&cnot_matrix(), gate_op.qubits[0], gate_op.qubits[1], n_qubits),
        GateType::CZ => tensor_product_two_qubit(&cz_matrix(), gate_op.qubits[0], gate_op.qubits[1], n_qubits),
        GateType::Swap => tensor_product_two_qubit(&swap_matrix(), gate_op.qubits[0], gate_op.qubits[1], n_qubits),
        _ => panic!("Gate not implemented"),
    };
    
    let u_dagger = conjugate_transpose(&gate_matrix);
    let intermediate = multiply_matrices(&gate_matrix, &dm.data);
    dm.data = multiply_matrices(&intermediate, &u_dagger);
}

pub fn partial_trace(dm: &DensityMatrix, qubit_to_trace: usize, n_qubits: usize) -> DensityMatrix {
    let old_size = dm.size;
    let new_size = old_size / 2;
    let mut result = vec![vec![Complex64::new(0.0, 0.0); new_size]; new_size];
    
    let shift = n_qubits - qubit_to_trace - 1;
    
    for i in 0..old_size {
        for j in 0..old_size {
            let bit_i = (i >> shift) & 1;
            let bit_j = (j >> shift) & 1;
            
            if bit_i == bit_j {
                let mask = !(1 << shift);
                let new_i = (i & mask) | ((i >> 1) & ((1 << shift) - 1));
                let new_j = (j & mask) | ((j >> 1) & ((1 << shift) - 1));
                
                let adjusted_i = if i > (1 << shift) { new_i - (1 << shift) } else { new_i };
                let adjusted_j = if j > (1 << shift) { new_j - (1 << shift) } else { new_j };
                
                result[adjusted_i][adjusted_j] += dm.data[i][j];
            }
        }
    }
    
    DensityMatrix { data: result, size: new_size }
}

pub fn von_neumann_entropy(dm: &DensityMatrix) -> f64 {
    let eigenvalues = compute_eigenvalues(dm);
    eigenvalues.iter()
        .filter(|&&e| e > 1e-15)
        .map(|&e| -e * e.log2())
        .sum()
}

fn compute_eigenvalues(dm: &DensityMatrix) -> Vec<f64> {
    let n = dm.size;
    let mut a = dm.data.clone();
    
    let mut eigenvalues = vec![0.0; n];
    for _ in 0..100 {
        let (q, r) = qr_decomposition(&a);
        a = multiply_matrices(&r, &q);
    }
    
    for i in 0..n {
        eigenvalues[i] = a[i][i].re.max(0.0);
    }
    
    eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap());
    eigenvalues
}

fn qr_decomposition(m: &[Vec<Complex64>]) -> (Vec<Vec<Complex64>>, Vec<Vec<Complex64>>) {
    let n = m.len();
    let mut q = vec![vec![Complex64::new(0.0, 0.0); n]; n];
    let mut r = vec![vec![Complex64::new(0.0, 0.0); n]; n];
    let mut a = m.to_vec();
    
    for j in 0..n {
        let mut norm_sq = 0.0;
        for i in 0..n {
            norm_sq += a[i][j].norm_sqr();
        }
        let norm = norm_sq.sqrt();
        r[j][j] = Complex64::new(norm, 0.0);
        
        if norm > 1e-15 {
            for i in 0..n {
                q[i][j] = a[i][j] / norm;
            }
        }
        
        for k in j + 1..n {
            let mut dot = Complex64::new(0.0, 0.0);
            for i in 0..n {
                dot += q[i][j].conj() * a[i][k];
            }
            r[j][k] = dot;
            
            for i in 0..n {
                a[i][k] -= dot * q[i][j];
            }
        }
    }
    
    (q, r)
}

pub fn compute_measurement_probabilities(dm: &DensityMatrix) -> Vec<MeasurementResult> {
    let n = (dm.size as f64).log2() as usize;
    let mut results = Vec::with_capacity(dm.size);
    
    for i in 0..dm.size {
        let bitstring = format!("{:0width$b}", i, width = n);
        let probability = dm.data[i][i].re.max(0.0);
        results.push(MeasurementResult { bitstring, probability });
    }
    
    results.sort_by(|a, b| b.probability.partial_cmp(&a.probability).unwrap());
    results
}

pub fn apply_calibration_error(gate_op: &mut GateOperation, error_magnitude: f64) {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    match &mut gate_op.gate_type {
        GateType::Rx { theta } => {
            *theta += rng.gen_range(-error_magnitude..error_magnitude);
        }
        GateType::Ry { theta } => {
            *theta += rng.gen_range(-error_magnitude..error_magnitude);
        }
        GateType::Rz { theta } => {
            *theta += rng.gen_range(-error_magnitude..error_magnitude);
        }
        _ => {}
    }
}

pub fn apply_crosstalk(gates: &mut [GateOperation], coupling_strength: f64) {
    if gates.len() < 2 {
        return;
    }
    
    for i in 0..gates.len() {
        for j in i + 1..gates.len() {
            let qubits_i: std::collections::HashSet<_> = gates[i].qubits.iter().collect();
            let qubits_j: std::collections::HashSet<_> = gates[j].qubits.iter().collect();
            
            if qubits_i.intersection(&qubits_j).next().is_some() {
                if let GateType::Rx { theta } = &mut gates[i].gate_type {
                    *theta += coupling_strength;
                }
                if let GateType::Rx { theta } = &mut gates[j].gate_type {
                    *theta += coupling_strength;
                }
            }
        }
    }
}

pub fn simulate_evolution(
    n_qubits: usize,
    gates: &[GateOperation],
    noise_params: &NoiseParameters,
    steps: usize,
    dt: f64,
) -> (DensityMatrix, Vec<EntropyTrajectory>, Vec<MeasurementResult>, Vec<f64>) {
    let mut dm = initialize_density_matrix(n_qubits);
    let mut entropy_trajectory = Vec::with_capacity(steps);
    let mut decoherence_times = vec![0.0; n_qubits];
    
    let mut noisy_gates = gates.to_vec();
    
    for gate in &mut noisy_gates {
        if noise_params.calibration_error > 0.0 {
            apply_calibration_error(gate, noise_params.calibration_error);
        }
    }
    
    if noise_params.crosstalk_coupling > 0.0 {
        apply_crosstalk(&mut noisy_gates, noise_params.crosstalk_coupling);
    }
    
    for step in 0..steps {
        for gate in &noisy_gates {
            apply_gate(&mut dm, gate, n_qubits);
        }
        
        apply_decoherence(&mut dm, noise_params.decoherence_rate * dt, n_qubits);
        
        for q in 0..n_qubits {
            let reduced_dm = partial_trace(&dm, q, n_qubits);
            let purity = trace_squared(&reduced_dm);
            if purity < 0.95 && decoherence_times[q] == 0.0 {
                decoherence_times[q] = step as f64 * dt;
            }
        }
        
        let entropy = von_neumann_entropy(&dm);
        entropy_trajectory.push(EntropyTrajectory { timestep: step, entropy });
    }
    
    let measurement_probs = compute_measurement_probabilities(&dm);
    
    (dm, entropy_trajectory, measurement_probs, decoherence_times)
}

pub fn apply_decoherence(dm: &mut DensityMatrix, gamma: f64, n_qubits: usize) {
    let size = dm.size;
    let factor = (-gamma).exp();
    
    for i in 0..size {
        for j in 0..size {
            if i != j {
                dm.data[i][j] *= factor;
            }
        }
    }
    
    let trace: f64 = (0..size).map(|i| dm.data[i][i].re).sum();
    if trace > 0.0 && (trace - 1.0).abs() > 1e-10 {
        for i in 0..size {
            dm.data[i][i] /= trace;
        }
    }
}

pub fn trace_squared(dm: &DensityMatrix) -> f64 {
    let product = multiply_matrices(&dm.data, &dm.data);
    (0..dm.size).map(|i| product[i][i].re).sum()
}
