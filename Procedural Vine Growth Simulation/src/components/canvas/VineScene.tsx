
import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing'
import { GrowthEngine } from '../../engine/GrowthEngine'
import { useStore } from '../../store/useStore'
import { Vine } from './Vine'
import { Obstacles } from './Obstacle'
import { LightParticles } from './LightParticles'
import type { VineNode, Leaf } from '../../types/vine'

function SceneContent() {
  const growthEngineRef = useRef<GrowthEngine | null>(null)
  const [nodes, setNodes] = useState<VineNode[]>([])
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  const {
    params,
    lightSource,
    obstacles,
    isPlaying,
    isPaused,
    setStats,
    currentPreset,
  } = useStore()

  useEffect(() => {
    growthEngineRef.current = new GrowthEngine(params, lightSource)
    growthEngineRef.current.setObstacles(obstacles)
    growthEngineRef.current.reset()
    growthEngineRef.current.start()
  }, [currentPreset])

  useEffect(() => {
    if (growthEngineRef.current) {
      growthEngineRef.current.setParams(params)
    }
  }, [params])

  useEffect(() => {
    if (growthEngineRef.current) {
      growthEngineRef.current.setLightSource(lightSource)
    }
  }, [lightSource])

  useEffect(() => {
    if (growthEngineRef.current) {
      growthEngineRef.current.setObstacles(obstacles)
    }
  }, [obstacles])

  useEffect(() => {
    if (growthEngineRef.current) {
      if (isPlaying && !isPaused) {
        growthEngineRef.current.start()
      } else {
        growthEngineRef.current.stop()
      }
    }
  }, [isPlaying, isPaused])

  useFrame((_, delta) => {
    if (!growthEngineRef.current) return

    if (isPlaying && !isPaused) {
      growthEngineRef.current.update(delta)
    }

    setNodes(growthEngineRef.current.getNodes())
    setLeaves(growthEngineRef.current.getLeaves())

    frameCountRef.current++
    const now = performance.now()
    if (now - lastTimeRef.current >= 500) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current))
      const stats = growthEngineRef.current.getStats()
      setStats({
        fps,
        totalNodes: stats.totalNodes,
        activeBranches: stats.activeBranches,
        collisionCount: stats.collisionCount,
        maxDepthReached: stats.maxDepthReached,
        nutritionRemaining: stats.nutritionRemaining,
      })
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={lightSource.position}
        intensity={lightSource.intensity}
        color="#fff8e7"
        castShadow
      />
      <pointLight
        position={lightSource.position}
        intensity={0.5}
        color="#ffd700"
        distance={30}
      />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Vine nodes={nodes} leaves={leaves} />
      <Obstacles obstacles={obstacles} />
      <LightParticles lightSource={lightSource} />

      <gridHelper args={[20, 20, '#2d5a27', '#1a3a1a']} position={[0, -0.1, 0]} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />

      <fog attach="fog" args={['#0a1f0a', 10, 50]} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        <FXAA />
      </EffectComposer>
    </>
  )
}

export function VineScene() {
  return (
    <Canvas
      camera={{ position: [0, 5, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a1f0a']} />
      <SceneContent />
    </Canvas>
  )
}
