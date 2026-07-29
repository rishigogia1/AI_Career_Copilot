import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X, 
  AlertCircle, 
  Info,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "@/api/api";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const steps = ["Uploading file...", "Extracting text...", "Analyzing skills...", "Building profile..."];

const ResumeUploadPage = () => {
  const { appState, updateAppState } = useAppState();
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const [file, setFile] = useState<{ name: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  // Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<{
    fullName?: string;
    email?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  } | null>(null);

  const navigate = useNavigate();

  // Restore state on mount
  useEffect(() => {
    const isUploaded = appState.resume?.original?.uploaded || appState.resume?.uploaded;
    const fileName = appState.resume?.original?.fileName || appState.resume?.fileName;

    if (isUploaded) {
      setFile({ name: fileName });
      setStatus("success");
      setShowRestoreBanner(true);
    } else {
      setFile(null);
      setStatus("idle");
      setShowRestoreBanner(false);
    }
  }, [appState.resume]);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setStatus("uploading");
    setProgress(10);
    setStepIndex(0);

    try {
      const formData = new FormData();
      formData.append("resume", f);

      setProgress(30);
      setStepIndex(1);

      const res = await API.post("/resume/upload", formData);

      setProgress(80);
      setStepIndex(2);

      console.log("[BACKEND RESUME PARSE RESPONSE]", res.data);

      const returnedWorkspace = res.data?.workspace;
      // In the new schema, profile is at resume.original.structuredData.extractedProfile
      // Legacy fallback just in case
      const extracted = returnedWorkspace?.resume?.original?.structuredData?.extractedProfile || res.data?.extractedProfile;

      setProgress(100);
      setStepIndex(3);

      // Safe replacement: The backend is now the source of truth for the workspace.
      if (returnedWorkspace) {
        updateAppState(returnedWorkspace, true);
      }

      setTimeout(() => {
        setStatus("success");
        setShowRestoreBanner(false); // New uploads don't need restore banner
        
        // Show sync modal if profile information was found
        if (extracted && (extracted.fullName || extracted.linkedin || extracted.github || extracted.portfolio)) {
          setExtractedProfile(extracted);
          setShowSyncModal(true);
        }
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Please try again.");
      setStatus("idle");
    }
  }, [updateAppState]);

  const handleSyncProfile = async () => {
    if (!extractedProfile) return;
    try {
      // Get current profile
      const currentRes = await API.get("/profile");
      const current = currentRes.data;

      // Update with new values where they exist
      const updated = {
        ...current,
        fullName: extractedProfile.fullName || current.fullName,
        linkedin: extractedProfile.linkedin || current.linkedin,
        github: extractedProfile.github || current.github,
        portfolio: extractedProfile.portfolio || current.portfolio
      };

      await API.put("/profile", updated);
      localStorage.setItem(`profileCache_${userId}`, JSON.stringify(updated));

      // Sync name in user object
      const userCached = JSON.parse(localStorage.getItem("user") || "{}");
      if (updated.fullName) {
        userCached.name = updated.fullName;
        localStorage.setItem("user", JSON.stringify(userCached));
      }

      toast.success("Profile sync completed successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Could not sync profile information.");
    } finally {
      setShowSyncModal(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setStepIndex(0);
    setShowRestoreBanner(false);
    updateAppState({
      resume: {
        original: null,
        optimized: null,
        activeVersion: "original"
      }
    }, true);
  };

  const isUploaded = appState.resume?.original?.uploaded || appState.resume?.uploaded;
  const uploadedAt = appState.resume?.original?.uploadedAt || appState.resume?.uploadedAt;

  const formattedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleString()
    : "";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {showRestoreBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 text-sm rounded-xl bg-primary/10 border border-primary/20 text-primary"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Previous session restored</span>
            </div>
            <button
              onClick={() => setShowRestoreBanner(false)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Upload Resume</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Upload your resume to get started with AI analysis
            </p>
          </div>
          {isUploaded && (
            <Button
              onClick={reset}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white self-start sm:self-center"
            >
              Clear Page Only
            </Button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">

                {/* IDLE */}
                {status === "idle" && (
                  <motion.label
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all ${
                      dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                      <FileUp className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Drop your resume here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                    <div className="flex gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">PDF</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">DOCX</span>
                    </div>
                    <input type="file" accept=".pdf,.docx" onChange={handleSelect} className="hidden" />
                  </motion.label>
                )}

                {/* UPLOADING */}
                {status === "uploading" && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-12"
                  >
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="font-medium text-foreground">{steps[stepIndex]}</p>
                    <p className="text-sm text-muted-foreground mt-1">{file?.name}</p>

                    <div className="w-full max-w-xs mt-6">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {progress}% complete
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SUCCESS */}
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>

                    <p className="font-medium text-foreground mb-1">
                      Resume uploaded successfully!
                    </p>

                    <div className="flex flex-col items-center gap-2 mt-2 px-6 py-4 bg-muted rounded-xl border border-border/30 w-full max-w-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">{file?.name}</span>
                        <button onClick={reset} className="ml-2 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      {formattedDate && (
                        <p className="text-xs text-muted-foreground">Uploaded on: {formattedDate}</p>
                      )}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={() => setShowPreviewDialog(true)}
                        variant="outline"
                        className="border-neutral-800 text-white hover:bg-neutral-950 font-semibold cursor-pointer h-10 px-4 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" /> Preview Resume
                      </Button>
                      <Button
                        onClick={() => navigate("/analysis")}
                        className="gradient-primary text-primary-foreground font-semibold cursor-pointer h-10 px-4 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        Continue to ATS Analysis <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Profile Sync Modal ─── */}
        <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
          <DialogContent className="bg-slate-900 text-white border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> Profile Sync Detected
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                We found profile information in your resume. Update your profile?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4 text-sm text-slate-300">
              {extractedProfile?.fullName && (
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="font-medium">{extractedProfile.fullName}</span>
                </div>
              )}
              {extractedProfile?.linkedin && (
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg">
                  <span className="text-xs text-muted-foreground">LinkedIn</span>
                  <span className="font-medium truncate max-w-[250px]">{extractedProfile.linkedin}</span>
                </div>
              )}
              {extractedProfile?.github && (
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg">
                  <span className="text-xs text-muted-foreground">GitHub</span>
                  <span className="font-medium truncate max-w-[250px]">{extractedProfile.github}</span>
                </div>
              )}
              {extractedProfile?.portfolio && (
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg">
                  <span className="text-xs text-muted-foreground">Portfolio</span>
                  <span className="font-medium truncate max-w-[250px]">{extractedProfile.portfolio}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setShowSyncModal(false)}>
                Skip
              </Button>
              <Button onClick={handleSyncProfile} className="gradient-primary text-primary-foreground font-semibold">
                Update Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Preview Resume Modal ─── */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-slate-900 text-white border-border max-w-2xl h-[550px] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Resume Text Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-slate-950/80 border border-neutral-800 rounded-xl p-4 overflow-y-auto font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
              {appState.resume.resumeText || "No text extracted yet."}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowPreviewDialog(false)} className="bg-neutral-800 hover:bg-neutral-750 text-white font-semibold cursor-pointer">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ResumeUploadPage;