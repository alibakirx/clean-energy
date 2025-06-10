import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    p5: any;
  }
}

interface WindTurbine {
  x: number;
  y: number;
  baseHeight: number;
  bladeLength: number;
  rotation: number;
  currentSpeed: number;
  targetSpeed: number;
  scale: number;
}

interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  opacity: number;
  color: number[];
}

const SimpleVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const checkP5 = () => {
      if (typeof window !== 'undefined' && window.p5) {
        const sketch = (p: any) => {
          let windTurbines: WindTurbine[] = [];
          let windParticles: WindParticle[] = [];
          let grassOffset: number[] = [];
          let isMousePressed = false;
          let timeOfDay = 12; // Start at noon
          const defaultWindSpeed = 0.02;
          const maxWindSpeed = 0.15;
          const speedTransition = 0.92;

          // Cellular automaton parameters for energy visualization
          const N = 8; // Number of energy states
          const threshold = 4;
          const thresholdFast = 6;
          const thresholdDead = 1;
          let cellSize = 8;
          const voronoi_count = 15;
          let cols: number, rows: number;
          let grid: number[][], nextGrid: number[][];
          let sites: any[] = [];
          let cellOwners: number[][] = [];
          let energyStates: any[];
          let d = 0.3;

          p.setup = () => {
            p.createCanvas(p.windowWidth, p.windowHeight);
            p.colorMode(p.RGB);
            
            // Calculate grid for cellular automaton
            cellSize = Math.max(6, Math.floor(Math.min(p.width, p.height) / 120));
            cols = p.floor(p.width / cellSize);
            rows = p.floor(p.height / cellSize);
            
            initializeWindTurbines();
            initializeGrass();
            initializeCellularAutomaton();
          };

          function initializeCellularAutomaton() {
            // Energy states with atmospheric colors
            energyStates = [
              p.color(135, 206, 235, 30),  // Sky blue - wind energy
              p.color(100, 149, 237, 35),  // Cornflower blue - clean air
              p.color(70, 130, 180, 40),   // Steel blue - atmospheric pressure
              p.color(176, 224, 230, 25),  // Powder blue - gentle breeze
              p.color(173, 216, 230, 30),  // Light blue - air current
              p.color(240, 248, 255, 20),  // Alice blue - fresh air
              p.color(30, 144, 255, 35),   // Dodger blue - strong wind
              p.color(135, 206, 250, 25),  // Light sky blue - calm atmosphere
            ];

            // Initialize cellular automaton grid
            grid = new Array(cols).fill(0).map(() => 
              new Array(rows).fill(0).map(() => p.floor(p.random(N)))
            );
            nextGrid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));

            // Initialize energy regions (Voronoi)
            sites = [];
            for (let i = 0; i < voronoi_count; i++) {
              sites.push(p.createVector(p.random(p.width), p.random(p.height)));
            }

            // Initialize cell owners
            cellOwners = new Array(cols);
            for (let x = 0; x < cols; x++) {
              cellOwners[x] = new Array(rows).fill(0);
            }
            
            updateVoronoi();
          }

          function updateVoronoi() {
            // Update energy regions - slower movement for atmospheric effect
            for (let i = 0; i < voronoi_count; i++) {
              sites[i].x += (p.noise(i * 1000 + p.millis() / 2000.0) - 0.5) * 0.8;
              sites[i].y += (p.noise(i * 2000 + p.millis() / 2000.0) - 0.5) * 0.8;
              sites[i].x = p.constrain(sites[i].x, 0, p.width);
              sites[i].y = p.constrain(sites[i].y, 0, p.height);
            }

            // Assign each cell to nearest energy region
            for (let x = 0; x < cols; x++) {
              for (let y = 0; y < rows; y++) {
                let closest = -1;
                let minDist = Infinity;
                for (let i = 0; i < sites.length; i++) {
                  const dx = sites[i].x - (x * cellSize);
                  const dy = sites[i].y - (y * cellSize);
                  const dist = dx * dx + dy * dy;
                  if (dist < minDist) {
                    minDist = dist;
                    closest = i;
                  }
                }
                cellOwners[x][y] = closest;
              }
            }
          }

          function updateCellularAutomaton() {
            const border = isMousePressed ? 0.8 : 0.3; // Increase activity when mouse pressed
            
            for (let x = 0; x < cols; x++) {
              for (let y = 0; y < rows; y++) {
                const currentState = grid[x][y];

                // Energy transitions at region boundaries
                if (p.random(1) < border) {
                  for (let m = 0; m < 2; m++) {
                    for (let q = 0; q < 2; q++) {
                      if (x - m >= 0 && y - q >= 0) {
                        if (cellOwners[x][y] !== cellOwners[x - m][y - q]) {
                          nextGrid[x - m][y - q] = p.int(p.random(N));
                        }
                      }
                    }
                  }
                }

                // Count neighboring energy states
                let count = 0;
                for (let dx = -1; dx <= 1; dx++) {
                  for (let dy = -1; dy <= 1; dy++) {
                    const nx = (x + dx + cols) % cols;
                    const ny = (y + dy + rows) % rows;
                    if (grid[nx][ny] === (currentState + 1) % N) {
                      count++;
                    }
                  }
                }

                // Energy transformation rules
                nextGrid[x][y] = currentState;
                
                if (count >= threshold) {
                  nextGrid[x][y] = (currentState + 1) % N;
                } else if (count >= thresholdFast) {
                  nextGrid[x][y] = (currentState + 2) % N;
                } else if (count <= thresholdDead) {
                  nextGrid[x][y] = (currentState + N - 1) % N;
                }
              }
            }
            
            // Swap grids
            const tmp = grid;
            grid = nextGrid;
            nextGrid = tmp;
          }

          function drawCellularBackground() {
            p.noStroke();
            
            for (let x = 0; x < cols; x += 1) {
              for (let y = 0; y < rows; y += 1) {
                const stateIndex = grid[x][y] % N;
                const energyColor = energyStates[stateIndex];
                
                // Add subtle wave effect
                const waveEffect = p.sin(x * 0.1 + y * 0.1 + p.frameCount * 0.03) * 0.3 + 1;
                const alpha = p.alpha(energyColor) * waveEffect;
                
                // Set color with modified alpha
                p.fill(p.red(energyColor), p.green(energyColor), p.blue(energyColor), alpha);
                
                // Draw cell with slight size variation
                const cellSizeVar = cellSize * (0.8 + waveEffect * 0.2);
                p.rect(x * cellSize, y * cellSize, cellSizeVar, cellSizeVar);
              }
            }
          }

          function initializeWindTurbines() {
            windTurbines = [];
            const turbineCount = 8; // Keeping the increased number
            
            // Calculate base Y position for all turbines
            const baseY = p.height * 0.85;
            
            // Calculate spacing between turbines
            const totalWidth = p.width * 0.8; // Use 80% of screen width
            const spacing = totalWidth / (turbineCount - 1);
            const startX = p.width * 0.1; // Start at 10% of screen width
            
            for (let i = 0; i < turbineCount; i++) {
              const depth = p.random(0.7, 1.0);
              
              // Calculate x position with small random offset
              const xPos = startX + (spacing * i) + p.random(-20, 20);
              
              // Calculate y position with gentle sine wave variation
              const yPos = baseY + p.sin(i * 0.5) * 15 + p.random(-5, 5);
              
              windTurbines.push({
                x: xPos,
                y: yPos,
                baseHeight: 220 * depth,
                bladeLength: 90 * depth,
                rotation: p.random(0, p.TWO_PI),
                currentSpeed: defaultWindSpeed * p.random(0.8, 1.2),
                targetSpeed: defaultWindSpeed * p.random(0.8, 1.2),
                scale: depth
              });
            }
            
            // Sort turbines by scale for proper rendering order
            windTurbines.sort((a, b) => a.scale - b.scale);
          }

          function initializeGrass() {
            grassOffset = [];
            for (let i = 0; i < 300; i++) {
              grassOffset[i] = 0;
            }
          }

          p.draw = () => {
            // Update cellular automaton every few frames
            if (p.frameCount % 3 === 0) {
              updateCellularAutomaton();
              updateVoronoi();
            }
            
            updateTimeOfDay();
            
            // Draw cellular automaton background first
            drawCellularBackground();
            
            // Then draw traditional landscape elements
            drawLandscape();
            updateWindEffects();
            updateWindTurbines();
            drawWindTurbines();
            if (isMousePressed) {
              drawWindEffects();
            }
            
            // Update evolution parameter
            d = p.constrain(d + (p.noise(p.frameCount * 0.01) - 0.5) * 0.02, 0.2, 0.8);
          };

          function updateTimeOfDay() {
            timeOfDay = (timeOfDay + 0.001) % 24;
          }

          function drawLandscape() {
            // Draw atmosphere with reduced opacity to show cellular background
            const skyColors = getSkyColors();
            for (let y = 0; y <= p.height * 0.85; y += 3) {
              const inter = p.map(y, 0, p.height * 0.85, 0, 1);
              const skyColor = p.lerpColor(skyColors.top, skyColors.bottom, inter);
              p.stroke(p.red(skyColor), p.green(skyColor), p.blue(skyColor), 30); // Reduced alpha
              p.line(0, y, p.width, y);
            }

            // Draw stars at night
            if (timeOfDay < 6 || timeOfDay > 18) {
              drawStars();
            }

            // Draw sun/moon
            drawCelestialBody();

            // Draw clouds with transparency
            drawClouds();

            // Terrain with transparency to show cellular background
            drawTerrain();
          }

          function getSkyColors() {
            let top, bottom;
            
            if (timeOfDay < 6) { // Night
              top = p.color(10, 10, 35);
              bottom = p.color(20, 20, 45);
            } else if (timeOfDay < 7) { // Dawn
              top = p.color(70, 70, 130);
              bottom = p.color(200, 150, 100);
            } else if (timeOfDay < 17) { // Day
              top = p.color(135, 206, 235);
              bottom = p.color(176, 224, 230);
            } else if (timeOfDay < 19) { // Dusk
              top = p.color(70, 70, 130);
              bottom = p.color(200, 100, 50);
            } else { // Night
              top = p.color(10, 10, 35);
              bottom = p.color(20, 20, 45);
            }
            
            return { top, bottom };
          }

          function drawStars() {
            p.push();
            p.noStroke();
            for (let i = 0; i < 200; i++) {
              const x = (i * 17.3) % p.width;
              const y = ((i * 13.7) % (p.height * 0.7));
              const twinkle = p.noise(x * 0.01, y * 0.01, p.frameCount * 0.01);
              const starSize = p.map(twinkle, 0, 1, 1, 3);
              const brightness = p.map(twinkle, 0, 1, 100, 255);
              p.fill(255, 255, brightness, brightness);
              p.ellipse(x, y, starSize, starSize);
            }
            p.pop();
          }

          function drawCelestialBody() {
            const angle = p.map(timeOfDay, 0, 24, 0, p.TWO_PI);
            const x = p.width / 2 + p.cos(angle - p.PI/2) * (p.height * 0.7);
            const y = p.height * 0.85 + p.sin(angle - p.PI/2) * (p.height * 0.7);

            p.push();
            p.noStroke();
            
            if (timeOfDay >= 6 && timeOfDay <= 18) {
              // Sun with corona
              const sunGradient = p.drawingContext.createRadialGradient(x, y, 0, x, y, 100);
              sunGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
              sunGradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.6)');
              sunGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
              p.drawingContext.fillStyle = sunGradient;
              p.circle(x, y, 200);
              
              // Sun core
              p.fill(255, 255, 200, 200);
              p.circle(x, y, 60);
            } else {
              // Moon with detailed surface
              p.fill(220, 220, 200, 180);
              p.circle(x, y, 50);
              p.fill(200, 200, 180, 80);
              for (let i = 0; i < 8; i++) {
                const craterX = x + p.cos(i * p.PI/4) * 15;
                const craterY = y + p.sin(i * p.PI/4) * 15;
                p.circle(craterX, craterY, p.random(5, 10));
              }
            }
            p.pop();
          }

          function drawClouds() {
            p.push();
            p.noStroke();
            const cloudOpacity = (timeOfDay >= 6 && timeOfDay <= 18) ? 100 : 50; // Reduced opacity
            
            for (let i = 0; i < 10; i++) {
              const x = (p.frameCount * 0.2 + i * 200) % (p.width + 400) - 200;
              const y = p.height * 0.3 + p.sin(i * 0.5) * 50;
              const cloudSize = 100 + p.sin(i * 0.7) * 30;
              
              const cloudGradient = p.drawingContext.createRadialGradient(x, y, 0, x, y, cloudSize);
              cloudGradient.addColorStop(0, `rgba(255, 255, 255, ${cloudOpacity * 0.6/255})`);
              cloudGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
              p.drawingContext.fillStyle = cloudGradient;
              
              p.circle(x, y, cloudSize * 2);
              p.circle(x + cloudSize * 0.5, y - cloudSize * 0.2, cloudSize * 1.5);
              p.circle(x - cloudSize * 0.5, y - cloudSize * 0.1, cloudSize * 1.7);
            }
            p.pop();
          }

          function drawTerrain() {
            // Far mountains with transparency
            p.push();
            p.noStroke();
            for (let i = 0; i < 3; i++) {
              const mountainColor = p.lerpColor(
                p.color(70, 90, 110, 80), // Reduced alpha
                p.color(40, 50, 70, 60),
                i / 2
              );
              p.fill(mountainColor);
              
              p.beginShape();
              p.vertex(0, p.height);
              for (let x = 0; x <= p.width; x += 50) {
                const noiseFactor = p.noise(x * 0.002 + i * 10, i * 10);
                const y = p.height * (0.6 + i * 0.05) - noiseFactor * 200;
                p.vertex(x, y);
              }
              p.vertex(p.width, p.height);
              p.endShape(p.CLOSE);
            }
            p.pop();

            // Main terrain with transparency
            p.push();
            p.noStroke();
            const grassColor = p.color(50, 120, 50, 120); // Reduced alpha
            const darkGrassColor = p.color(30, 80, 30, 100);
            
            for (let layer = 0; layer < 3; layer++) {
              const terrainColor = p.lerpColor(grassColor, darkGrassColor, layer / 2);
              p.fill(terrainColor);
              
              p.beginShape();
              p.vertex(0, p.height);
              for (let x = 0; x <= p.width; x += 20) {
                const noiseFactor = p.noise(x * 0.005 + layer * 10, layer * 10);
                const baseY = p.height * 0.85;
                const y = baseY + p.sin(x * 0.02) * 15 - noiseFactor * 50;
                p.vertex(x, y + layer * 20);
              }
              p.vertex(p.width, p.height);
              p.endShape(p.CLOSE);
            }
            p.pop();

            // Detailed grass with transparency
            p.push();
            p.stroke(34, 139, 34, 120);
            p.strokeWeight(1);
            for (let i = 0; i < 300; i++) {
              const x = (i * p.width) / 300;
              const baseY = p.height * 0.85 + p.sin(x * 0.02) * 15;
              const windBend = isMousePressed ? grassOffset[i] : 0;
              
              // Multiple grass blades per position
              for (let j = 0; j < 3; j++) {
                const grassX = x + p.random(-5, 5);
                const grassY = baseY + p.random(-5, 5);
                const grassHeight = p.random(10, 25);
                const bendStrength = windBend * (1 + j * 0.2);
                
                const controlX = grassX + bendStrength * 0.5;
                const controlY = grassY - grassHeight * 0.5;
                
                p.stroke(34, 139, 34, 100);
                p.noFill();
                p.beginShape();
                p.vertex(grassX, grassY);
                p.quadraticVertex(
                  controlX,
                  controlY,
                  grassX + bendStrength,
                  grassY - grassHeight
                );
                p.endShape();
              }
            }
            p.pop();
          }

          function updateWindEffects() {
            if (isMousePressed) {
              // Update grass movement
              for (let i = 0; i < grassOffset.length; i++) {
                grassOffset[i] = p.sin(p.frameCount * 0.1 + i * 0.1) * 5 + p.random(-1, 1);
              }

              // Generate wind particles
              if (p.frameCount % 3 === 0) {
                for (let i = 0; i < 2; i++) {
                  windParticles.push({
                    x: p.random(p.width),
                    y: p.random(p.height * 0.3, p.height * 0.8),
                    vx: p.random(3, 10),
                    vy: p.random(-2, 2),
                    life: 80,
                    size: p.random(2, 8),
                    opacity: p.random(150, 200),
                    color: [255, 255, 255]
                  });
                }
              }
            } else {
              // Grass returns to normal
              for (let i = 0; i < grassOffset.length; i++) {
                grassOffset[i] *= 0.9;
              }
            }

            // Update existing particles
            for (let i = windParticles.length - 1; i >= 0; i--) {
              const particle = windParticles[i];
              particle.x += particle.vx;
              particle.y += particle.vy;
              particle.life--;
              particle.opacity *= 0.97;
              
              if (particle.life <= 0 || particle.x > p.width) {
                windParticles.splice(i, 1);
              }
            }
          }

          function drawWindEffects() {
            p.push();
            p.noStroke();
            
            // Draw wind particles with motion blur effect
            windParticles.forEach(particle => {
              const gradient = p.drawingContext.createLinearGradient(
                particle.x - particle.vx * 2,
                particle.y - particle.vy * 2,
                particle.x + particle.vx * 2,
                particle.y + particle.vy * 2
              );
              
              gradient.addColorStop(0, `rgba(${particle.color.join(',')}, 0)`);
              gradient.addColorStop(0.5, `rgba(${particle.color.join(',')}, ${particle.opacity/255})`);
              gradient.addColorStop(1, `rgba(${particle.color.join(',')}, 0)`);
              
              p.drawingContext.fillStyle = gradient;
              p.ellipse(
                particle.x,
                particle.y,
                particle.size * 3,
                particle.size
              );
            });
            
            p.pop();
          }

          function updateWindTurbines() {
            windTurbines.forEach(turbine => {
              if (isMousePressed) {
                turbine.targetSpeed = maxWindSpeed * p.random(0.9, 1.1);
              } else {
                turbine.targetSpeed = defaultWindSpeed * p.random(0.8, 1.2);
              }

              turbine.currentSpeed = p.lerp(
                turbine.currentSpeed,
                turbine.targetSpeed,
                1 - speedTransition
              );

              turbine.rotation += turbine.currentSpeed;
            });
          }

          function drawWindTurbines() {
            windTurbines.forEach(turbine => {
              drawSingleTurbine(turbine);
            });
          }

          function drawSingleTurbine(turbine: WindTurbine) {
            p.push();
            p.translate(turbine.x, turbine.y);
            p.scale(turbine.scale);

            // Tower shadow
            p.push();
            p.noStroke();
            const shadowLength = p.map(timeOfDay, 0, 24, -100, 100);
            const shadowAlpha = p.map(Math.abs(timeOfDay - 12), 0, 12, 50, 20);
            p.fill(0, 0, 0, shadowAlpha);
            p.beginShape();
            p.vertex(shadowLength, 0);
            p.vertex(shadowLength + 20, 0);
            p.vertex(5, -turbine.baseHeight);
            p.vertex(-5, -turbine.baseHeight);
            p.endShape(p.CLOSE);
            p.pop();

            // Tower with gradient and details
            const towerBaseWidth = 20;
            const towerTopWidth = 12;
            const towerHeight = turbine.baseHeight;
            
            // Tower gradient
            for (let i = 0; i < towerHeight; i += 2) {
              const ratio = i / towerHeight;
              const currentWidth = p.lerp(towerBaseWidth, towerTopWidth, ratio);
              const y = -i;
              
              // Main tower color
              const mainColor = p.lerpColor(
                p.color(240, 240, 245),
                p.color(220, 220, 225),
                ratio
              );
              p.fill(mainColor);
              p.noStroke();
              p.rect(-currentWidth/2, y, currentWidth, 2);
              
              // Shadow side
              const shadowColor = p.lerpColor(
                p.color(200, 200, 205),
                p.color(180, 180, 185),
                ratio
              );
              p.fill(shadowColor);
              p.rect(-currentWidth/2, y, currentWidth/4, 2);
            }
            
            // Tower segments and details
            p.stroke(180, 180, 180);
            p.strokeWeight(1);
            for (let segment = 0; segment < 5; segment++) {
              const segmentY = -(towerHeight / 5) * (segment + 1);
              const segmentRatio = (segment + 1) / 5;
              const segmentWidth = p.lerp(towerBaseWidth, towerTopWidth, segmentRatio);
              p.line(-segmentWidth/2, segmentY, segmentWidth/2, segmentY);
              
              // Bolt details
              for (let bolt = -1; bolt <= 1; bolt += 2) {
                p.fill(160, 160, 160);
                p.noStroke();
                p.circle(bolt * segmentWidth/4, segmentY, 2);
              }
            }

            // Maintenance door
            p.fill(100, 100, 120);
            p.stroke(80, 80, 100);
            p.strokeWeight(1);
            p.rect(-5, -30, 10, 25, 2);
            
            // Door details
            p.fill(150, 150, 150);
            p.noStroke();
            p.rect(-3, -28, 6, 2); // Top vent
            p.rect(-3, -10, 6, 2); // Bottom vent
            p.circle(2, -18, 2); // Handle

            // Nacelle (turbine housing)
            p.push();
            p.translate(0, -towerHeight);
            
            // Main nacelle body with gradient
            const nacelleGradient = p.drawingContext.createLinearGradient(0, -15, 0, 15);
            nacelleGradient.addColorStop(0, 'rgb(250, 250, 255)');
            nacelleGradient.addColorStop(1, 'rgb(220, 220, 225)');
            p.drawingContext.fillStyle = nacelleGradient;
            p.noStroke();
            p.ellipse(0, 0, 50, 25);
            
            // Nacelle details
            p.fill(245, 245, 250);
            p.ellipse(20, 0, 25, 20); // Front cone
            p.fill(235, 235, 240);
            p.ellipse(-15, 0, 20, 22); // Back housing
            
            // Cooling vents
            p.fill(210, 210, 215);
            for (let vent = -2; vent <= 2; vent++) {
              p.rect(-20 + vent * 8, -8, 4, 2, 1);
            }
            
            // Technical details
            p.stroke(190, 190, 200);
            p.strokeWeight(1);
            p.line(-22, -6, 22, -6);
            p.line(-22, 6, 22, 6);
            
            p.pop();

            // Turbine blades with enhanced detail
            p.push();
            p.translate(0, -towerHeight);
            p.rotate(turbine.rotation);
            
            for (let i = 0; i < 3; i++) {
              p.push();
              p.rotate((i * p.TWO_PI) / 3);
              
              // Blade with aerodynamic shape
              p.fill(252, 252, 255);
              p.stroke(220, 220, 225);
              p.strokeWeight(1);
              
              p.beginShape();
              p.vertex(0, -2);
              p.bezierVertex(
                turbine.bladeLength * 0.1, -8,
                turbine.bladeLength * 0.3, -10,
                turbine.bladeLength * 0.95, -2
              );
              p.vertex(turbine.bladeLength, 0);
              p.bezierVertex(
                turbine.bladeLength * 0.95, 2,
                turbine.bladeLength * 0.3, 10,
                turbine.bladeLength * 0.1, 8
              );
              p.vertex(0, 2);
              p.endShape(p.CLOSE);
              
              // Blade highlight
              p.fill(255, 255, 255, 100);
              p.noStroke();
              p.beginShape();
              p.vertex(0, -1);
              p.bezierVertex(
                turbine.bladeLength * 0.2, -4,
                turbine.bladeLength * 0.6, -5,
                turbine.bladeLength * 0.9, -1
              );
              p.bezierVertex(
                turbine.bladeLength * 0.6, -2,
                turbine.bladeLength * 0.2, -1,
                0, -1
              );
              p.endShape();
              
              // Blade tip and root details
              p.fill(240, 240, 245);
              p.ellipse(turbine.bladeLength * 0.98, 0, 5, 3);
              p.fill(230, 230, 235);
              p.ellipse(turbine.bladeLength * 0.1, 0, 10, 15);
              
              p.pop();
            }
            
            // Hub with enhanced detail
            p.fill(240, 240, 245);
            p.stroke(200, 200, 210);
            p.strokeWeight(2);
            p.ellipse(0, 0, 25, 25);
            
            // Hub center and bolts
            p.fill(220, 220, 225);
            p.noStroke();
            p.ellipse(0, 0, 15, 15);
            
            p.fill(180, 180, 185);
            for (let i = 0; i < 6; i++) {
              const angle = (i * p.TWO_PI) / 6;
              const boltX = p.cos(angle) * 8;
              const boltY = p.sin(angle) * 8;
              p.ellipse(boltX, boltY, 3, 3);
            }
            
            p.fill(250, 250, 255);
            p.ellipse(0, 0, 10, 10);
            
            p.pop();
            p.pop();
          }

          p.windowResized = () => {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            
            // Recalculate cellular automaton grid
            cellSize = Math.max(6, Math.floor(Math.min(p.width, p.height) / 120));
            cols = p.floor(p.width / cellSize);
            rows = p.floor(p.height / cellSize);
            
            initializeWindTurbines();
            initializeGrass();
            initializeCellularAutomaton();
          };

          p.mousePressed = () => {
            isMousePressed = true;
          };

          p.mouseReleased = () => {
            isMousePressed = false;
          };
        };

        p5InstanceRef.current = new window.p5(sketch, canvasRef.current);
      } else {
        setTimeout(checkP5, 100);
      }
    };

    checkP5();

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full absolute inset-0">
      <div ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default SimpleVisualization; 