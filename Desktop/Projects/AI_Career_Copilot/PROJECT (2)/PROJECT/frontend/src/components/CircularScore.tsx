import { motion } from "framer-motion";

interface CircularScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return { color: "hsl(var(--success))", label: "Strong", textClass: "text-success" };
  if (score >= 50) return { color: "hsl(var(--warning))", label: "Moderate", textClass: "text-warning" };
  return { color: "hsl(var(--destructive))", label: "Weak", textClass: "text-destructive" };
};

export const CircularScore = ({ score, size = 96, strokeWidth: customStrokeWidth, className = "" }: CircularScoreProps) => {
  const strokeWidth = customStrokeWidth || (size < 70 ? 5 : 8);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { color, label, textClass } = getScoreColor(score);

  const scoreFontSize = Math.max(size * 0.22, 12);
  const labelFontSize = Math.max(size * 0.09, 7.5);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none select-none">
        <span className="font-bold text-foreground" style={{ fontSize: `${scoreFontSize}px` }}>{score}%</span>
        {size >= 65 && (
          <span className={`font-semibold tracking-wide uppercase mt-0.5 ${textClass}`} style={{ fontSize: `${labelFontSize}px` }}>{label}</span>
        )}
      </div>
    </div>
  );
};
