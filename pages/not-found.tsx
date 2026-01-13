import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white">404</h1>
            <h2 className="text-xl font-semibold text-slate-200">Sayfa Bulunamadı</h2>
            <p className="text-slate-400 text-sm">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
            
            <Button 
              onClick={() => setLocation("/")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
