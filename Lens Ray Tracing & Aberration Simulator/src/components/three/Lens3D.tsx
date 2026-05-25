import { useMemo } from 'react';
import * as THREE from 'three';
import type { Lens } from '@/types/optics';
import { createSimpleLensGeometry } from './LensGeometry';

interface Lens3DProps {
  lens: Lens;
}

export const Lens3D = ({ lens }: Lens3DProps) => {
  const geometry = useMemo(() => {
    return createSimpleLensGeometry(lens);
  }, [lens.radius1, lens.radius2, lens.thickness, lens.aperture]);

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.9,
      thickness: 0.5,
      ior: lens.refractiveIndex,
      side: THREE.DoubleSide,
      envMapIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
  }, [lens.refractiveIndex]);

  return (
    <mesh
      position={[0, 0, lens.position + lens.thickness / 2]}
      geometry={geometry}
      material={material}
    />
  );
};

export const LensSystem = ({ lenses }: { lenses: Lens[] }) => {
  return (
    <group>
      {lenses.map((lens) => (
        <Lens3D key={lens.id} lens={lens} />
      ))}
    </group>
  );
};
