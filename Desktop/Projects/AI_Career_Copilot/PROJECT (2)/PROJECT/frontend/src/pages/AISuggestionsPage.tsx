import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, Code, Users, ArrowRight, AlertCircle, CheckSquare, Square, AlertTriangle, Sparkles, Target, MessageSquare, ShieldAlert, Tag, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAppState } from "@/hooks/useAppState";

interface QuestionItem {
  question: string;
  answer: any;
}

const AISuggestionsPage = () => {
  const { appState, updateAppState } = useAppState();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [technical, setTechnical] = useState<(string | QuestionItem)[]>([]);
  const [behavioral, setBehavioral] = useState<(string | QuestionItem)[]>([]);
  const [role, setRole] = useState<string>("Software Engineer");
  const [company, setCompany] = useState<string>("Target Company");
  const [loading, setLoading] = useState(true);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  const getQuestionText = (q: string | QuestionItem) => {
    if (typeof q === "object" && q !== null) return q.question;
    return String(q || "");
  };

  const renderDetailedAnswer = (q: string | QuestionItem, type: "technical" | "behavioral") => {
    let answerObj: any = null;

    if (typeof q === "object" && q !== null && q.answer) {
      if (typeof q.answer === "object") {
        answerObj = q.answer;
      } else {
        try {
          answerObj = JSON.parse(q.answer);
        } catch (e) {
          answerObj = null;
        }
      }
    }

    // No answer data at all
    if (!answerObj) {
      return (
        <div className="text-sm text-muted-foreground italic py-4">
          No preparation data available for this question. Try running a new job analysis.
        </div>
      );
    }

    const isFallback = answerObj.source === "fallback";
    const accentColor = type === "technical" ? "blue" : "green";
    const headerClass = type === "technical" ? "text-blue-400" : "text-green-400";

    // Extract fields with backward compatibility for old schema
    const difficulty = answerObj.difficulty || "—";
    const duration = answerObj.estimatedAnswerTime || answerObj.estimatedTime || answerObj.duration || "—";
    const competency = answerObj.competency || "";
    const whyAsked = answerObj.whyAsked || answerObj.intent || "";
    const framework = answerObj.answerFramework || answerObj.answerStrategy || "";
    const expectations = Array.isArray(answerObj.interviewerExpectations)
      ? answerObj.interviewerExpectations
      : Array.isArray(answerObj.interviewerWants)
        ? answerObj.interviewerWants
        : answerObj.whatInterviewerWants
          ? [answerObj.whatInterviewerWants]
          : [];
    const talkingPoints = Array.isArray(answerObj.keyTalkingPoints) ? answerObj.keyTalkingPoints : [];
    const sample = answerObj.sampleAnswer || "";
    const mistakes = Array.isArray(answerObj.commonMistakes) ? answerObj.commonMistakes : [];
    const followUps = Array.isArray(answerObj.followUpQuestions) ? answerObj.followUpQuestions : [];
    const rubric = Array.isArray(answerObj.evaluationRubric) ? answerObj.evaluationRubric : [];
    const redFlags = Array.isArray(answerObj.redFlags) ? answerObj.redFlags : [];
    const keywords = Array.isArray(answerObj.keywords) ? answerObj.keywords : [];
    const tips = Array.isArray(answerObj.confidenceTips)
      ? answerObj.confidenceTips
      : Array.isArray(answerObj.tips)
        ? answerObj.tips
        : [];

    const rubricColors: Record<string, string> = {
      "Excellent": "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
      "Good": "border-blue-500/30 bg-blue-500/5 text-blue-300",
      "Average": "border-amber-500/30 bg-amber-500/5 text-amber-300",
      "Poor": "border-rose-500/30 bg-rose-500/5 text-rose-300",
      "Strong": "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
      "Weak": "border-rose-500/30 bg-rose-500/5 text-rose-300"
    };

    return (
      <div className="space-y-5 text-sm leading-relaxed mt-3 text-muted-foreground border-t border-border/10 pt-4">
        {/* Fallback Warning */}
        {isFallback && (
          <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>AI generation was unavailable — showing basic guidance. Run a new analysis for full AI-powered prep.</span>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border ${
            accentColor === "blue"
              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
              : "border-green-500/20 bg-green-500/10 text-green-400"
          }`}>
            {difficulty}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-300">
            ⏱ {duration}
          </span>
          {framework && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border border-indigo-500/20 bg-indigo-500/5 text-indigo-400">
              ⚙ {framework}
            </span>
          )}
          {competency && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md border border-violet-500/20 bg-violet-500/5 text-violet-400">
              🎯 {competency}
            </span>
          )}
        </div>

        {/* Why This Question Is Asked */}
        {whyAsked && (
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/40 p-4 rounded-xl border border-slate-700/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/60 rounded-l-xl" />
            <div className="flex items-start gap-2.5 ml-2">
              <Target className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-400 mb-1.5">Why This Question Is Asked</h4>
                <p className="text-neutral-200 text-xs leading-relaxed">{whyAsked}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interviewer Expectations */}
        {expectations.length > 0 && (
          <div>
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-2.5 ${headerClass} flex items-center gap-1.5`}>
              <Sparkles className="w-3.5 h-3.5" />
              What the Interviewer Expects
            </h4>
            <div className="grid gap-2">
              {expectations.map((exp: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/50">
                  <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded ${
                    accentColor === "blue" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-neutral-200 text-xs leading-relaxed">{exp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Talking Points */}
        {talkingPoints.length > 0 && (
          <div>
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-2 ${headerClass} flex items-center gap-1.5`}>
              <Zap className="w-3.5 h-3.5" />
              Key Talking Points
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-200">
              {talkingPoints.map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sample Answer */}
        {sample && (
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-2.5 ${headerClass} flex items-center gap-1.5`}>
              <MessageSquare className="w-3.5 h-3.5" />
              Sample Answer
            </h4>
            <p className="text-neutral-100 text-xs font-normal leading-relaxed italic pr-2">
              "{sample}"
            </p>
          </div>
        )}

        {/* Common Mistakes */}
        {mistakes.length > 0 && (
          <div>
            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Common Mistakes to Avoid
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-200">
              {mistakes.map((mistake: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">✖</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-500/10 p-3 rounded-lg">
            <h4 className="font-bold text-[10px] uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Interviewer Red Flags
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {redFlags.map((flag: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">⚠</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evaluation Rubric */}
        {rubric.length > 0 && (
          <div className="border-t border-border/10 pt-4">
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-3 ${headerClass}`}>Evaluation Rubric</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {rubric.map((item: any, idx: number) => {
                const level = typeof item === "string"
                  ? (item.startsWith("Strong") ? "Strong" : item.startsWith("Weak") ? "Weak" : "Good")
                  : (item.level || "Good");
                const criteria = typeof item === "string" ? item : (item.criteria || item);
                const colorClass = rubricColors[level] || "border-neutral-800 bg-neutral-950 text-neutral-300";
                return (
                  <div key={idx} className={`p-3 rounded-lg border leading-normal ${colorClass}`}>
                    <span className="font-bold text-[10px] uppercase tracking-wider block mb-1 opacity-80">{level}</span>
                    <span className="text-xs">{typeof criteria === "string" ? criteria.replace(/^(Strong|Weak|Good|Excellent|Average|Poor):\s*/i, "") : String(criteria)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        {followUps.length > 0 && (
          <div className="border-t border-border/10 pt-3">
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-2 ${headerClass}`}>Likely Follow-up Questions</h4>
            <ul className="space-y-1.5 text-xs text-neutral-200">
              {followUps.map((fq: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 italic">
                  <span className="text-indigo-400 mt-0.5">✦</span>
                  <span>"{fq}"</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="border-t border-border/10 pt-3">
            <h4 className={`font-bold text-[10px] uppercase tracking-wider mb-2 ${headerClass} flex items-center gap-1.5`}>
              <Tag className="w-3.5 h-3.5" />
              Keywords to Mention
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw: string, idx: number) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 font-medium">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Tips */}
        {tips.length > 0 && (
          <div className="border-t border-border/10 pt-3">
            <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-lg">
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Confidence Tips
              </h4>
              <ul className="space-y-1.5 text-xs text-neutral-300">
                {tips.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    // Load from persistent state
    const latest = appState.analyses.latestAnalysis;
    console.log("[INTERVIEW QUESTIONS RECEIVED]", latest);
    
    console.log({
        stage: "8. AISuggestionsPage",
        exists: !!latest?.ai?.suggestions,
        isArray: Array.isArray(latest?.ai?.suggestions),
        length: latest?.ai?.suggestions?.length
    });

    if (latest) {
      setSuggestions(latest.ai?.suggestions || []);
      setTechnical(latest.ai?.questions?.technical || []);
      setBehavioral(latest.ai?.questions?.behavioral || []);
      setRole(latest.saved?.role || "Software Engineer");
      setCompany(latest.saved?.company || "Target Company");
      setShowRestoreBanner(true);
    }
    setLoading(false);
  }, [appState.analyses.latestAnalysis]);

  const handleToggleQuestionComplete = (e: React.MouseEvent, qText: string) => {
    e.stopPropagation(); // Stop Accordion toggle
    const currentCompleted = { ...appState.interviewPrep.completedQuestions };
    
    if (currentCompleted[qText]) {
      delete currentCompleted[qText];
    } else {
      currentCompleted[qText] = true;
    }

    updateAppState((prev) => ({
      ...prev,
      interviewPrep: {
        ...prev.interviewPrep,
        completedQuestions: currentCompleted
      }
    }), true); // Immediate save
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (suggestions.length === 0 && technical.length === 0 && behavioral.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[70vh] flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-primary/10 rounded-2xl mb-6">
              <Lightbulb className="w-12 h-12 text-primary mx-auto" />
            </div>
            <h1 className="text-3xl font-bold mb-2">No Suggestions Yet</h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-md">
              Complete a resume analysis to receive personalized AI suggestions.
            </p>
            <Link to="/analysis">
              <Button size="lg" className="gap-2">
                <FileText className="w-5 h-5" />
                Go to Job Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
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

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Career Roadmap</h1>
              <p className="text-muted-foreground">
                Optimized suggestions for <span className="font-semibold text-primary">{role}</span> at {company}
              </p>
            </div>
          </div>
          {(suggestions.length > 0 || technical.length > 0 || behavioral.length > 0 || Object.keys(appState.interviewPrep.completedQuestions).length > 0) && (
            <Button
              onClick={() => {
                setSuggestions([]);
                setTechnical([]);
                setBehavioral([]);
                setShowRestoreBanner(false);
                updateAppState((prev) => {
                  const cleanedAnalysis = prev.analyses.latestAnalysis
                    ? {
                        ...prev.analyses.latestAnalysis,
                        ai: {
                          suggestions: [],
                          questions: { technical: [], behavioral: [] }
                        }
                      }
                    : null;
                  
                  return {
                    ...prev,
                    analyses: {
                      ...prev.analyses,
                      latestAnalysis: cleanedAnalysis
                    },
                    interviewPrep: {
                      ...prev.interviewPrep,
                      completedQuestions: {}
                    }
                  };
                }, true); // Immediate save
              }}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white self-start sm:self-center"
            >
              Start New Interview Session / Clear Page
            </Button>
          )}
        </motion.div>

        {/* RESUME ENHANCEMENTS */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-primary overflow-hidden bg-gradient-to-r from-slate-900/50 to-slate-900">
            <CardHeader className="pb-4 bg-muted/5 border-b border-border/30">
              <CardTitle className="flex gap-3 items-center text-xl">
                <FileText className="w-6 h-6 text-primary" />
                Strategic Resume Enhancements
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 font-normal">Key improvements to highlight your fit for this role</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {suggestions.map((s, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-800 border border-border/30 shadow-sm transition-all hover:border-primary/50 hover:bg-slate-800/80"
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed text-white">{s}</p>
                  </div>
                  <Badge 
                    className={`flex-shrink-0 ${i === 0 ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                  >
                    {i === 0 ? '🔥 Critical' : '⭐ Boost'}
                  </Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* INTERVIEW PREP */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TECHNICAL */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-t-4 border-t-blue-500 bg-gradient-to-b from-slate-900/50 to-slate-900">
              <CardHeader className="bg-muted/5 border-b border-border/30 pb-4">
                <CardTitle className="flex gap-3 items-center text-lg">
                  <Code className="w-5 h-5 text-blue-500" />
                  Technical Interview Prep
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {technical.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground italic">No technical questions generated</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {technical.map((q, i) => {
                      const qText = getQuestionText(q);
                      const isCompleted = !!appState.interviewPrep.completedQuestions[qText];
                      return (
                        <AccordionItem key={i} value={`tech-${i}`} className="border-b border-border/10 last:border-0">
                          <AccordionTrigger className="py-4 hover:no-underline text-left">
                            <div className="flex gap-3 items-start w-full pr-4">
                              <span className="text-blue-500 font-bold text-sm min-w-[28px]">Q{i + 1}</span>
                              <span className={`font-medium text-sm leading-relaxed flex-1 ${isCompleted ? 'text-muted-foreground line-through' : 'text-white'}`}>
                                {qText}
                              </span>
                              <button
                                onClick={(e) => handleToggleQuestionComplete(e, qText)}
                                className={`flex-shrink-0 transition-colors p-1 rounded hover:bg-slate-700 ${isCompleted ? 'text-green-400' : 'text-muted-foreground'}`}
                                title={isCompleted ? "Mark incomplete" : "Mark complete"}
                              >
                                {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </button>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-muted/5 p-4 rounded-lg border-t border-border/10">
                            {renderDetailedAnswer(q, "technical")}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </motion.div>
 
          {/* BEHAVIORAL */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full border-t-4 border-t-green-500 bg-gradient-to-b from-slate-900/50 to-slate-900">
              <CardHeader className="bg-muted/5 border-b border-border/30 pb-4">
                <CardTitle className="flex gap-3 items-center text-lg">
                  <Users className="w-5 h-5 text-green-500" />
                  Behavioral Interview Prep
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {behavioral.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground italic">No behavioral questions generated</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {behavioral.map((q, i) => {
                      const qText = getQuestionText(q);
                      const isCompleted = !!appState.interviewPrep.completedQuestions[qText];
                      return (
                        <AccordionItem key={i} value={`beh-${i}`} className="border-b border-border/10 last:border-0">
                          <AccordionTrigger className="py-4 hover:no-underline text-left">
                            <div className="flex gap-3 items-start w-full pr-4">
                              <span className="text-green-500 font-bold text-sm min-w-[28px]">B{i + 1}</span>
                              <span className={`font-medium text-sm leading-relaxed flex-1 ${isCompleted ? 'text-muted-foreground line-through' : 'text-white'}`}>
                                {qText}
                              </span>
                              <button
                                onClick={(e) => handleToggleQuestionComplete(e, qText)}
                                className={`flex-shrink-0 transition-colors p-1 rounded hover:bg-slate-700 ${isCompleted ? 'text-green-400' : 'text-muted-foreground'}`}
                                title={isCompleted ? "Mark incomplete" : "Mark complete"}
                              >
                                {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </button>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="bg-muted/5 p-4 rounded-lg border-t border-border/10">
                            {renderDetailedAnswer(q, "behavioral")}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button
            onClick={() => navigate("/history")}
            className="gradient-primary text-primary-foreground font-semibold cursor-pointer rounded-xl flex items-center justify-center gap-1.5 h-11 px-6"
          >
            View History <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AISuggestionsPage;
