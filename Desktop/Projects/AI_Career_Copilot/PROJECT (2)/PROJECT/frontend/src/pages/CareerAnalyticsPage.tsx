import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/hooks/useAppState";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, PieChart, Pie } from "recharts";
import {
  TrendingUp,
  Briefcase,
  Target,
  BookOpen,
  Award,
  AlertTriangle,
  Building2,
  UserCheck,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

export default function CareerAnalyticsPage() {
  const { appState } = useAppState();
  const apps = appState.applications || [];

  // ==========================================
  // Career Overview Metrics
  // ==========================================
  const totalApps = apps.length;
  const activeApps = apps.filter(a => a.status === "Applied" || a.status === "Interview").length;
  const totalInterviews = apps.filter(a => a.status === "Interview").length;
  const totalOffers = apps.filter(a => a.status === "Offer").length;
  const successDivisor = apps.filter(a => ["Applied", "Interview", "Offer", "Rejected"].includes(a.status)).length;
  const successRate = successDivisor > 0 ? Math.round((totalOffers / successDivisor) * 100) : 0;

  // ==========================================
  // Row 1 Component A: Application Funnel
  // ==========================================
  const funnelCounts = {
    Applied: apps.filter(a => a.status === "Applied").length,
    Interview: totalInterviews,
    Offer: totalOffers,
    Rejected: apps.filter(a => a.status === "Rejected").length,
  };

  const funnelData = [
    { stage: "Applied", count: funnelCounts.Applied, color: "#3b82f6" },
    { stage: "Interview", count: funnelCounts.Interview, color: "#eab308" },
    { stage: "Offer", count: funnelCounts.Offer, color: "#22c55e" },
    { stage: "Rejected", count: funnelCounts.Rejected, color: "#ef4444" },
  ];

  // ==========================================
  // Row 1 Component B: ATS Score Performance
  // ==========================================
  const atsScores = apps.map(a => a.atsScore).filter((s): s is number => typeof s === "number");
  const avgATS = atsScores.length > 0 ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0;
  const maxATS = atsScores.length > 0 ? Math.max(...atsScores) : 0;
  const minATS = atsScores.length > 0 ? Math.min(...atsScores) : 0;

  // ==========================================
  // Row 2 Component A: Top Missing Skills
  // ==========================================
  const history = appState.analyses.history || [];
  const missingCounts: Record<string, number> = {};
  let totalMissingInstances = 0;
  history.forEach((item) => {
    const missing = item.missingSkills || [];
    missing.forEach((s: string) => {
      const norm = String(s).trim();
      if (norm) {
        missingCounts[norm] = (missingCounts[norm] || 0) + 1;
        totalMissingInstances++;
      }
    });
  });

  const sortedMissing = Object.entries(missingCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  const top5Missing = sortedMissing.slice(0, 5);
  const mostCommonMissingSkill = top5Missing[0]?.skill || "—";

  // ==========================================
  // Row 2 Component B: Application Status Distribution (Doughnut Chart)
  // ==========================================
  const statusCounts = {
    Saved: apps.filter(a => a.status === "Saved").length,
    Applied: apps.filter(a => a.status === "Applied").length,
    Interview: totalInterviews,
    Offer: totalOffers,
    Rejected: apps.filter(a => a.status === "Rejected").length,
  };

  const statusColors: Record<string, string> = {
    Saved: "#64748b",
    Applied: "#3b82f6",
    Interview: "#eab308",
    Offer: "#22c55e",
    Rejected: "#ef4444",
  };

  const statusPieData = Object.entries(statusCounts)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: statusColors[status],
      percentage: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
    }))
    .filter(item => item.value > 0);

  // ==========================================
  // Row 3 Component A: Most Applied Roles
  // ==========================================
  const roleCounts: Record<string, number> = {};
  apps.forEach((a) => {
    const role = a.role.trim();
    if (role) {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    }
  });
  const sortedRoles = Object.entries(roleCounts)
    .map(([role, count]) => ({
      name: role,
      count,
      percentage: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const mostAppliedRole = sortedRoles[0]?.name || "—";

  // ==========================================
  // Row 3 Component B: Most Applied Companies
  // ==========================================
  const companyCounts: Record<string, number> = {};
  apps.forEach((a) => {
    const company = a.company.trim();
    if (company) {
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    }
  });
  const sortedCompanies = Object.entries(companyCounts)
    .map(([company, count]) => ({
      name: company,
      count,
      percentage: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const mostAppliedCompany = sortedCompanies[0]?.name || "—";

  // ==========================================
  // Row 4 Component A: Learning Analytics
  // ==========================================
  const roadmapsGenerated = appState.gapCloser.analytics.roadmapsGenerated || 0;
  const skillsLearned = appState.gapCloser.learnedSkills.length || 0;
  
  let totalTasks = 0;
  let completedTasks = 0;
  Object.keys(appState.gapCloser.roadmaps || {}).forEach((rmId) => {
    totalTasks += 7;
    const progressMap = appState.gapCloser.progress[rmId] || {};
    completedTasks += Object.values(progressMap).filter(Boolean).length;
  });
  const learningCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ==========================================
  // Row 4 Component B: Career Insights Engine
  // ==========================================
  const generateInsights = () => {
    const list: string[] = [];

    // Insight 1: Top Missing Skill percentage
    if (mostCommonMissingSkill !== "—" && totalMissingInstances > 0) {
      const topCount = missingCounts[mostCommonMissingSkill.toLowerCase()] || missingCounts[mostCommonMissingSkill] || 0;
      const pct = Math.round((topCount / totalMissingInstances) * 100);
      list.push(`"${mostCommonMissingSkill}" represents ${pct}% of your detected skill gaps. We recommend generating an AI roadmap for it.`);
    }

    // Insight 2: Most Targeted Role
    if (mostAppliedRole !== "—") {
      list.push(`"${mostAppliedRole}" is currently your most targeted role, representing ${sortedRoles[0]?.percentage || 0}% of applications.`);
    }

    // Insight 3: Interview stage percentage representation
    if (totalApps > 0) {
      const interviewPct = Math.round((totalInterviews / totalApps) * 100);
      list.push(`Applications in Interview stage currently represent ${interviewPct}% of your job search progress.`);
    }

    // Insight 4: ATS Score progression
    const historicalAtsScores = history.map(h => h.matchScore || 0).filter(Boolean);
    if (historicalAtsScores.length >= 2) {
      const firstHalf = historicalAtsScores.slice(Math.floor(historicalAtsScores.length / 2));
      const secondHalf = historicalAtsScores.slice(0, Math.floor(historicalAtsScores.length / 2));
      const avgFirst = firstHalf.reduce((a,b)=>a+b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a,b)=>a+b, 0) / secondHalf.length;
      if (avgSecond > avgFirst) {
        list.push(`Your average ATS score is improving over time (up to ${Math.round(avgSecond)}% in recent runs).`);
      } else {
        list.push(`Keep optimizing your resume parameters; your current average match score is stable at ${Math.round(avgSecond)}%.`);
      }
    } else {
      list.push("Run more Job Matches to begin modeling your ATS score improvement timeline.");
    }

    return list.slice(0, 4);
  };
  const dynamicInsights = generateInsights();

  // ==========================================
  // Section 5: ATS Score Distribution (Buckets)
  // ==========================================
  // Buckets: 90+, 80-89, 70-79, 60-69, Below 60
  const bucketCounts = {
    "90+": 0,
    "80-89": 0,
    "70-79": 0,
    "60-69": 0,
    "Below 60": 0,
  };

  atsScores.forEach((score) => {
    if (score >= 90) bucketCounts["90+"]++;
    else if (score >= 80) bucketCounts["80-89"]++;
    else if (score >= 70) bucketCounts["70-79"]++;
    else if (score >= 60) bucketCounts["60-69"]++;
    else bucketCounts["Below 60"]++;
  });

  const atsBucketData = Object.entries(bucketCounts).map(([bucket, count]) => ({
    bucket,
    count,
  }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Career Hub Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time analytics and dynamic career insights generated from your applications and analysis histories.
          </p>
        </motion.div>

        {/* Career Overview Metrics Card Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Applications", value: totalApps, icon: Briefcase, color: "text-blue-400" },
            { label: "Active Applications", value: activeApps, icon: TrendingUp, color: "text-cyan-400" },
            { label: "Interviews", value: totalInterviews, icon: Target, color: "text-warning" },
            { label: "Offers", value: totalOffers, icon: Award, color: "text-success" },
            { label: "Success Rate", value: `${successRate}%`, icon: UserCheck, color: "text-primary" },
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="glass-card card-hover animate-pulse-subtle">
                <CardContent className="p-4 flex items-center justify-between h-20">
                  <div className="flex flex-col justify-between h-full">
                    <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                    <span className="text-2xl font-bold text-foreground">{card.value}</span>
                  </div>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ==========================================
            Row 1: Application Funnel & ATS Performance (Plus ATS Distribution)
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Application Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalApps === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Add applications to visualize the funnel
                </div>
              ) : (
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                        labelStyle={{ color: "#94a3b8" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ATS Performance & Score Buckets */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> ATS Score Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-border/40">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Min</span>
                  <p className="text-sm font-bold text-red-400">{minATS || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase text-primary">Avg</span>
                  <p className="text-sm font-bold text-blue-400">{avgATS || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase text-green-400">Max</span>
                  <p className="text-sm font-bold text-green-400">{maxATS || "—"}</p>
                </div>
              </div>

              {/* Bucket Distribution (Horizontal Bars) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">Score Distribution</span>
                {atsBucketData.map((item) => {
                  const pct = atsScores.length > 0 ? Math.round((item.count / atsScores.length) * 100) : 0;
                  return (
                    <div key={item.bucket} className="space-y-0.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{item.bucket}</span>
                        <span>{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            Row 2: Top Missing Skills & Application Status Distribution
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Missing Skills */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Top Missing Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {top5Missing.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No missing skills history found yet.</p>
              ) : (
                top5Missing.map((item) => {
                  const pct = totalMissingInstances > 0 ? Math.round((item.count / totalMissingInstances) * 100) : 0;
                  return (
                    <div key={item.skill} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200 capitalize">{item.skill}</span>
                        <span className="text-muted-foreground">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div className="bg-red-500/80 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Pie/Doughnut Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Application Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 h-[200px]">
              {totalApps === 0 ? (
                <div className="w-full text-center text-muted-foreground text-sm">
                  No tracking distribution data
                </div>
              ) : (
                <>
                  <div className="w-1/2 h-[150px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-1.5">
                    {statusPieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 capitalize">{item.name}</span>
                        <span className="text-muted-foreground ml-auto font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            Row 3: Most Applied Roles & Top Companies Applied
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Most Applied Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No applications tracked yet.</p>
              ) : (
                sortedRoles.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 capitalize">{idx + 1}. {item.name}</span>
                      <span className="text-muted-foreground">{item.count} applications ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-primary/70 h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Top Companies Applied
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No applications tracked yet.</p>
              ) : (
                sortedCompanies.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 capitalize">{idx + 1}. {item.name}</span>
                      <span className="text-muted-foreground">{item.count} applications ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-blue-500/70 h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            Row 4: Learning Analytics & Career Insights
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Analytics */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> Learning Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/40 border border-border/50 text-center">
                  <span className="text-2xl font-bold text-foreground">{roadmapsGenerated}</span>
                  <p className="text-xs text-muted-foreground mt-1">Roadmaps Generated</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/40 border border-border/50 text-center">
                  <span className="text-2xl font-bold text-foreground">{skillsLearned}</span>
                  <p className="text-xs text-muted-foreground mt-1">Skills Mastered</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-sm">
                  <span className="text-muted-foreground">Learning Completion Rate</span>
                  <span className="font-bold text-foreground">{learningCompletionRate}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${learningCompletionRate}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400" /> Calculated across all roadmap checklist tasks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Insights Engine */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" /> Career Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {dynamicInsights.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Generate analyses and tracking details to compute dynamic insights.</p>
              ) : (
                dynamicInsights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 items-start text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
