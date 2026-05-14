import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SimulationService, SimulationConfig } from './simulation.service';

@Controller('simulations')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get()
  async getAllSimulations() {
    return this.simulationService.getAllSimulations();
  }

  @Get(':id')
  async getSimulation(@Param('id') id: string) {
    const simulation = await this.simulationService.getSimulation(id);
    if (!simulation) {
      throw new HttpException('Simulation not found', HttpStatus.NOT_FOUND);
    }
    return simulation;
  }

  @Post()
  async createSimulation(@Body() body: { name: string; config: SimulationConfig }) {
    return this.simulationService.createSimulation(body.config, body.name);
  }

  @Delete(':id')
  async deleteSimulation(@Param('id') id: string) {
    await this.simulationService.deleteSimulation(id);
    return { success: true };
  }

  @Post('initialize')
  async initializeSolver(@Body() config: SimulationConfig) {
    this.simulationService.initializeSolver(config);
    return { success: true, message: 'Solver initialized' };
  }

  @Post('step')
  async stepSimulation(@Body() body: { dt: number; flowRateRatio: number }) {
    try {
      const result = this.simulationService.stepSimulation(body.dt, body.flowRateRatio);
      return result;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':id/save-droplets')
  async saveDroplets(
    @Param('id') id: string,
    @Body() body: { droplets: any[]; timestamp: number },
  ) {
    await this.simulationService.saveDropletData(id, body.droplets, body.timestamp);
    return { success: true };
  }

  @Put(':id/stats')
  async updateStats(@Param('id') id: string, @Body() stats: any) {
    await this.simulationService.updateSimulationStats(id, stats);
    return { success: true };
  }
}
