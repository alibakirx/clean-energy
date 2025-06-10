export interface EnergySource {
  id: string;
  name: string;
  type: 'solar' | 'wind' | 'hydro' | 'smart-grid';
  position: { x: number; y: number };
  efficiency: number;
  active: boolean;
  capacity: number;
  color: string;
}

export interface EnergyParticle {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  size: number;
  color: string;
  sourceType: string;
}

export interface WindTurbine extends EnergySource {
  rotationSpeed: number;
  bladeAngle: number;
  windStrength: number;
}

export interface SolarPanel extends EnergySource {
  sunExposure: number;
  temperature: number;
  tilt: number;
}

export interface HydroPlant extends EnergySource {
  waterFlow: number;
  turbineSpeed: number;
  reservoirLevel: number;
}

export interface SmartGridNode extends EnergySource {
  connections: string[];
  loadBalancing: number;
  energyStorage: number;
}

export interface EnergySystemConfig {
  particleCount: number;
  windSpeed: number;
  solarIntensity: number;
  hydroFlow: number;
  gridEfficiency: number;
  systemLoad: number;
  renewableRatio: number;
}

export interface UserControls {
  energyType: 'all' | 'solar' | 'wind' | 'hydro' | 'smart-grid';
  intensity: number;
  efficiency: number;
  showParticles: boolean;
  showGrid: boolean;
  simulationSpeed: number;
} 