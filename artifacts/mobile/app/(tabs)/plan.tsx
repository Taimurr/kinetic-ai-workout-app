import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Clock,
  CheckCircle2,
  Moon,
  ChevronRight,
  Play,
  Menu,
  User,
  Zap,
  RefreshCw,
  Plus,
} from "lucide-react-native";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { useApp } from "@/context/AppContext";
import { PrimaryButton } from "@/components/PrimaryButton";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayDayName(): string {
  return DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function getIntensityColor(intensity: string, primary: string): string {
  if (intensity === "high") return "#EF4444";
  if (intensity === "moderate") return primary;
  return "#22C55E";
}

function isDayCompleted(dayName: string, completedDays: { dayName: string; date: string }[]): boolean {
  return completedDays.some((d) => d.dayName === dayName);
}

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { weeklyPlan, progress, generatePlan, profile, isGeneratingPlan, resetApp } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const today = getTodayDayName();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const weeklyMinutes = progress.completedDays.reduce((a, d) => a + Math.round(d.durationSeconds / 60), 0);
  const daysCompleted = progress.completedDays.length;
  const totalDays = weeklyPlan?.days.filter((d) => d.type === "training").length ?? 0;

  const handleRefresh = async () => {
    if (!profile) return;
    setRefreshing(true);
    await generatePlan(profile);
    setRefreshing(false);
  };

  const handleDayPress = (day: typeof weeklyPlan.days[0]) => {
    if (day.type === "rest") return;
    router.push({ pathname: "/workout/detail", params: { dayName: day.day } });
  };

  if (!weeklyPlan) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background, paddingTop: topInset, paddingBottom: bottomInset + 80 }]}>
        <View style={[styles.plusCircle, { borderColor: colors.primary }]}>
          <Plus size={48} color={colors.primary} strokeWidth={1.5} />
        </View>
        <KineticText variant="headline" style={{ textAlign: "center", marginTop: 32 }}>
          CREATE A NEW
        </KineticText>
        <KineticText variant="headline" lime style={{ textAlign: "center" }}>
          WORKOUT PLAN
        </KineticText>
        <KineticText
          variant="muted"
          style={{ textAlign: "center", color: colors.mutedForeground, marginTop: 12, marginBottom: 40, paddingHorizontal: 32 }}
        >
          Answer a few quick questions and we'll build a personalized plan for your goals.
        </KineticText>
        <PrimaryButton
          label="GET STARTED"
          onPress={() => router.replace("/onboarding/step1")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
          <Menu size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <KineticText variant="brand" lime>KINETIC</KineticText>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push("/profile")}>
          <User size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 84 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            CURRENT CYCLE
          </KineticText>
          <KineticText variant="headline">WEEKLY</KineticText>
          <KineticText variant="headline" lime>PLAN</KineticText>
          <KineticText variant="muted" style={{ color: colors.mutedForeground, marginTop: 8 }}>
            Fueling the kinetic chain through structured resistance.
          </KineticText>
          {weeklyPlan.isTemplate && (
            <View style={[styles.templateBadge, { backgroundColor: colors.tertiary + "30", borderColor: colors.tertiary }]}>
              <KineticText variant="label" style={{ color: colors.tertiary, fontSize: 9 }}>
                TEMPLATE PLAN — LOG SESSIONS TO PERSONALIZE
              </KineticText>
            </View>
          )}
        </View>

        <View style={styles.days}>
          {weeklyPlan.days.map((day, index) => {
            const isToday = day.day === today;
            const isCompleted = isDayCompleted(day.day, progress.completedDays);
            const isRest = day.type === "rest";

            return (
              <Animated.View key={day.day} entering={FadeInDown.delay(index * 60).springify().damping(18)}>
              <TouchableOpacity
                onPress={() => handleDayPress(day)}
                activeOpacity={isRest ? 1 : 0.8}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: colors.card,
                    borderWidth: isToday ? 1 : 1,
                    borderColor: isToday ? colors.primary : colors.border,
                    borderLeftWidth: isToday ? 3 : 1,
                    borderLeftColor: isToday ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={styles.dayCardContent}>
                  <View style={styles.dayTop}>
                    <View style={styles.dayLabels}>
                      <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10 }}>
                        {day.day.toUpperCase()}
                      </KineticText>
                      {isToday && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                          <KineticText style={{ color: "#000", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 }}>
                            TODAY
                          </KineticText>
                        </View>
                      )}
                    </View>
                    {isCompleted && <CheckCircle2 size={18} color="#22C55E" />}
                    {isRest && !isCompleted && <Moon size={18} color={colors.mutedForeground} />}
                    {!isRest && !isCompleted && isToday && (
                      <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                        <Play size={14} color="#000" fill="#000" />
                      </View>
                    )}
                    {!isRest && !isCompleted && !isToday && (
                      <ChevronRight size={18} color={colors.mutedForeground} />
                    )}
                  </View>

                  {isRest ? (
                    <KineticText variant="body" style={{ fontStyle: "italic", color: colors.mutedForeground }}>
                      Active recovery & Mobility
                    </KineticText>
                  ) : (
                    <View>
                      <KineticText
                        variant="title"
                        style={{
                          fontSize: 17,
                          color: isCompleted ? colors.success : colors.text,
                          marginBottom: 6,
                        }}
                      >
                        {day.title}
                      </KineticText>
                      <View style={styles.dayMeta}>
                        <Clock size={12} color={colors.mutedForeground} />
                        <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10, marginLeft: 4 }}>
                          {day.estimated_duration} MIN
                        </KineticText>
                        {day.intensity === "high" && (
                          <>
                            <Zap size={10} color="#EF4444" style={{ marginLeft: 8 }} />
                            <KineticText variant="label" style={{ color: "#EF4444", fontSize: 10, marginLeft: 2 }}>
                              HIGH INTENSITY
                            </KineticText>
                          </>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInDown.delay(500).springify().damping(18)} style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 16 }}>
            WEEKLY STATS
          </KineticText>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: colors.primary, lineHeight: 32 }}>
                {weeklyMinutes}
              </KineticText>
              <KineticText variant="label" style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 10 }}>
                MINUTES ACTIVE
              </KineticText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 28, color: colors.primary, lineHeight: 32 }}>
                {daysCompleted}/{totalDays}
              </KineticText>
              <KineticText variant="label" style={{ color: colors.mutedForeground, marginTop: 4, fontSize: 10 }}>
                DAYS COMPLETED
              </KineticText>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuVisible(false);
                await resetApp();
              }}
            >
              <RefreshCw size={18} color={colors.primary} />
              <KineticText variant="body" style={{ marginLeft: 12 }}>Regenerate Plan</KineticText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  plusCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  hero: { paddingTop: 8, marginBottom: 24 },
  templateBadge: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  days: { gap: 10, marginBottom: 24 },
  dayCard: { borderRadius: 16, overflow: "hidden" },
  dayCardContent: { padding: 16 },
  dayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  dayLabels: { flexDirection: "row", alignItems: "center", gap: 8 },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dayMeta: { flexDirection: "row", alignItems: "center" },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 50 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-start", padding: 20 },
  menu: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginTop: 80,
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 12 },
});
