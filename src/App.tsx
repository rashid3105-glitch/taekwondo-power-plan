import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CoachModeProvider } from "@/contexts/CoachModeContext";
import { ActiveClubProvider } from "@/contexts/ActiveClubContext";
import { ClubSwitchOverlay } from "@/components/ClubSwitchOverlay";
import { RoleProvider } from "@/contexts/RoleContext";
import { ThemeSync } from "@/contexts/ThemeSync";
import { ConsentGate } from "@/components/ConsentGate";
import { GlobalAppMenu } from "@/components/GlobalAppMenu";
import { BodyPointerEventsGuard } from "@/components/BodyPointerEventsGuard";

import { OfflineBanner } from "@/components/OfflineBanner";
import { AppUpdateBanner } from "@/components/AppUpdateBanner";
import { SplashScreen } from "@/components/SplashScreen";
import { isNativeApp } from "@/lib/platform";
import Index from "./pages/Index";
import CoachLanding from "./pages/CoachLanding";
import { PublicSeo } from "@/components/seo/SeoHead";
import FeatureDetail from "./pages/FeatureDetail";
import PlatformPage from "./pages/PlatformPage";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";

import AthleteModules from "./pages/AthleteModules";
import CoachModules from "./pages/CoachModules";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import LibraryChooser from "./pages/LibraryChooser";
import CoachSurveysHub from "./pages/CoachSurveysHub";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import AdminApproval from "./pages/AdminApproval";
import AdminModuleAccess from "./pages/AdminModuleAccess";
import CoachDashboard from "./pages/CoachDashboard";
import CoachConsents from "./pages/CoachConsents";
import CoachToday from "./pages/CoachToday";
import CoachMessages from "./pages/CoachMessages";
import CoachMentalReview from "./pages/CoachMentalReview";
import CoachAthleteOverview from "./pages/CoachAthleteOverview";
import CoachCompetitions from "./pages/CoachCompetitions";
import SeasonCalendar from "./pages/SeasonCalendar";
import Pricing from "./pages/Pricing";
import SubscriptionSettings from "./pages/SubscriptionSettings";
import Help from "./pages/Help";
import Diary from "./pages/Diary";
import AdminPayments from "./pages/AdminPayments";
import AdminClubs from "./pages/AdminClubs";
import NotFound from "./pages/NotFound";
import MockupSeasonOnboarding from "./pages/MockupSeasonOnboarding";
import MockupAthleteGoals from "./pages/MockupAthleteGoals";
import Methodology from "./pages/Methodology";
import Unsubscribe from "./pages/Unsubscribe";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SeoLanding from "./pages/SeoLanding";
import PaymentSuccess from "./pages/PaymentSuccess";
import About from "./pages/About";
import Programs from "./pages/Programs";
import PlatformMarketing from "./pages/PlatformMarketing";
import Funktioner from "./pages/Funktioner";
import Priser from "./pages/Priser";
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCommentConfirm from "./pages/BlogCommentConfirm";
import AdminBlogComments from "./pages/AdminBlogComments";
import AdminBlog from "./pages/AdminBlog";
import AdminBlogEditor from "./pages/AdminBlogEditor";
import AdminDrills from "./pages/AdminDrills";
import Contact from "./pages/Contact";
import Kostplan from "./pages/Kostplan";
import Health from "./pages/Health";

import Competitions from "./pages/Competitions";
import CompetitionReflection from "./pages/CompetitionReflection";
import PublicAthlete from "./pages/PublicAthlete";
import MatchAnalysis from "./pages/MatchAnalysis";
import MatchShare from "./pages/MatchShare";
import SeasonPlan from "./pages/SeasonPlan";
import JoinInvite from "./pages/JoinInvite";
import SignupCoach from "./pages/SignupCoach";
import InviteSignup from "./pages/InviteSignup";
import Messages from "./pages/Messages";
import ParentJoin from "./pages/ParentJoin";
import ParentDashboard from "./pages/ParentDashboard";
import Consent from "./pages/Consent";

