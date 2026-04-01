import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKinetic } from "@/lib/context";
import type { WorkoutSession } from "@/lib/store";
import { ArrowLeft, Check, X, ChevronUp, ChevronDown, Trophy, Clock } from "lucide-react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface LoggedSet {
  exercise: string;
  reps: number;
  weight_kg: number;
}

export default function Session() {
  const { day } = useParams<{ day: string }>();
  const [, navigate] = useLocation();
  const { plan, addSession } = useKinetic();

  const [elapsed, setElapsed] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (restTimer === null || restTimer <= 0) {
      if (restTimer === 0) setRestTimer(null);
      return;
    }
    const t = setTimeout(() => setRestTimer((r) => (r ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [restTimer]);

  if (!plan) return null;
  const dayPlan = plan.days.find((d) => d.day.toLowerCase() === day?.toLowerCase());
  if (!dayPlan || dayPlan.type === "rest") {
    navigate("/");
    return null;
  }

  const exercises = dayPlan.exercises;
  const currentExercise = exercises[exerciseIdx];

  const logSet = () => {
    setLoggedSets((prev) => [...prev, {
      exercise: currentExercise.name,
      reps,
      weight_kg: weight,
    }]);

    const nextSet = setIdx + 1;
    if (nextSet >= currentExercise.sets) {
      const nextEx = exerciseIdx + 1;
      if (nextEx >= exercises.length) {
        setRestTimer(null);
        finishWorkout();
      } else {
        setExerciseIdx(nextEx);
        setSetIdx(0);
        const next = exercises[nextEx];
        setReps(next.reps);
        setWeight(next.suggested_weight_kg);
        setRestTimer(currentExercise.rest_seconds);
      }
    } else {
      setSetIdx(nextSet);
      setRestTimer(currentExercise.rest_seconds);
    }
  };

  const skipSet = () => {
    const nextSet = setIdx + 1;
    if (nextSet >= currentExercise.sets) {
      const nextEx = exerciseIdx + 1;
      if (nextEx >= exercises.length) {
        finishWorkout();
      } else {
        setExerciseIdx(nextEx);
        setSetIdx(0);
        const next = exercises[nextEx];
        setReps(next.reps);
        setWeight(next.suggested_weight_kg);
      }
    } else {
      setSetIdx(nextSet);
    }
    setRestTimer(null);
  };

  const finishWorkout = async () => {
    const session: WorkoutSession = {
      day: dayPlan.day,
      date: new Date().toISOString(),
      duration_seconds: elapsed,
      sets_logged: loggedSets,
      completed: true,
    };
    try {
      await addSession(session);
    } catch {
      // session still shows complete even if save fails
    }
    setFinished(true);
  };

  // Init reps/weight on mount
  useEffect(() => {
    if (exercises.length > 0) {
      setReps(exercises[0].reps);
      setWeight(exercises[0].suggested_weight_kg);
    }
  }, []);

  if (finished) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-[#CCFF00]/20 border-2 border-[#CCFF00] flex items-center justify-center"
          >
            <Trophy className="w-12 h-12 text-[#CCFF00]" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold font-['Outfit'] mb-2">Workout Complete</h1>
            <p className="text-white/40 text-sm">{dayPlan.title}</p>
          </div>
          <div className="flex gap-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#CCFF00] font-['Outfit']">{formatTime(elapsed)}</div>
              <div className="text-white/40 text-xs mt-1">Duration</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-[#CCFF00] font-['Outfit']">{loggedSets.length}</div>
              <div className="text-white/40 text-xs mt-1">Sets logged</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full max-w-xs h-12 rounded-2xl bg-[#CCFF00] text-black font-bold font-['Outfit'] hover:bg-[#d9ff33] transition-all active:scale-[0.98]"
          >
            Back to Plan
          </button>
        </motion.div>
      </div>
    );
  }

  const progress = (exerciseIdx / exercises.length) * 100 + (setIdx / currentExercise.sets) * (100 / exercises.length);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <div className="max-w-lg mx-auto w-full px-5 pt-8 pb-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(`/workout/${day}`)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-white/40">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-['Space_Mono'] text-sm">{formatTime(elapsed)}</span>
          </div>
          <button onClick={finishWorkout} className="text-white/30 hover:text-white text-xs font-['Outfit'] transition-colors">
            Finish
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-[#CCFF00] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Rest timer overlay */}
        <AnimatePresence>
          {restTimer !== null && restTimer > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-[#1A1A1A] border border-white/10 text-center"
            >
              <p className="text-white/40 text-xs mb-1 font-['Space_Mono']">REST</p>
              <p className="text-3xl font-bold text-[#CCFF00] font-['Space_Mono']">{restTimer}s</p>
              <button
                onClick={() => setRestTimer(null)}
                className="mt-2 text-xs text-white/30 hover:text-white transition-colors"
              >
                Skip rest
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exercise info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${exerciseIdx}-${setIdx}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1"
          >
            <div className="mb-2">
              <span className="text-xs text-white/30 font-['Space_Mono']">
                Exercise {exerciseIdx + 1} of {exercises.length} · Set {setIdx + 1} of {currentExercise.sets}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Outfit'] mb-1">{currentExercise.name}</h2>
            <p className="text-white/40 text-sm mb-8 capitalize">{currentExercise.muscle_group}</p>

            {/* Reps input */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 p-4 bg-[#1A1A1A] rounded-2xl border border-white/10">
                <div className="text-white/40 text-xs mb-3 font-['Space_Mono']">REPS</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setReps((r) => Math.max(1, r - 1))}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-bold font-['Outfit'] text-[#CCFF00]">{reps}</span>
                  <button
                    onClick={() => setReps((r) => r + 1)}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-[#1A1A1A] rounded-2xl border border-white/10">
                <div className="text-white/40 text-xs mb-3 font-['Space_Mono']">WEIGHT (kg)</div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWeight((w) => Math.max(0, parseFloat((w - 2.5).toFixed(1))))}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="text-3xl font-bold font-['Outfit'] text-[#CCFF00]">{weight}</span>
                  <button
                    onClick={() => setWeight((w) => parseFloat((w + 2.5).toFixed(1)))}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Previous sets */}
            {loggedSets.filter((s) => s.exercise === currentExercise.name).length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-white/30 font-['Space_Mono'] mb-2">PREVIOUS SETS</p>
                <div className="flex gap-2 flex-wrap">
                  {loggedSets
                    .filter((s) => s.exercise === currentExercise.name)
                    .map((s, i) => (
                      <div key={i} className="px-3 py-1.5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-xs text-[#CCFF00] font-['Space_Mono']">
                        {s.reps}×{s.weight_kg}kg
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-3 mt-auto">
          <button
            onClick={skipSet}
            className="w-12 h-12 rounded-2xl border border-white/10 bg-[#1A1A1A] flex items-center justify-center hover:border-white/25 transition-colors"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
          <button
            onClick={logSet}
            className="flex-1 h-12 rounded-2xl bg-[#CCFF00] text-black font-bold font-['Outfit'] flex items-center justify-center gap-2 hover:bg-[#d9ff33] active:scale-[0.98] transition-all"
          >
            <Check className="w-5 h-5" />
            Log Set
          </button>
        </div>
      </div>
    </div>
  );
}
