import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Simulation } from '../entity/Simulation.entity';
import { DropletData } from '../entity/DropletData.entity';
import { PhaseFieldSolver } from '../phase-field/phase-field.solver';

export interface SimulationConfig {
  channelGeometry: {
    type: string;
    mainChannelWidth: number;
    mainChannelHeight: number;
    mainChannelLength: number;
    sideChannelWidth: number;
    sideChannelHeight: number;
    sideChannelLength: number;
    orificeWidth?: number;
    surfaceRoughness: number;
    wallContactAngle: number;
  };
  fluidProperties: {
    continuousPhaseViscosity: number;
    dispersedPhaseViscosity: number;
    continuousPhaseDensity: number;
    dispersedPhaseDensity: number;
    interfacialTension: number;
    flowRateRatio: number;
    capillaryNumber: number;
  };
}

@Injectable()
export class SimulationService {
  private solver: PhaseFieldSolver | null = null;

  constructor(
    @InjectRepository(Simulation)
    private simulationRepository: Repository<Simulation>,
    @InjectRepository(DropletData)
    private dropletDataRepository: Repository<DropletData>,
  ) {}

  async createSimulation(config: SimulationConfig, name: string): Promise<Simulation> {
    const simulation = this.simulationRepository.create({
      name,
      channelGeometry: config.channelGeometry,
      fluidProperties: config.fluidProperties,
      simulationTime: 0,
    });

    return this.simulationRepository.save(simulation);
  }

  async getSimulation(id: string): Promise<Simulation | null> {
    return this.simulationRepository.findOne({
      where: { id },
      relations: ['droplets'],
    });
  }

  async getAllSimulations(): Promise<Simulation[]> {
    return this.simulationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async deleteSimulation(id: string): Promise<void> {
    await this.simulationRepository.delete(id);
  }

  initializeSolver(config: SimulationConfig): void {
    this.solver = new PhaseFieldSolver({
      width: config.channelGeometry.mainChannelLength * 1e-6,
      height: config.channelGeometry.mainChannelWidth * 1e-6,
      dx: 5e-6,
      dy: 5e-6,
      interfacialTension: config.fluidProperties.interfacialTension,
      mobility: 1e-10,
      relaxationTime: 1e-6,
    });
  }

  stepSimulation(dt: number, flowRateRatio: number): any {
    if (!this.solver) {
      throw new Error('Solver not initialized');
    }

    return this.solver.step(dt, flowRateRatio);
  }

  async saveDropletData(simulationId: string, droplets: any[], timestamp: number): Promise<void> {
    const simulation = await this.simulationRepository.findOne({ where: { id: simulationId } });
    if (!simulation) return;

    const dropletEntities = droplets.map((d) =>
      this.dropletDataRepository.create({
        simulation,
        x: d.x,
        y: d.y || 0,
        z: d.z || 0,
        radius: d.radius,
        volume: d.volume,
        velocityX: d.velocity?.x || 0,
        velocityY: d.velocity?.y || 0,
        velocityZ: d.velocity?.z || 0,
        isSatellite: d.isSatellite || false,
        timestamp,
      }),
    );

    await this.dropletDataRepository.save(dropletEntities);
  }

  async updateSimulationStats(id: string, stats: any): Promise<void> {
    await this.simulationRepository.update(id, {
      averageDropletSize: stats.averageSize,
      generationFrequency: stats.generationFrequency,
      cvValue: stats.cvValue,
      breakupMode: stats.breakupMode,
      simulationTime: stats.simulationTime,
    });
  }
}
