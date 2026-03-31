import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Clock, Play, Moon, Activity } from "lucide-react-native";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayDayName(): string {
  const d = new Date().getDay();
  return DAY_ORDER[d === 0 ? 6 : d - 1];
}

export default function WorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { weeklyPlan, progress, currentSession } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const today = getTodayDayName();
  const todayPlan = weeklyPlan?.days.find((d) => d.day === today);
  const isCompleted = progress.completedDays.some((d) => d.dayName === today);
  const isInProgress = currentSession?.dayPlan.day === today && currentSession.status === "in_progress";

  if (!weeklyPlan || !todayPlan) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <Activity size={48} color={colors.mutedForeground} />
        <KineticText variant="title" style={{ textAlign: "center", marginTop: 16 }}>
          No workout plan
        </KineticText>
        <KineticText variant="muted" style={{ textAlign: "center", color: colors.mutedForeground, marginTop: 8 }}>
          Complete onboarding to get your personalized workout plan.
        </KineticText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>TODAY'S WORKOUT</KineticText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {todayPlan.type === "rest" ? (
          <View style={styles.restDay}>
            <Moon size={56} color={colors.mutedForeground} />
            <KineticText variant="headline" style={{ textAlign: "center", marginTop: 20 }}>
              REST DAY
            </KineticText>
            <KineticText variant="muted" style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              Active recovery & Mobility
            </KineticText>
            <KineticText variant="body" style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 16, paddingHorizontal: 24 }}>
              Take it easy today. Light stretching, walking, or mobility work will aid recovery.
            </KineticText>
          </View>
        ) : (
          <View>
            <KineticText variant="headline" style={{ marginBottom: 4 }}>
              {todayPlan.title.toUpperCase()}
            </KineticText>

            <View style={styles.meta}>
              <View style={[styles.metaBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Clock size={12} color={colors.mutedForeground} />
                <KineticText variant="label" style={{ color: colors.mutedForeground, marginLeft: 6, fontSize: 11 }}>
                  ESTIMATED TIME: {todayPlan.estimated_duration} MIN
                </KineticText>
              </View>
            </View>

            {isCompleted && (
              <View style={[styles.completedBanner, { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}>
                <KineticText variant="label" style={{ color: "#22C55E" }}>WORKOUT COMPLETED TODAY</KineticText>
              </View>
            )}

            <View style={styles.exercises}>
              {todayPlan.exercises.map((ex, idx) => (
                <View
                  key={idx}
                  style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 6, fontSize: 10 }}>
                    {ex.category === "primary" ? "PRIMARY LIFT" : ex.category === "accessory" ? "ACCESSORY" : "ISOLATION"}
                  </KineticText>
                  <KineticText variant="title" style={{ fontSize: 20, marginBottom: 12 }}>{ex.name}</KineticText>
                  <View style={styles.exMeta}>
                    <View style={styles.exMetaItem}>
                      <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9, marginBottom: 4 }}>
                        TARGET
                      </KineticText>
                      <KineticText variant="body" style={{ fontFamily: "Inter_600SemiBold" }}>
                        {ex.sets} Sets × {ex.reps} Reps
                      </KineticText>
                    </View>
                    {ex.suggested_weight_kg > 0 && (
                      <View style={styles.exMetaItem}>
                        <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9, marginBottom: 4 }}>
                          LOAD
                        </KineticText>
                        <KineticText variant="body" style={{ fontFamily: "Inter_600SemiBold" }}>
                          {ex.suggested_weight_kg} kg
                        </KineticText>
                      </View>
                    )}
                  </View>
                  {ex.description && (
                    <KineticText variant="muted" style={{ color: colors.mutedForeground, marginTop: 10, fontSize: 13 }}>
                      {ex.description}
                    </KineticText>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {todayPlan.type === "training" && !isCompleted && (
        <View style={[styles.ctaContainer, { paddingBottom: bottomInset + 80, backgroundColor: colors.background }]}>
          <PrimaryButton
            label={isInProgress ? "CONTINUE WORKOUT" : "START WORKOUT"}
            onPress={() => router.push({ pathname: "/workout/session", params: { dayName: today } })}
            icon={<Play size={16} color="#000" fill="#000" />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 0 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  restDay: { flex: 1, alignItems: "center", paddingTop: 60 },
  meta: { marginBottom: 20, marginTop: 12 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  completedBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
  },
  exercises: { gap: 12 },
  exerciseCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  exMeta: { flexDirection: "row", gap: 32 },
  exMetaItem: {},
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
