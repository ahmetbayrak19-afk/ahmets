import { QueryClient } from "@tanstack/react-query";

// Şalteri açıyoruz, artık "null" döndürüp sistemi kilitlemeyecek
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Artık bir şeyi engellemesine gerek yok, Firebase kendi işini yapacak
      queryFn: async () => {
        return []; // null yerine boş liste döndürmek daha güvenlidir
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 dakika
    },
  },
});

// Eski kodlar hata vermesin diye bu fonksiyonu "boş ama zararsız" bıraktık
export async function apiRequest(method: string, url: string, data?: any) {
  console.log("Firebase aktif, API isteği bypass edildi.");
  return { success: true }; 
}
