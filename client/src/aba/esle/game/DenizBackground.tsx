import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

// deniz.glb EslemeGame.tsx ile aynı klasörde
const GLB_URL = new URL("./deniz.glb", import.meta.url).toString();

function FitAndLog({ object }: { object: THREE.Object3D }) {
  const { camera } = useThree();

  useEffect(() => {
    // SAHNEDE NE VAR -> konsola dök
    const names: string[] = [];
    object.traverse((o: any) => {
      if (o?.isMesh) names.push(o.name || "(no-name)");
    });
    console.log("[deniz.glb] mesh names:", names);

    // KADRAJA SIĞDIR (tiyatro sahnesi gibi tek sefer fit)
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const cam = camera as THREE.PerspectiveCamera;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cam.fov || 50;
    const dist = maxDim / (2 * Math.tan((fov * Math.PI) / 360));

    cam.position.set(center.x, center.y, center.z + dist * 1.25);
    cam.lookAt(center);
    cam.updateProjectionMatrix();
  }, [object, camera]);

  return null;
}

function DenizModel() {
  const gltf = useGLTF(GLB_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // 3D daha net görünsün diye (istersen)
  // scene.scale.setScalar(1);

  return (
    <>
      <primitive object={scene} />
      <FitAndLog object={scene} />
    </>
  );
}

export default function DenizBackground3D() {
  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: "none", zIndex: 0 }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <DenizModel />
      </Canvas>
    </div>
  );
}

useGLTF.preload(GLB_URL);
