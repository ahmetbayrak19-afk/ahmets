import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";

import { storage } from "../../../firebase"; // ✅ doğru yol
import { ref, getDownloadURL } from "firebase/storage";

const STORAGE_PATH = "deniz.glb";

// ✅ Buradan ayar çek
const MODEL_SCALE = 0.22;       // çok büyükse düşür (0.18 / 0.12 gibi)
const MODEL_Y = -1.35;          // aşağı-yukarı
const MODEL_Z = 0;              // ileri-geri
const FLIP_Y = Math.PI;         // ters duvarı gösteriyorsa 180° çevirir

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    // Kamera ayarı (sahne çok büyükse position'u büyüt)
    camera.position.set(0, 0.9, 5.2);
    camera.lookAt(0, 0.2, 0);
    camera.near = 0.05;
    camera.far = 300;
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function DenizModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  return (
    <primitive
      object={gltf.scene}
      position={[0, MODEL_Y, MODEL_Z]}
      rotation={[0, FLIP_Y, 0]}
      scale={[MODEL_SCALE, MODEL_SCALE, MODEL_SCALE]}
    />
  );
}

export default function DenizBackground() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fileRef = ref(storage, STORAGE_PATH);
        const downloadUrl = await getDownloadURL(fileRef);
        if (!alive) return;
        setUrl(downloadUrl);
      } catch (e) {
        console.error("DenizBackground getDownloadURL error:", e);
        if (!alive) return;
        setUrl(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // URL yoksa hiç render etme (oyun yine çalışsın)
  if (!url) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.9, 5.2], fov: 45, near: 0.05, far: 300 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // transparan
        }}
      >
        <CameraRig />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />

        <Suspense fallback={null}>
          <DenizModel url={url} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
    }
