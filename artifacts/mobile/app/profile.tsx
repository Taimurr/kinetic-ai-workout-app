import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Edit3, RotateCcw, Target, Dumbbell, Clock, Calendar, Zap } from "lucide-react-native";
import Svg, { Rect, Line, Text as SvgText, Circle } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { useApp } from "@/context/AppContext";

const GOAL_LABELS: Record<string, string> = {
  strength: "Build Strength",
  muscle_gain: "Muscle Gain",
  weight_loss: "Weight Loss",
  general_fitness: "General Fitness",
};

const EXP_LABELS: Record<string, string> = {
  beginner: "Beginner",
  some_experience: "Some Experience",
  intermediate: "Intermediate",
};

const EQUIP_LABELS: Record<string, string> = {
  full_gym: "Full Gym",
  dumbbells_only: "Dumbbells Only",
  barbells_and_dumbbells: "Barbells & Dumbbells",
  bodyweight_only: "Bodyweight Only",
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function WeeklyActivityChart({ completedDays, primary, card, border, mutedForeground }: {
  completedDays: { dayName: string; durationSeconds: number }[];
  primary: string;
  card: string;
  border: string;
  mutedForeground: string;
}) {
  const W = 280;
  const H = 90;
  const barW = 26;
  const gap = (W - DAY_LETTERS.length * barW) / (DAY_LETTERS.length + 1);
  const maxDuration = Math.max(...completedDays.map((d) => d.durationSeconds), 1);

  return (
    <Svg width={W} height={H}>
      {DAY_LETTERS.map((letter, i) => {
        const x = gap + i * (barW + gap);
        const hit = completedDays.find((d) => d.dayName === DAY_NAMES[i]);
        const barH = hit ? Math.max(8, (hit.durationSeconds / maxDuration) * 56) : 6;
        const barY = 64 - barH;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={barY}
              width={barW}
              height={barH}
              rx={5}
              fill={hit ? primary : border}
              opacity={hit ? 1 : 0.5}
            />
            <SvgText
              x={x + barW / 2}
              y={82}
              textAnchor="middle"
              fontSize={10}
              fontFamily="Inter_600SemiBold"
              fill={mutedForeground}
            >
              {letter}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function DurationSparkline({ completedDays, primary, mutedForeground }: {
  completedDays: { durationSeconds: number; workoutTitle: string }[];
  primary: string;
  mutedForeground: string;
}) {
  const sessions = completedDays.slice(-8);
  const W = 280;
  const H = 80;

  if (sessions.length < 2) {
    return (
      <View style={{ width: W, height: H, alignItems: "center", justifyContent: "center" }}>
        <KineticText variant="muted" style={{ color: mutedForeground, fontSize: 12 }}>
          Complete 2+ workouts to see trend
        </KineticText>
      </View>
    );
  }

  const maxDur = Math.max(...sessions.map((s) => s.durationSeconds), 1);
  const minDur = Math.min(...sessions.map((s) => s.durationSeconds));
  const range = maxDur - minDur || 1;

  const points = sessions.map((s, i) => ({
    x: 16 + (i / (sessions.length - 1)) * (W - 32),
    y: 12 + (1 - (s.durationSeconds - minDur) / range) * (H - 32),
  }));

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <Svg width={W} height={H}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t, i) => (
        <Line
          key={i}
          x1={0} y1={12 + t * (H - 32)}
          x2={W} y2={12 + t * (H - 32)}
          stroke={mutedForeground}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
      ))}
      {/* Line path */}
      <Svg>
        {points.slice(0, -1).map((p, i) => (
          <Line
            key={i}
            x1={p.x} y1={p.y}
            x2={points[i + 1].x} y2={points[i + 1].y}
            stroke={primary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </Svg>
      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={primary} />
      ))}
      {/* Labels */}
      <SvgText x={0} y={H} fontSize={9} fontFamily="Inter_600SemiBold" fill={mutedForeground}>
        {Math.round(minDur / 60)}m
      </SvgText>
      <SvgText x={W - 24} y={14} fontSize={9} fontFamily="Inter_600SemiBold" fill={mutedForeground}>
        {Math.round(maxDur / 60)}m
      </SvgText>
    </Svg>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, progress, resetApp } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleEditProfile = () => {
    router.push("/onboarding/step1");
  };

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "This will clear all your data and progress. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetApp();
            router.replace("/");
          },
        },
      ],
    );
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KineticText>No profile set up yet.</KineticText>
      </View>
    );
  }

  const settingRows = [
    { icon: <Target size={16} color={colors.primary} />, label: "GOAL", value: GOAL_LABELS[profile.goal] ?? profile.goal },
    { icon: <Zap size={16} color={colors.primary} />, label: "EXPERIENCE", value: EXP_LABELS[profile.experience] ?? profile.experience },
    { icon: <Dumbbell size={16} color={colors.primary} />, label: "EQUIPMENT", value: EQUIP_LABELS[profile.equipment] ?? profile.equipment },
    { icon: <Clock size={16} color={colors.primary} />, label: "SESSION LENGTH", value: `${profile.timePerWorkout} minutes` },
    { icon: <Calendar size={16} color={colors.primary} />, label: "DAYS PER WEEK", value: `${profile.daysPerWeek} days` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <KineticText variant="brand" lime>PROFILE</KineticText>
        <TouchableOpacity onPress={handleEditProfile} style={styles.backBtn}>
          <Edit3 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats strip */}
        <View style={[styles.statsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { value: progress.totalWorkouts, label: "WORKOUTS" },
            { value: progress.streakCount, label: "STREAK" },
            { value: `${Math.round(progress.totalMinutes)}m`, label: "ACTIVE TIME" },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />}
              <View style={styles.stripStat}>
                <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: colors.primary }}>
                  {s.value}
                </KineticText>
                <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 8, marginTop: 2 }}>
                  {s.label}
                </KineticText>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <KineticText variant="label" style={{ color: colors.mutedForeground }}>MY SETTINGS</KineticText>
            <TouchableOpacity onPress={handleEditProfile} style={[styles.editBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Edit3 size={12} color={colors.primary} />
              <KineticText style={{ color: colors.primary, fontSize: 10, fontFamily: "Inter_700Bold", marginLeft: 4, letterSpacing: 1 }}>
                EDIT
              </KineticText>
            </TouchableOpacity>
          </View>
          {settingRows.map((row, i) => (
            <View
              key={i}
              style={[
                styles.settingRow,
                { borderTopColor: colors.border },
                i === 0 && { borderTopWidth: 0 },
              ]}
            >
              <View style={styles.settingIcon}>{row.icon}</View>
              <View style={styles.settingText}>
                <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9 }}>{row.label}</KineticText>
                <KineticText style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.text, marginTop: 2 }}>
                  {row.value}
                </KineticText>
              </View>
            </View>
          ))}
        </View>

        {/* Chart 1 — Weekly Activity */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 16 }}>
            THIS WEEK'S ACTIVITY
          </KineticText>
          <View style={{ alignItems: "center" }}>
            <WeeklyActivityChart
              completedDays={progress.completedDays}
              primary={colors.primary}
              card={colors.card}
              border={colors.border}
              mutedForeground={colors.mutedForeground}
            />
          </View>
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9 }}>WORKOUT COMPLETED</KineticText>
            <View style={[styles.legendDot, { backgroundColor: colors.border, marginLeft: 12 }]} />
            <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9 }}>REST / SKIPPED</KineticText>
          </View>
        </View>

        {/* Chart 2 — Duration Trend */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            SESSION DURATION TREND
          </KineticText>
          <KineticText variant="muted" style={{ color: colors.mutedForeground, fontSize: 11, marginBottom: 16 }}>
            Last {Math.min(progress.completedDays.length, 8)} sessions
          </KineticText>
          <View style={{ alignItems: "center" }}>
            <DurationSparkline
              completedDays={progress.completedDays}
              primary={colors.primary}
              mutedForeground={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Danger zone */}
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetBtn, { borderColor: "#EF444440" }]}
        >
          <RotateCcw size={14} color="#EF4444" />
          <KineticText style={{ color: "#EF4444", fontFamily: "Inter_600SemiBold", fontSize: 13, marginLeft: 8 }}>
            Reset All Data
          </KineticText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { padding: 4, width: 36 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14 },
  statsStrip: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  stripStat: { flex: 1, alignItems: "center" },
  stripDivider: { width: 1, height: 36 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderTopWidth: 1,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#CCFF0015",
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: { flex: 1 },
  chartLegend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
});
