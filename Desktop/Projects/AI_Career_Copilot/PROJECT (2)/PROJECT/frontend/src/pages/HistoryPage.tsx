import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Search,
  CheckCircle2,
  FileUp,
  Tag,
  Briefcase,
  BookOpen,
  Target,
  ArrowRightLeft,
  X,
  GraduationCap,
  Mic,
  Trophy,
  BarChart,
} from "lucide-react";
import { useAppState } from "@/hooks/useAppState";

interface ActivityLog {
  id: string;
  type: "APPLICATION" | "JOB_ANALYSIS" | "ATS_ANALYSIS" | "ROADMAP_GENERATED" | "ROADMAP_COMPLETED" | "INTERVIEW_PREP" | "SKILL_MASTERED" | "APPLICATION_STATUS_CHANGED";
  title: string;
  subtitle: string;
  date: Date;
  details?: {
    matchedSkills?: string[];
    missingSkills?: string[];
    recommendations?: string[];
    score?: number;
    company?: string;
    role?: string;
    status?: string;
    location?: string;
    round?: string;
    applicationDate?: string;
    interviewDate?: string;
    notes?: string;
    skillName?: string;
    daysCompleted?: number;
    progressPercent?: number;
    strengths?: string[];
    weaknesses?: string[];
  };
}

