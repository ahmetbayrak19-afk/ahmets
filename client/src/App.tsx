import { Switch, Route, Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useHashLocation } from "./hooks/use-hash-location";

import Home from "@/pages/Home";
import StudentDashboard from "@/pages/StudentDashboard";
import TeacherLogin from "@/pages/TeacherLogin";
import AdminPanel from "@/pages/AdminPanel";
import WelcomeScreen from "@/pages/WelcomeScreen";

// Parçaladığımız yeni sayfalar
import AssessmentPage from "@/pages/assessmentPage";
import AbaAssessmentPage from "@/pages/abaAssessmentPage";
import KavramAssessmentPage from "@/pages/kavramAssessmentPage"; 
import OkumayazmaAssessmentPage from "@/pages/okumayazmaAssessmentPage";

// --- OKUMA YAZMA ALT SAYFALARI ---
import HeceOkuyazDegerlendir from "@/pages/okuyaz/heceokuyazdegerlendir";
import Seviye1 from "@/pages/okuyaz/seviye1";
import Seviye2 from "@/pages/okuyaz/seviye2";
import Seviye3 from "@/pages/okuyaz/seviye3";
// YENİ EKLENEN: A SESİ ETKİNLİK SAYFASI
import SesliHarfEtkinlikleri from "@/pages/okuyaz/sesli";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router hook={useHashLocation}>
        <Switch>
          <Route path="/" component={WelcomeScreen} />
          <Route path="/login" component={TeacherLogin} />
          <Route path="/home" component={Home} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/student/:id" component={StudentDashboard} />

          {/* 1. Sistem Seçim Menüsü */}
          <Route path="/assessment/:id" component={AssessmentPage} />

          {/* 2. ABA Değerlendirme Sayfası */}
          <Route path="/aba-assessment/:id" component={AbaAssessmentPage} />

          {/* 3. Kavram Değerlendirme Sayfası */}
          <Route path="/kavram-assessment/:id" component={KavramAssessmentPage} />

          {/* 4. Okuma Yazma ANA GİRİŞ Sayfası */}
          <Route path="/okuma-yazma-assessment/:id" component={OkumayazmaAssessmentPage} />

          {/* --- OKUMA YAZMA ALT SAYFALARI --- */}
          <Route path="/okuyaz/degerlendirme/:id" component={HeceOkuyazDegerlendir} />
          <Route path="/okuyaz/seviye1/:id" component={Seviye1} />
          <Route path="/okuyaz/seviye2/:id" component={Seviye2} />
          <Route path="/okuyaz/seviye3/:id" component={Seviye3} />
          
          {/* A Sesi Etkinlikleri */}
          <Route path="/okuyaz/sesli/:id" component={SesliHarfEtkinlikleri} />

          {/* Yanlış URL girilirse ana ekrana at */}
          <Route component={WelcomeScreen} />
        </Switch>
      </Router>
    </QueryClientProvider>
  );
      }
