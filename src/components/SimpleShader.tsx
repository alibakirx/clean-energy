import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SimpleShaderProps {
  isMousePressed: boolean;
  mousePosition: { x: number; y: number };
}

const SimpleShader: React.FC<SimpleShaderProps> = ({
  isMousePressed,
  mousePosition
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId?: number;
  } | null>(null);

  // Basit vertex shader
  const vertexShader = `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Basit fragment shader
  const fragmentShader = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform bool u_mouse_pressed;

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      
      // Daha soft gradient background
      vec3 color = vec3(st.x * 0.3, st.y * 0.4, 0.6);
      
      // Mouse efekti - çok daha subtle
      if (u_mouse_pressed) {
        vec2 mouseNorm = u_mouse / u_resolution;
        float dist = distance(st, mouseNorm);
        float effect = (1.0 - smoothstep(0.0, 0.4, dist)) * 0.15; // Çok daha az yoğun
        color += vec3(0.1, 0.3, 0.1) * effect; // Daha soft yeşil
      }
      
      // Zaman efekti - daha minimal
      color += sin(u_time * 0.5) * 0.03;
      
      gl_FragColor = vec4(color, 0.3); // Daha transparent
    }
  `;

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      camera.position.z = 1;

      const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true 
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      containerRef.current.appendChild(renderer.domElement);

      // Shader material
      const geometry = new THREE.PlaneGeometry(2, 2);
      
      const uniforms = {
        u_time: { value: 1.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2() },
        u_mouse_pressed: { value: false }
      };

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Store scene objects
      sceneRef.current = {
        scene,
        camera,
        renderer,
        uniforms
      };

      // Resize handler
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        renderer.setSize(width, height);
        uniforms.u_resolution.value.x = width;
        uniforms.u_resolution.value.y = height;
      };

      window.addEventListener('resize', handleResize);

      // Animation loop
      const clock = new THREE.Clock();
      
      const animate = () => {
        if (!sceneRef.current) return;
        
        uniforms.u_time.value = clock.getElapsedTime();
        renderer.render(scene, camera);
        
        sceneRef.current.animationId = requestAnimationFrame(animate);
      };
      
      animate();

      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (sceneRef.current?.animationId) {
          cancelAnimationFrame(sceneRef.current.animationId);
        }
        
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    } catch (error) {
      console.error('Shader initialization error:', error);
    }
  }, []);

  // Update uniforms when props change
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.uniforms.u_mouse.value.x = mousePosition.x;
    sceneRef.current.uniforms.u_mouse.value.y = window.innerHeight - mousePosition.y;
    sceneRef.current.uniforms.u_mouse_pressed.value = isMousePressed;
  }, [isMousePressed, mousePosition]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 2,
        opacity: 0.7
      }}
    />
  );
};

export default SimpleShader; 