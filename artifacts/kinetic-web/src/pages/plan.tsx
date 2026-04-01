import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useKinetic } from "@/lib/context";
import { Zap, Moon, ChevronRight, RefreshCw, Clock, Flame } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getTodayName() {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

const INTENSITY_COLORS: Record<string, string> = {
  high: "text-red-400",
  moderate: "text-[#CCFF00]",
  low: "text-white/40",
};

const INTENSITY_DOTS: Record<string, string> = {
  high: "bg-red-400",
  moderate: "bg-[#CCFF00]",
  low: "bg-white/20",
};

export default function Plan() {
  const [, navigate] = useLocation();
  const { plan, sessions } = useKinetic();
  const today = getTodayName();

  if (!plan) return null;

  const weekSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    return sessionDate >= weekStart;
  });

  const totalMinutes = plan.days
    .filter((d) => d.type === "training")
    .reduce((sum, d) => sum + d.estimated_duration, 0);

  const completedDays = weekSessions.filter((s) => s.completed).length;
  const trainingDays = plan.days.filter((d) => d.type === "training").length;

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24">
      <div className="max-w-lg mx-auto px-5 pt-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" fill="black" />
            </div>
            <span className="font-bold text-lg font-['Outfit'] tracking-tight">KINETIC</span>
          </div>
          <button
            onClick={() => navigate("/progress")}
            className="text-white/40 hover:text-white transition-colors text-sm font-['Outfit']"
          >
            Progress
          </button>
        </div>

        <div className="mt-8 mb-6">
          <h1 className="text-2xl font-bold font-['Outfit']">This Week</h1>
          <div className="flex gap-4 mt-2 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {totalMinutes} min / week
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              {completedDays} / {trainingDays} done
            </span>
          </div>
        </div>

        {/* Weekly progress dots */}
        <div className="flex gap-2 mb-8">
          {plan.days.map((day, i) => {
            const isToday = day.day === today;
            const isDone = weekSessions.some((s) => s.day === day.day && s.completed);
            return (
              <div key={day.day} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`w-full h-1.5 rounded-full ${
                  isDone ? "bg-[#CCFF00]" : day.type === "rest" ? "bg-white/10" : isToday ? "bg-[#CCFF00]/40" : "bg-white/20"
                }`} />
                <span className={`text-[10px] font-['Space_Mono'] ${isToday ? "text-[#CCFF00]" : "text-white/30"}`}>
                  {SHORT_DAYS[i]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day cards */}
        <div className="flex flex-col gap-3">
          {plan.days.map((day, i) => {
            const isToday = day.day === today;
            const isDone = weekSessions.some((s) => s.day === day.day && s.completed);
            const isRest = day.type === "rest";

            return (
              <motion.button
                key={day.day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !isRest && navigate(`/workout/${day.day.toLowerCase()}`)}
                disabled={isRest}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  isToday
                    ? "border-[#CCFF00]/50 bg-[#CCFF00]/5"
                    : isRest
                    ? "border-white/5 bg-[#1A1A1A]/50 cursor-default"
                    : isDone
                    ? "border-[#CCFF00]/20 bg-[#1A1A1A]"
                    : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isToday && (
                      <span className="text-[10px] bg-[#CCFF00] text-black font-bold px-2 py-0.5 rounded font-['Space_Mono']">
                        TODAY
                      </span>
                    )}
                    {isDone && !isToday && (
                      <span className="text-[10px] bg-[#CCFF00]/20 text-[#CCFF00] font-bold px-2 py-0.5 rounded font-['Space_Mono']">
                        DONE
                      </span>
                    )}
                    <span className={`text-sm font-['Space_Mono'] ${isToday ? "text-[#CCFF00]" : "text-white/40"}`}>
                      {day.day.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                  {!isRest && <ChevronRight className="w-4 h-4 text-white/30" />}
                  {isRest && <Moon className="w-4 h-4 text-white/20" />}
                </div>

                <div className="mt-2">
                  <h3 className={`font-bold font-['Outfit'] ${isRest ? "text-white/30" : ""}`}>{day.title}</h3>
                  {!isRest && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/40 text-xs">{day.exercises.length} exercises</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40 text-xs">{day.estimated_duration} min</span>
                      <span className="text-white/20">·</span>
                      <span className={`text-xs flex items-center gap-1 ${INTENSITY_COLORS[day.intensity]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${INTENSITY_DOTS[day.intensity]}`} />
                        {day.intensity}
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={() => navigate("/onboarding")}
          className="mt-6 w-full flex items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm py-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate plan
        </button>
      </div>
    </div>
  );
}
