"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/store/simulationStore";

export default function MicrofluidicChip() {
  const groupRef = useRef<THREE.Group>(null);
  const {
    channelGeometry,
    fluidProperties,
    droplets,
    isSimulating,
    time,
    showStreamlines,
    showInterfaceCurvature,
    showWettabilityGradient,
    setDroplets,
  } = useSimulationStore();

  const channelScale = 0.02;

  const generateChannelGeometry = useMemo(() => {
    const { type, mainChannelWidth, mainChannelHeight, mainChannelLength, sideChannelWidth, sideChannelHeight, sideChannelLength, orificeWidth, surfaceRoughness } = channelGeometry;

    const mainW = mainChannelWidth * channelScale;
    const mainH = mainChannelHeight * channelScale;
    const mainL = mainChannelLength * channelScale;
    const sideW = sideChannelWidth * channelScale;
    const sideH = sideChannelHeight * channelScale;
    const sideL = sideChannelLength * channelScale;
    const orificeW = (orificeWidth || 40) * channelScale;

    const geometries: { mesh: THREE.BufferGeometry; position: [number, number, number]; color: string; opacity: number }[] = [];

    if (type === "flow-focusing") {
      const mainChannel = new THREE.BoxGeometry(mainL, mainH, mainW);
      geometries.push({ mesh: mainChannel, position: [0, 0, 0], color: "#e5e7eb", opacity: 0.3 });

      const sideChannel1 = new THREE.BoxGeometry(sideL, sideH, sideW);
      geometries.push({ mesh: sideChannel1, position: [-mainL / 2 - sideL / 2, 0, mainW / 2 + sideW / 2], color: "#fef3c7", opacity: 0.4 });

      const sideChannel2 = new THREE.BoxGeometry(sideL, sideH, sideW);
      geometries.push({ mesh: sideChannel2, position: [-mainL / 2 - sideL / 2, 0, -(mainW / 2 + sideW / 2)], color: "#fef3c7", opacity: 0.4 });

      const orifice = new THREE.BoxGeometry(orificeW * 2, mainH, orificeW);
      geometries.push({ mesh: orifice, position: [-mainL / 4, 0, 0], color: "#d1d5db", opacity: 0.5 });
    } else {
      const mainChannel = new THREE.BoxGeometry(mainL, mainH, mainW);
      geometries.push({ mesh: mainChannel, position: [0, 0, 0], color: "#e5e7eb", opacity: 0.3 });

      const sideChannel = new THREE.BoxGeometry(sideW, sideH, sideL);
      geometries.push({ mesh: sideChannel, position: [-mainL / 4, 0, mainW / 2 + sideL / 2], color: "#fef3c7", opacity: 0.4 });
    }

    return geometries;
  }, [channelGeometry]);

  const streamlines = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number]; color: string }[] = [];
    const { type, mainChannelWidth, mainChannelLength } = channelGeometry;
    const mainW = mainChannelWidth * channelScale;
    const mainL = mainChannelLength * channelScale;

    for (let i = 0; i < 10; i++) {
      const zOffset = (i - 4.5) * (mainW / 10);
      lines.push({
        start: [-mainL / 2, 0, zOffset],
        end: [mainL / 2, 0, zOffset],
        color: "#60a5fa",
      });
    }

    if (type === "flow-focusing") {
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * 0.2;
        lines.push({
          start: [-mainL, 0, mainW / 2 + 1 + offset],
          end: [-mainL / 4, 0, offset * 0.5],
          color: "#f59e0b",
        });
        lines.push({
          start: [-mainL, 0, -(mainW / 2 + 1 + offset)],
          end: [-mainL / 4, 0, -offset * 0.5],
          color: "#f59e0b",
        });
      }
    }

    return lines;
  }, [channelGeometry]);

  const wettabilityColors = useMemo(() => {
    const colors: THREE.Color[] = [];
    const resolution = 20;

    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1);
      const angle = 90 + t * 40;
      const hue = 0.6 - t * 0.4;
      colors.push(new THREE.Color().setHSL(hue, 0.7, 0.5));
    }

    return colors;
  }, []);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setDroplets((prev) => {
        const newDroplets = [...prev];
        const { capillaryNumber, flowRateRatio } = fluidProperties;
        const { surfaceRoughness, type } = channelGeometry;

        if (Math.random() < 0.05 * flowRateRatio) {
          const baseRadius = 0.3 + Math.random() * 0.2;
          const isJetting = capillaryNumber > 0.03;

          const newDroplet = {
            id: Date.now() + Math.random(),
            x: -3 + (Math.random() - 0.5) * 0.5,
            y: 0,
            z: (Math.random() - 0.5) * 0.3,
            radius: isJetting ? baseRadius * 0.5 : baseRadius,
            volume: (4 / 3) * Math.PI * Math.pow(isJetting ? baseRadius * 0.5 : baseRadius, 3),
            velocity: { x: 0.1 + Math.random() * 0.05, y: 0, z: 0 },
            phase: 1,
          };

          newDroplets.push(newDroplet);

          if (Math.random() < 0.3) {
            newDroplets.push({
              ...newDroplet,
              id: Date.now() + Math.random() + 1,
              radius: newDroplet.radius * 0.2,
              isSatellite: true,
              x: newDroplet.x + 0.2,
              z: newDroplet.z + (Math.random() - 0.5) * 0.2,
            });
          }
        }

        return newDroplets
          .map((d) => ({
            ...d,
            x: d.x + d.velocity.x,
            z: d.z + (surfaceRoughness > 0.015 ? (Math.random() - 0.5) * 0.02 : 0),
          }))
          .filter((d) => d.x < 6 && d.radius > 0.05);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating, fluidProperties, channelGeometry, setDroplets]);

  useFrame(() => {
    if (groupRef.current && isSimulating) {
      groupRef.current.position.y = Math.sin(time * 2) * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {generateChannelGeometry.map((geom, i) => (
        <mesh key={i} position={geom.position}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={geom.color}
            transparent
            opacity={geom.opacity}
            side={THREE.DoubleSide}
            wireframe={false}
          />
        </mesh>
      ))}

      {showStreamlines &&
        streamlines.map((line, i) => (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...line.start, ...line.end])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={line.color} linewidth={2} opacity={0.6} transparent />
          </line>
        ))}

      {droplets.map((droplet) => (
        <group key={droplet.id}>
          <mesh position={[droplet.x, droplet.y, droplet.z]}>
            <sphereGeometry args={[droplet.radius, 32, 32]} />
            <meshStandardMaterial
              color={droplet.isSatellite ? "#a78bfa" : "#3b82f6"}
              transparent
              opacity={0.8}
              emissive={droplet.isSatellite ? "#a78bfa" : "#3b82f6"}
              emissiveIntensity={0.2}
            />
          </mesh>

          {showInterfaceCurvature && (
            <mesh position={[droplet.x, droplet.y, droplet.z]}>
              <sphereGeometry args={[droplet.radius * 1.1, 16, 16]} />
              <meshBasicMaterial
                color="#ef4444"
                wireframe
                transparent
                opacity={0.3}
              />
            </mesh>
          )}
        </group>
      ))}

      {showWettabilityGradient && (
        <mesh position={[0, -channelGeometry.mainChannelHeight * channelScale / 2 - 0.05, 0]}>
          <boxGeometry args={[10, 0.1, 2]} />
          <meshStandardMaterial vertexColors={false} color="#10b981" opacity={0.6} transparent />
        </mesh>
      )}

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
