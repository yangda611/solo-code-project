import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import SubmersibleHull from './SubmersibleHull'
import BubbleSystem from './BubbleSystem'
import { useSimulationStore } from '../store/simulationStore'
import api from '../services/api'

function OceanEnvironment() {
  const { depth } = useSimulationStore()

  const fogColor = useMemo(function() {
    const depthFactor = Math.min(1, depth / 11000)
    if (depthFactor > 0.8) return '#060612'
    if (depthFactor > 0.5) return '#08101f'
    if (depthFactor > 0.3) return '#0a1a30'
    return '#0c2a4a'
  }, [depth])

  return (
    <>
      <fog attach="fog" args={[fogColor, 12, 35]} />
      <color attach="background" args={[fogColor]} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[8, 12, 8]} intensity={0.25} color="#60a5fa" />
      <directionalLight position={[-8, -8, -8]} intensity={0.15} color="#1e40af" />
      <pointLight position={[0, 0, 0]} intensity={0.4} color="#3b82f6" distance={25} />
    </>
  )
}

function RotatingHull() {
  const groupRef = useRef(null)
  const { isAnalyzing, failureState } = useSimulationStore()

  useFrame(function(state, delta) {
    if (groupRef.current) {
      const baseSpeed = 0.1
      const analysisSpeed = isAnalyzing ? 0.5 : 0
      const failureSpeed = failureState && failureState.hasCrack ? 0.8 : 0

      groupRef.current.rotation.y += (baseSpeed + analysisSpeed + failureSpeed) * delta
    }
  })

  return (
    <group ref={groupRef}>
      <SubmersibleHull />
    </group>
  )
}

function SceneContent() {
  const {
    depth,
    targetDepth,
    temperature,
    getDesignParams,
    setAnalysisResult,
    setIsAnalyzing,
    updateFailureState,
    updateAnimationTime,
    setDepth
  } = useSimulationStore()

  useEffect(function() {
    let animationFrame
    let lastTime = performance.now()

    const animate = function(time) {
      const delta = (time - lastTime) / 1000
      lastTime = time

      if (!isNaN(delta) && isFinite(delta)) {
        updateAnimationTime(delta)

        if (depth !== targetDepth) {
          const diff = targetDepth - depth
          const step = diff * Math.min(1, delta * 2)
          const newDepth = depth + step
          if (Math.abs(newDepth - targetDepth) < 0.01) {
            setDepth(targetDepth)
          } else {
            setDepth(newDepth)
          }
        }
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return function() {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [depth, targetDepth, updateAnimationTime, setDepth])

  useEffect(function() {
    let timeoutId

    const runAnalysis = async function() {
      setIsAnalyzing(true)
      try {
        const designParams = getDesignParams()
        if (designParams && designParams.material && typeof designParams.material === 'object') {
          const result = await api.analyze(designParams, depth, temperature)
          if (result && typeof result === 'object') {
            setAnalysisResult(result)
            updateFailureState(result)
          }
        }
      } catch (error) {
        console.error('分析失败:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }

    timeoutId = window.setTimeout(runAnalysis, 300)
    return function() {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [depth, temperature, getDesignParams, setAnalysisResult, setIsAnalyzing, updateFailureState])

  return (
    <>
      <OceanEnvironment />
      <PerspectiveCamera makeDefault position={[10, 6, 12]} fov={45} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <SubmersibleHull />
      <BubbleSystem />
      <OrbitControls />
    </>
  )
}

function Scene3D() {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
      shadows={false}
    >
      <SceneContent />
    </Canvas>
  )
}

export default Scene3D
