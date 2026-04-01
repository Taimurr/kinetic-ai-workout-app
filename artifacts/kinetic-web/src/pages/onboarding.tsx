import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGeneratePlan } from "@workspace/api-client-react";
import { useKinetic } from "@/lib/context";
import type { UserProfile } from "@/lib/store";
import { Dumbbell, Zap, TrendingDown, Activity, Loader2, ChevronRight, ChevronLeft } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const GOALS = [
  { value: "strength", label: "Build Strength", description: "Lift heavier, get stronger", icon: Zap },
  { value: "muscle_gain", label: "Gain Muscle", description: "Grow bigger, look better", icon: Dumbbell },
  { value: "weight_loss", label: "Lose Weight", description: "Burn fat, stay lean", icon: TrendingDown },
  { value: "general_fitness", label: "General Fitness", description: "Stay active and healthy", icon: Activity },
];

const EXPERIENCE = [
  { value: "beginner", label: "Beginner", description: "Less than 6 months training" },
  { value: "some_experience", label: "Some Experience", description: "6 months to 2 years" },
  { value: "intermediate", label: "Intermediate", description: "2+ years of consistent training" },
];

const EQUIPMENT = [
  { value: "full_gym", label: "Full Gym", description: "Barbells, dumbbells, machines, cables" },
  { value: "barbells_and_dumbbells", label: "Barbells + Dumbbells", description: "Free weights only" },
  { value: "dumbbells_only", label: "Dumbbells Only", description: "Dumbbells and bodyweight" },
  { value: "bodyweight_only", label: "Bodyweight Only", description: "No equipment needed" },
];

const TIME_OPTIONS = [30, 45, 60, 75];
const DAY_OPTIONS = [2, 3, 4, 5];

const stepTitles: Record<Step, string> = {
  1: "What's your goal?",
  2: "Your experience level",
  3: "Available equipment",
  4: "Time per workout",
  5: "Days per week",
};

const stepSubtitles: Record<Step, string> = {
  1: "What are you training for?",
  2: "How long have you been lifting?",
  3: "What do you have access to?",
  4: "How long is each session?",
  5: "How many days can you commit?",
};

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { setProfile, setPlan } = useKinetic();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = useGeneratePlan();

  const goNext = () => setStep((s) => Math.min(5, s + 1) as Step);
  const goBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const set = (key: keyof UserProfile, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const canContinue = () => {
    if (step === 1) return !!form.goal;
    if (step === 2) return !!form.experience_level;
    if (step === 3) return !!form.equipment;
    if (step === 4) return !!form.time_per_workout;
    if (step === 5) return !!form.days_per_week;
    return false;
  };

  const handleFinish = async () => {
    const profile = form as UserProfile;
    setProfile(profile);
    setGenerating(true);
    setError(null);
    try {
      const plan = await generatePlan.mutateAsync({ data: profile });
      setPlan(plan);
      navigate("/");
    } catch (e) {
      setError("Plan generation failed. Please try again.");
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-[#CCFF00]/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#CCFF00]/5 animate-ping" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold font-['Outfit'] mb-2">Building your plan</h2>
            <p className="text-white/50 text-sm">AI is crafting a personalized program just for you...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col text-white">
      <div className="max-w-lg mx-auto w-full flex flex-col min-h-screen px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#CCFF00] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" fill="black" />
            </div>
            <span className="font-bold text-lg font-['Outfit'] tracking-tight">KINETIC</span>
          </div>
          <span className="text-white/30 text-sm font-['Space_Mono']">{step} / 5</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-[#CCFF00] rounded-full"
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <h1 className="text-3xl font-bold font-['Outfit'] mb-1">{stepTitles[step]}</h1>
            <p className="text-white/40 mb-8 text-sm">{stepSubtitles[step]}</p>

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(({ value, label, description, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => set("goal", value)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                      form.goal === value
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-3 ${form.goal === value ? "text-[#CCFF00]" : "text-white/40"}`} />
                    <div className="font-semibold text-sm font-['Outfit']">{label}</div>
                    <div className="text-white/40 text-xs mt-0.5">{description}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                {EXPERIENCE.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => set("experience_level", value)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      form.experience_level === value
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                    }`}
                  >
                    <div>
                      <div className="font-semibold font-['Outfit']">{label}</div>
                      <div className="text-white/40 text-sm mt-0.5">{description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.experience_level === value ? "border-[#CCFF00]" : "border-white/20"
                    }`}>
                      {form.experience_level === value && <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                {EQUIPMENT.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => set("equipment", value)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      form.equipment === value
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                    }`}
                  >
                    <div>
                      <div className="font-semibold font-['Outfit']">{label}</div>
                      <div className="text-white/40 text-sm mt-0.5">{description}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.equipment === value ? "border-[#CCFF00]" : "border-white/20"
                    }`}>
                      {form.equipment === value && <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]" />}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-2 gap-3">
                {TIME_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => set("time_per_workout", mins)}
                    className={`p-6 rounded-2xl border text-center transition-all duration-200 ${
                      form.time_per_workout === mins
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                    }`}
                  >
                    <span className={`text-3xl font-bold font-['Outfit'] ${form.time_per_workout === mins ? "text-[#CCFF00]" : ""}`}>{mins}</span>
                    <div className="text-white/40 text-sm mt-1">minutes</div>
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="grid grid-cols-2 gap-3">
                {DAY_OPTIONS.map((days) => (
                  <button
                    key={days}
                    onClick={() => set("days_per_week", days)}
                    className={`p-6 rounded-2xl border text-center transition-all duration-200 ${
                      form.days_per_week === days
                        ? "border-[#CCFF00] bg-[#CCFF00]/10"
                        : "border-white/10 bg-[#1A1A1A] hover:border-white/25"
                    }`}
                  >
                    <span className={`text-3xl font-bold font-['Outfit'] ${form.days_per_week === days ? "text-[#CCFF00]" : ""}`}>{days}</span>
                    <div className="text-white/40 text-sm mt-1">{days === 1 ? "day" : "days"} / week</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3 mt-10 pt-4">
          {step > 1 && (
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-2xl border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:border-white/25 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white/60" />
            </button>
          )}
          <button
            onClick={step === 5 ? handleFinish : goNext}
            disabled={!canContinue()}
            className="flex-1 h-12 rounded-2xl bg-[#CCFF00] text-black font-bold font-['Outfit'] text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all hover:bg-[#d9ff33] active:scale-[0.98]"
          >
            {step === 5 ? "Generate My Plan" : "Continue"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
