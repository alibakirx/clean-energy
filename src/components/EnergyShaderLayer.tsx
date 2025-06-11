import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface EnergyShaderLayerProps {
  isMousePressed: boolean;
  mousePosition: { x: number; y: number };
  windStrength: number;
  energyLevel: number;
}

const EnergyShaderLayer: React.FC<EnergyShaderLayerProps> = ({
  isMousePressed,
  mousePosition,
  windStrength,
  energyLevel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId?: number;
  } | null>(null);

  // Vertex Shader - Basit geçişli
  const vertexShader = `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment Shader - Temiz Enerji Görselleştirmesi
  const fragmentShader = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_wind_strength;
    uniform float u_energy_level;
    uniform bool u_mouse_pressed;

    // Noise fonksiyonu
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    // Fractal Brownian Motion
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Rüzgar akış alanları
    vec2 windFlow(vec2 st) {
      float windX = fbm(st + u_time * 0.1) * 2.0 - 1.0;
      float windY = fbm(st + vec2(100.0) + u_time * 0.15) * 2.0 - 1.0;
      return vec2(windX, windY) * u_wind_strength;
    }

    // Enerji dalgaları
    float energyWaves(vec2 st) {
      float wave1 = sin(st.x * 8.0 + u_time * 2.0) * 0.5 + 0.5;
      float wave2 = sin(st.y * 6.0 + u_time * 1.5) * 0.5 + 0.5;
      float wave3 = sin((st.x + st.y) * 10.0 + u_time * 3.0) * 0.5 + 0.5;
      
      return (wave1 + wave2 + wave3) / 3.0;
    }

    // Güneş ışığı efekti
    float sunlightEffect(vec2 st) {
      vec2 sunPos = vec2(0.7, 0.3); // Güneş pozisyonu
      float dist = distance(st, sunPos);
      float sunlight = exp(-dist * 3.0) * 0.8;
      
      // Işık huzmeleri
      float rays = abs(sin((atan(st.y - sunPos.y, st.x - sunPos.x) + u_time * 0.5) * 12.0));
      rays = pow(rays, 0.3) * sunlight;
      
      return rays;
    }

    // 3D Noise fonksiyonu bulutlar için
    float noise3D(vec3 st) {
      return fract(sin(dot(st, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
    }

    float fbm3D(vec3 st) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 4; i++) {
        value += amplitude * noise3D(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    // Volumetric bulut efektleri
    float volumetricClouds(vec2 st) {
      // Çoklu katmanlı bulutlar
      vec3 cloudPos1 = vec3(st * 2.0 + u_time * 0.02, u_time * 0.1);
      vec3 cloudPos2 = vec3(st * 1.5 - u_time * 0.015, u_time * 0.08);
      vec3 cloudPos3 = vec3(st * 3.0 + u_time * 0.025, u_time * 0.12);
      
      float cloud1 = fbm3D(cloudPos1);
      float cloud2 = fbm3D(cloudPos2);
      float cloud3 = fbm3D(cloudPos3);
      
      // Bulut şekli - sadece üst kısımda
      float skyMask = smoothstep(0.3, 0.7, st.y);
      
      // Bulutları birleştir
      float clouds = cloud1 * 0.6 + cloud2 * 0.3 + cloud3 * 0.1;
      clouds = smoothstep(0.4, 0.8, clouds);
      clouds *= skyMask;
      
      // Bulut gölgeleri
      vec2 shadowOffset = vec2(0.02, -0.01);
      vec3 shadowPos = vec3((st + shadowOffset) * 2.0 + u_time * 0.02, u_time * 0.1);
      float shadow = fbm3D(shadowPos);
      shadow = smoothstep(0.5, 0.9, shadow) * skyMask;
      
      return clouds - shadow * 0.3;
    }

    // Animated bulut parçacıkları
    float cloudParticles(vec2 st) {
      float particles = 0.0;
      
      // Multiple cloud particle layers
      for (int i = 0; i < 8; i++) {
        float fi = float(i);
        vec2 offset = vec2(sin(fi * 2.3 + u_time * 0.1), cos(fi * 1.7 + u_time * 0.08));
        vec2 particlePos = st * (3.0 + fi * 0.5) + offset * 0.1;
        
        float particle = fbm(particlePos + u_time * (0.01 + fi * 0.002));
        particle = smoothstep(0.6, 0.9, particle);
        
        // Sadece gökyüzü bölgesinde
        float heightMask = smoothstep(0.4, 0.8, st.y);
        particle *= heightMask;
        
        particles += particle * (0.8 - fi * 0.1);
      }
      
      return particles * 0.3;
    }

    // Mouse etkisi
    float mouseEffect(vec2 st) {
      if (!u_mouse_pressed) return 0.0;
      
      vec2 mouseNorm = u_mouse / u_resolution;
      float dist = distance(st, mouseNorm);
      float effect = exp(-dist * 8.0) * 0.6;
      
      // Ripple efekti
      float ripple = sin(dist * 20.0 - u_time * 8.0) * 0.5 + 0.5;
      effect *= ripple;
      
      return effect;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec3 color = vec3(0.0);

      // Temel atmosfer rengi
      vec3 skyColor = vec3(0.4, 0.7, 0.9);
      vec3 energyColor = vec3(0.3, 0.9, 0.4);
      vec3 windColor = vec3(0.8, 0.9, 1.0);
      vec3 cloudColor = vec3(0.9, 0.95, 1.0);

      // Rüzgar akışı
      vec2 flow = windFlow(st * 4.0);
      vec2 distortedSt = st + flow * 0.1;

      // Volumetric bulutlar
      float clouds = volumetricClouds(st);
      float cloudParticleEffect = cloudParticles(distortedSt);
      float totalClouds = clouds + cloudParticleEffect;
      
      // Bulut renkleri - günün saatine göre
      vec3 finalCloudColor = cloudColor;
      float cloudIntensity = 0.7;
      
      // Rüzgardan etkilenen bulut hareket efekti
      vec2 cloudDistortion = flow * 0.05;
      float cloudMovement = volumetricClouds(st + cloudDistortion);
      totalClouds = mix(totalClouds, cloudMovement, u_wind_strength * 0.3);

      // Enerji dalgaları
      float waves = energyWaves(distortedSt * 3.0);
      color += energyColor * waves * u_energy_level * 0.3;

      // Güneş ışığı
      float sunlight = sunlightEffect(st);
      color += vec3(1.0, 0.9, 0.6) * sunlight * 0.4;
      
      // Güneş ışığı bulutların içinden geçerken
      float cloudSunlight = sunlight * (1.0 - totalClouds * 0.6);
      color += vec3(1.0, 0.8, 0.4) * cloudSunlight * 0.2;

      // Rüzgar görselleştirmesi
      float windVis = fbm(distortedSt * 6.0 + u_time * 0.2);
      color += windColor * windVis * u_wind_strength * 0.2;

      // Bulutları ekle
      color += finalCloudColor * totalClouds * cloudIntensity;
      
      // Bulut gölgeleri yeryüzünde
      float groundShadow = totalClouds * smoothstep(0.7, 0.9, st.y);
      color *= (1.0 - groundShadow * 0.3);

      // Mouse etkisi
      float mouseEff = mouseEffect(st);
      color += vec3(1.0, 1.0, 0.8) * mouseEff;
      
      // Mouse ile bulut etkileşimi
      if (u_mouse_pressed) {
        vec2 mouseNorm = u_mouse / u_resolution;
        float mouseDist = distance(st, mouseNorm);
        float cloudDispersion = exp(-mouseDist * 3.0) * 0.4;
        totalClouds *= (1.0 - cloudDispersion);
        
        // Enerji bulutları
        vec3 energyClouds = energyColor * cloudDispersion * sin(u_time * 4.0) * 0.5;
        color += energyClouds;
      }

      // Cellular automaton benzeri desenler
      float cellular = fbm(st * 20.0 + flow);
      cellular = step(0.6, cellular);
      color += energyColor * cellular * 0.1;

      // Dinamik parlaklık
      float brightness = 0.8 + sin(u_time * 0.5) * 0.2;
      color *= brightness;

      // Final composite
      color = mix(skyColor * 0.1, color, 0.8);
      
      gl_FragColor = vec4(color, 0.6); // Semi-transparent
    }
  `;

  useEffect(() => {
    if (!containerRef.current) return;

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
      u_resolution: { value: new THREE.Vector2() },
      u_mouse: { value: new THREE.Vector2() },
      u_wind_strength: { value: 1.0 },
      u_energy_level: { value: 1.0 },
      u_mouse_pressed: { value: false }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending
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

    handleResize();
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
  }, []);

  // Update uniforms when props change
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.uniforms.u_mouse.value.x = mousePosition.x;
    sceneRef.current.uniforms.u_mouse.value.y = window.innerHeight - mousePosition.y; // Y koordinatını ters çevir
    sceneRef.current.uniforms.u_wind_strength.value = windStrength;
    sceneRef.current.uniforms.u_energy_level.value = energyLevel;
    sceneRef.current.uniforms.u_mouse_pressed.value = isMousePressed;
  }, [isMousePressed, mousePosition, windStrength, energyLevel]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 2,
        mixBlendMode: 'screen' // Mevcut p5.js ile karışım efekti
      }}
    />
  );
};

export default EnergyShaderLayer; 