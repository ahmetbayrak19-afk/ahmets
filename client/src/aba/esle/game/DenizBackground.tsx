// client/src/aba/esle/game/DenizBackground.tsx
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";

import { storage } from "../../../firebase"; // ✅ DOĞRU YOL
import { ref, getDownloadURL } from "firebase/storage";

type Props = {
  className?: string;
};

// Firebase Storage içindeki dosya yolu (gs://... değil)
// Senin verdiğin: gs://ogrencitakip-2a775.firebasestorage.app/deniz.glb
// -> Storage path: "deniz.glb"
const STORAGE_PATH = "deniz.glb";

function DenizModel({ url }: { url: string }) {
  // drei/useGLTF URL ile yükler
  const gltf = useGLTF(url);

  return (
    <primitive
      object={gltf.scene}
      // sahne düzeni: tiyatro gibi
      // sağ/sol dağlar, üst yüzey, alt kum — modeli buna göre konumlandırırsın
      position={[0, -1.1, 0]}
      rotation={[0, 0, 0]}
      scale={[1, 1, 1]}
    />
  );
}

export default function DenizBackground({ className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Firebase Storage’dan public download URL çek
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setErr(null);
        const fileRef = ref(storage, STORAGE_PATH);
        const downloadUrl = await getDownloadURL(fileRef);
        if (!alive) return;
        setUrl(downloadUrl);
      } catch (e: any) {
        console.error("DenizBackground getDownloadURL error:", e);
        if (!alive) return;
        setErr(e?.message || "GLB indirilemedi");
        setUrl(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Siyah ekran olmasın diye: URL gelene kadar render etme
  if (err) {
    return (
      <div className={className} style={{ position: "absolute", inset: 0, background: "black" }}>
        {/* Hata olursa da oyunu bozmasın */}
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          background: "black",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none", // ✅ input canvas’a gitsin
        zIndex: 0,
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.8, 3.2], fov: 45, near: 0.05, far: 200 }}
        onCreated={({ gl }) => {
          // bazı android webview’larda siyah ekranı azaltır
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />

        <Suspense fallback={null}>
          <DenizModel url={url} />
          <Environment preset="sunset" />
        </Suspense>

        {/* debug istemiyorsan kapalı kalsın; pointerEvents none zaten */}
        {/* <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} /> */}
      </Canvas>
    </div>
  );
}

// drei cache
useGLTF.preload("/deniz.glb");
