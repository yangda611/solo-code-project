import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
    try {
        const simulations = db.prepare(`
            SELECT 
                s.*,
                COUNT(DISTINCT b.id) as band_count,
                COUNT(DISTINCT g.id) as gap_count
            FROM simulations s
            LEFT JOIN band_data b ON s.id = b.simulation_id
            LEFT JOIN band_gaps g ON s.id = g.simulation_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT 20
        `).all();

        return NextResponse.json({
            success: true,
            simulations
        });
    } catch (error) {
        console.error('History error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch history'
        }, { status: 500 });
    }
}
