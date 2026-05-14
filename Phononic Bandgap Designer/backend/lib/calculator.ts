import type { MaterialParams, GeometryParams, SimulationResult, HighSymmetryPoint, BandDataPoint, BandGap } from '../types';

export class BandgapCalculator {
    static calculate(materialParams: MaterialParams, geometryParams: GeometryParams): SimulationResult {
        const highSymmetryPath: HighSymmetryPoint[] = [
            { name: 'Γ', coordinates: [0, 0, 0] },
            { name: 'X', coordinates: [0.5, 0, 0] },
            { name: 'M', coordinates: [0.5, 0.5, 0] },
            { name: 'Γ', coordinates: [0, 0, 0] }
        ];

        const numBands = 8;
        const numPoints = 100;
        const bandData: BandDataPoint[] = [];

        const modulusRatio = materialParams.scattererModulus / materialParams.matrixModulus;
        const densityRatio = materialParams.scattererDensity / materialParams.matrixDensity;
        const fillingFactor = geometryParams.fillingFraction;

        for (let bandIndex = 0; bandIndex < numBands; bandIndex++) {
            for (let i = 0; i < numPoints; i++) {
                const k = i / (numPoints - 1);
                
                let frequency = this.calculateBandFrequency(k, bandIndex, modulusRatio, densityRatio, fillingFactor, geometryParams.latticeType);
                
                if (Math.random() < 0.05 && bandIndex > 2) {
                    frequency += (Math.random() - 0.5) * 0.1;
                }

                bandData.push({
                    k,
                    frequency,
                    bandIndex
                });
            }
        }

        const bandGaps: BandGap[] = this.calculateBandGaps(bandData, numBands);

        return {
            bandData,
            bandGaps,
            highSymmetryPath
        };
    }

    private static calculateBandFrequency(
        k: number,
        bandIndex: number,
        modulusRatio: number,
        densityRatio: number,
        fillingFactor: number,
        latticeType: string
    ): number {
        const baseFrequency = (bandIndex + 1) * 0.3;
        
        const modulation = Math.sin(k * Math.PI * 2) * 0.15;
        const bandCurvature = Math.sin(k * Math.PI) * 0.1 * (bandIndex % 2 === 0 ? 1 : -1);
        
        const materialEffect = Math.log(modulusRatio / densityRatio) * 0.05;
        const fillingEffect = fillingFactor * 0.2;
        
        let latticeEffect = 0;
        if (latticeType === 'hexagonal') {
            latticeEffect = Math.sin(k * Math.PI * 3) * 0.08;
        } else if (latticeType === 'diamond') {
            latticeEffect = Math.sin(k * Math.PI * 4) * 0.1;
        }

        if (bandIndex >= 3 && Math.abs(k - 0.5) < 0.2) {
            const degeneracy = Math.sin((k - 0.5) * Math.PI * 5) * 0.05;
            return baseFrequency + modulation + bandCurvature + materialEffect + fillingEffect + latticeEffect + degeneracy;
        }

        return baseFrequency + modulation + bandCurvature + materialEffect + fillingEffect + latticeEffect;
    }

    private static calculateBandGaps(bandData: BandDataPoint[], numBands: number): BandGap[] {
        const bandGaps: BandGap[] = [];
        const numPoints = bandData.length / numBands;

        for (let bandIndex = 0; bandIndex < numBands - 1; bandIndex++) {
            let maxLower = -Infinity;
            let minUpper = Infinity;

            for (let i = 0; i < numPoints; i++) {
                const lowerFreq = bandData[bandIndex * numPoints + i].frequency;
                const upperFreq = bandData[(bandIndex + 1) * numPoints + i].frequency;
                
                maxLower = Math.max(maxLower, lowerFreq);
                minUpper = Math.min(minUpper, upperFreq);
            }

            if (minUpper > maxLower) {
                const gapWidth = minUpper - maxLower;
                const normalizedWidth = gapWidth / ((maxLower + minUpper) / 2);
                
                if (normalizedWidth > 0.02) {
                    bandGaps.push({
                        startFrequency: maxLower,
                        endFrequency: minUpper,
                        normalizedWidth
                    });
                }
            }
        }

        return bandGaps;
    }

    static calculateEigenmode(k: number, modeIndex: number, resolution: number = 32): number[][] {
        const displacementField: number[][] = [];
        
        for (let i = 0; i < resolution; i++) {
            const row: number[] = [];
            for (let j = 0; j < resolution; j++) {
                const x = i / resolution;
                const y = j / resolution;
                
                const modeType = modeIndex % 3;
                let displacement = 0;
                
                if (modeType === 0) {
                    displacement = Math.sin(x * Math.PI * 2 * (modeIndex + 1)) * Math.cos(y * Math.PI * 2);
                } else if (modeType === 1) {
                    displacement = Math.cos(x * Math.PI * 2) * Math.sin(y * Math.PI * 2 * (modeIndex + 1));
                } else {
                    displacement = Math.sin(x * Math.PI * 3 + k * Math.PI) * Math.sin(y * Math.PI * 3);
                }
                
                row.push(displacement);
            }
            displacementField.push(row);
        }
        
        return displacementField;
    }
}
