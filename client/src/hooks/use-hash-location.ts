import { useState, useEffect, useCallback } from "react";

// Bu fonksiyon APK'nın içinde sayfalar arası geçişi sağlar
export const useHashLocation = () => {
  const hashLocation = () => window.location.hash.replace(/^#/, "") || "/";
  const [loc, setLoc] = useState(hashLocation);

  useEffect(() => {
    const handler = () => setLoc(hashLocation());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
  }, []);

  return [loc, navigate] as [string, (to: string) => void];
};
