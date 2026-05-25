
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Obstacle } from '../../types/vine'

interface ObstacleSphereProps {
  obstacle: Obstacle
}

export function ObstacleSphere({ obstacle }: ObstacleSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={obstacle.position}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[obstacle.radius, 32, 32]} />
      <meshStandardMaterial
        color="#4a5568"
        roughness={0.3}
        metalness={0.7}
        transparent
        opacity={0.7}
        emissive="#2d3748"
        emissiveIntensity={0.2}
      />
      <meshBasicMaterial
        color="#718096"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

interface ObstaclesProps {
  obstacles: Obstacle[]
}

export function Obstacles({ obstacles }: ObstaclesProps) {
  return (
    <group>
      {obstacles.map((obstacle) => (
        <ObstacleSphere key={obstacle.id} obstacle={obstacle} />
      ))}
    </group>
  )
}
