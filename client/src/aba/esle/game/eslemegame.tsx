import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';

function BalikSahnede({ url }: { url: string }) {
  // Bu fonksiyon artık sanal bir 'blob:https://...' linkiyle çalışacak
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={3} rotation={[0, Math.PI / 2, 0]} />;
}

export default function EslemeGame() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // 1. Yerel dosyayı bir 'internet verisi' gibi çekmeye zorla
    fetch('/balik.glb')
      .then(res => res.blob())
      .then(blob => {
        // 2. Veriyi sanal bir URL'e dönüştür (Firebase linki gibi davranır)
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(err => console.error("Balık yüklenirken protokol hatası:", err));

    // Bellek temizliği
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000' }}>
      {blobUrl ? (
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={2} />
          <pointLight position={[10, 10, 10]} />
          <Suspense fallback={null}>
            <BalikSahnede url={blobUrl} />
          </Suspense>
          <OrbitControls />
        </Canvas>
      ) : (
        <div style={{ color: 'white', textAlign: 'center', paddingTop: '50vh' }}>
          PROTOKOL AYARLANIYOR...
        </div>
      )}
    </div>
  );
}
