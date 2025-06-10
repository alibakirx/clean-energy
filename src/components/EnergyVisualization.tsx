import { useEffect, useRef } from 'react';
import { UserControls } from '../types';

declare global {
  interface Window {
    p5: any;
  }
}

interface EnergyVisualizationProps {
  controls: UserControls;
  onEnergyDataUpdate: (data: { totalGeneration: number; renewablePercentage: number; efficiency: number }) => void;
}

const EnergyVisualization = ({ controls, onEnergyDataUpdate }: EnergyVisualizationProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const checkP5 = () => {
      if (typeof window !== 'undefined' && window.p5) {
    
    const sketch = (p: any) => {
      // Energy sources
      let windTurbines: any[] = [];
      let solarPanels: any[] = [];
      let energyParticles: any[] = [];
      let timeOfDay = 12; // Start at noon
      let backgroundHue = 0;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        initializeEnergySources();
      };

      function initializeEnergySources() {
        windTurbines = [];
        solarPanels = [];
        
        // Create wind turbines
        for (let i = 0; i < 6; i++) {
          windTurbines.push({
            x: p.random(100, p.width - 100),
            y: p.random(100, p.height - 200),
            rotation: 0,
            speed: p.random(0.02, 0.08),
            efficiency: p.random(0.7, 0.95),
            capacity: p.random(2, 5),
            windStrength: 1
          });
        }

        // Create solar panels
        for (let i = 0; i < 8; i++) {
          solarPanels.push({
            x: p.random(50, p.width - 50),
            y: p.random(50, p.height - 50),
            efficiency: p.random(0.18, 0.22),
            capacity: p.random(0.5, 2),
            sunExposure: 1,
            angle: p.random(-10, 10)
          });
        }
      }

      p.draw = () => {
        updateEnvironment();
        drawBackground();
        updateEnergyProduction();
        
        if (controls.energyType === 'all' || controls.energyType === 'wind') {
          drawWindTurbines();
        }
        if (controls.energyType === 'all' || controls.energyType === 'solar') {
          drawSolarPanels();
        }
        if (controls.showParticles) {
          updateEnergyParticles();
        }
        
        updateStatistics();
      };

      function updateEnvironment() {
        // Update time of day (24-hour cycle)
        timeOfDay += (controls.simulationSpeed * 0.01) % 24;
        if (timeOfDay >= 24) timeOfDay = 0;
        
        // Update background hue based on time
        backgroundHue = p.map(timeOfDay, 0, 24, 200, 280);
      }

      function drawBackground() {
        // Dynamic sky gradient
        for (let i = 0; i <= p.height; i++) {
          const inter = p.map(i, 0, p.height, 0, 1);
          const brightness = p.map(timeOfDay, 0, 24, 20, 80);
          const saturation = p.map(timeOfDay, 6, 18, 40, 80);
          
          p.stroke(backgroundHue, saturation, brightness - inter * 30);
          p.line(0, i, p.width, i);
        }

        // Draw sun/moon
        drawSunMoon();
        
        // Draw stars at night
        if (timeOfDay < 6 || timeOfDay > 20) {
          drawStars();
        }
      }

      function drawSunMoon() {
        const angle = p.map(timeOfDay, 0, 24, 0, p.TWO_PI);
        const centerX = p.width / 2;
        const centerY = p.height + 50;
        const radius = p.height * 0.8;
        
        const x = centerX + p.cos(angle - p.PI/2) * radius;
        const y = centerY + p.sin(angle - p.PI/2) * radius;

        if (timeOfDay >= 6 && timeOfDay <= 18) {
          // Sun
          p.fill(60, 100, 100, 80);
          p.noStroke();
          p.ellipse(x, y, 80, 80);
          
          // Sun rays
          p.stroke(60, 80, 100, 60);
          p.strokeWeight(3);
          for (let i = 0; i < 12; i++) {
            const rayAngle = (i / 12) * p.TWO_PI;
            const x1 = x + p.cos(rayAngle) * 50;
            const y1 = y + p.sin(rayAngle) * 50;
            const x2 = x + p.cos(rayAngle) * 80;
            const y2 = y + p.sin(rayAngle) * 80;
            p.line(x1, y1, x2, y2);
          }
        } else {
          // Moon
          p.fill(0, 0, 90, 70);
          p.noStroke();
          p.ellipse(x, y, 60, 60);
        }
      }

      function drawStars() {
        p.fill(0, 0, 100, 80);
        p.noStroke();
        for (let i = 0; i < 100; i++) {
          const starX = (i * 73) % p.width;
          const starY = (i * 37) % (p.height * 0.7);
          const twinkle = p.noise(starX * 0.01, starY * 0.01, p.frameCount * 0.02);
          p.ellipse(starX, starY, twinkle * 3, twinkle * 3);
        }
      }

      function updateEnergyProduction() {
        // Update wind turbines
        windTurbines.forEach(turbine => {
          turbine.windStrength = (0.5 + p.noise(turbine.x * 0.01, turbine.y * 0.01, p.frameCount * 0.02)) * controls.intensity;
          turbine.rotation += turbine.speed * turbine.windStrength * controls.simulationSpeed;
        });

        // Update solar panels
        solarPanels.forEach(panel => {
          if (timeOfDay >= 6 && timeOfDay <= 18) {
            const dayProgress = p.map(timeOfDay, 6, 18, 0, p.PI);
            panel.sunExposure = p.sin(dayProgress) * controls.intensity;
          } else {
            panel.sunExposure = 0;
          }
        });

        // Generate energy particles
        if (controls.showParticles && p.frameCount % 10 === 0) {
          generateEnergyParticles();
        }
      }

      function drawWindTurbines() {
        windTurbines.forEach(turbine => {
          p.push();
          p.translate(turbine.x, turbine.y);
          
          // Tower
          p.stroke(0, 0, 80);
          p.strokeWeight(4);
          p.line(0, 0, 0, -100);
          
          // Nacelle
          p.fill(0, 0, 70);
          p.noStroke();
          p.ellipse(0, -100, 20, 8);
          
          // Blades
          p.stroke(200, 60, 90);
          p.strokeWeight(3);
          for (let i = 0; i < 3; i++) {
            p.push();
            p.translate(0, -100);
            p.rotate(turbine.rotation + (i * p.TWO_PI / 3));
            p.line(0, 0, 0, -50);
            p.pop();
          }
          
          // Energy aura
          if (turbine.windStrength > 0.3) {
            p.fill(200, 60, 90, turbine.windStrength * 30);
            p.noStroke();
            p.ellipse(0, -100, 30 + turbine.windStrength * 20, 30 + turbine.windStrength * 20);
          }
          
          p.pop();
        });
      }

      function drawSolarPanels() {
        solarPanels.forEach(panel => {
          p.push();
          p.translate(panel.x, panel.y);
          p.rotate(p.radians(panel.angle));
          
          // Panel
          p.fill(240, 100, 60);
          p.stroke(0, 0, 30);
          p.strokeWeight(2);
          p.rect(-20, -15, 40, 30);
          
          // Grid lines
          p.stroke(0, 0, 20);
          p.strokeWeight(1);
          for (let i = -15; i <= 15; i += 5) {
            p.line(i, -15, i, 15);
            p.line(-20, i, 20, i);
          }
          
          // Solar energy effect
          if (panel.sunExposure > 0.1) {
            p.fill(60, 100, 100, panel.sunExposure * 50);
            p.noStroke();
            p.ellipse(0, 0, 50 + panel.sunExposure * 30, 50 + panel.sunExposure * 30);
          }
          
          p.pop();
        });
      }

      function generateEnergyParticles() {
        // From wind turbines
        windTurbines.forEach(turbine => {
          if (turbine.windStrength > 0.3 && p.random() < 0.5) {
            energyParticles.push({
              x: turbine.x,
              y: turbine.y - 100,
              vx: p.random(-2, 2),
              vy: p.random(-3, -1),
              life: 100,
              color: [200, 60, 90],
              type: 'wind'
            });
          }
        });

        // From solar panels
        solarPanels.forEach(panel => {
          if (panel.sunExposure > 0.1 && p.random() < 0.3) {
            energyParticles.push({
              x: panel.x,
              y: panel.y,
              vx: p.random(-1, 1),
              vy: p.random(-2, -0.5),
              life: 80,
              color: [60, 100, 100],
              type: 'solar'
            });
          }
        });
      }

      function updateEnergyParticles() {
        for (let i = energyParticles.length - 1; i >= 0; i--) {
          const particle = energyParticles[i];
          
          particle.x += particle.vx * controls.simulationSpeed;
          particle.y += particle.vy * controls.simulationSpeed;
          particle.life -= 2 * controls.simulationSpeed;
          
          // Draw particle
          const alpha = p.map(particle.life, 0, 100, 0, 80);
          p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
          p.noStroke();
          p.ellipse(particle.x, particle.y, 6, 6);
          
          // Remove dead particles
          if (particle.life <= 0 || particle.y < 0) {
            energyParticles.splice(i, 1);
          }
        }
      }

      function updateStatistics() {
        let totalGeneration = 0;
        let renewableGeneration = 0;
        
        // Calculate wind generation
        windTurbines.forEach(turbine => {
          const generation = turbine.capacity * turbine.windStrength * turbine.efficiency * controls.efficiency;
          totalGeneration += generation;
          renewableGeneration += generation;
        });

        // Calculate solar generation
        solarPanels.forEach(panel => {
          const generation = panel.capacity * panel.sunExposure * panel.efficiency * controls.efficiency;
          totalGeneration += generation;
          renewableGeneration += generation;
        });

        const renewablePercentage = totalGeneration > 0 ? 100 : 0; // All sources are renewable
        const efficiency = controls.efficiency * 100;

        onEnergyDataUpdate({
          totalGeneration,
          renewablePercentage,
          efficiency
        });
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        initializeEnergySources();
      };

      p.mousePressed = () => {
        // Add new solar panel at mouse position
        if (controls.energyType === 'solar' || controls.energyType === 'all') {
          solarPanels.push({
            x: p.mouseX,
            y: p.mouseY,
            efficiency: 0.2,
            capacity: 1,
            sunExposure: timeOfDay >= 6 && timeOfDay <= 18 ? 0.8 : 0,
            angle: p.random(-10, 10)
          });
        }
      };
    };

        const p5Instance = new window.p5(sketch, canvasRef.current);
        return () => {
          p5Instance.remove();
        };
      } else {
        setTimeout(checkP5, 100);
      }
    };

    checkP5();
  }, [controls, onEnergyDataUpdate]);

  return (
    <div 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1 
      }} 
    />
  );
};

export default EnergyVisualization; 