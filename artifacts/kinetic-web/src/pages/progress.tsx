import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useKinetic } from "@/lib/context";
import { ArrowLeft, Flame, Dumbbell, Clock, Calendar } from "lucide-react";

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getStreak(sessions: { date: string; completed: boolean }[]) {
  if (!sessions.length) return 0;
  const completedDates = sessions
    .filter((s) => s.completed)
    .map((s) => new Date(s.date).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!completedDates.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < completedDates.length; i++) {
    const date = new Date(completedDates[i]);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === i || (i === 0 && diff <= 1)) {
      streak++;
    } else break;
  }
  return streak;
}

export default function Progress() {
  const [, navigate] = useLocation();
  const { sessions } = useKinetic();

  const completedSessions = sessions.filter((s) => s.completed);
  const streak = getStreak(sessions);
  const totalMinutes = Math.floor(sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);
  const totalSets = sessions.reduce((sum, s) => sum + s.sets_logged.length, 0);

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-12">
      <div className="max-w-lg mx-auto px-5 pt-8">
        {/* Back */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-['Outfit']">Back</span>
        </button>

        <h1 className="text-2xl font-bold font-['Outfit'] mb-8">Progress</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-[#1A1A1A] border border-[#CCFF00]/20"
          >
            <Flame className="w-5 h-5 text-[#CCFF00] mb-3" />
            <div className="text-3xl font-bold text-[#CCFF00] font-['Outfit']">{streak}</div>
            <div className="text-white/40 text-sm mt-1">Day streak</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-[#1A1A1A] border border-white/8"
          >
            <Dumbbell className="w-5 h-5 text-white/40 mb-3" />
            <div className="text-3xl font-bold font-['Outfit']">{completedSessions.length}</div>
            <div className="text-white/40 text-sm mt-1">Workouts</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#1A1A1A] border border-white/8"
          >
            <Clock className="w-5 h-5 text-white/40 mb-3" />
            <div className="text-3xl font-bold font-['Outfit']">{totalMinutes}</div>
            <div className="text-white/40 text-sm mt-1">Minutes total</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-5 rounded-2xl bg-[#1A1A1A] border border-white/8"
          >
            <Calendar className="w-5 h-5 text-white/40 mb-3" />
            <div className="text-3xl font-bold font-['Outfit']">{totalSets}</div>
            <div className="text-white/40 text-sm mt-1">Sets logged</div>
          </motion.div>
        </div>

        {/* Recent sessions */}
        <h2 className="text-base font-bold font-['Outfit'] mb-4 text-white/60">Recent Workouts</h2>

        {completedSessions.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-['Outfit']">No workouts yet. Start one from your plan.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {[...completedSessions].reverse().map((session, i) => {
            const date = new Date(session.date);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl bg-[#1A1A1A] border border-white/8"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold font-['Outfit']">{session.day}</h3>
                    <p className="text-white/30 text-xs mt-0.5">
                      {date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[#CCFF00] font-bold font-['Space_Mono'] text-sm">
                      {formatTime(session.duration_seconds)}
                    </div>
                    <div className="text-white/30 text-xs mt-0.5">{session.sets_logged.length} sets</div>
                  </div>
                </div>

                {session.sets_logged.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(session.sets_logged.map((s) => s.exercise))].map((ex) => (
                        <span key={ex} className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/40 font-['Space_Mono']">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
