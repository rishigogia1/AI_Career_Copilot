import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, LogOut, Sun, Moon, RotateCcw, Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "../context/AuthContext";
import { startNewSession, factoryReset, DEFAULT_APP_STATE } from "@/lib/appState";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/api";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { appState, updateAppState } = useAppState();
  const { logout } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);

  // 🔹 Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Listen to global reset modal event
  useEffect(() => {
    const handleOpen = () => setShowResetModal(true);
    window.addEventListener("open_reset_modal", handleOpen);
    return () => window.removeEventListener("open_reset_modal", handleOpen);
  }, []);

  // 🔹 Logout handler
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartNewSession = () => {
    updateAppState((prev) => {
      const next = startNewSession(prev);
      // Sync to server
      API.put("/workspace", next).catch(() => {});
      return next;
    }, true);
    setShowResetModal(false);
    navigate("/upload");
  };

  const handleFactoryReset = async () => {
    const defaultState = factoryReset();
    updateAppState(defaultState, true);
    setShowResetModal(false);
    // Wipe server workspace
    try { await API.delete("/workspace"); } catch (_) {}
    navigate("/upload");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-3">

              {/* 🔄 Clear Current Session Button */}
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
                title="Reset or Start Fresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Current Session</span>
              </button>

              {/* 🌓 Dark/Light Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Bell */}
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              </button>

              {/* Profile Avatar — clickable */}
              <button
                onClick={() => navigate("/profile")}
                className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-semibold hover:opacity-80 transition-opacity"
                title={user?.name || "Profile"}
              >
                {user?.avatar ? (
                  <img src={`http://localhost:5001${user.avatar}`} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : userInitial}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>

        {/* Start Fresh / Two-Tier Confirmation Dialog */}
        <AnimatePresence>
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="glass-card max-w-lg w-full overflow-hidden border border-border/40 shadow-2xl rounded-2xl bg-slate-900/90 text-white"
              >
                <div className="flex justify-between items-center px-6 py-4 border-b border-border/20">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" /> Start Fresh?
                  </h3>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Choose how you want to clear your session state. Select one of the two options below:
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    
                    {/* Option 1: Start New Session */}
                    <button
                      onClick={handleStartNewSession}
                      className="text-left p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all space-y-1 hover:border-primary/40 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary group-hover:underline">Start New Session</span>
                        <RotateCcw className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs text-slate-400">
                        Clears only current working data (inputs, latest report, uploaded resume). Retains your analyses history, learning roadmaps, progress, and learned skills.
                      </p>
                    </button>

                    {/* Option 2: Factory Reset */}
                    <button
                      onClick={handleFactoryReset}
                      className="text-left p-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-all space-y-1 hover:border-destructive/40 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-destructive group-hover:underline">Delete All Data (Factory Reset)</span>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </div>
                      <p className="text-xs text-slate-400">
                        Permanently wipes out all history, analytics, progress, completed roadmaps, and skills. Your theme preferences and login settings remain unaffected.
                      </p>
                    </button>

                  </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 bg-slate-900/50 border-t border-border/20">
                  <Button
                    onClick={() => setShowResetModal(false)}
                    variant="ghost"
                    className="text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}
