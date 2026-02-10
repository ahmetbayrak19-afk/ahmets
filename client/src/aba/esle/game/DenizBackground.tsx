// client/src/aba/esle/game/DenizBackground.tsx
import React, { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";

const GLB_URL =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function DenizModel({
  onOk,
  onErr,
}: {
  onOk: () => void;
  onErr: (m: string) => void;
}) {
  try {
    const gltf = useGLTF(GLB_URL);
    // ✅ 90 derece sola çevir (Y ekseni -90deg)
    const rotY = useMemo(() => -Math.PI / 2, []);
    const scale = 1; // burayı sonra büyütür/küçültürüz

    // İlk başarılı load’da “OK” işaretle
    React.useEffect(() => {
      onOk();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <primitive
        object={gltf.scene}
        rotation={[0, rotY, 0]}
        scale={scale}
        position={[0, 0, 0]}
      />
    );
  } catch (e: any) {
    onErr(e?.message || String(e));
    return null;
  }
}

function CenterMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-black/70 border border-white/10 rounded-2xl p-4 text-white">
        <div className="font-black text-lg">{title}</div>
        <div className="mt-2 text-xs text-white/70 whitespace-pre-wrap break-words">
          {text}
        </div>
      </div>
    </div>
  );
}

export default function DenizBackground() {
  const [status, setStatus] = useState<
    | { kind: "loading" }
    | { kind: "ok" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  return (
    <div className="absolute inset-0">
      <Canvas
        // ✅ 3D arkada kalacak
        style={{ width: "100%", height: "100%", background: "black" }}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 4, 9], fov: 55, near: 0.1, far: 2000 }}
        onCreated={() => {
          // Canvas created
        }}
      >
        {/* ışıklar */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} />
        <directionalLight position={[-6, 6, -6]} intensity={0.5} />

        <Suspense
          fallback={
            <Html center>
              <div className="text-white text-sm font-black">3D yükleniyor…</div>
            </Html>
          }
        >
          <DenizModel
            onOk={() => setStatus({ kind: "ok" })}
            onErr={(m) => setStatus({ kind: "error", message: m })}
          />
        </Suspense>

        {/* Debug kontrol (istersen kapatırsın) */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>

      {status.kind === "loading" && (
        <CenterMessage title="Deniz GLB yükleniyor…" text="Eğer burada takılı kalıyorsa URL/token veya GLB bozuk olabilir." />
      )}

      {status.kind === "error" && (
        <CenterMessage
          title="DenizBackground HATA"
          text={status.message}
        />
      )}
    </div>
  );
}

// drei cache
useGLTF.preload(GLB_URL);
