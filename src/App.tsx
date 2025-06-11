import { useState, useEffect } from 'react';
import SimpleVisualization from './components/SimpleVisualization';
import SimpleShader from './components/SimpleShader';

function App() {
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsMousePressed(true);
    };

    const handleMouseUp = () => {
      setIsMousePressed(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">

      
      {/* p5.js Visualization - Base Layer */}
      <SimpleVisualization />
      
      {/* Three.js Simple Shader Layer - Test */}
      <SimpleShader
        isMousePressed={isMousePressed}
        mousePosition={mousePosition}
      />
      

    </div>
  );
}

export default App; 