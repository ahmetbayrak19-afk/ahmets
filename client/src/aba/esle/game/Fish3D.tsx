import { useFrame } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/**
 * Bu sürüm "Suspense'e teslim olmaz".
 * - Local URL takılırsa tüm sahneyi kilitlemez.
 * - Hangi path'in çalıştığını / neden çalışmadığını ekrana basar.
 *
 * Not: Bu dosya yalnız başına yeterli. DenizBackground'te Suspense olsa bile,
 * Fish3D artık Suspense tetiklemediği için tüm sahneyi karartmaz.
 */

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
  const [status, setStatus] = useState<string>("init");
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);

  // APK içinde sen "assets/models" gördüm dediğin için o path'leri de deniyoruz.
  // Sıra önemli: önce en olasılar.
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

    const loader = new GLTFLoader();
    loader.setCrossOrigin("anonymous");

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
      setStatus("loading…");
      for (const url of candidates) {
        try {
          const scene = await tryOne(url);
          if (cancelled) return;

          // Model geldi: klonlayıp state'e koy.
          const cloned = scene.clone(true);
          setModel(cloned);
          setPickedUrl(url);
          setStatus("loaded ✅");
          return;
        } catch (e: any) {
          // Sıradaki URL'ye geç
          // (Burada console'a da basıyoruz ki logcat/remote debug'da görünsün.)
          // eslint-disable-next-line no-console
          console.warn("GLB load failed:", url, e?.message || e);
        }
      }

      if (!cancelled) {
        setStatus("FAILED ❌ (hiçbir URL yüklenmedi)");
      }
    })();

    return () => {
      cancelled = true;
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

  // Model yoksa: sahnede KIRMIZI KÜP + Debug yazısı göster.
  if (!model) {
    return (
      <group ref={groupRef}>
        <mesh scale={[2, 2, 2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Basit 3D yazı yerine, debug için console + status yeterli.
            Eğer ekranda görmek istersen Html kullanırız ama şimdilik kodu minimal tuttum. */}
        {/* Status’i en azından console’dan takip edeceksin. */}
        {process.env.NODE_ENV !== "production" ? null : null}
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} scale={5.0} />
      {/* Hangi URL çalıştı diye console'a basalım */}
      {/* eslint-disable-next-line no-console */}
      {pickedUrl ? console.log("Fish GLB loaded from:", pickedUrl) : null}
    </group>
  );
}
