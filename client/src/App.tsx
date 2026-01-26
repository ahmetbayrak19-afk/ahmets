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
// YENİ EKLENEN IMPORT:
import OkumayazmaAssessmentPage from "@/pages/okumayazmaAssessmentPage";

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

          {/* 4. Okuma Yazma Değerlendirme Sayfası (YENİ EKLENDİ) */}
          <Route path="/okuma-yazma-assessment/:id" component={OkumayazmaAssessmentPage} />

          {/* Yanlış URL girilirse ana ekrana at */}
          <Route component={WelcomeScreen} />
        </Switch>
      </Router>
    </QueryClientProvider>
  );
      }
            
