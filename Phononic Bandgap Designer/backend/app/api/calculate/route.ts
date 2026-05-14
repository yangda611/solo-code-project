import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { BandgapCalculator } from '../../../lib/calculator';
import type { MaterialParams, GeometryParams } from '../../../types';

export async function POST(request: Request) {
    try {
        const { materialParams, geometryParams } = await request.json();

        const result = BandgapCalculator.calculate(materialParams as MaterialParams, geometryParams as GeometryParams);

        const insertSimulation = db.prepare(`
            INSERT INTO simulations (
                lattice_type, scatterer_shape, filling_fraction, lattice_constant,
                matrix_modulus, scatterer_modulus, matrix_density, scatterer_density
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const simulationResult = insertSimulation.run(
            geometryParams.latticeType,
            geometryParams.scattererShape,
            geometryParams.fillingFraction,
            geometryParams.latticeConstant,
            materialParams.matrixModulus,
            materialParams.scattererModulus,
            materialParams.matrixDensity,
            materialParams.scattererDensity
        );

        const simulationId = simulationResult.lastInsertRowid as number;

        const insertBandData = db.prepare(`
            INSERT INTO band_data (simulation_id, k, frequency, band_index)
            VALUES (?, ?, ?, ?)
        `);

        for (const point of result.bandData) {
            insertBandData.run(simulationId, point.k, point.frequency, point.bandIndex);
        }

        const insertBandGap = db.prepare(`
            INSERT INTO band_gaps (simulation_id, start_frequency, end_frequency, normalized_width)
            VALUES (?, ?, ?, ?)
        `);

        for (const gap of result.bandGaps) {
            insertBandGap.run(simulationId, gap.startFrequency, gap.endFrequency, gap.normalizedWidth);
        }

        return NextResponse.json({
            success: true,
            simulationId,
            result
        });
    } catch (error) {
        console.error('Calculation error:', error);
        return NextResponse.json({
            success: false,
            error: 'Calculation failed'
        }, { status: 500 });
    }
}
