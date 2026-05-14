import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { DropletData } from './DropletData.entity';

@Entity()
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json' })
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

  @Column({ type: 'json' })
  fluidProperties: {
    continuousPhaseViscosity: number;
    dispersedPhaseViscosity: number;
    continuousPhaseDensity: number;
    dispersedPhaseDensity: number;
    interfacialTension: number;
    flowRateRatio: number;
    capillaryNumber: number;
  };

  @Column({ type: 'real', default: 0 })
  simulationTime: number;

  @Column({ type: 'real', nullable: true })
  averageDropletSize: number;

  @Column({ type: 'real', nullable: true })
  generationFrequency: number;

  @Column({ type: 'real', nullable: true })
  cvValue: number;

  @Column({ nullable: true })
  breakupMode: string;

  @OneToMany(() => DropletData, (droplet) => droplet.simulation)
  droplets: DropletData[];

  @CreateDateColumn()
  createdAt: Date;
}