const BADGE_COLORS: Record<string, string> = {
  APPLICATION: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  JOB_ANALYSIS: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ATS_ANALYSIS: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  ROADMAP_GENERATED: "bg-green-500/10 text-green-400 border-green-500/20",
  ROADMAP_COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERVIEW_PREP: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  SKILL_MASTERED: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  APPLICATION_STATUS_CHANGED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const TYPE_LABELS: Record<string, string> = {
  APPLICATION: "Application Created",
  JOB_ANALYSIS: "Job Match",
  ATS_ANALYSIS: "ATS Scan",
  ROADMAP_GENERATED: "Roadmap Created",
  ROADMAP_COMPLETED: "Milestone Reached",
  INTERVIEW_PREP: "Interview Prep",
  SKILL_MASTERED: "Skill Mastered",
  APPLICATION_STATUS_CHANGED: "Status Update",
};

// Helper relative time formatting utility
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Icon mapping resolver
function getActivityIcon(type: string) {
  const iconProps = { className: "w-4 h-4 flex-shrink-0" };
  switch (type) {
    case "APPLICATION":
    case "APPLICATION_STATUS_CHANGED":
      return <Briefcase {...iconProps} />;
    case "JOB_ANALYSIS":
      return <Target {...iconProps} />;
    case "ATS_ANALYSIS":
      return <BarChart {...iconProps} />;
    case "ROADMAP_GENERATED":
      return <BookOpen {...iconProps} />;
    case "ROADMAP_COMPLETED":
      return <GraduationCap {...iconProps} />;
    case "INTERVIEW_PREP":
      return <Mic {...iconProps} />;
    case "SKILL_MASTERED":
      return <Trophy {...iconProps} />;
    default:
      return <Calendar {...iconProps} />;
  }
}

export default function HistoryPage() {
  const { appState } = useAppState();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  // Group and augment activities
  const allLogs = useMemo(() => {
    const list: ActivityLog[] = [];
    const history = appState.analyses.history || [];
    const apps = appState.applications || [];

    // 1. ATS Analyses Completed
    if (appState.atsScore.atsReport) {
      const rep = appState.atsScore.atsReport;
      list.push({
        id: "ats-report",
        type: "ATS_ANALYSIS",
        title: "ATS Compatibility Scan Completed",
        subtitle: `Resume matched against target criteria. Score: ${rep.overallScore}%`,
        date: new Date(appState.sessionStartedAt || Date.now()),
        details: {
          score: rep.overallScore,
          strengths: rep.sections?.keywordMatch?.matched || [],
          weaknesses: rep.sections?.keywordMatch?.missing || [],
          recommendations: rep.quickWins || [],
        }
      });
    }

    // 2. Job Analyses Runs
    history.forEach((h: any) => {
      list.push({
        id: h.id || `job-${h.timestamp}`,
        type: "JOB_ANALYSIS",
        title: `Matched "${h.role || 'Job'}" Profile`,
        subtitle: `Match evaluation score for ${h.company || 'Not Specified'}: ${h.matchScore}%`,
        date: new Date(h.timestamp || h.createdAt),
        details: {
          score: h.matchScore,
          company: h.company,
          role: h.role,
          matchedSkills: h.matchedSkills || [],
          missingSkills: h.missingSkills || [],
          recommendations: h.ai?.suggestions || [],
        }
      });
    });

    // 3. Roadmap Generations
    Object.entries(appState.gapCloser.roadmaps || {}).forEach(([id, rm]: [string, any]) => {
      const progMap = appState.gapCloser.progress[id] || {};
      const completedCount = Object.values(progMap).filter(Boolean).length;
      const pct = Math.round((completedCount / 7) * 100);

      list.push({
        id: id,
        type: "ROADMAP_GENERATED",
        title: `Generated "${rm.skill}" Learning Roadmap`,
        subtitle: `Created customized 7-day milestone skill path. Currently ${pct}% complete.`,
        date: new Date(rm.createdAt || Date.now()),
        details: {
          skillName: rm.skill,
          daysCompleted: completedCount,
          progressPercent: pct,
        }
      });

      // 4. Roadmap Completed milestones / Skill Mastered
      if (pct === 100) {
        list.push({
          id: `mastered-${id}`,
          type: "SKILL_MASTERED",
          title: `Mastered Skill: ${rm.skill} 🏆`,
          subtitle: `Completed all checklist tasks for "${rm.skill}" learning path!`,
          date: new Date(),
          details: {
            skillName: rm.skill,
            daysCompleted: 7,
            progressPercent: 100,
          }
        });
      }
    });

    // 5. Individual Roadmap Progress Checks
    Object.entries(appState.gapCloser.progress || {}).forEach(([rmId, progressMap]: [string, any]) => {
      const road = appState.gapCloser.roadmaps[rmId];
      if (road) {
        Object.entries(progressMap).forEach(([dayKey, checked]) => {
          if (checked) {
            list.push({
              id: `milestone-${rmId}-${dayKey}`,
              type: "ROADMAP_COMPLETED",
              title: `Completed ${dayKey} Tasks`,
              subtitle: `Progressed roadmap study parameters for "${road.skill}"`,
              date: new Date(),
              details: {
                skillName: road.skill,
                daysCompleted: parseInt(dayKey.replace(/\D/g, "")) || 0,
              }
            });
          }
        });
      }
    });

    // 6. Interview Prep Generation (If active sessions exist)
    if (appState.interviewPrep.activeSessionId) {
      list.push({
        id: `interview-prep-${appState.interviewPrep.activeSessionId}`,
        type: "INTERVIEW_PREP",
        title: "Generated Interview Prep Questions",
        subtitle: "Loaded tailored preparation questions for interview review.",
        date: new Date(),
        details: {
          recommendations: ["Study core structural interview responses.", "Review company products & job criteria."],
        }
      });
    }

    // 7. Applications Created & Status Transitions
    apps.forEach((a: any) => {
      list.push({
        id: `app-create-${a.id}`,
        type: "APPLICATION",
        title: `${a.company}`,
        subtitle: `Role: ${a.role} | Status: ${a.status}${a.atsScore ? ` | ATS Score: ${a.atsScore}%` : ""}`,
        date: new Date(a.createdAt),
        details: {
          company: a.company,
          role: a.role,
          status: a.status,
          score: a.atsScore,
          applicationDate: a.applicationDate,
          interviewDate: a.interviewDate,
          notes: a.notes,
        }
      });

      if (a.history && a.history.length > 0) {
        a.history.forEach((hist: any) => {
          if (hist.from !== "None") {
            list.push({
              id: `app-trans-${a.id}-${hist.date}-${hist.to}`,
              type: "APPLICATION_STATUS_CHANGED",
              title: `${a.company}`,
              subtitle: `Role: ${a.role} | Moved: ${hist.from} → ${hist.to}${a.atsScore ? ` | ATS Score: ${a.atsScore}%` : ""}`,
              date: new Date(hist.date),
              details: {
                company: a.company,
                role: a.role,
                status: hist.to,
                score: a.atsScore,
                applicationDate: a.applicationDate,
                interviewDate: a.interviewDate,
                notes: a.notes,
              }
            });
          }
        });
      }
    });

    // Sort descending
    list.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Deduplicate duplicate log entries (same title, description, and day)
    const uniqueList: ActivityLog[] = [];
    const seen = new Set<string>();
    list.forEach(item => {
      const key = `${item.title}-${item.subtitle}-${item.date.toDateString()}`;
      if (!seen.has(key)) {
        uniqueList.push(item);
        seen.add(key);
      }
    });

    return uniqueList;
  }, [appState]);

  // Reduced Top Stats counters
  const stats = useMemo(() => {
    return {
      total: allLogs.length,
      applications: allLogs.filter(l => l.type === "APPLICATION" || l.type === "APPLICATION_STATUS_CHANGED").length,
      roadmaps: allLogs.filter(l => l.type === "ROADMAP_GENERATED" || l.type === "ROADMAP_COMPLETED").length,
      interviews: allLogs.filter(l => l.type === "INTERVIEW_PREP").length,
    };
  }, [allLogs]);

  // Filtered & Searched Activities
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // Type Filter
      if (activeFilter === "ATS" && log.type !== "ATS_ANALYSIS") return false;
      if (activeFilter === "APPLICATION" && log.type !== "APPLICATION" && log.type !== "APPLICATION_STATUS_CHANGED") return false;
      if (activeFilter === "ROADMAP" && log.type !== "ROADMAP_GENERATED" && log.type !== "ROADMAP_COMPLETED" && log.type !== "SKILL_MASTERED") return false;
      if (activeFilter === "INTERVIEW" && log.type !== "INTERVIEW_PREP") return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          log.title.toLowerCase().includes(query) ||
          log.subtitle.toLowerCase().includes(query) ||
          log.type.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allLogs, activeFilter, searchQuery]);

  // Group activities by date bucket
  const groupedLogs = useMemo(() => {
    const today: ActivityLog[] = [];
    const yesterday: ActivityLog[] = [];
    const thisWeek: ActivityLog[] = [];
    const older: ActivityLog[] = [];

    const now = new Date();
    const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const midnightYesterday = midnightToday - 24 * 60 * 60 * 1000;
    const startOfWeek = midnightToday - 7 * 24 * 60 * 60 * 1000;

    filteredLogs.forEach((log) => {
      const logTime = log.date.getTime();
      if (logTime >= midnightToday) {
        today.push(log);
      } else if (logTime >= midnightYesterday) {
        yesterday.push(log);
      } else if (logTime >= startOfWeek) {
        thisWeek.push(log);
      } else {
        older.push(log);
      }
    });

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "This Week", items: thisWeek },
      { title: "Older", items: older },
    ].filter(group => group.items.length > 0);
  }, [filteredLogs]);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground text-sm">Unified chronological activity timeline of your job search progress.</p>
          </div>
        </motion.div>

        {/* Reduced Top Stats indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Activities", count: stats.total, color: "text-white" },
            { label: "Applications", count: stats.applications, color: "text-purple-400" },
            { label: "Roadmaps", count: stats.roadmaps, color: "text-green-400" },
            { label: "Interviews", count: stats.interviews, color: "text-yellow-400" },
          ].map((item) => (
            <Card key={item.label} className="glass-card">
              <CardContent className="p-4 text-center">
                <span className="text-xs text-muted-foreground font-medium block">{item.label}</span>
                <span className={`text-2xl font-bold ${item.color} mt-1 block`}>{item.count}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar: Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="flex items-center max-w-sm relative flex-1">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search activity history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/60 text-sm h-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters List */}
          <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
            {[
              { id: "ALL", label: "All Activities" },
              { id: "ATS", label: "ATS Analyses" },
              { id: "APPLICATION", label: "Applications" },
              { id: "ROADMAP", label: "Roadmaps" },
              { id: "INTERVIEW", label: "Interview" },
            ].map((btn) => (
              <Button
                key={btn.id}
                onClick={() => setActiveFilter(btn.id)}
                variant="outline"
                size="sm"
                className={`text-xs h-8 px-3 rounded-lg border-border/50 transition-all ${
                  activeFilter === btn.id
                    ? "bg-primary/20 text-primary border-primary/30 font-medium"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Unified Activity Feed Timeline grouped by Date */}
        <Card className="glass-card">
          <CardContent className="p-6">
            {groupedLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No activities found matching filters or search queries.
              </div>
            ) : (
              <div className="space-y-10">
                {groupedLogs.map((group, gIdx) => (
                  // margin-top: 32px (mt-8 = 32px) between groups visually to prevent looking cramped
                  <div key={group.title} className={`${gIdx > 0 ? "mt-8" : ""} space-y-4`}>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-2 border-l-2 border-primary/40">
                      {group.title}
                    </h2>
                    <div className="relative border-l border-border/40 pl-6 space-y-6">
                      {group.items.map((log) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative"
                        >
                          {/* Custom Contextual Icon resolver mapping instead of simple dot */}
                          <span className="absolute -left-[38px] top-1 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-300 ring-4 ring-slate-900/80">
                            {getActivityIcon(log.type)}
                          </span>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-2">
                            <div className="space-y-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <Badge className={`text-[10px] py-0 px-1.5 font-bold tracking-wide border ${BADGE_COLORS[log.type]}`}>
                                  {TYPE_LABELS[log.type] || log.type}
                                </Badge>
                                <h3 className="font-semibold text-white text-sm capitalize">{log.title}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground">{log.subtitle}</p>
                            </div>

                            <div className="flex items-center gap-3 ml-auto sm:ml-0">
                              <span className="text-[11px] text-slate-500 font-medium">
                                {formatRelativeTime(log.date)}
                              </span>
                              {log.details && (
                                <Button
                                  onClick={() => setSelectedActivity(log)}
                                  variant="secondary"
                                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] h-6 py-0 px-2 rounded"
                                >
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={selectedActivity !== null} onOpenChange={(open) => !open && setSelectedActivity(null)}>
          {selectedActivity && (
            <DialogContent className="bg-slate-900 border-border text-white max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Badge className={`text-[10px] py-0 px-1.5 font-bold border ${BADGE_COLORS[selectedActivity.type]}`}>
                    {TYPE_LABELS[selectedActivity.type] || selectedActivity.type}
                  </Badge>
                  <span className="capitalize">{selectedActivity.title}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-3 text-sm">
                <p className="text-xs text-muted-foreground">{selectedActivity.subtitle}</p>

                {/* Job Analysis detailed panel */}
                {selectedActivity.type === "JOB_ANALYSIS" && (
                  <div className="space-y-4">
                    {selectedActivity.details?.score !== undefined && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/40 border border-border/50">
                        <span className="text-xs text-muted-foreground">Match Score:</span>
                        <span className="font-bold text-primary text-lg">{selectedActivity.details.score}%</span>
                      </div>
                    )}
                    {selectedActivity.details?.matchedSkills && selectedActivity.details.matchedSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-green-400 block">✓ Matched Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedActivity.details.matchedSkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedActivity.details?.missingSkills && selectedActivity.details.missingSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-red-400 block">✗ Missing Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedActivity.details.missingSkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedActivity.details?.recommendations && selectedActivity.details.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-primary block">Action Suggestions</span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                          {selectedActivity.details.recommendations.slice(0, 4).map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ATS Analysis detailed panel */}
                {selectedActivity.type === "ATS_ANALYSIS" && (
                  <div className="space-y-4">
                    {selectedActivity.details?.score !== undefined && (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent/40 border border-border/50">
                        <span className="text-xs text-muted-foreground">ATS Score:</span>
                        <span className="font-bold text-orange-400 text-lg">{selectedActivity.details.score}%</span>
                      </div>
                    )}
                    {selectedActivity.details?.strengths && selectedActivity.details.strengths.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-green-400 block">Strengths / Keyword Matches</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedActivity.details.strengths.slice(0, 8).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedActivity.details?.weaknesses && selectedActivity.details.weaknesses.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-red-400 block">Weaknesses / Missing Keywords</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedActivity.details.weaknesses.slice(0, 8).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Applications details panel */}
                {(selectedActivity.type === "APPLICATION" || selectedActivity.type === "APPLICATION_STATUS_CHANGED") && (
                  <div className="space-y-3 p-3 bg-accent/30 rounded-lg border border-border/50">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Company:</span>
                        <span className="font-bold text-white block capitalize">{selectedActivity.details?.company || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Role:</span>
                        <span className="font-bold text-white block capitalize">{selectedActivity.details?.role || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Status:</span>
                        <span className="font-bold text-primary block capitalize">{selectedActivity.details?.status || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">ATS Score:</span>
                        <span className="font-bold text-white block">{selectedActivity.details?.score ? `${selectedActivity.details.score}%` : "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Applied Date:</span>
                        <span className="font-semibold text-slate-300 block">{selectedActivity.details?.applicationDate || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Interview Date:</span>
                        <span className="font-semibold text-slate-300 block">{selectedActivity.details?.interviewDate || "—"}</span>
                      </div>
                    </div>
                    {selectedActivity.details?.notes && (
                      <div className="pt-2 border-t border-border/30 text-xs">
                        <span className="text-muted-foreground block mb-0.5">Notes:</span>
                        <p className="text-slate-300 leading-relaxed italic">{selectedActivity.details.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Roadmaps details panel */}
                {(selectedActivity.type === "ROADMAP_GENERATED" || selectedActivity.type === "ROADMAP_COMPLETED" || selectedActivity.type === "SKILL_MASTERED") && (
                  <div className="space-y-3 p-3 bg-accent/30 rounded-lg border border-border/50">
                    <div className="text-xs space-y-2">
                      <p><span className="text-muted-foreground">Skill Name:</span> <span className="font-bold text-white capitalize">{selectedActivity.details?.skillName || "—"}</span></p>
                      {selectedActivity.details?.daysCompleted !== undefined && (
                        <p><span className="text-muted-foreground">Milestones:</span> <span className="font-bold text-white">{selectedActivity.details.daysCompleted} / 7 Days Checked</span></p>
                      )}
                      {selectedActivity.details?.progressPercent !== undefined && (
                        <div>
                          <div className="flex justify-between items-center mb-1 text-[11px]">
                            <span className="text-muted-foreground">Roadmap Progress:</span>
                            <span className="font-bold text-primary">{selectedActivity.details.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${selectedActivity.details.progressPercent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          )}
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
