import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SimulationModule } from './simulation/simulation.module';
import { Simulation } from './entity/Simulation.entity';
import { DropletData } from './entity/DropletData.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'microfluidic.db',
      entities: [Simulation, DropletData],
      synchronize: true,
      logging: false,
    }),
    SimulationModule,
  ],
})
export class AppModule {}
