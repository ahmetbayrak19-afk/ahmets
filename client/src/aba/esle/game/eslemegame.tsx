import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ErrorBoundary, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";

/**
 * Bu komponent console olmadan “ekrana hata basmak” için yapıldı.
 * - window.onerror
 * - unhandledrejection
 * - fetch testleri
 * - GLTF/Draco yükleme süreci
 */

type LogItem = { t: number; msg: string; level: "info" | "warn" | "error" };

function useScreenLogger() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const push = (msg: string, level: LogItem["level"] = "info") => {
    setLogs((prev) => [...prev.slice(-30), { t: Date.now(), msg, level }]);
  };
  const clear = () => setLogs([]);
  return { logs, push, clear };
}

function LogOverlay({
  title,
  logs,
  onClear,
}: {
  title: string;
  logs: LogItem[];
  onClear: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        right: 10,
        maxWidth: 720,
        zIndex: 999999,
        background: "rgba(0,0,0,0.88)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        padding: 12,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#e5e7eb",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 800, color: "#ffcc00" }}>{title}</div>
        <button
          onClick={onClear}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Temizle
        </button>
      </div>

      <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
        {logs.length === 0 ? (
          <div style={{ color: "#9ca3af" }}>Log yok.</div>
        ) : (
          logs.map((l, i) => (
            <div
              key={i}
              style={{
                color:
                  l.level === "error"
                    ? "#ff4d4d"
                    : l.level === "warn"
                      ? "#fbbf24"
                      : "#a7f3d0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {"> "}
              {l.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          color: "white",
          background: "rgba(0,0,0,0.6)",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.2)",
          fontFamily: "monospace",
        }}
      >
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

function Model3D({
  url,
  report,
}: {
  url: string;
  report: (msg: string, level?: "info" | "warn" | "error") => void;
}) {
  /**
   * Draco: public/draco/* dosyalarını kullanıyoruz.
   * Bu path kesin böyle olmalı:
   * - public/draco/draco_decoder.wasm
   * - public/draco/draco_wasm_wrapper.js
   * - public/draco/draco_decoder.js
   */
  useMemo(() => {
    useGLTF.setDecoderPath("/draco/");
  }, []);

  const { scene } = useGLTF(url);

  useEffect(() => {
    report("BAŞARILI: GLB yüklendi ve sahneye eklendi.");
  }, [report]);

  return <primitive object={scene} />;
}

export default function EslemeGame() {
  const { logs, push, clear } = useScreenLogger();
  const [modelUrl, setModelUrl] = useState<string>("");
  const [glReady, setGlReady] = useState<boolean>(false);

  // window error yakalama (console olmadan)
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const where = event.filename ? ` @ ${event.filename}:${event.lineno}:${event.colno}` : "";
      push(`window.onerror: ${event.message}${where}`, "error");
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || JSON.stringify(event.reason);
      push(`unhandledrejection: ${reason}`, "error");
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [push]);

  useEffect(() => {
    // Ortamı ekrana bas
    push(`href: ${window.location.href}`, "info");
    push(`origin: ${window.location.origin}`, "info");

    // GLB url: file:// + http + capacitor hepsinde doğru çözülür
    const url = new URL("models/balik.glb", window.location.href).toString();
    setModelUrl(url);
    push(`GLB URL: ${url}`, "info");

    // fetch testleri (ekrana bas)
    const testFetch = async (path: string, label: string) => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (res.ok) push(`${label} OK (HTTP ${res.status})`, "info");
        else push(`${label} HATA (HTTP ${res.status})`, "error");
      } catch (e: any) {
        push(`${label} FAILED: ${e?.message || String(e)}`, "error");
      }
    };

    // 1) GLB erişim
    testFetch(url, "GLB fetch");

    // 2) Draco erişim
    testFetch("/draco/draco_wasm_wrapper.js", "DRACO wrapper");
    testFetch("/draco/draco_decoder.wasm", "DRACO wasm");
    // draco_decoder.js şart değil ama varsa kontrol iyi
    testFetch("/draco/draco_decoder.js", "DRACO decoder.js");
  }, [push]);

  const report = (msg: string, level: "info" | "warn" | "error" = "info") => push(msg, level);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <LogOverlay title="NATIVE / 3D RAPOR (Console Yok)" logs={logs} onClear={clear} />

      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => {
          // WebGL context var mı?
          try {
            const ctx =
              gl.getContext() ||
              // bazı cihazlarda bu dönmez ama yine de render çalışır
              null;
            setGlReady(true);
            report(`WebGL hazır: ${ctx ? "context OK" : "context bilinmiyor"}`, "info");

            // context kaybı yakalama
            const canvas = gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              report("WEBGL CONTEXT LOST (siyah ekran sebebi olabilir).", "error");
            };
            const onRestored = () => report("WEBGL CONTEXT RESTORED", "warn");
            canvas.addEventListener("webglcontextlost", onLost as any, false);
            canvas.addEventListener("webglcontextrestored", onRestored as any, false);
          } catch (e: any) {
            report(`WebGL init hatası: ${e?.message || String(e)}`, "error");
          }
        }}
      >
        {/* Stage/environment KULLANMIYORUZ (Android’de dış asset/hdri yükleyip siyah ekran yapabiliyor) */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -3, 2]} intensity={0.4} />

        <ErrorBoundary
          fallback={
            <Html center>
              <div
                style={{
                  color: "#ff4d4d",
                  background: "rgba(0,0,0,0.75)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                }}
              >
                HATA: 3D sahne yüklenemedi (ErrorBoundary)
              </div>
            </Html>
          }
        >
          <Suspense fallback={<Loader3D />}>
            {modelUrl ? (
              <Model3D url={modelUrl} report={report} />
            ) : (
              <Html center>
                <div style={{ color: "white", fontFamily: "monospace" }}>Model URL bekleniyor...</div>
              </Html>
            )}
          </Suspense>
        </ErrorBoundary>

        <OrbitControls enablePan enableRotate enableZoom />
      </Canvas>

      {/* WebGL hiç oluşmadıysa bunu da kullanıcı görsün */}
      {!glReady && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            left: 12,
            right: 12,
            zIndex: 999999,
            color: "#fbbf24",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            padding: 10,
          }}
        >
          UYARI: WebGL henüz hazır değil. Cihaz WebGL’i engelliyor olabilir.
        </div>
      )}
    </div>
  );
}

// İsteğe bağlı: ön yükleme (ilk açılış hızlanır)
useGLTF.preload("/models/balik.glb");
