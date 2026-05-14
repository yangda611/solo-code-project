import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Simulation } from './Simulation.entity';

@Entity()
export class DropletData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Simulation, (sim) => sim.droplets, { onDelete: 'CASCADE' })
  simulation: Simulation;

  @Column({ type: 'real' })
  x: number;

  @Column({ type: 'real' })
  y: number;

  @Column({ type: 'real' })
  z: number;

  @Column({ type: 'real' })
  radius: number;

  @Column({ type: 'real' })
  volume: number;

  @Column({ type: 'real' })
  velocityX: number;

  @Column({ type: 'real' })
  velocityY: number;

  @Column({ type: 'real' })
  velocityZ: number;

  @Column({ default: false })
  isSatellite: boolean;

  @Column({ type: 'real' })
  timestamp: number;
}
