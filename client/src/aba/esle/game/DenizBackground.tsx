// DenizBackground.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../../firebase"; // ⚠️ Klasörün durumuna göre yolu düzelt (aşağıda not var)
import * as THREE from "three";

/**
 * Not:
 * - Bu dosya EslemeGame.tsx ile aynı klasördeyse ve EslemeGame "client/src/aba/esle/game/..." içindeyse
 *   firebase import yolu genelde: import { storage } from "../../firebase";
 * - Eğer build hata verirse, bu import yolunu senin klasör hiyerarşine göre ayarla.
 */

type Props = {
  storagePath: string; // örn: "deniz.glb"
  onReady?: () => void;
  onCrash?: (e: any) => void;
};

function SceneModel({ url, onReady }: { url: string; onReady?: () => void }) {
  // Drei GLTF loader
  const gltf = useGLTF(url);

  useEffect(() => {
    onReady?.();

    // texture/anisotropy optimize (mobil)
    gltf.scene.traverse((obj: any) => {
      if (obj?.isMesh) {
        obj.frustumCulled = true;
        obj.castShadow = false;
        obj.receiveShadow = false;
        const mat = obj.material as THREE.Material | THREE.Material[];
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach((m: any) => {
          if (m?.map) {
            m.map.anisotropy = 1;
            m.map.needsUpdate = false;
          }
        });
      }
    });
  }, [gltf, onReady]);

  // Sahneye ekle
  return <primitive object={gltf.scene} />;
}

export default function DenizBackground({ storagePath, onReady, onCrash }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1) Storage -> downloadURL
  useEffect(() => {
    let alive = true;
    setFailed(false);
    setUrl(null);

    (async () => {
      try {
        const r = storageRef(storage, storagePath); // "deniz.glb"
        const u = await getDownloadURL(r);
        if (!alive) return;
        // cache bust (bazı webview’lerde iyi gelir)
        setUrl(u + (u.includes("?") ? "&" : "?") + "v=" + Date.now());
      } catch (e) {
        if (!alive) return;
        setFailed(true);
        onCrash?.(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [storagePath, onCrash]);

  // 2) WebGL context lost -> fallback
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const onLost = (ev: any) => {
      try {
        ev.preventDefault?.();
      } catch {}
      setFailed(true);
      onCrash?.({ where: "webglcontextlost", message: "WebGL context lost" });
    };

    c.addEventListener("webglcontextlost", onLost as any);
    return () => c.removeEventListener("webglcontextlost", onLost as any);
  }, [onCrash]);

  if (failed) return null;
  if (!url) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;

          // mobil stabilite
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
          gl.outputColorSpace = THREE.SRGBColorSpace;

          // performans
          gl.shadowMap.enabled = false;
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false,
        }}
        camera={{ position: [0, 1.2, 4], fov: 50, near: 0.01, far: 200 }}
      >
        {/* Işıklar */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />

        {/* Model */}
        <group position={[0, -1.0, 0]} rotation={[0, 0, 0]} scale={[1, 1, 1]}>
          <SceneModel url={url} onReady={onReady} />
        </group>

        {/* İsteğe bağlı environment */}
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

// GLTF preload (url runtime geldiği için burada otomatik preload yok)
// useGLTF.preload("...") ancak sabit url’de yapılır.
