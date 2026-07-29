import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, FileText, Code, Users } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const AISuggestionsPage = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [technical, setTechnical] = useState<string[]>([]);
  const [behavioral, setBehavioral] = useState<string[]>([]);
  const [role, setRole] = useState("Software Engineer");

  useEffect(() => {
    const stored = localStorage.getItem("latestAnalysis");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    setSuggestions(parsed.ai?.suggestions || []);
    setTechnical(parsed.ai?.questions?.technical || []);
    setBehavioral(parsed.ai?.questions?.behavioral || []);
    setRole(parsed.saved?.role || "Software Engineer");
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Smart Career Roadmap</h1>
              <p className="text-muted-foreground text-sm">Optimized suggestions for <span className="font-semibold text-primary">{role}</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden text-white bg-slate-900	">
            <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
              <CardTitle className="flex gap-2 items-center text-lg">
                <FileText className="w-5 h-5 text-primary" /> Strategic Resume Enhancements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground italic">No suggestions available. Complete an analysis first.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {suggestions.map((s, i) => (
                    <motion.div key={i} whileHover={{ x: 5 }} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:border-primary/50 group">
                      <div className="mt-1.5 flex-shrink-0"><div className="w-2.5 h-2.5 rounded-full bg-primary" /></div>
                      <div className="flex-1 text-white"><p className="text-sm font-medium leading-relaxed">{s}</p></div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{i === 0 ? "Critical" : "Improvement"}</Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="h-full shadow-sm hover:shadow-md border-t-4 border-t-primary text-white bg-slate-900	">
              <CardHeader className="bg-muted/30 border-b border-border/10">
                <CardTitle className="flex gap-2 items-center text-md"><Code className="w-5 h-5 text-primary" /> Technical Deep Dive</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {technical.length > 0 ? technical.map((q, i) => (
                    <AccordionItem key={i} value={`tech-${i}`} className="border-b border-border/10 last:border-0">
                      <AccordionTrigger className="text-left text-[0.9rem] py-4 hover:no-underline">
                        <div className="flex gap-3 text-white"><span className="text-primary font-bold min-w-[30px]">Q{i + 1}.</span><span className="font-semibold line-clamp-2">{q}</span></div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/10 p-4 rounded-b-lg border-t border-muted-foreground/10 text-sm italic text-muted-foreground">Practice answering this with actual projects from your resume.</AccordionContent>
                    </AccordionItem>
                  )) : <p className="text-sm text-center py-4 text-muted-foreground italic">Nothing yet.</p>}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="h-full shadow-sm hover:shadow-md border-t-4 border-t-green-500 text-white bg-slate-900	">
              <CardHeader className="bg-muted/30 border-b border-border/10">
                <CardTitle className="flex gap-2 items-center text-md"><Users className="w-5 h-5 text-green-500" /> Behavioral Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {behavioral.length > 0 ? behavioral.map((q, i) => (
                    <AccordionItem key={i} value={`beh-${i}`} className="border-b border-border/10 last:border-0">
                      <AccordionTrigger className="text-left text-[0.9rem] py-4 hover:no-underline">
                        <div className="flex gap-3 text-white"><span className="text-green-500 font-bold min-w-[30px]">B{i + 1}.</span><span className="font-semibold line-clamp-2">{q}</span></div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/10 p-4 rounded-b-lg border-t border-muted-foreground/10 text-sm text-muted-foreground">Use the STAR method for this response.</AccordionContent>
                    </AccordionItem>
                  )) : <p className="text-sm text-center py-4 text-muted-foreground italic">Nothing yet.</p>}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default AISuggestionsPage;