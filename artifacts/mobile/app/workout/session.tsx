import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Check, SkipForward, Timer } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp, type LoggedSet } from "@/context/AppContext";

interface SetState {
  reps: string;
  weight: string;
  logged: boolean;
  skipped: boolean;
}

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dayName } = useLocalSearchParams<{ dayName: string }>();
  const { weeklyPlan, startWorkout, logSet, completeWorkout, currentSession } = useApp();

  const dayPlan = weeklyPlan?.days.find((d) => d.day === dayName);
  const [setStates, setSetStates] = useState<Record<string, SetState>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (!dayPlan || dayPlan.type === "rest" || startedRef.current) return;
    startedRef.current = true;

    const date = new Date().toISOString().split("T")[0];
    startWorkout(dayPlan, date);

    const initial: Record<string, SetState> = {};
    dayPlan.exercises.forEach((ex) => {
      for (let s = 1; s <= ex.sets; s++) {
        const key = `${ex.name}_${s}`;
        initial[key] = {
          reps: ex.reps.toString(),
          weight: ex.suggested_weight_kg.toString(),
          logged: false,
          skipped: false,
        };
      }
    });
    setSetStates(initial);

    timerRef.current = setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [dayPlan]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLogSet = (exerciseName: string, setNum: number) => {
    const key = `${exerciseName}_${setNum}`;
    const state = setStates[key];
    if (!state) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const logged: LoggedSet = {
      exerciseName,
      setNumber: setNum,
      actualReps: parseInt(state.reps) || 0,
      actualWeight: parseFloat(state.weight) || 0,
      skipped: false,
      loggedAt: new Date().toISOString(),
    };
    logSet(logged);
    setSetStates((prev) => ({ ...prev, [key]: { ...prev[key], logged: true } }));
  };

  const handleSkipSet = (exerciseName: string, setNum: number) => {
    const key = `${exerciseName}_${setNum}`;
    const logged: LoggedSet = {
      exerciseName,
      setNumber: setNum,
      actualReps: 0,
      actualWeight: 0,
      skipped: true,
      loggedAt: new Date().toISOString(),
    };
    logSet(logged);
    setSetStates((prev) => ({ ...prev, [key]: { ...prev[key], skipped: true, logged: true } }));
  };

  const allLogged = Object.values(setStates).every((s) => s.logged || s.skipped);

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeWorkout();
    router.replace("/workout/complete");
  };

  const handleExit = () => {
    Alert.alert("Exit Workout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: () => { if (timerRef.current) clearInterval(timerRef.current); router.back(); } },
    ]);
  };

  if (!dayPlan || dayPlan.type === "rest") {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity onPress={handleExit} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.timerBadge}>
          <Timer size={14} color={colors.primary} />
          <KineticText style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginLeft: 6 }}>
            {formatTime(elapsedSeconds)}
          </KineticText>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.titleRow}>
        <KineticText variant="headline" style={{ fontSize: 28 }}>{dayPlan.title.toUpperCase()}</KineticText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {dayPlan.exercises.map((ex, exIdx) => (
          <View key={exIdx} style={[styles.exerciseSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.exHeader}>
              <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10 }}>
                {ex.category === "primary" ? "PRIMARY LIFT" : ex.category === "accessory" ? "ACCESSORY" : "ISOLATION"}
              </KineticText>
              <KineticText variant="title" style={{ fontSize: 18, marginTop: 4 }}>{ex.name}</KineticText>
            </View>

            <View style={[styles.setHeaderRow, { borderBottomColor: colors.border }]}>
              <KineticText variant="label" style={{ color: colors.mutedForeground, width: 30, fontSize: 9 }}>SET</KineticText>
              <KineticText variant="label" style={{ color: colors.mutedForeground, flex: 1, fontSize: 9 }}>REPS</KineticText>
              <KineticText variant="label" style={{ color: colors.mutedForeground, flex: 1, fontSize: 9 }}>KG</KineticText>
              <View style={{ width: 72 }} />
            </View>

            {Array.from({ length: ex.sets }, (_, i) => i + 1).map((setNum) => {
              const key = `${ex.name}_${setNum}`;
              const state = setStates[key] || { reps: ex.reps.toString(), weight: ex.suggested_weight_kg.toString(), logged: false, skipped: false };

              return (
                <View key={setNum} style={[styles.setRow, { opacity: state.logged ? 0.5 : 1 }]}>
                  <View style={[styles.setNumBadge, { backgroundColor: state.logged ? colors.success + "30" : colors.muted }]}>
                    <KineticText style={{ color: state.logged ? colors.success : colors.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 13 }}>
                      {setNum}
                    </KineticText>
                  </View>

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.text, borderColor: colors.border }]}
                    value={state.reps}
                    onChangeText={(v) => setSetStates((prev) => ({ ...prev, [key]: { ...prev[key], reps: v } }))}
                    keyboardType="numeric"
                    editable={!state.logged}
                    selectTextOnFocus
                  />

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.text, borderColor: colors.border }]}
                    value={state.weight}
                    onChangeText={(v) => setSetStates((prev) => ({ ...prev, [key]: { ...prev[key], weight: v } }))}
                    keyboardType="decimal-pad"
                    editable={!state.logged}
                    selectTextOnFocus
                  />

                  <View style={styles.setActions}>
                    {!state.logged ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleSkipSet(ex.name, setNum)}
                          style={[styles.actionBtn, { backgroundColor: colors.muted }]}
                        >
                          <SkipForward size={14} color={colors.mutedForeground} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleLogSet(ex.name, setNum)}
                          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        >
                          <Check size={14} color="#000" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={[styles.actionBtn, { backgroundColor: state.skipped ? colors.muted : colors.success + "30" }]}>
                        <Check size={14} color={state.skipped ? colors.mutedForeground : colors.success} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryButton
          label={allLogged ? "FINISH WORKOUT" : "COMPLETE WORKOUT"}
          onPress={handleComplete}
          icon={<Check size={16} color="#000" />}
        />
      </View>
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
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#CCFF0015",
  },
  titleRow: { paddingHorizontal: 20, paddingBottom: 16 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 12 },
  exerciseSection: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  exHeader: { padding: 16, paddingBottom: 12 },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  setNumBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  setActions: { flexDirection: "row", gap: 6, width: 72, justifyContent: "flex-end" },
  actionBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(18,18,18,0.95)",
  },
});