import { UpgradeGate } from "@/components/UpgradeGate";
import CoachSurveys from "./pages/CoachSurveys";
import AthleteSurveys from "./pages/AthleteSurveys";
import CoachTestSessions from "./pages/CoachTestSessions";
import CoachTestSession from "./pages/CoachTestSession";


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
  <motion.div {...pageTransition} style={{ minHeight: "100dvh" }}>
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Expose router-aware navigation to the native push handler so notification
  // taps stay in-app instead of triggering a full page reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { setPushNavigator, registerPushToken } = await import("@/lib/nativePush");
        if (cancelled) return;
        setPushNavigator((path) => navigate(path));

        // If the user is already signed in on native (persistent session),
        // register the FCM token now — permission prompt is post-login only.
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
        await registerPushToken(session.user.id); 
    }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      import("@/lib/nativePush").then(({ setPushNavigator }) => setPushNavigator(null)).catch(() => {});
    };
  }, [navigate]);

  useEffect(() => {
    // On a native cold start after iOS killed the WebView (e.g. after the camera
    // UI was dismissed), Capacitor reloads the app at "/". If the food scanner
    // saved a resume route before opening the camera, restore it here.
    if (location.pathname !== "/") return;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { Preferences } = await import("@capacitor/preferences");
        const { value } = await Preferences.get({ key: "scanner:resume_route" });
        if (value) {
          await Preferences.remove({ key: "scanner:resume_route" });
          if (value.startsWith("/dashboard") || value.startsWith("/nutrition")) {
            navigate(value, { replace: true });
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <>
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Index /></Page>} />
        <Route path="/v3" element={<Page><CoachLanding /></Page>} />
        <Route path="/v2" element={<Page><Landing /></Page>} />
        <Route path="/signup/coach" element={<Page><SignupCoach /></Page>} />
        <Route path="/invite/:code" element={<Page><InviteSignup /></Page>} />
        <Route path="/signup" element={<Navigate to="/auth?tab=signup" replace />} />
        <Route path="/login" element={<Navigate to="/auth?tab=signin" replace />} />
        <Route path="/methodology" element={<Page><Methodology /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/programs" element={<Page><Programs /></Page>} />
        <Route path="/platform" element={<Page><PlatformMarketing /></Page>} />
        <Route path="/funktioner" element={<Page><Funktioner /></Page>} />
        <Route path="/priser" element={isNativeApp() ? <Navigate to="/dashboard" replace /> : <Page><Priser /></Page>} />
        <Route path="/terms" element={<Page><Terms /></Page>} />
        <Route path="/blog" element={<Page><Blog /></Page>} />
        <Route path="/blog/:slug" element={<Page><BlogPost /></Page>} />
        <Route path="/blog-comment/confirm" element={<Page><BlogCommentConfirm /></Page>} />
        <Route path="/admin/blog" element={<Page><AdminBlog /></Page>} />
        <Route path="/admin/blog/comments" element={<Page><AdminBlogComments /></Page>} />
        <Route path="/admin/blog/new" element={<Page><AdminBlogEditor /></Page>} />
        <Route path="/admin/blog/:id/edit" element={<Page><AdminBlogEditor /></Page>} />
        <Route path="/contact" element={<Page><Contact /></Page>} />
        <Route path="/features/:section" element={<Page><FeatureDetail /></Page>} />
        <Route path="/platform/:slug" element={<Page><PlatformPage /></Page>} />
        <Route path="/auth" element={<Page><Auth /></Page>} />
        <Route path="/reset-password" element={<Page><ResetPassword /></Page>} />
        <Route path="/pending-approval" element={<Page><PendingApproval /></Page>} />
        <Route path="/admin/approval" element={<Page><AdminApproval /></Page>} />
        <Route path="/admin/modules" element={<Page><AdminModuleAccess /></Page>} />
        <Route path="/admin/payments" element={<Page><AdminPayments /></Page>} />
        <Route path="/admin/clubs" element={<Page><AdminClubs /></Page>} />
        <Route path="/admin/drills" element={<Page><AdminDrills /></Page>} />
        <Route path="/coach" element={<Page><CoachDashboard /></Page>} />
        <Route path="/coach/consents" element={<Page><CoachConsents /></Page>} />
        <Route path="/coach/today" element={<Page><CoachToday /></Page>} />
        <Route path="/coach/messages" element={<Page><CoachMessages /></Page>} />
        <Route path="/coach/mental" element={<Page><CoachMentalReview /></Page>} />
        <Route path="/coach/athlete/:athleteId" element={<Page><CoachAthleteOverview /></Page>} />
        <Route path="/coach/competitions" element={<Page><CoachCompetitions /></Page>} />
        <Route path="/coach/season-calendar" element={<Page><SeasonCalendar /></Page>} />
        <Route path="/coach/testing/sessions" element={<Page><CoachTestSessions /></Page>} />
        <Route path="/coach/testing/sessions/:sessionId" element={<Page><CoachTestSession /></Page>} />
        <Route path="/coach/surveys" element={<Page><CoachSurveys /></Page>} />
        <Route path="/surveys" element={<Page><AthleteSurveys /></Page>} />
        <Route path="/pricing" element={<Navigate to={isNativeApp() ? "/dashboard" : "/#pricing"} replace />} />
        {/* Pricing page hidden — uncomment to restore */}
        {/* <Route path="/pricing" element={<Page><Pricing /></Page>} /> */}
        <Route path="/settings/subscription" element={<Page><SubscriptionSettings /></Page>} />
        <Route path="/help" element={<Page><Help /></Page>} />
        <Route path="/kostplan" element={<Page><Kostplan /></Page>} />
        <Route path="/install" element={<Navigate to="/kostplan" replace />} />
        <Route path="/profile-setup" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<Page><Profile /></Page>} />
        <Route path="/profile-edit" element={<Page><ProfileEdit /></Page>} />
        <Route path="/change-password" element={<Page><ChangePassword /></Page>} />
        <Route path="/delete-account" element={<Page><DeleteAccount /></Page>} />

        <Route path="/moduler" element={<Page><AthleteModules /></Page>} />
        <Route path="/hold/moduler" element={<Page><CoachModules /></Page>} />
        <Route path="/onboarding" element={<Page><Onboarding /></Page>} />
        <Route path="/health" element={<Page><Health /></Page>} />
        <Route path="/health/sync-setup" element={<Navigate to="/health" replace />} />
        <Route path="/health/sync-setup-android" element={<Navigate to="/health" replace />} />
        <Route path="/wearables" element={<Navigate to="/health" replace />} />
        <Route path="/wearables/sync" element={<Navigate to="/health" replace />} />
        <Route path="/dashboard" element={<Page><Dashboard /></Page>} />
        <Route path="/library" element={<Page><UpgradeGate module="library"><LibraryChooser /></UpgradeGate></Page>} />
        {/* Antidoping/supplement check is free for all tiers — defined BEFORE the gated :section route so it wins */}
        <Route path="/library/supplement" element={<Page><Library forcedSection="supplement" /></Page>} />
        {/* Coach surveys hub — must come BEFORE the dynamic :section route */}
        <Route path="/library/surveys" element={<Page><CoachSurveysHub /></Page>} />
        <Route path="/library/:section" element={<Page><UpgradeGate module="library"><Library /></UpgradeGate></Page>} />
        <Route path="/diary" element={<Page><Diary /></Page>} />
        <Route path="/messages" element={<Page><Messages /></Page>} />
        <Route path="/competitions" element={<Page><UpgradeGate module="competitions"><Competitions /></UpgradeGate></Page>} />
        <Route path="/competitions/:id/reflect" element={<Page><UpgradeGate module="competitions"><CompetitionReflection /></UpgradeGate></Page>} />
        <Route path="/season" element={<Page><UpgradeGate module="season_plan"><SeasonPlan /></UpgradeGate></Page>} />
        <Route path="/match-analysis/me" element={<Page><UpgradeGate module="match_analysis"><MatchAnalysis /></UpgradeGate></Page>} />
        <Route path="/match-analysis/:athleteId" element={<Page><UpgradeGate module="match_analysis"><MatchAnalysis /></UpgradeGate></Page>} />
        <Route path="/match/share/:token" element={<Page><MatchShare /></Page>} />
        <Route path="/athlete/:code" element={<Page><PublicAthlete /></Page>} />
        <Route path="/join/:code" element={<Page><JoinInvite /></Page>} />
        <Route path="/parent-join/:code" element={<Page><ParentJoin /></Page>} />
        <Route path="/parent-dashboard" element={<Page><ParentDashboard /></Page>} />
        <Route path="/consent/:token" element={<Page><Consent /></Page>} />
        <Route path="/payment-success" element={<Page><PaymentSuccess /></Page>} />

        <Route path="/unsubscribe" element={<Page><Unsubscribe /></Page>} />
        <Route path="/privacy" element={<Page><PrivacyPolicy /></Page>} />
        <Route path="/taekwondo-training-program" element={<Page><SeoLanding /></Page>} />
        <Route path="/progress" element={<Navigate to="/dashboard" replace />} />
        <Route path="/mockup/season-onboarding" element={<Page><MockupSeasonOnboarding /></Page>} />
        <Route path="/mockup/athlete-goals" element={<Page><MockupAthleteGoals /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AppUpdateBanner />
      <LanguageProvider>
        <TooltipProvider>
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <BodyPointerEventsGuard />
            <ActiveClubProvider>
              <RoleProvider>
                <CoachModeProvider>
                  <ThemeSync />
                  <OfflineBanner />
                  <ConsentGate>
                    <AnimatedRoutes />
                  </ConsentGate>
                  <GlobalAppMenu />
                  <ClubSwitchOverlay />
                </CoachModeProvider>
              </RoleProvider>
            </ActiveClubProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;

