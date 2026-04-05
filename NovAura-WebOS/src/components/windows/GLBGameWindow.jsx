import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Html, Center, Grid } from '@react-three/drei';
import { Loader2, Maximize2, Minimize2, RotateCw, Info } from 'lucide-react';
import { motion } from 'framer-motion';

// 3D Model Component
function Model({ url, autoRotate }) {
  const { scene, animations } = useGLTF(url);
  const groupRef = useRef();
  
  useFrame((state) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} scale={1} />
      </Center>
    </group>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        <p className="text-sm font-medium">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

// Sample demo model (a simple animated shape when no URL provided)
function DemoModel() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group>
      <Center>
        <mesh ref={meshRef}>
          <torusKnotGeometry args={[1, 0.3, 128, 16]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            metalness={0.7} 
            roughness={0.2}
            emissive="#0891b2"
            emissiveIntensity={0.1}
          />
        </mesh>
      </Center>
    </group>
  );
}

export default function GLBGameWindow({ 
  modelUrl = null, 
  autoRotate = false,
  showStats = false,
  onLoad,
  onError 
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col bg-black/90 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full w-full'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white/80 font-medium text-sm">3D Game Viewer</span>
          {modelUrl && (
            <span className="text-xs text-white/40 truncate max-w-[200px]">
              {modelUrl.split('/').pop()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-white/60'}`}
            title="Toggle Grid"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-white/60'}`}
            title="Toggle Info"
          >
            <Info className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleFullscreen}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          shadows
          className="bg-gradient-to-b from-gray-900 to-black"
        >
          <Suspense fallback={<LoadingScreen />}>
            {/* Environment */}
            <Environment preset="studio" />
            
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1} 
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#06b6d4" />
            
            {/* Grid */}
            {showGrid && (
              <Grid
                position={[0, -2, 0]}
                args={[20, 20]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#06b6d4"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#0891b2"
                fadeDistance={25}
                fadeStrength={1}
                infiniteGrid
              />
            )}
            
            {/* Model */}
            {modelUrl ? (
              <Model url={modelUrl} autoRotate={autoRotate} />
            ) : (
              <DemoModel />
            )}
            
            {/* Controls */}
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={20}
            />
          </Suspense>
        </Canvas>

        {/* Info Overlay */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/10"
          >
            <h4 className="text-white font-medium mb-2">Controls</h4>
            <ul className="text-sm text-white/60 space-y-1">
              <li>• Left Click + Drag: Rotate</li>
              <li>• Right Click + Drag: Pan</li>
              <li>• Scroll: Zoom</li>
            </ul>
            {!modelUrl && (
              <p className="text-xs text-cyan-400 mt-2">
                Demo mode - Upload a GLB file to view your model
              </p>
            )}
          </motion.div>
        )}

        {/* File Upload Prompt (when no model) */}
        {!modelUrl && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/60 backdrop-blur-sm rounded-xl p-6 border border-white/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-2">Load 3D Model</h3>
              <p className="text-sm text-white/60 mb-4">
                Upload a GLB/GLTF file to view in 3D
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg cursor-pointer transition-colors">
                <span>Choose File</span>
                <input 
                  type="file" 
                  accept=".glb,.gltf" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onLoad) {
                      const url = URL.createObjectURL(file);
                      onLoad(url);
                    }
                  }}
                />
              </label>
            </motion.div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {showStats && (
        <div className="px-4 py-2 bg-black/50 border-t border-white/10 text-xs text-white/40 flex items-center justify-between">
          <span>Three.js WebGL Renderer</span>
          <span>Drag to rotate • Scroll to zoom</span>
        </div>
      )}
    </div>
  );
}
