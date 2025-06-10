import { UserControls } from '../types';

interface ControlPanelProps {
  controls: UserControls;
  onControlChange: (controls: Partial<UserControls>) => void;
  energyData: {
    totalGeneration: number;
    renewablePercentage: number;
    efficiency: number;
  };
}

const ControlPanel = ({
  controls,
  onControlChange,
  energyData
}: ControlPanelProps) => {
  return (
    <div className="fixed top-4 left-4 z-10 control-panel w-80">
      <h2 className="text-xl font-bold mb-4 text-energy-green-400">
        Clean Energy Control Center
      </h2>

      {/* Energy Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Energy Source</label>
        <div className="grid grid-cols-2 gap-2">
          {(['all', 'solar', 'wind', 'hydro'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onControlChange({ energyType: type })}
              className={`energy-button ${
                type === 'solar' ? 'solar-button' :
                type === 'wind' ? 'wind-button' :
                type === 'hydro' ? 'hydro-button' :
                'bg-energy-green-500 text-white hover:bg-energy-green-400'
              } ${controls.energyType === type ? 'ring-2 ring-offset-2' : ''}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Energy Intensity: {Math.round(controls.intensity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={controls.intensity}
          onChange={(e) => onControlChange({ intensity: parseFloat(e.target.value) })}
          className="energy-slider"
        />
      </div>

      {/* Efficiency Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          System Efficiency: {Math.round(controls.efficiency * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.01"
          value={controls.efficiency}
          onChange={(e) => onControlChange({ efficiency: parseFloat(e.target.value) })}
          className="energy-slider"
        />
      </div>

      {/* Simulation Speed */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Simulation Speed: {controls.simulationSpeed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={controls.simulationSpeed}
          onChange={(e) => onControlChange({ simulationSpeed: parseFloat(e.target.value) })}
          className="energy-slider"
        />
      </div>

      {/* Visual Options */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="showParticles"
            checked={controls.showParticles}
            onChange={(e) => onControlChange({ showParticles: e.target.checked })}
            className="mr-2 rounded border-gray-600 bg-gray-700 text-energy-green-500"
          />
          <label htmlFor="showParticles" className="text-sm">Show Energy Particles</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showGrid"
            checked={controls.showGrid}
            onChange={(e) => onControlChange({ showGrid: e.target.checked })}
            className="mr-2 rounded border-gray-600 bg-gray-700 text-energy-green-500"
          />
          <label htmlFor="showGrid" className="text-sm">Show Smart Grid</label>
        </div>
      </div>

      {/* Energy Statistics */}
      <div className="border-t border-gray-600 pt-4">
        <h3 className="text-lg font-semibold mb-2 text-energy-green-400">Energy Stats</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Generation:</span>
            <span className="text-solar-yellow-400">{energyData.totalGeneration.toFixed(1)} MW</span>
          </div>
          <div className="flex justify-between">
            <span>Renewable %:</span>
            <span className="text-energy-green-400">{energyData.renewablePercentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>System Efficiency:</span>
            <span className="text-wind-blue-400">{energyData.efficiency.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel; 