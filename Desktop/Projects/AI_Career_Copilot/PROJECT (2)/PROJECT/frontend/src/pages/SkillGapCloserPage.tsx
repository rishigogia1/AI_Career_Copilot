import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  BookOpen, 
  Map, 
  CheckCircle, 
  Award, 
  Printer, 
  Briefcase, 
  Calendar, 
  Loader2, 
  ChevronRight, 
  ArrowRight, 
  Info,
  Clock,
  AlertCircle
} from "lucide-react";
import API from "@/api/api";
import { useAppState } from "@/hooks/useAppState";

type DayItem = {
  day: number;
  title: string;
  contentType?: string;
  estimatedTime?: string;
  difficulty?: string;
  learningObjectives?: string[];
  theory?: string;
  details: string;
  practice: string;
  resource?: { title: string; link: string };
  interviewQuestion?: {
    question: string;
    answer: string;
  };
  resumeTip?: string;
  portfolioTask?: string;
  quiz?: {
    question: string;
    options: string[];
    correctOption: string;
  }[];
};

type RoadmapData = {
  skill: string;
  overview: string;
  domain?: string;
  learningOutcomes?: string[];
  days: DayItem[];
  project: {
    title: string;
    description: string;
    features: string[];
  };
  interviewQuestions?: {
    question: string;
    answer: string;
  }[];
  resources?: {
    videos?: { title: string; link: string }[];
    certifications?: { name: string; provider: string }[];
    quizzes?: { question: string; options: string[]; answer: string }[];
  };
};

type CachedRoadmap = {
  skill: string;
  targetRole: string;
  analysisId: string;
  createdAt: string;
  roadmapData: RoadmapData;
};

