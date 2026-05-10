import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'

function BubbleSystem() {
  const pointsRef = useRef(null)
  const { depth, bubbleIntensity, failureState } = useSimulationStore()

  const baseCount = 300
  const bubbleCount = Math.max(50, Math.floor(baseCount * bubbleIntensity))

  const bubbleData = useMemo(function() {
    const positions = new Float32Array(bubbleCount * 3)
    const velocities = new Float32Array(bubbleCount * 3)
    const sizes = new Float32Array(bubbleCount)

    for (let i = 0; i < bubbleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15
      positions[i * 3 + 1] = -10 - Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15

      velocities[i * 3] = (Math.random() - 0.5) * 0.3
      velocities[i * 3 + 1] = 0.8 + Math.random() * 1.5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3

      sizes[i] = 0.02 + Math.random() * 0.08
    }

    return { positions, velocities, sizes }
  }, [bubbleCount])

  const bubbleGeometry = useMemo(function() {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(bubbleData.positions, 3))
    return geometry
  }, [bubbleData.positions])

  useFrame(function(state, delta) {
    if (!pointsRef.current || !pointsRef.current.geometry) return

    const positions = pointsRef.current.geometry.attributes.position.array
    if (!positions || positions.length === 0) return

    const time = state.clock.elapsedTime

    const hasFailure = failureState && (failureState.hasCrack || failureState.isBursting)
    const speedMultiplier = hasFailure ? 2.5 : 1

    for (let i = 0; i < bubbleCount; i++) {
      const idx = i * 3

      positions[idx] += bubbleData.velocities[idx] * delta * speedMultiplier
      positions[idx + 1] += bubbleData.velocities[idx + 1] * delta * speedMultiplier
      positions[idx + 2] += bubbleData.velocities[idx + 2] * delta * speedMultiplier

      positions[idx] += Math.sin(time * 2 + i * 0.5) * 0.005
      positions[idx + 2] += Math.cos(time * 1.5 + i * 0.3) * 0.005

      if (positions[idx + 1] > 10) {
        positions[idx] = (Math.random() - 0.5) * 15
        positions[idx + 1] = -10 - Math.random() * 10
        positions[idx + 2] = (Math.random() - 0.5) * 15
      }

      if (hasFailure && i < Math.floor(bubbleCount * 0.2)) {
        if (positions[idx + 1] > 3) {
          positions[idx] = (Math.random() - 0.5) * 3
          positions[idx + 1] = -3 + Math.random() * 2
          positions[idx + 2] = (Math.random() - 0.5) * 3
        }
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true

    const depthFactor = Math.min(1, depth / 11000)
    if (pointsRef.current.material) {
      pointsRef.current.material.opacity = 0.25 + depthFactor * 0.35
    }
  })

  return (
    <points ref={pointsRef} geometry={bubbleGeometry}>
      <pointsMaterial
        size={0.05}
        color="#a5f3fc"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default BubbleSystem
