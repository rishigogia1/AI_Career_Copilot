import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  TrendingUp,
  Tag,
  BookOpen,
  ArrowRightLeft,
  X,
  FileText,
  ClipboardList
} from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useAuth } from "../context/AuthContext";
import { Application } from "@/lib/appState";
import { toast } from "sonner";

const STATUS_COLUMNS = ["Saved", "Applied", "Interview", "Offer", "Rejected"] as const;
type StatusType = typeof STATUS_COLUMNS[number];

export default function ApplicationsPage() {
  const { appState, updateAppState } = useAppState();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  // Form states
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formStatus, setFormStatus] = useState<StatusType>("Applied");
  const [formPriority, setFormPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [formDate, setFormDate] = useState("");
  const [formInterviewDate, setFormInterviewDate] = useState("");
  const [formInterviewTime, setFormInterviewTime] = useState("");
  const [formInterviewRound, setFormInterviewRound] = useState("");
  const [formInterviewLocation, setFormInterviewLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formJD, setFormJD] = useState("");
  const [formResumeVersion, setFormResumeVersion] = useState("");
  const [formScore, setFormScore] = useState<string>("");

  const resetForm = () => {
    setFormCompany("");
    setFormRole("");
    setFormStatus("Applied");
    setFormPriority("Medium");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormInterviewDate("");
    setFormInterviewTime("");
    setFormInterviewRound("");
    setFormInterviewLocation("");
    setFormNotes("");
    setFormJD("");
    setFormResumeVersion("");
    setFormScore("");
  };

  const handleOpenAddModal = () => {
    resetForm();
    try {
      const cachedProfile = localStorage.getItem(`profileCache_${user?.id || "guest"}`);
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.targetRole) {
          setFormRole(parsed.targetRole);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsAddOpen(true);
  };

  const handleAddApplication = () => {
    if (!formCompany.trim() || !formRole.trim()) {
      toast.error("Company and Role are required");
      return;
    }

    const newApp: Application = {
      id: Math.random().toString(36).substring(2, 9),
      company: formCompany.trim(),
      role: formRole.trim(),
      status: formStatus,
      priority: formPriority,
      applicationDate: formDate || undefined,
      interviewDate: formInterviewDate || undefined,
      interviewTime: formInterviewTime || undefined,
      interviewRound: formInterviewRound || undefined,
      interviewLocation: formInterviewLocation || undefined,
      notes: formNotes.trim() || undefined,
      jobDescription: formJD.trim() || undefined,
      resumeVersion: formResumeVersion.trim() || undefined,
      atsScore: formScore ? parseInt(formScore) : undefined,
      source: "Manual",
      lastStatusChange: new Date().toISOString(),
      history: [
        {
          from: "None",
          to: formStatus,
          date: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateAppState((prev) => ({
      ...prev,
      applications: [...(prev.applications || []), newApp],
    }), true);

    setIsAddOpen(false);
    toast.success("Application added successfully!");
  };

  const handleOpenEditModal = (app: Application) => {
    setEditingApp(app);
    setFormCompany(app.company);
    setFormRole(app.role);
    setFormStatus(app.status);
    setFormPriority(app.priority || "Medium");
    setFormDate(app.applicationDate || "");
    setFormInterviewDate(app.interviewDate || "");
    setFormInterviewTime(app.interviewTime || "");
    setFormInterviewRound(app.interviewRound || "");
    setFormInterviewLocation(app.interviewLocation || "");
    setFormNotes(app.notes || "");
    setFormJD(app.jobDescription || "");
    setFormResumeVersion(app.resumeVersion || "");
    setFormScore(app.atsScore?.toString() || "");
    setIsEditOpen(true);
  };

  const handleEditApplication = () => {
    if (!editingApp) return;
    if (!formCompany.trim() || !formRole.trim()) {
      toast.error("Company and Role are required");
      return;
    }

    const updatedApps = (appState.applications || []).map((app) => {
      if (app.id === editingApp.id) {
        const isStatusChanged = app.status !== formStatus;
        const newHistory = [...(app.history || [])];
        if (isStatusChanged) {
          newHistory.push({
            from: app.status,
            to: formStatus,
            date: new Date().toISOString(),
          });
        }

        return {
          ...app,
          company: formCompany.trim(),
          role: formRole.trim(),
          status: formStatus,
          priority: formPriority,
          applicationDate: formDate || undefined,
          interviewDate: formInterviewDate || undefined,
          interviewTime: formInterviewTime || undefined,
          interviewRound: formInterviewRound || undefined,
          interviewLocation: formInterviewLocation || undefined,
          notes: formNotes.trim() || undefined,
          jobDescription: formJD.trim() || undefined,
          resumeVersion: formResumeVersion.trim() || undefined,
          atsScore: formScore ? parseInt(formScore) : undefined,
          history: newHistory,
          lastStatusChange: isStatusChanged ? new Date().toISOString() : app.lastStatusChange,
          updatedAt: new Date().toISOString(),
        };
      }
      return app;
    });

    updateAppState((prev) => ({
      ...prev,
      applications: updatedApps,
    }), true);

    setIsEditOpen(false);
    toast.success("Application updated successfully!");
  };

  const handleDeleteApplication = (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    const updatedApps = (appState.applications || []).filter((app) => app.id !== id);
    updateAppState((prev) => ({
      ...prev,
      applications: updatedApps,
    }), true);
    toast.success("Application deleted");
  };

  const handleStatusChange = (app: Application, nextStatus: StatusType) => {
    const updatedApps = (appState.applications || []).map((a) => {
      if (a.id === app.id) {
        const newHistory = [...(a.history || [])];
        newHistory.push({
          from: a.status,
          to: nextStatus,
          date: new Date().toISOString(),
        });
        return {
          ...a,
          status: nextStatus,
          lastStatusChange: new Date().toISOString(),
          history: newHistory,
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    updateAppState((prev) => ({
      ...prev,
      applications: updatedApps,
    }), true);
    toast.success(`Moved to ${nextStatus}`);
  };

  // Filtered applications list
  const filteredApps = useMemo(() => {
    const apps = appState.applications || [];
    if (!searchQuery.trim()) return apps;
    const query = searchQuery.toLowerCase();
    return apps.filter(
      (app) =>
        app.company.toLowerCase().includes(query) ||
        app.role.toLowerCase().includes(query)
    );
  }, [appState.applications, searchQuery]);

  // Group applications by status
  const appsByStatus = useMemo(() => {
    const groups: Record<StatusType, Application[]> = {
      Saved: [],
      Applied: [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };
    filteredApps.forEach((app) => {
      if (groups[app.status]) {
        groups[app.status].push(app);
      }
    });
    return groups;
  }, [filteredApps]);

  const priorityColor = (priority?: string) => {
    if (priority === "High") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (priority === "Medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Application Tracker
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organize and track your career opportunities in a simple Kanban board
            </p>
          </div>
          <Button onClick={handleOpenAddModal} className="gradient-primary text-primary-foreground font-semibold gap-1">
            <Plus className="w-4 h-4" /> Add Application
          </Button>
        </div>

        {/* Toolbar (Search) */}
        {((appState.applications || []).length > 0) && (
          <div className="flex items-center max-w-sm relative">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/60"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Board View */}
        {(appState.applications || []).length === 0 ? (
          /* Empty State Layout */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 rounded-2xl border border-border/30 backdrop-blur-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Applications Yet</h2>
            <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
              Track your job applications, monitor progress, and organize your job search in one centralized dashboard.
            </p>
            <Button onClick={handleOpenAddModal} className="gradient-primary text-primary-foreground font-semibold">
              Add First Application
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            {STATUS_COLUMNS.map((column) => {
              const list = appsByStatus[column] || [];
              return (
                <div key={column} className="bg-slate-900/30 rounded-xl border border-border/40 p-3 flex flex-col min-h-[60vh]">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        column === 'Saved' ? 'bg-slate-400' :
                        column === 'Applied' ? 'bg-blue-400' :
                        column === 'Interview' ? 'bg-yellow-400' :
                        column === 'Offer' ? 'bg-green-400' : 'bg-destructive'
                      }`} />
                      {column}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-slate-800/80">
                      {list.length}
                    </Badge>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    <AnimatePresence>
                      {list.map((app) => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Card className="glass-card card-hover border-border/30 overflow-hidden relative group">
                            <CardContent className="p-4 space-y-3">
                              
                              {/* Header: Company & Action Buttons */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {app.company}
                                  </h3>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {app.role}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenEditModal(app)}
                                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-all"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteApplication(app.id)}
                                    className="p-1 text-slate-400 hover:text-destructive rounded hover:bg-slate-800 transition-all"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Badges: Priority, ATS score */}
                              <div className="flex flex-wrap gap-1.5">
                                {app.priority && (
                                  <Badge className={`text-[10px] py-0 px-1.5 border ${priorityColor(app.priority)}`}>
                                    {app.priority}
                                  </Badge>
                                )}
                                {app.atsScore !== undefined && (
                                  <Badge className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border border-primary/20">
                                    ATS: {app.atsScore}%
                                  </Badge>
                                )}
                                {app.source && app.source !== "Manual" && (
                                  <Badge className="text-[10px] py-0 px-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {app.source}
                                  </Badge>
                                )}
                              </div>

                              {/* Date Info */}
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/10">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>
                                  {app.status === "Interview" && app.interviewDate
                                    ? `Interview: ${app.interviewDate}`
                                    : `Applied: ${app.applicationDate || "—"}`}
                                </span>
                              </div>

                              {/* Footer Select to move status quickly */}
                              <div className="pt-2 border-t border-border/10 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> Move status
                                </span>
                                <Select
                                  value={app.status}
                                  onValueChange={(val: StatusType) => handleStatusChange(app, val)}
                                >
                                  <SelectTrigger className="h-6 text-[10px] py-0 px-2 bg-slate-800/80 border-border/40 w-[110px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-border">
                                    {STATUS_COLUMNS.map((st) => (
                                      <SelectItem key={st} value={st} className="text-xs">
                                        {st}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add Application */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-slate-900 text-white border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add Application
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="e.g. Amazon"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="role">Job Title / Role *</Label>
                <Input
                  id="role"
                  placeholder="e.g. SDE Intern"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select value={formStatus} onValueChange={(val: StatusType) => setFormStatus(val)}>
                  <SelectTrigger className="bg-slate-950 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-border text-white">
                    {STATUS_COLUMNS.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formPriority}
                  onValueChange={(val: "Low" | "Medium" | "High") => setFormPriority(val)}
                >
                  <SelectTrigger className="bg-slate-950 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-border text-white">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Application Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">ATS Match Score (%)</Label>
                <Input
                  id="score"
                  type="number"
                  placeholder="e.g. 78"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              {formStatus === "Interview" && (
                <>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="interview-date">Interview Date</Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={formInterviewDate}
                      onChange={(e) => setFormInterviewDate(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="interview-time">Interview Time</Label>
                    <Input
                      id="interview-time"
                      placeholder="e.g. 10:30 AM"
                      value={formInterviewTime}
                      onChange={(e) => setFormInterviewTime(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="interview-round">Interview Round</Label>
                    <Input
                      id="interview-round"
                      placeholder="e.g. Technical Round 1"
                      value={formInterviewRound}
                      onChange={(e) => setFormInterviewRound(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="interview-location">Location / Link</Label>
                    <Input
                      id="interview-location"
                      placeholder="e.g. Google Meet / Room 302"
                      value={formInterviewLocation}
                      onChange={(e) => setFormInterviewLocation(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes / Reminders</Label>
                <Textarea
                  id="notes"
                  placeholder="Referrals, preparation strategy..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="bg-slate-950 border-border/60 resize-none h-16"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddApplication} className="gradient-primary text-primary-foreground font-semibold">
                Save Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Edit Application */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-slate-900 text-white border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" /> Edit Application
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-company">Company Name *</Label>
                <Input
                  id="edit-company"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-role">Job Title / Role *</Label>
                <Input
                  id="edit-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(val: StatusType) => setFormStatus(val)}>
                  <SelectTrigger className="bg-slate-950 border-border/60">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-border text-white">
                    {STATUS_COLUMNS.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formPriority}
                  onValueChange={(val: "Low" | "Medium" | "High") => setFormPriority(val)}
                >
                  <SelectTrigger className="bg-slate-950 border-border/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-border text-white">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">Application Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-score">ATS Match Score (%)</Label>
                <Input
                  id="edit-score"
                  type="number"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  className="bg-slate-950 border-border/60"
                />
              </div>

              {formStatus === "Interview" && (
                <>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="edit-interview-date">Interview Date</Label>
                    <Input
                      id="edit-interview-date"
                      type="date"
                      value={formInterviewDate}
                      onChange={(e) => setFormInterviewDate(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="edit-interview-time">Interview Time</Label>
                    <Input
                      id="edit-interview-time"
                      placeholder="e.g. 10:30 AM"
                      value={formInterviewTime}
                      onChange={(e) => setFormInterviewTime(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="edit-interview-round">Interview Round</Label>
                    <Input
                      id="edit-interview-round"
                      placeholder="e.g. Technical Round 1"
                      value={formInterviewRound}
                      onChange={(e) => setFormInterviewRound(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="edit-interview-location">Location / Link</Label>
                    <Input
                      id="edit-interview-location"
                      placeholder="e.g. Google Meet / Room 302"
                      value={formInterviewLocation}
                      onChange={(e) => setFormInterviewLocation(e.target.value)}
                      className="bg-slate-950 border-border/60"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-notes">Notes / Reminders</Label>
                <Textarea
                  id="edit-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="bg-slate-950 border-border/60 resize-none h-16"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditApplication} className="gradient-primary text-primary-foreground font-semibold">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
