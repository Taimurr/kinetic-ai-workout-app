import React from "react";
import { View, ScrollView, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TrendingUp, Flame, Clock, Award, Dumbbell } from "lucide-react-native";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { useApp } from "@/context/AppContext";

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { progress } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const totalMinutes = Math.round(progress.totalMinutes);
  const avgSessionMinutes = progress.totalWorkouts > 0 ? Math.round(totalMinutes / progress.totalWorkouts) : 0;

  const statCards = [
    { label: "CURRENT STREAK", value: `${progress.streakCount}`, unit: "days", icon: <Flame size={20} color="#EF4444" /> },
    { label: "LONGEST STREAK", value: `${progress.longestStreak}`, unit: "days", icon: <Award size={20} color={colors.primary} /> },
    { label: "TOTAL WORKOUTS", value: `${progress.totalWorkouts}`, unit: "sessions", icon: <Dumbbell size={20} color={colors.primary} /> },
    { label: "TOTAL ACTIVE TIME", value: `${totalMinutes}`, unit: "minutes", icon: <Clock size={20} color={colors.secondary} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>YOUR PROGRESS</KineticText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 84 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <KineticText variant="headline">PROGRESS</KineticText>
          <KineticText variant="headline" lime>TRACKER</KineticText>
          <KineticText variant="muted" style={{ color: colors.mutedForeground, marginTop: 8 }}>
            Every rep logged, every session counted.
          </KineticText>
        </View>

        {progress.totalWorkouts === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TrendingUp size={40} color={colors.mutedForeground} />
            <KineticText variant="title" style={{ marginTop: 16, textAlign: "center" }}>No workouts yet</KineticText>
            <KineticText variant="muted" style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 8 }}>
              Complete your first workout to start tracking progress.
            </KineticText>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {statCards.map((s, i) => (
                <View
                  key={i}
                  style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.statIcon}>{s.icon}</View>
                  <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: colors.text, lineHeight: 28 }}>
                    {s.value}
                  </KineticText>
                  <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 2 }}>
                    {s.unit}
                  </KineticText>
                  <KineticText variant="label" style={{ color: colors.mutedForeground, marginTop: 6, fontSize: 9, letterSpacing: 0.5 }}>
                    {s.label}
                  </KineticText>
                </View>
              ))}
            </View>

            <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 16 }}>
                RECENT SESSIONS
              </KineticText>
              {progress.completedDays.slice(-7).reverse().map((day, i) => (
                <View key={i} style={[styles.historyItem, { borderBottomColor: colors.border }]}>
                  <View>
                    <KineticText variant="body" style={{ fontFamily: "Inter_600SemiBold" }}>
                      {day.workoutTitle}
                    </KineticText>
                    <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>
                      {day.dayName} · {new Date(day.date).toLocaleDateString()}
                    </KineticText>
                  </View>
                  <View style={styles.durationPill}>
                    <Clock size={10} color={colors.primary} />
                    <KineticText variant="label" style={{ color: colors.primary, fontSize: 10, marginLeft: 4 }}>
                      {Math.round(day.durationSeconds / 60)} min
                    </KineticText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 12 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  hero: { marginBottom: 24, paddingTop: 8 },
  emptyCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: { marginBottom: 8 },
  historyCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  durationPill: { flexDirection: "row", alignItems: "center" },
});
