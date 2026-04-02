import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Trophy, Flame } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";

export default function CompleteScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { progress } = useApp();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  }, []);

  const lastSession = progress.completedDays[progress.completedDays.length - 1];
  const durationMin = lastSession ? Math.round(lastSession.durationSeconds / 60) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.trophy, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.trophyCircle, { backgroundColor: colors.primary }]}>
            <Trophy size={40} color="#000" />
          </View>
        </Animated.View>

        <KineticText variant="headline" style={{ textAlign: "center", marginTop: 32 }}>
          WORKOUT
        </KineticText>
        <KineticText variant="headline" lime style={{ textAlign: "center" }}>
          COMPLETE!
        </KineticText>

        <KineticText variant="muted" style={{ color: colors.mutedForeground, textAlign: "center", marginTop: 12 }}>
          Another session in the books. Stay consistent.
        </KineticText>

        <View style={styles.stats}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34, color: colors.primary }}>
              {durationMin}
            </KineticText>
            <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>
              MINUTES
            </KineticText>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.streakRow}>
              <Flame size={24} color="#EF4444" />
              <KineticText style={{ fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34, color: colors.text }}>
                {progress.streakCount}
              </KineticText>
            </View>
            <KineticText variant="label" style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>
              DAY STREAK
            </KineticText>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryButton
          label="BACK TO PLAN"
          onPress={() => router.replace("/(tabs)/plan")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  trophy: { alignItems: "center" },
  trophyCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", gap: 16, marginTop: 40 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { paddingTop: 16 },
});
