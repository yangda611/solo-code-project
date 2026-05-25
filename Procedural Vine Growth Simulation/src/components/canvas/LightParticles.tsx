
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { LightSource } from '../../types/vine'

interface LightParticlesProps {
  lightSource: LightSource
}

export function LightParticles({ lightSource }: LightParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 200

  const { positions, velocities, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const lightDir = lightSource.direction.clone().normalize()
    const lightPos = lightDir.clone().multiplyScalar(15)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      )
      const startPos = lightPos.clone().add(offset)
      
      positions[i3] = startPos.x
      positions[i3 + 1] = startPos.y
      positions[i3 + 2] = startPos.z

      const velocity = lightDir.clone().negate()
      velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ))
      velocity.normalize()
      velocities[i3] = velocity.x
      velocities[i3 + 1] = velocity.y
      velocities[i3 + 2] = velocity.z

      sizes[i] = Math.random() * 2 + 1
    }

    return { positions, velocities, sizes }
  }, [lightSource])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const geometry = pointsRef.current.geometry
    const posAttribute = geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttribute.array as Float32Array

    const lightDir = lightSource.direction.clone().normalize()
    const lightPos = lightDir.clone().multiplyScalar(15)

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      posArray[i3] += velocities[i3] * delta * 3
      posArray[i3 + 1] += velocities[i3 + 1] * delta * 3
      posArray[i3 + 2] += velocities[i3 + 2] * delta * 3

      const dist = Math.sqrt(
        posArray[i3] * posArray[i3] +
        posArray[i3 + 1] * posArray[i3 + 1] +
        posArray[i3 + 2] * posArray[i3 + 2]
      )

      if (dist < 1) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5
        )
        const startPos = lightPos.clone().add(offset)
        posArray[i3] = startPos.x
        posArray[i3 + 1] = startPos.y
        posArray[i3 + 2] = startPos.z
      }
    }

    posAttribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffd700"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
