
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { VineNode, Leaf } from '../../types/vine'

interface VineProps {
  nodes: VineNode[]
  leaves: Leaf[]
}

export function Vine({ nodes, leaves }: VineProps) {
  const vineRef = useRef<THREE.Group>(null)
  const leavesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const vineGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 1, 1, 8)
  }, [])



  const leafGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(0.3, 0.2, 0.5, 0.5)
    shape.quadraticCurveTo(0.3, 0.8, 0, 1)
    shape.quadraticCurveTo(-0.3, 0.8, -0.5, 0.5)
    shape.quadraticCurveTo(-0.3, 0.2, 0, 0)
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 2,
    }
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.center()
    geometry.translate(0, 0.5, 0)
    return geometry
  }, [])

  const leafMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#3d8b37',
      side: THREE.FrontSide,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: false,
    })
  }, [])

  const vineSegments = useMemo(() => {
    const segments: {
      position: THREE.Vector3
      rotation: THREE.Euler
      scale: THREE.Vector3
      color: THREE.Color
      emissive: THREE.Color
      emissiveIntensity: number
    }[] = []

    const greenColor = new THREE.Color('#2d5a27')
    const brownColor = new THREE.Color('#8b4513')
    const redColor = new THREE.Color('#ff4444')

    for (let i = 0; i < nodes.length - 1; i++) {
      const node = nodes[i]
      const nextNode = nodes[i + 1]
      
      if (!nextNode) continue

      const start = node.position
      const end = nextNode.position
      const direction = end.clone().sub(start)
      const length = direction.length()
      
      if (length < 0.01) continue

      const midPoint = start.clone().add(end).multiplyScalar(0.5)
      const avgThickness = (node.thickness + nextNode.thickness) / 2
      
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      )
      const rotation = new THREE.Euler().setFromQuaternion(quaternion)

      const finalColor = greenColor.clone().lerp(brownColor, node.witherProgress)
      const emissiveColor = node.collisionFlash > 0 ? redColor : finalColor
      const emissiveIntensity = node.collisionFlash > 0 ? node.collisionFlash : 0

      segments.push({
        position: midPoint,
        rotation,
        scale: new THREE.Vector3(avgThickness, length, avgThickness),
        color: finalColor,
        emissive: emissiveColor,
        emissiveIntensity,
      })
    }

    return segments
  }, [nodes])

  useEffect(() => {
    if (!leavesRef.current) return

    leaves.forEach((leaf, i) => {
      dummy.position.copy(leaf.position)
      dummy.rotation.copy(leaf.rotation)
      const scale = leaf.scale * leaf.growthProgress
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      leavesRef.current!.setMatrixAt(i, dummy.matrix)
    })

    leavesRef.current.count = leaves.length
    if (leavesRef.current.instanceMatrix) {
      leavesRef.current.instanceMatrix.needsUpdate = true
    }
  }, [leaves, dummy])

  return (
    <group ref={vineRef}>
      {vineSegments.map((segment, i) => (
        <mesh
          key={i}
          position={segment.position}
          rotation={segment.rotation}
          scale={segment.scale}
          geometry={vineGeometry}
        >
          <meshStandardMaterial
            color={segment.color}
            emissive={segment.emissive}
            emissiveIntensity={segment.emissiveIntensity}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}
      
      <instancedMesh
        ref={leavesRef}
        args={[leafGeometry, leafMaterial, Math.max(leaves.length, 1)]}
        count={leaves.length}
      />
    </group>
  )
}
