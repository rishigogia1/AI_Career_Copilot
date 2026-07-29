import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import JobAnalysisPage from "./pages/JobAnalysisPage";
import AISuggestionsPage from "./pages/AISuggestionsPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import SkillGapCloserPage from "./pages/SkillGapCloserPage";
import ATSScorePage from "./pages/ATSScorePage";
import ApplicationsPage from "./pages/ApplicationsPage";
import CareerAnalyticsPage from "./pages/CareerAnalyticsPage";
import ResumeTailorPage from "./pages/ResumeTailorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AuthPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Protected Routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <ResumeUploadPage />
                </ProtectedRoute>
              } />
              <Route path="/analysis" element={
                <ProtectedRoute>
                  <JobAnalysisPage />
                </ProtectedRoute>
              } />
              <Route path="/tailor" element={
                <ProtectedRoute>
                  <ResumeTailorPage />
                </ProtectedRoute>
              } />
              <Route path="/suggestions" element={
                <ProtectedRoute>
                  <AISuggestionsPage />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/gap-closer" element={
                <ProtectedRoute>
                  <SkillGapCloserPage />
                </ProtectedRoute>
              } />
              <Route path="/ats-score" element={
                <ProtectedRoute>
                  <ATSScorePage />
                </ProtectedRoute>
              } />
              <Route path="/applications" element={
                <ProtectedRoute>
                  <ApplicationsPage />
                </ProtectedRoute>
              } />
              <Route path="/career-analytics" element={
                <ProtectedRoute>
                  <CareerAnalyticsPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
