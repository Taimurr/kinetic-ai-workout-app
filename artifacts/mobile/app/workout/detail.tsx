import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Clock, Play } from "lucide-react-native";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dayName } = useLocalSearchParams<{ dayName: string }>();
  const { weeklyPlan, progress } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const dayPlan = weeklyPlan?.days.find((d) => d.day === dayName);
  const isCompleted = progress.completedDays.some((d) => d.dayName === dayName);

  if (!dayPlan || dayPlan.type === "rest") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ paddingTop: topInset + 16, paddingHorizontal: 24 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <KineticText variant="title">This is a rest day</KineticText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>TODAY'S WORKOUT</KineticText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <KineticText variant="headline" style={{ marginBottom: 12 }}>
          {dayPlan.title.toUpperCase()}
        </KineticText>

        <View style={[styles.timeBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Clock size={13} color={colors.mutedForeground} />
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginLeft: 6, fontSize: 11 }}>
            ESTIMATED TIME: {dayPlan.estimated_duration} MIN
          </KineticText>
        </View>

        {isCompleted && (
          <View style={[styles.completedBanner, { backgroundColor: "#22C55E20", borderColor: "#22C55E" }]}>
            <KineticText variant="label" style={{ color: "#22C55E" }}>COMPLETED</KineticText>
          </View>
        )}

        <View style={styles.exercises}>
          {dayPlan.exercises.map((ex, idx) => (
            <View
              key={idx}
              style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10, marginBottom: 6 }}>
                {ex.category === "primary" ? "PRIMARY LIFT" : ex.category === "accessory" ? "ACCESSORY" : "ISOLATION"}
              </KineticText>
              <KineticText variant="title" style={{ fontSize: 20, marginBottom: 14 }}>{ex.name}</KineticText>
              <View style={styles.exMeta}>
                <View>
                  <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9, marginBottom: 4 }}>TARGET</KineticText>
                  <KineticText variant="body" style={{ fontFamily: "Inter_600SemiBold" }}>
                    {ex.sets} Sets × {ex.reps} Reps
                  </KineticText>
                </View>
                {ex.suggested_weight_kg > 0 && (
                  <View>
                    <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9, marginBottom: 4 }}>LOAD</KineticText>
                    <KineticText variant="body" style={{ fontFamily: "Inter_600SemiBold" }}>
                      {ex.suggested_weight_kg} kg
                    </KineticText>
                  </View>
                )}
              </View>
              {ex.description && (
                <KineticText variant="muted" style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13, lineHeight: 18 }}>
                  {ex.description}
                </KineticText>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {!isCompleted && (
        <View style={[styles.cta, { paddingBottom: bottomInset + 24 }]}>
          <PrimaryButton
            label="START WORKOUT"
            onPress={() => router.push({ pathname: "/workout/session", params: { dayName } })}
            icon={<Play size={16} color="#000" fill="#000" />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  completedBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  exercises: { gap: 12 },
  exerciseCard: { borderRadius: 16, padding: 18, borderWidth: 1 },
  exMeta: { flexDirection: "row", gap: 32 },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
