import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { FloatingDiaryButton } from "@/components/FloatingDiaryButton";
import { OfflineBanner } from "@/components/OfflineBanner";
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
import AdminClubs from "./pages/AdminClubs";
import NotFound from "./pages/NotFound";
import Methodology from "./pages/Methodology";
import Unsubscribe from "./pages/Unsubscribe";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SeoLanding from "./pages/SeoLanding";
import PaymentSuccess from "./pages/PaymentSuccess";
import About from "./pages/About";
import Programs from "./pages/Programs";
import Contact from "./pages/Contact";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const pageTransition = prefersReducedMotion
  ? {}
  : {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18, ease: "easeOut" as const },
    };

const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.div {...pageTransition} style={{ minHeight: "100%" }}>
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Index /></Page>} />
        <Route path="/methodology" element={<Page><Methodology /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/programs" element={<Page><Programs /></Page>} />
        <Route path="/contact" element={<Page><Contact /></Page>} />
        <Route path="/features/:section" element={<Page><FeatureDetail /></Page>} />
        <Route path="/auth" element={<Page><Auth /></Page>} />
        <Route path="/reset-password" element={<Page><ResetPassword /></Page>} />
        <Route path="/pending-approval" element={<Page><PendingApproval /></Page>} />
        <Route path="/admin/approval" element={<Page><AdminApproval /></Page>} />
        <Route path="/admin/payments" element={<Page><AdminPayments /></Page>} />
        <Route path="/admin/clubs" element={<Page><AdminClubs /></Page>} />
        <Route path="/coach" element={<Page><CoachDashboard /></Page>} />
        <Route path="/pricing" element={<Page><Pricing /></Page>} />
        <Route path="/help" element={<Page><Help /></Page>} />
        <Route path="/install" element={<Page><Install /></Page>} />
        <Route path="/profile-setup" element={<Page><ProfileSetup /></Page>} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/library" element={<Page><LibraryChooser /></Page>} />
        <Route path="/library/:section" element={<Page><Library /></Page>} />
        <Route path="/diary" element={<Page><Diary /></Page>} />
        <Route path="/payment-success" element={<Page><PaymentSuccess /></Page>} />
        <Route path="/unsubscribe" element={<Page><Unsubscribe /></Page>} />
        <Route path="/privacy" element={<Page><PrivacyPolicy /></Page>} />
        <Route path="/taekwondo-training-program" element={<Page><SeoLanding /></Page>} />
        <Route path="/progress" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OfflineBanner />
          <AnimatedRoutes />
          <FloatingDiaryButton />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
