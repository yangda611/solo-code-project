import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../store/simulationStore'

function SubmersibleHull() {
  const hullGroupRef = useRef(null)
  const { design, analysisResult, showStressHeatmap, showRibs, showWindows, failureState, showDeformation, deformationScale } = useSimulationStore()

  const outerRadius = design.outerRadius
  const innerRadius = design.innerRadius
  const length = design.length
  const windowDiameter = design.windowDiameter
  const windowCount = design.windowCount
  const ribCount = design.ribCount
  const ribHeight = design.ribHeight
  const endCapType = design.endCapType

  const hullGeometry = useMemo(function() {
    return new THREE.CylinderGeometry(outerRadius, outerRadius, length, 32, 16, true)
  }, [outerRadius, length])

  const innerHullGeometry = useMemo(function() {
    return new THREE.CylinderGeometry(innerRadius, innerRadius, length * 0.99, 24, 8, true)
  }, [innerRadius, length])

  const hullColor = useMemo(function() {
    if (!analysisResult || !showStressHeatmap) {
      return new THREE.Color(0x3b82f6)
    }
    const sr = analysisResult.maxVonMisesStress / (analysisResult.yieldStrength * 1.2)
    const stressRatio = Math.min(1, sr)
    if (stressRatio < 0.16) return new THREE.Color(0x00ff00)
    if (stressRatio < 0.33) return new THREE.Color(0x66ff00)
    if (stressRatio < 0.5) return new THREE.Color(0xffff00)
    if (stressRatio < 0.66) return new THREE.Color(0xff8800)
    if (stressRatio < 0.83) return new THREE.Color(0xff4400)
    if (stressRatio < 1.0) return new THREE.Color(0xff0000)
    return new THREE.Color(0x8800ff)
  }, [analysisResult, showStressHeatmap])

  useFrame(function(state) {
    if (showDeformation && analysisResult && hullGroupRef.current) {
      const deformation = analysisResult.deformation.radial * deformationScale
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7
      const scale = 1 + deformation * pulse
      hullGroupRef.current.scale.setScalar(scale)
    } else if (hullGroupRef.current) {
      hullGroupRef.current.scale.setScalar(1)
    }
  })

  const leftEndCapGeometry = useMemo(function() {
    const r = outerRadius
    if (endCapType === 'hemispherical') {
      return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    }
    if (endCapType === 'spherical') {
      return new THREE.SphereGeometry(r * 0.95, 32, 24)
    }
    if (endCapType === 'ellipsoidal') {
      return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3)
    }
    if (endCapType === 'flat') {
      return new THREE.CircleGeometry(r, 32)
    }
    return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  }, [outerRadius, endCapType])

  const rightEndCapGeometry = useMemo(function() {
    const r = outerRadius
    if (endCapType === 'hemispherical') {
      return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    }
    if (endCapType === 'spherical') {
      return new THREE.SphereGeometry(r * 0.95, 32, 24)
    }
    if (endCapType === 'ellipsoidal') {
      return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3)
    }
    if (endCapType === 'flat') {
      return new THREE.CircleGeometry(r, 32)
    }
    return new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  }, [outerRadius, endCapType])

  const ribs = useMemo(function() {
    const ribsArray = []
    if (ribCount > 0 && ribHeight > 0) {
      for (let i = 0; i < ribCount; i++) {
        const yPos = -length / 2 + (i + 1) * (length / (ribCount + 1))
        ribsArray.push({
          key: 'rib-' + i,
          position: [0, yPos, 0],
          rotation: [Math.PI / 2, 0, 0],
          innerRadius: outerRadius,
          outerRadius: outerRadius + ribHeight
        })
      }
    }
    return ribsArray
  }, [ribCount, length, outerRadius, ribHeight])

  const windows = useMemo(function() {
    const windowsArray = []
    if (windowCount > 0) {
      for (let i = 0; i < windowCount; i++) {
        const angle = (i / windowCount) * Math.PI * 2
        const x = outerRadius * Math.cos(angle)
        const z = outerRadius * Math.sin(angle)
        windowsArray.push({
          key: 'window-' + i,
          position: [x * 0.95, 0, z * 0.95],
          rotation: [0, -angle + Math.PI / 2, 0],
          diameter: windowDiameter
        })
      }
    }
    return windowsArray
  }, [windowCount, outerRadius, windowDiameter])

  const hasCracks = failureState && failureState.crackLocations && failureState.crackLocations.length > 0

  return (
    <group ref={hullGroupRef}>
      <mesh geometry={hullGeometry}>
        <meshStandardMaterial color={hullColor} />
      </mesh>

      <mesh geometry={innerHullGeometry}>
        <meshStandardMaterial color="#2d3748" side={THREE.BackSide} />
      </mesh>

      <mesh geometry={leftEndCapGeometry} position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={hullColor} />
      </mesh>

      <mesh geometry={rightEndCapGeometry} position={[0, -length / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color={hullColor} />
      </mesh>

      {showRibs && ribs.length > 0 && ribs.map(function(rib) {
        return (
          <mesh key={rib.key} position={rib.position} rotation={rib.rotation}>
            <ringGeometry args={[rib.innerRadius, rib.outerRadius, 32]} />
            <meshStandardMaterial color={showStressHeatmap ? '#f97316' : '#475569'} />
          </mesh>
        )
      })}

      {showWindows && windows.length > 0 && windows.map(function(window) {
        return (
          <group key={window.key} position={window.position} rotation={window.rotation}>
            <mesh>
              <cylinderGeometry args={[window.diameter / 2, window.diameter / 2, 0.05, 32]} />
              <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} />
            </mesh>
            <mesh>
              <ringGeometry args={[window.diameter / 2, window.diameter / 2 + 0.03, 32]} />
              <meshStandardMaterial
                color={showStressHeatmap && failureState.hasCrack ? '#ff4444' : '#64748b'}
                emissive={failureState.hasCrack ? '#ff0000' : '#000000'}
                emissiveIntensity={failureState.hasCrack ? 0.5 : 0}
              />
            </mesh>
          </group>
        )
      })}

      {hasCracks && failureState.crackLocations.filter(function(c) {
        return c && c.progress > 0
      }).map(function(crack, index) {
        return <Crack key={'crack-' + index} crack={crack} outerRadius={outerRadius} length={length} />
      })}
    </group>
  )
}

function Crack(props) {
  const lineRef = useRef(null)
  const crack = props.crack
  const outerRadius = props.outerRadius
  const length = props.length

  const crackPoints = useMemo(function() {
    const points = []
    const segments = 30
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const wobble = Math.sin(t * 15 + crack.angle) * 0.008 * crack.progress
      const y = (t - 0.5) * length * crack.progress
      const x = outerRadius + 0.001
      points.push(new THREE.Vector3(x + wobble, y, 0))
    }
    return points
  }, [crack, outerRadius, length])

  useFrame(function(state) {
    if (lineRef.current) {
      const material = lineRef.current.material
      if (material) {
        const pulse = (Math.sin(state.clock.elapsedTime * 8) + 1) / 2
        material.opacity = Math.min(0.95, crack.progress) * (0.5 + pulse * 0.5)
      }
    }
  })

  return (
    <group rotation={[0, crack.angle, 0]}>
      <line ref={lineRef} points={crackPoints}>
        <lineBasicMaterial color="#ff2222" transparent opacity={Math.min(0.95, crack.progress)} linewidth={3} />
      </line>
    </group>
  )
}

export default SubmersibleHull
