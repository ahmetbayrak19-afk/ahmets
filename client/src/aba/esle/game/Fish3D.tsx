import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

type FishState = {
  x: number;
  y: number;
  rotation: number;
  lastDirection: number;
};

export function Fish3D({
  fishRef,
}: {
  fishRef: React.MutableRefObject<FishState>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const [model, setModel] = useState<THREE.Group | null>(null);
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);

  const candidates = useMemo(
    () => [
      "models/balik.glb",
      "./models/balik.glb",
      "assets/models/balik.glb",
      "./assets/models/balik.glb",
      "/models/balik.glb",
      "/assets/models/balik.glb",
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    // 1) GLTF + DRACO loader kur
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();

    // 2) Draco decoder'ı CDN'den al (internet varsa en sorunsuz test)
    // Alternatif CDN gerekirse: https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    const tryOne = (url: string) =>
      new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          url,
          (gltf) => resolve(gltf.scene),
          undefined,
          (err) => reject(err)
        );
      });

    (async () => {
      for (const url of candidates) {
        try {
          const scene = await tryOne(url);
          if (cancelled) return;

          const cloned = scene.clone(true);
          setModel(cloned);
          setPickedUrl(url);

          console.log("✅ Fish GLB loaded from:", url);
          return;
        } catch (e: any) {
          console.warn("❌ GLB load failed:", url, e?.message || e);
        }
      }

      console.error("❌ Fish GLB: hiçbir path yüklenmedi.");
    })();

    return () => {
      cancelled = true;
      dracoLoader.dispose();
    };
  }, [candidates]);

  useFrame(() => {
    if (!groupRef.current || !fishRef.current) return;

    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    groupRef.current.position.x = fish.x * SCALE_FACTOR;
    groupRef.current.position.y = -fish.y * SCALE_FACTOR;
    groupRef.current.rotation.y =
      fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    groupRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  if (!model) {
    // Model yok → kırmızı küp
    return (
      <group ref={groupRef}>
        <mesh scale={[2, 2, 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} scale={5.0} />
      {pickedUrl ? null : null}
    </group>
  );
}
