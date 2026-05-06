import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { FloatingDiaryButton } from "@/components/FloatingDiaryButton";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import CoachLanding from "./pages/CoachLanding";
import FeatureDetail from "./pages/FeatureDetail";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import LibraryChooser from "./pages/LibraryChooser";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import AdminApproval from "./pages/AdminApproval";
import CoachDashboard from "./pages/CoachDashboard";
import CoachAthleteOverview from "./pages/CoachAthleteOverview";
import Pricing from "./pages/Pricing";
import SubscriptionSettings from "./pages/SubscriptionSettings";
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
import Health from "./pages/Health";
import Competitions from "./pages/Competitions";
import CompetitionReflection from "./pages/CompetitionReflection";
import PublicAthlete from "./pages/PublicAthlete";
import MatchAnalysis from "./pages/MatchAnalysis";
import MatchShare from "./pages/MatchShare";
import SeasonPlan from "./pages/SeasonPlan";
import JoinInvite from "./pages/JoinInvite";
import { UpgradeGate } from "@/components/UpgradeGate";

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
        <Route path="/" element={<Page><Landing /></Page>} />
        <Route path="/v1" element={<Page><Index /></Page>} />
        <Route path="/signup" element={<Navigate to="/auth?tab=signup" replace />} />
        <Route path="/login" element={<Navigate to="/auth?tab=signin" replace />} />
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
        <Route path="/coach/athlete/:athleteId" element={<Page><CoachAthleteOverview /></Page>} />
        <Route path="/pricing" element={<Page><Pricing /></Page>} />
        <Route path="/settings/subscription" element={<Page><SubscriptionSettings /></Page>} />
        <Route path="/help" element={<Page><Help /></Page>} />
        <Route path="/install" element={<Page><Install /></Page>} />
        <Route path="/profile-setup" element={<Page><ProfileSetup /></Page>} />
        <Route path="/onboarding" element={<Page><Onboarding /></Page>} />
        <Route path="/health" element={<Page><Health /></Page>} />
        <Route path="/wearables" element={<Navigate to="/health" replace />} />
        <Route path="/wearables/sync" element={<Navigate to="/health" replace />} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/library" element={<Page><UpgradeGate module="library"><LibraryChooser /></UpgradeGate></Page>} />
        <Route path="/library/:section" element={<Page><UpgradeGate module="library"><Library /></UpgradeGate></Page>} />
        <Route path="/diary" element={<Page><Diary /></Page>} />
        <Route path="/competitions" element={<Page><UpgradeGate module="competitions"><Competitions /></UpgradeGate></Page>} />
        <Route path="/competitions/:id/reflect" element={<Page><UpgradeGate module="competitions"><CompetitionReflection /></UpgradeGate></Page>} />
        <Route path="/season" element={<Page><UpgradeGate module="season_plan"><SeasonPlan /></UpgradeGate></Page>} />
        <Route path="/match-analysis/me" element={<Page><UpgradeGate module="match_analysis"><MatchAnalysis /></UpgradeGate></Page>} />
        <Route path="/match-analysis/:athleteId" element={<Page><UpgradeGate module="match_analysis"><MatchAnalysis /></UpgradeGate></Page>} />
        <Route path="/match/share/:token" element={<Page><MatchShare /></Page>} />
        <Route path="/athlete/:code" element={<Page><PublicAthlete /></Page>} />
        <Route path="/join/:code" element={<Page><JoinInvite /></Page>} />
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

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
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
};

export default App;
