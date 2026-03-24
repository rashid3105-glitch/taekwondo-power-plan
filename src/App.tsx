import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { FloatingDiaryButton } from "@/components/FloatingDiaryButton";
import Index from "./pages/Index";
import FeatureDetail from "./pages/FeatureDetail";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import LibraryChooser from "./pages/LibraryChooser";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import AdminApproval from "./pages/AdminApproval";
import CoachDashboard from "./pages/CoachDashboard";
import Pricing from "./pages/Pricing";
import Help from "./pages/Help";
import Diary from "./pages/Diary";
import AdminPayments from "./pages/AdminPayments";
import NotFound from "./pages/NotFound";
import Methodology from "./pages/Methodology";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="/features/:section" element={<FeatureDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/admin/approval" element={<AdminApproval />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/help" element={<Help />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/library" element={<LibraryChooser />} />
            <Route path="/library/:section" element={<Library />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/progress" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingDiaryButton />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
