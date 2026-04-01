import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useKinetic } from "@/lib/context";
import { ArrowLeft, Play, Target, Dumbbell, Zap } from "lucide-react";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  primary: { bg: "bg-[#CCFF00]/15", text: "text-[#CCFF00]", label: "PRIMARY LIFT" },
  accessory: { bg: "bg-blue-400/15", text: "text-blue-400", label: "ACCESSORY" },
  isolation: { bg: "bg-purple-400/15", text: "text-purple-400", label: "ISOLATION" },
};

export default function Workout() {
  const { day } = useParams<{ day: string }>();
  const [, navigate] = useLocation();
  const { plan } = useKinetic();

  if (!plan) return null;

  const dayPlan = plan.days.find((d) => d.day.toLowerCase() === day?.toLowerCase());
  if (!dayPlan || dayPlan.type === "rest") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32">
      <div className="max-w-lg mx-auto px-5 pt-8">
        {/* Back */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-['Outfit']">Week plan</span>
        </button>

        {/* Day header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-white/30 font-['Space_Mono']">{dayPlan.day.toUpperCase()}</span>
            <span className="text-white/20">·</span>
            <span className={`text-xs font-['Space_Mono'] ${dayPlan.intensity === "high" ? "text-red-400" : dayPlan.intensity === "moderate" ? "text-[#CCFF00]" : "text-white/40"}`}>
              {dayPlan.intensity.toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-bold font-['Outfit']">{dayPlan.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
            <span>{dayPlan.exercises.length} exercises</span>
            <span>·</span>
            <span>{dayPlan.estimated_duration} min</span>
          </div>
        </div>

        {/* Exercises */}
        <div className="flex flex-col gap-3 mb-8">
          {dayPlan.exercises.map((exercise, i) => {
            const cat = CATEGORY_COLORS[exercise.category] ?? CATEGORY_COLORS.accessory;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-4 rounded-2xl bg-[#1A1A1A] border border-white/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-['Space_Mono'] ${cat.bg} ${cat.text}`}>
                        {cat.label}
                      </span>
                    </div>
                    <h3 className="font-bold font-['Outfit'] text-base">{exercise.name}</h3>
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">{exercise.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#CCFF00] font-bold font-['Outfit'] text-lg leading-none">
                      {exercise.sets}×{exercise.reps}
                    </div>
                    <div className="text-white/30 text-xs mt-1">sets × reps</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/8">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Dumbbell className="w-3 h-3" />
                    <span>{exercise.suggested_weight_kg > 0 ? `${exercise.suggested_weight_kg}kg` : "Bodyweight"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Target className="w-3 h-3" />
                    <span className="capitalize">{exercise.muscle_group}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
                    <span>{exercise.rest_seconds}s rest</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/session/${day}`)}
            className="w-full h-14 rounded-2xl bg-[#CCFF00] text-black font-bold font-['Outfit'] flex items-center justify-center gap-2 hover:bg-[#d9ff33] active:scale-[0.98] transition-all text-base"
          >
            <Play className="w-5 h-5" fill="black" />
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}