const SkillGapCloserPage = () => {
  const { appState, updateAppState } = useAppState();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeRoadmap, setActiveRoadmap] = useState<CachedRoadmap | null>(null);
  const [activeDay, setActiveDay] = useState(1);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  // Sync historical analyses from appState
  useEffect(() => {
    const hist = appState.analyses.history || [];
    setHistory(hist);
    if (hist.length > 0) {
      setSelectedAnalysis(hist[0]);
    }
  }, [appState.analyses.history]);

  // Restore active roadmap if it exists
  useEffect(() => {
    const activeId = appState.gapCloser.activeRoadmapId;
    if (activeId && appState.gapCloser.roadmaps[activeId]) {
      const road = appState.gapCloser.roadmaps[activeId];
      setActiveRoadmap(road);

      // Scroll / Highlight first incomplete day
      const prog = appState.gapCloser.progress[activeId] || {};
      let firstIncomplete = 1;
      for (let d = 1; d <= 7; d++) {
        if (!prog[`day${d}`]) {
          firstIncomplete = d;
          break;
        }
      }
      setActiveDay(firstIncomplete);
      setShowRestoreBanner(true);
    }
  }, [appState.gapCloser.activeRoadmapId, appState.gapCloser.roadmaps]);

  // Scroll to day tab on activeDay change
  useEffect(() => {
    if (activeRoadmap) {
      setTimeout(() => {
        const activeEl = document.querySelector(`.day-btn-${activeDay}`);
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }, 300);
    }
  }, [activeDay, activeRoadmap]);

  // Update selected skill dropdown when analysis changes
  useEffect(() => {
    if (selectedAnalysis) {
      const missing = selectedAnalysis.missingSkills || [];
      const unlearned = missing.filter((s: string) => !appState.gapCloser.learnedSkills.includes(s.toLowerCase().trim()));
      if (unlearned.length > 0) {
        setSelectedSkill(unlearned[0]);
      } else {
        setSelectedSkill("");
      }
    } else {
      setSelectedSkill("");
    }
  }, [selectedAnalysis, appState.gapCloser.learnedSkills]);

  // Compute active roadmap stats
  const getRoadmapProgress = (key: string) => {
    const progObj = appState.gapCloser.progress[key] || {};
    const total = 7;
    const completed = Object.values(progObj).filter(Boolean).length;
    return {
      completed,
      percent: Math.round((completed / total) * 100)
    };
  };

  const handleCheckboxChange = (dayNum: number, checked: boolean) => {
    if (!activeRoadmap) return;
    const key = `${activeRoadmap.targetRole}_${activeRoadmap.skill}`;
    
    const updatedProgress = { ...appState.gapCloser.progress };
    if (!updatedProgress[key]) {
      updatedProgress[key] = {
        day1: false, day2: false, day3: false, day4: false, day5: false, day6: false, day7: false
      };
    }
    updatedProgress[key][`day${dayNum}`] = checked;

    const newProg = updatedProgress[key];
    const completedDays = Object.values(newProg).filter(Boolean).length;
    
    updateAppState((prev) => {
      return {
        ...prev,
        gapCloser: {
          ...prev.gapCloser,
          progress: updatedProgress
        }
      };
    }, true); // Immediate save
  };

  const handleGenerate = async () => {
    if (!selectedAnalysis || !selectedSkill) return;
    const targetRole = selectedAnalysis.role || "Software Engineer";
    const key = `${targetRole}_${selectedSkill}`;

    // 1. Check Cache first
    if (appState.gapCloser.roadmaps[key]) {
      const cached = appState.gapCloser.roadmaps[key];
      
      updateAppState((prev) => ({
        ...prev,
        gapCloser: {
          ...prev.gapCloser,
          activeRoadmapId: key
        }
      }), true);

      setActiveRoadmap(cached);
      
      const prog = appState.gapCloser.progress[key] || {};
      let firstIncomplete = 1;
      for (let d = 1; d <= 7; d++) {
        if (!prog[`day${d}`]) {
          firstIncomplete = d;
          break;
        }
      }
      setActiveDay(firstIncomplete);
      return;
    }

    // 2. Fetch from Backend
    try {
      setLoading(true);
      const res = await API.post("/ai/gap-roadmap", { skill: selectedSkill, targetRole });
      const newRoadmap: CachedRoadmap = {
        skill: selectedSkill,
        targetRole,
        analysisId: selectedAnalysis.id || "manual",
        createdAt: new Date().toISOString(),
        roadmapData: res.data.roadmap
      };

      // Update storage and compute analytics
      const updatedRoadmaps = { ...appState.gapCloser.roadmaps, [key]: newRoadmap };
      
      // Calculate most selected skill by frequency in cache
      const skillCounts: Record<string, number> = {};
      Object.values(updatedRoadmaps).forEach((r) => {
        const name = String(r.skill).toLowerCase().trim();
        skillCounts[name] = (skillCounts[name] || 0) + 1;
      });
      let topSkill = "";
      let maxCount = 0;
      Object.entries(skillCounts).forEach(([sk, c]) => {
        if (c > maxCount) {
          maxCount = c;
          topSkill = sk.charAt(0).toUpperCase() + sk.slice(1);
        }
      });

      const updatedProgress = { ...appState.gapCloser.progress };
      if (!updatedProgress[key]) {
        updatedProgress[key] = {
          day1: false, day2: false, day3: false, day4: false, day5: false, day6: false, day7: false
        };
      }

      updateAppState((prev) => ({
        ...prev,
        gapCloser: {
          ...prev.gapCloser,
          activeRoadmapId: key,
          roadmaps: updatedRoadmaps,
          progress: updatedProgress,
          analytics: {
            roadmapsGenerated: (prev.gapCloser.analytics.roadmapsGenerated || 0) + 1,
            skillsCompleted: prev.gapCloser.analytics.skillsCompleted || 0,
            mostSelectedSkill: topSkill
          }
        }
      }), true);

      setActiveRoadmap(newRoadmap);
      setActiveDay(1);
      setShowRestoreBanner(false);
    } catch (err) {
      console.error(err);
      alert("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsLearned = () => {
    if (!activeRoadmap) return;
    const key = `${activeRoadmap.targetRole}_${activeRoadmap.skill}`;
    const skillNorm = activeRoadmap.skill.toLowerCase().trim();

    const updatedLearned = [...appState.gapCloser.learnedSkills];
    if (!updatedLearned.includes(skillNorm)) {
      updatedLearned.push(skillNorm);
    }

    updateAppState((prev) => ({
      ...prev,
      gapCloser: {
        ...prev.gapCloser,
        activeRoadmapId: "", // Reset active roadmap
        learnedSkills: updatedLearned,
        analytics: {
          ...prev.gapCloser.analytics,
          skillsCompleted: (prev.gapCloser.analytics.skillsCompleted || 0) + 1
        }
      }
    }), true);

    alert(`🎉 Congratulations! You marked "${activeRoadmap.skill}" as learned!`);
    setActiveRoadmap(null);
    setShowRestoreBanner(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // If no history exists, show empty state
  if (history.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-primary/10 rounded-2xl mb-6">
            <Map className="w-12 h-12 text-primary mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Build Your Study Roadmaps</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-md leading-relaxed">
            Run a Job Analysis first to discover your skill gaps and generate a personalized roadmap.
          </p>
          <Button size="lg" className="gap-2" onClick={() => navigate("/analysis")}>
            <Briefcase className="w-5 h-5" />
            Go to Job Analysis
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Filter skills to display
  const missingSkills = selectedAnalysis
    ? (selectedAnalysis.missingSkills || []).filter((s: string) => !appState.gapCloser.learnedSkills.includes(s.toLowerCase().trim()))
    : [];

  const roadmapKey = activeRoadmap ? `${activeRoadmap.targetRole}_${activeRoadmap.skill}` : "";
  const progressStats = activeRoadmap ? getRoadmapProgress(roadmapKey) : { completed: 0, percent: 0 };
  const allDaysDone = progressStats.completed === 7;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12 print:p-0">
        
        {/* Printable View Wrap */}
        <div className="print:block print:w-full print:space-y-6">

          {showRestoreBanner && activeRoadmap && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 text-sm rounded-xl bg-primary/10 border border-primary/20 text-primary print:hidden"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="capitalize">
                  Continuing your {activeRoadmap.skill} roadmap - Continue where you left off
                </span>
              </div>
              <button
                onClick={() => setShowRestoreBanner(false)}
                className="text-xs font-semibold hover:underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-4 print:border-b-2 print:pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center print:hidden">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">AI Skill Gap Closer</h1>
              </div>
              <p className="text-muted-foreground text-sm mt-1 print:hidden">
                Select your target job analysis, choose a missing skill, and follow a 7-day personalized study roadmap.
              </p>
            </div>
            {activeRoadmap && (
              <div className="flex items-center gap-2 print:hidden">
                <Button
                  onClick={() => {
                    updateAppState((prev) => ({
                      ...prev,
                      gapCloser: {
                        ...prev.gapCloser,
                        activeRoadmapId: "" // Clear active roadmap to return to selection
                      }
                    }), true);
                    setActiveRoadmap(null);
                    setShowRestoreBanner(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-white"
                >
                  Generate Another Roadmap / Clear Page
                </Button>
                <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
                  <Printer className="w-4 h-4" /> Print Roadmap
                </Button>
              </div>
            )}
          </div>

          {!activeRoadmap ? (
            /* Setup Selection Card & My Roadmaps Grid */
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
                
                {/* Generate Card */}
                <Card className="glass-card w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Generate Study Roadmap</CardTitle>
                    <CardDescription>We will customize a complete learning guide with study items, projects, and practice quizzes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Select Analysis */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">1. Select Job Analysis</label>
                      <select
                        className="w-full h-10 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
                        value={selectedAnalysis ? selectedAnalysis.id : ""}
                        onChange={(e) => {
                          const found = history.find(h => h.id === e.target.value);
                          if (found) setSelectedAnalysis(found);
                        }}
                      >
                        {history.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.role} at {h.company} ({new Date(h.timestamp || h.createdAt || 0).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Skill */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">2. Select Skill to Master</label>
                      {missingSkills.length === 0 ? (
                        <p className="text-sm text-green-500 font-medium">🎉 Excellent! No remaining skill gaps for this analysis!</p>
                      ) : (
                        <select
                          className="w-full h-10 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm capitalize"
                          value={selectedSkill}
                          onChange={(e) => setSelectedSkill(e.target.value)}
                        >
                          {missingSkills.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || missingSkills.length === 0}
                      className="w-full h-11 gradient-primary text-primary-foreground font-semibold"
                    >
                      {loading ? (
                        <><Loader2 className="animate-spin mr-2 w-4 h-4" /> Generating Roadmap...</>
                      ) : (
                        <><Map className="mr-2 w-4 h-4" /> Generate 7-Day Roadmap</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* My Roadmaps Section */}
                <Card className="glass-card w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">My Roadmaps</CardTitle>
                    <CardDescription>Select a previously generated roadmap to resume learning.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.keys(appState.gapCloser.roadmaps).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-4 text-center">No roadmaps generated yet. Choose a skill and generate one!</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-auto pr-1">
                        {Object.entries(appState.gapCloser.roadmaps).map(([key, roadmap]) => {
                          const prog = appState.gapCloser.progress[key] || {};
                          const completed = Object.values(prog).filter(Boolean).length;
                          const percent = Math.round((completed / 7) * 100);
                          const isLearned = appState.gapCloser.learnedSkills.includes(roadmap.skill.toLowerCase().trim());
                          
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                updateAppState((prev) => ({
                                  ...prev,
                                  gapCloser: {
                                    ...prev.gapCloser,
                                    activeRoadmapId: key
                                  }
                                }), true);
                                setActiveRoadmap(roadmap);
                                // Scroll / Highlight first incomplete day
                                let firstIncomplete = 1;
                                for (let d = 1; d <= 7; d++) {
                                  if (!prog[`day${d}`]) {
                                    firstIncomplete = d;
                                    break;
                                  }
                                }
                                setActiveDay(firstIncomplete);
                              }}
                              className="w-full text-left p-3.5 rounded-xl border border-border/40 bg-slate-800/40 hover:bg-slate-800 transition-all flex flex-col gap-2 hover:border-primary/40 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white group-hover:text-primary capitalize">{roadmap.skill}</span>
                                {isLearned ? (
                                  <Badge className="bg-green-600/20 text-green-400 border border-green-500/30">✓ Mastered</Badge>
                                ) : percent === 100 ? (
                                  <Badge className="bg-green-500 text-white">✓ 100%</Badge>
                                ) : (
                                  <Badge className="bg-primary/20 text-primary border border-primary/30">{percent}% Complete</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {roadmap.targetRole}
                              </p>
                              {!isLearned && (
                                <div className="w-full bg-slate-800 rounded-full h-1">
                                  <div className="bg-primary h-1 rounded-full" style={{ width: `${percent}%` }}></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </motion.div>
          ) : (
            /* Roadmap view */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Overview and Progress */}
              <div className="space-y-6 lg:col-span-1 print:col-span-3">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 uppercase mb-2">Roadmap</Badge>
                        <CardTitle className="text-2xl capitalize text-white">{activeRoadmap.roadmapData.skill}</CardTitle>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Briefcase className="w-3.5 h-3.5" /> Target: {activeRoadmap.targetRole}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {activeRoadmap.roadmapData.overview}
                    </p>

                    {activeRoadmap.roadmapData.learningOutcomes && activeRoadmap.roadmapData.learningOutcomes.length > 0 && (
                      <div className="border-t border-border/30 pt-3.5 space-y-2">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Learning Outcomes</h4>
                        <ul className="text-xs space-y-1.5 text-slate-300">
                          {activeRoadmap.roadmapData.learningOutcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start gap-2 leading-relaxed">
                              <span className="text-primary font-bold mt-0.5">•</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Progress tracking section */}
                    <div className="border-t border-border/30 pt-4 space-y-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>LEARNING PROGRESS</span>
                        <span className="text-primary">{progressStats.percent}% COMPLETE</span>
                      </div>
                      <Progress value={progressStats.percent} className="h-2" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {progressStats.completed} of 7 days completed
                      </p>
                      
                      {/* Mark as learned completion trigger */}
                      {allDaysDone && (
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="pt-2 print:hidden">
                          <Button
                            onClick={handleMarkAsLearned}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                          >
                            <Award className="w-4 h-4" /> Mark Skill as Learned
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mastered Skills Preview */}
                {appState.gapCloser.learnedSkills.length > 0 && (
                  <Card className="glass-card print:hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-500">
                        <Award className="w-4 h-4" /> Mastered Skills ({appState.gapCloser.learnedSkills.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {appState.gapCloser.learnedSkills.map((s) => (
                          <Badge key={s} className="bg-green-500/10 text-green-400 capitalize hover:bg-green-500/20">
                            ✓ {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: 7-Day Plan details & quizzes */}
              <div className="lg:col-span-2 space-y-6 print:col-span-3">
                
                {/* 7 Day Tabs Timeline */}
                <Card className="glass-card">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary" /> 7-Day Learning Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Day selector tabs */}
                    <div className="flex overflow-x-auto gap-1.5 pb-2 mb-4 scrollbar-none print:hidden">
                      {activeRoadmap.roadmapData.days.map((dayObj) => {
                        const isDone = appState.gapCloser.progress[roadmapKey]?.[`day${dayObj.day}`];
                        const isNextRecommended = dayObj.day === activeDay;
                        return (
                          <button
                            key={dayObj.day}
                            onClick={() => setActiveDay(dayObj.day)}
                            className={`day-btn-${dayObj.day} px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all ${
                              activeDay === dayObj.day
                                ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-[1.02]"
                                : isNextRecommended
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            <span>Day {dayObj.day}</span>
                            {isDone && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                            {isNextRecommended && !isDone && (
                              <Badge className="ml-1 bg-primary text-primary-foreground scale-75 px-1 py-0 text-[9px] uppercase tracking-wide">Next</Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Day Content */}
                    <div className="space-y-4 print:hidden">
                      {activeRoadmap.roadmapData.days.map((dayObj) => {
                        if (dayObj.day !== activeDay) return null;
                        const isDone = !!appState.gapCloser.progress[roadmapKey]?.[`day${dayObj.day}`];
                        return (
                          <motion.div
                            key={dayObj.day}
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-start sm:items-center w-full gap-2">
                                <div>
                                  <span className="text-xs font-bold text-primary uppercase tracking-wider">DAY {dayObj.day} • {dayObj.contentType || "Learning Block"}</span>
                                  <h3 className="text-lg font-bold text-white mt-0.5">{dayObj.title}</h3>
                                </div>
                                {dayObj.day === activeDay && !isDone && (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 py-1 px-2.5 shrink-0">
                                    ⚡ Recommended Day
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5 w-full">
                                {dayObj.estimatedTime && (
                                  <Badge variant="outline" className="text-[10px] text-neutral-400 border-neutral-800 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {dayObj.estimatedTime}
                                  </Badge>
                                )}
                                {dayObj.difficulty && (
                                  <Badge variant="outline" className={`text-[10px] border-neutral-800 flex items-center gap-1 ${
                                    dayObj.difficulty.toLowerCase().includes("begin") ? "text-emerald-400" :
                                    dayObj.difficulty.toLowerCase().includes("inter") ? "text-amber-400" : "text-rose-400"
                                  }`}>
                                    {dayObj.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Learning Objectives */}
                            {dayObj.learningObjectives && dayObj.learningObjectives.length > 0 && (
                              <div className="bg-[#0e0e11] border border-neutral-800/60 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">🎯 Learning Objectives:</p>
                                <ul className="text-xs space-y-1 text-slate-300">
                                  {dayObj.learningObjectives.map((obj, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <span className="text-indigo-400">✓</span> {obj}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Theory Block */}
                            {dayObj.theory && (
                              <div className="bg-slate-800/20 border border-border/10 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">📖 Theoretical Foundations:</p>
                                <p className="text-sm leading-relaxed text-slate-200">{dayObj.theory}</p>
                              </div>
                            )}

                            {/* What to study */}
                            <div className="bg-slate-800/40 border border-border/10 rounded-xl p-4 space-y-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">💡 Detailed Study Content:</p>
                              <p className="text-sm leading-relaxed text-slate-200">{dayObj.details}</p>
                            </div>
                            
                            {/* Practice exercise with interactive state */}
                            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-bold text-green-400 uppercase tracking-wide flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Practical Lab / Exercises:
                              </p>
                              <p className="text-sm leading-relaxed text-slate-200">{dayObj.practice}</p>
                              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-green-500/10 mt-2 select-none">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={(e) => handleCheckboxChange(dayObj.day, e.target.checked)}
                                  className="w-4.5 h-4.5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-white">Mark Day {dayObj.day} Complete</span>
                              </label>
                            </div>

                            {/* Free Resource Recommendation */}
                            {dayObj.resource && dayObj.resource.link && (
                              <div className="bg-neutral-900 border border-neutral-800/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Recommended Free Resource</p>
                                  <p className="text-xs font-semibold text-white mt-0.5">{dayObj.resource.title}</p>
                                </div>
                                <a 
                                  href={dayObj.resource.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  Go to Resource →
                                </a>
                              </div>
                            )}

                            {/* Portfolio Tasks & Resume Tips */}
                            {(dayObj.resumeTip || dayObj.portfolioTask) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {dayObj.resumeTip && (
                                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-1.5">
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Award className="w-3.5 h-3.5" /> Resume Achievement Tip
                                    </p>
                                    <p className="text-xs leading-relaxed text-slate-300 italic">
                                      "{dayObj.resumeTip}"
                                    </p>
                                  </div>
                                )}
                                {dayObj.portfolioTask && (
                                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 space-y-1.5">
                                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Briefcase className="w-3.5 h-3.5" /> GitHub Portfolio Task
                                    </p>
                                    <p className="text-xs leading-relaxed text-slate-300">
                                      {dayObj.portfolioTask}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Daily Quiz Knowledge Check */}
                            {dayObj.quiz && dayObj.quiz.length > 0 && (
                              <div className="bg-[#0e0e11] border border-neutral-800/60 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/10 pb-2">
                                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" /> Day {dayObj.day} Knowledge Check
                                  </p>
                                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                                    {dayObj.quiz.length} {dayObj.quiz.length === 1 ? "Question" : "Questions"}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-4">
                                  {dayObj.quiz.map((q, qIdx) => {
                                    const questionKey = `day${dayObj.day}_q${qIdx}`;
                                    const selected = selectedAnswers[questionKey];
                                    const isCorrect = selected === q.correctOption;
                                    
                                    return (
                                      <div key={qIdx} className="space-y-2">
                                        <p className="text-sm font-semibold text-white">{qIdx + 1}. {q.question}</p>
                                        <div className="grid grid-cols-1 gap-2">
                                          {q.options.map((opt) => {
                                            const isThisSelected = selected === opt;
                                            let btnStyle = "bg-slate-800/40 border-neutral-800 text-slate-300 hover:bg-slate-800";
                                            
                                            if (selected) {
                                              if (opt === q.correctOption) {
                                                btnStyle = "bg-green-500/10 border-green-500/30 text-green-400 font-medium";
                                              } else if (isThisSelected) {
                                                btnStyle = "bg-red-500/10 border-red-500/30 text-red-400 font-medium";
                                              } else {
                                                btnStyle = "bg-slate-800/20 border-neutral-950 text-slate-500 opacity-60";
                                              }
                                            }

                                            return (
                                              <button
                                                key={opt}
                                                disabled={!!selected}
                                                onClick={() => setSelectedAnswers(prev => ({ ...prev, [questionKey]: opt }))}
                                                className={`text-left text-xs p-3 rounded-lg border transition-all ${btnStyle}`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span>{opt}</span>
                                                  {selected && opt === q.correctOption && (
                                                    <span className="text-green-500 text-[10px] font-bold uppercase">Correct</span>
                                                  )}
                                                  {selected && isThisSelected && opt !== q.correctOption && (
                                                    <span className="text-red-500 text-[10px] font-bold uppercase">Incorrect</span>
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                        {selected && (
                                          <motion.p 
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-xs mt-1.5 ${isCorrect ? "text-green-400/80" : "text-amber-400/80"}`}
                                          >
                                            {isCorrect ? "✓ Correct! Well done." : `✗ Incorrect. The correct answer is: ${q.correctOption}`}
                                          </motion.p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Daily Mock Interview Question */}
                            {dayObj.interviewQuestion && (
                              <Accordion type="single" collapsible className="w-full bg-slate-800/40 border border-border/10 rounded-xl px-4 py-1">
                                <AccordionItem value="daily-question" className="border-b-0">
                                  <AccordionTrigger className="text-sm font-semibold text-white hover:no-underline py-3">
                                    <span className="text-primary font-bold mr-2">Daily Interview Q:</span> {dayObj.interviewQuestion.question}
                                  </AccordionTrigger>
                                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed border-t border-border/10 pt-3 pb-3">
                                    <strong>AI Guidance:</strong> {dayObj.interviewQuestion.answer}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Print Layout (Invisible on screen, visible on print) */}
                    <div className="hidden print:block space-y-6">
                      {activeRoadmap.roadmapData.days.map((dayObj) => (
                        <div key={dayObj.day} className="border-b border-gray-300 pb-4 last:border-0 page-break-inside-avoid text-black">
                          <h3 className="text-md font-bold text-black">Day {dayObj.day}: {dayObj.title} ({dayObj.contentType || "Curriculum Block"})</h3>
                          <div className="text-xs text-gray-600 mt-0.5 mb-2">Estimated Time: {dayObj.estimatedTime || "N/A"} | Difficulty: {dayObj.difficulty || "N/A"}</div>
                          
                          {dayObj.learningObjectives && dayObj.learningObjectives.length > 0 && (
                            <p className="text-xs text-gray-800 mt-1"><strong>Learning Objectives:</strong> {dayObj.learningObjectives.join(" • ")}</p>
                          )}
                          {dayObj.theory && (
                            <p className="text-xs text-gray-800 mt-1"><strong>Theory:</strong> {dayObj.theory}</p>
                          )}
                          <p className="text-xs text-gray-800 mt-1"><strong>Study Details:</strong> {dayObj.details}</p>
                          <p className="text-xs text-gray-800 mt-1"><strong>Hands-on Practice:</strong> {dayObj.practice}</p>
                          
                          {dayObj.resource && (
                            <p className="text-xs text-gray-800 mt-1"><strong>Recommended Resource:</strong> {dayObj.resource.title} ({dayObj.resource.link})</p>
                          )}
                          {dayObj.resumeTip && (
                            <p className="text-xs text-gray-800 mt-1"><strong>Resume Achievement Tip:</strong> "{dayObj.resumeTip}"</p>
                          )}
                          {dayObj.portfolioTask && (
                            <p className="text-xs text-gray-800 mt-1"><strong>GitHub Portfolio Task:</strong> {dayObj.portfolioTask}</p>
                          )}
                          
                          {dayObj.interviewQuestion && (
                            <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200">
                              <p className="text-xs font-bold text-black">Mock Interview Question:</p>
                              <p className="text-sm text-gray-800 italic">{dayObj.interviewQuestion.question}</p>
                              <p className="text-sm text-gray-700 mt-1"><strong>Guidance:</strong> {dayObj.interviewQuestion.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                  </CardContent>
                </Card>

                {/* Gap Closer Project */}
                <Card className="glass-card page-break-inside-avoid">
                  <CardHeader className="pb-3 border-b border-border/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-5 h-5 text-warning" /> Gap-Closer Capstone Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h4 className="text-md font-bold text-white">{activeRoadmap.roadmapData.project.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {activeRoadmap.roadmapData.project.description}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 border border-border/10 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">🔧 Key Features to Build:</p>
                      <ul className="text-sm space-y-1.5 text-slate-200 list-disc list-inside">
                        {activeRoadmap.roadmapData.project.features.map((feat, index) => (
                          <li key={index}>{feat}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

              </div>
              
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
};

export default SkillGapCloserPage;
