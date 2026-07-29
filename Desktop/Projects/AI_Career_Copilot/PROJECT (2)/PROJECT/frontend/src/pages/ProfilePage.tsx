import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Briefcase, 
  Link as LinkIcon, 
  Info, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import API from "@/api/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface UserProfile {
  fullName: string;
  email: string;
  profilePicture: string;
  targetRole: string;
  careerGoal: string;
  college: string;
  graduationYear: string;
  linkedin: string;
  github: string;
  portfolio: string;
  bio: string;
}

const CAREER_GOALS = [
  "Software Engineer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "ML Engineer",
  "Cybersecurity Analyst",
  "Custom"
];

const ProfilePage = () => {
  const { user } = useAuth();
  const userId = user?.id || "guest";

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    profilePicture: "",
    targetRole: "",
    careerGoal: "Software Engineer",
    college: "",
    graduationYear: "",
    linkedin: "",
    github: "",
    portfolio: "",
    bio: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await API.get("/profile");
        const data = res.data;
        setProfile({
          fullName: data.fullName || "",
          email: data.email || "",
          profilePicture: data.profilePicture || "",
          targetRole: data.targetRole || "",
          careerGoal: data.careerGoal || "Software Engineer",
          college: data.college || "",
          graduationYear: data.graduationYear || "",
          linkedin: data.linkedin || "",
          github: data.github || "",
          portfolio: data.portfolio || "",
          bio: data.bio || ""
        });
        if (data.profilePicture) {
          setAvatarPreview(data.profilePicture);
        }
        localStorage.setItem(`profileCache_${userId}`, JSON.stringify(data));
      } catch (err: any) {
        console.error("Failed to load profile details", err);
        // Load fallback from localStorage if present
        const cached = localStorage.getItem(`profileCache_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
          if (parsed.profilePicture) setAvatarPreview(parsed.profilePicture);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  // Save changes
  const handleSaveProfile = async () => {
    setMsg(null);
    if (!profile.fullName.trim()) {
      setMsg({ type: "error", text: "Full Name is required" });
      return;
    }

    // Client-side URL format check
    if (profile.linkedin && !profile.linkedin.match(/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i)) {
      setMsg({ type: "error", text: "Invalid LinkedIn URL. Must start with linkedin.com" });
      return;
    }
    if (profile.github && !profile.github.match(/^(https?:\/\/)?(www\.)?github\.com\/.*$/i)) {
      setMsg({ type: "error", text: "Invalid GitHub URL. Must start with github.com" });
      return;
    }
    if (profile.portfolio && !profile.portfolio.match(/^https?:\/\/.*$/i)) {
      setMsg({ type: "error", text: "Invalid Portfolio URL. Must start with http:// or https://" });
      return;
    }

    try {
      setSaving(true);
      console.log("[DEBUG] Profile data before save:", profile);
      console.log("[DEBUG] Payload sent to backend:", profile);
      const res = await API.put("/profile", profile);
      console.log("[DEBUG] Backend response (profile save):", res.data);
      const updatedProfile = res.data.profile;
      
      // Update state and cache
      const finalState = { ...profile, ...updatedProfile };
      setProfile(finalState);
      localStorage.setItem(`profileCache_${userId}`, JSON.stringify(finalState));
      
      // Update local storage 'user' name as well if it changed
      const userCached = JSON.parse(localStorage.getItem("user") || "{}");
      if (userCached.name !== finalState.fullName || userCached.avatar !== finalState.profilePicture) {
        userCached.name = finalState.fullName;
        userCached.avatar = finalState.profilePicture;
        localStorage.setItem("user", JSON.stringify(userCached));
      }

      setMsg({ type: "success", text: "Profile saved successfully!" });
      toast.success("Profile saved successfully!");
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Failed to save profile";
      setMsg({ type: "error", text: errMsg });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Convert uploaded image to Base64
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB limit)
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 5) {
      toast.error("File is too large. Maximum size allowed is 5MB.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file format. Please upload JPG, PNG, or WEBP.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      setProfile(prev => ({ ...prev, profilePicture: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const userInitial = profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "U";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">Loading your profile details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your personal, educational, and professional links</p>
        </motion.div>

        {/* ─── Profile Photo ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="w-4 h-4 text-primary" /> Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground text-base">{profile.fullName || "Your Name"}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-slate-900 border-border/60 hover:bg-slate-800"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="w-3.5 h-3.5 mr-2" />
                  Upload Photo
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Core Info ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g. Rishi Gogia"
                    className="h-11 bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Read Only)</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="h-11 bg-muted text-muted-foreground border-border/30 cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Career Info ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="w-4 h-4 text-primary" /> Career Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label htmlFor="targetRole">Target Role</Label>
                  <Input
                    id="targetRole"
                    value={profile.targetRole}
                    onChange={(e) => setProfile(prev => ({ ...prev, targetRole: e.target.value }))}
                    placeholder="e.g. Data Analyst"
                    className="h-11 bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label htmlFor="college">College / University</Label>
                  <Input
                    id="college"
                    value={profile.college}
                    onChange={(e) => setProfile(prev => ({ ...prev, college: e.target.value }))}
                    placeholder="e.g. Stanford University"
                    className="h-11 bg-background border-border/50"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    value={profile.graduationYear}
                    onChange={(e) => setProfile(prev => ({ ...prev, graduationYear: e.target.value }))}
                    placeholder="e.g. 2026"
                    className="h-11 bg-background border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Career Goal Profile</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CAREER_GOALS.map((goal) => (
                    <label
                      key={goal}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        profile.careerGoal === goal
                          ? "border-primary bg-primary/10 text-white font-medium shadow-sm shadow-primary/20"
                          : "border-border/60 bg-background/50 hover:bg-accent text-muted-foreground hover:text-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="careerGoal"
                        value={goal}
                        checked={profile.careerGoal === goal}
                        onChange={() => setProfile(prev => ({ ...prev, careerGoal: goal }))}
                        className="sr-only"
                      />
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        profile.careerGoal === goal ? "border-primary" : "border-muted-foreground/50"
                      }`}>
                        {profile.careerGoal === goal && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </span>
                      <span className="text-xs truncate">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Links ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LinkIcon className="w-4 h-4 text-primary" /> Professional Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin"
                  value={profile.linkedin}
                  onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="h-11 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Profile URL</Label>
                <Input
                  id="github"
                  value={profile.github}
                  onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
                  placeholder="https://github.com/yourusername"
                  className="h-11 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio / Personal Website URL</Label>
                <Input
                  id="portfolio"
                  value={profile.portfolio}
                  onChange={(e) => setProfile(prev => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://yourportfolio.com"
                  className="h-11 bg-background border-border/50"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Bio ─── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="w-4 h-4 text-primary" /> About Me
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a brief professional summary or introduction..."
                  className="min-h-[120px] bg-background border-border/50 resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Message and Submit */}
        <div className="flex flex-col gap-3">
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm ${
                msg.type === "success" 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {msg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{msg.text}</span>
            </motion.div>
          )}

          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base transition-all rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
