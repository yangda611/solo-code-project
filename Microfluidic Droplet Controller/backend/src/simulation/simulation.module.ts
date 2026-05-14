import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Simulation } from '../entity/Simulation.entity';
import { DropletData } from '../entity/DropletData.entity';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Simulation, DropletData])],
  providers: [SimulationService],
  controllers: [SimulationController],
})
export class SimulationModule {}
